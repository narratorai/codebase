import json
from typing import Generator

from pydantic import BaseModel

from core.api.customer_facing.chats.models import MessageHistory
from core.api.customer_facing.chats.utils import ChatManager, ChatUpdator
from core.graph import graph_client
from core.logger import get_logger
from core.models.company import Company, CompanyTable
from core.models.ids import UUIDStr
from core.models.time import utcnow
from core.models.user import AuthenticatedUser
from core.v4.llm.core import MavisAgent
from core.v4.llm.models import (
    ContextData,
    MessageData,
    ReplyMessages,
    UIMessage,
    data_type_enum,
    role_enum,
)
from core.v4.mavis import Mavis

logger = get_logger()


def get_context(user: AuthenticatedUser, table: CompanyTable):
    entity = table.identifier

    # Fetch the following with a Graph Query
    context = graph_client.get_chat_context(
        user_id=user.id,
        company_id=user.company.id,
        table_id=table.id,
        favorite_tag_id=user.tags.favorite,
    )

    # last_5_question_summaries = "\n".join([f"   - At {q.created_at}:  {q.detailed_summary}" for q in context.chat])
    # if context.company_tags:
    #     favorited_activities = "\n".join(
    #         [
    #             f"   - {a.activity.name}: {a.activity.description} (category: {a.activity.category})"
    #             for a in context.company_tags.tagged_items
    #         ]
    #     )
    # else:
    #     favorited_activities = "No favorited activities"

    if context.company_user:
        context_data = ContextData(
            entity=entity,
            user=context.company_user[0].user_context,
            company=context.company_user[0].company_context,
            kpi=context.company_user[0].metrics_context,
        )
    else:
        context_data = ContextData(entity=entity)

    # Add a new message with the context
    context_message = UIMessage(
        type=data_type_enum.context,
        data=context_data,
        hidden=True,  # Set to False if you want it visible in the UI
    )
    return context_message


def load_chat(chat_id: UUIDStr, company: Company):
    updator = ChatUpdator(company=company)
    updator.check_get_permissions(chat_id)
    if chat := updator.get(chat_id):
        logger.debug("Found chat")
        return chat
    else:
        chat = graph_client.get_chat(chat_id).chat_by_pk

        return MessageHistory(
            id=chat_id,
            table_id=chat.table_id,
            user_id=chat.created_by,
            messages=[
                UIMessage(
                    role=role_enum.user,
                    type=data_type_enum.user_message,
                    data=MessageData(text=chat.question),
                ),
                get_context(company.user, company.table(chat.table_id)),
            ],
            created_by=company.user.id,
            created_at=utcnow(),
        )


def extract_visible_messages(messages: list[UIMessage]):
    """Get the user messages and the mavis messages that actually have a type.
    Everything that doesn't have a type is for internal use.
    """
    return [message for message in messages if not message.hidden]


def prepare_chat_response(company: Company, message_history: MessageHistory):
    manager = ChatManager(company=company)
    manager.upload_messages(message_history)
    # update the model to summarize the chat
    if 1 < len(message_history.messages) < 6:
        manager.resync_id(message_history.id)
    return message_history


def format_messages(generator: Generator) -> Generator:
    for message in generator:
        if isinstance(message, BaseModel):
            if hasattr(message, "external_dict"):
                yield json.dumps(message.external_dict(), default=str)
            else:
                yield message.dict()
        elif isinstance(message, dict):
            yield json.dumps(message, default=str)
        elif isinstance(message, str):
            yield message
        else:
            yield str(message)


def get_next_messages(chat: MessageHistory, content: str | None, mavis: Mavis) -> Generator:
    logger.debug("Getting next messages", content=content)

    # remove any that are hidden
    for message in chat.messages[::-1]:
        if message.hidden or message.role == role_enum.tool:
            chat.messages.pop(-1)
        else:
            break

    # better handling empty content
    if content:
        ui_message = UIMessage(
            role=role_enum.user,
            type=data_type_enum.user_message,
            data=MessageData(text=content),
        )
        chat.messages.append(ui_message)
    elif not (chat.messages and chat.messages[-1].role == role_enum.user):
        logger.debug("Last message not a user so skip it", messages=chat.messages)
        return None

    try:
        # Add the messages
        last_idx = len(chat.messages)

        mavis_agent = MavisAgent(mavis, chat.table_id, chat.messages)
        message_generator = mavis_agent.ask_llm()

        # get all the messages as they come
        for message in message_generator:
            # GOAL: TO be able to send an array multiple chats as the AI has a conversation with the user
            new_messages = extract_visible_messages(chat.messages[last_idx:] + [message])
            logger.debug("Yielding ReplyMessages", new_messages=new_messages)
            yield ReplyMessages(new_messages=new_messages)

        # Add the last message to the chat
        chat.messages.append(message)

        # return the chat
        prepare_chat_response(mavis.company, chat)

    except Exception as e:
        logger.error("Error getting next messages", error=e)
        prepare_chat_response(mavis.company, chat)
        raise e


def get_narrative_results(company_id, narrative_slug: str):
    graph_nar = graph_client.get_narrative_by_slug(company_id=company_id, slug=narrative_slug).narrative

    return graph_nar.narrative_runs and graph_nar.narrative_runs[0].is_actionable
