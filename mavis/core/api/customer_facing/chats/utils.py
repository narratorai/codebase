from pydantic import BaseModel

from core.api.customer_facing.chats.models import MessageHistory
from core.api.customer_facing.utils.decorator import ensure_company
from core.graph import graph_client
from core.graph.sync_client.enums import access_role_enum, tag_relations_enum
from core.logger import get_logger
from core.models.ids import UUIDStr
from core.util.llm import ask_gpt
from core.v4.llm.models import role_enum

from ..utils import BasicHandler, ItemUpdator, QueryBuilder

logger = get_logger()


class ChatSummary(BaseModel):
    short_summary: str
    detailed_summary: str


class BasicChatHandler(BasicHandler):
    @property
    def index_name(self):
        return "chat"

    @property
    def related_key(self):
        return tag_relations_enum.chat.value

    @property
    def use_semantic_search(self):
        return True

    @property
    def index_properties(self):
        return {
            "id": {"type": "keyword"},
            # permission fields
            "company_slug": {"type": "keyword"},
            "team_ids": {"type": "keyword"},
            "user_id": {"type": "keyword"},
            # Fields Used for sorting
            "favorited_by": {"type": "keyword"},
            "created_at": {"type": "date"},
            "table_id": {"type": "keyword"},
            # Fields Used for Search
            "summary": {"type": "text"},
            "detailed_summary": {"type": "text"},
        }


class ChatQueryBuilder(BasicChatHandler, QueryBuilder):
    @property
    def search_fields(self):
        return ["summary^2", "detailed_summary"]

    @property
    def filter_fields(self):
        return []

    @property
    def sort_by(self):
        return [("created_at", "desc")]


class ChatUpdator(BasicChatHandler, ItemUpdator):
    @ensure_company
    def get(self, id: UUIDStr) -> MessageHistory | None:
        if ms := self.company.s3.get_file(
            ["configs", "chats", f"{id}.json"],
        ):
            if not ms.get("user_id"):
                ms["user_id"] = graph_client.get_chat(id=id).chat_by_pk.created_by
            try:
                return MessageHistory(**ms)
            except Exception as e:
                logger.error(f"Error loading chat {id}: {e}")
                graph_client.delete_chat(id=id)
                return None

    def get_search_data(self, id: UUIDStr):
        message_history = self.get(id)
        if not message_history:
            return None

        # keep track of the chat
        summary = summarize_chat(message_history)

        output = dict(
            id=id,
            user_id=message_history.user_id,
            table_id=message_history.table_id,
            created_at=message_history.created_at,
            summary=summary.short_summary,
            detailed_summary=summary.detailed_summary,
        )
        return output

    def vectorize(self, search_data: dict):
        return search_data["detailed_summary"] or search_data["summary"]


class ChatManager(ChatUpdator):
    @ensure_company
    def check_create_permissions(self, table_id=None, **kwargs):
        self.user.require_role(access_role_enum.create_chat)
        # check the table permissions
        self.company.table(table_id, raise_error=True)
        return True

    def create(
        self,
        content: str = None,
        table_id: str = None,
    ):
        self.check_create_permissions(table_id=table_id)
        # create the chat
        chat_id = graph_client.insert_chat(
            question=content,
            created_by=self.user.id,
            table_id=table_id,
        ).insert_chat_one.id

        # create the basic content
        self.create_search_data(dict(id=chat_id, table_id=table_id, summary=content))
        return chat_id

    @ensure_company
    def upload_messages(self, message_history: MessageHistory):
        self.company.s3.upload_object(
            message_history.dict(),
            ["configs", "chats", f"{message_history.id}.json"],
        )

    @ensure_company
    def delete(self, id: UUIDStr):
        graph_client.delete_chat(id=id)
        self.company.s3.delete_file(["configs", "chats", f"{id}.json"])
        self.delete_id(id)


def summarize_chat(chat: MessageHistory) -> ChatSummary | None:
    logger.debug("Summarizing chat")

    content = [
        f" - **{m.role}:** {m.data.content if m.data else 'No content'}"
        for m in chat.messages
        if not m.hidden and m.role != role_enum.tool
    ]
    if not content:
        return None

    prompt = """
    **GOAL**: Generate a summary from the user's perspective highlighting everything the user is attempting to get answered.
    **INPUT:** A series of messages from the chat between the USER and the assistant.
    **OUTPUT:** JSON with `short_summary` (less than 15 words) and `detailed_summary` keys.

    Always try to summarize the conversation in a way that will be useful for the user to search in the future. Ensure the `detailed_summary` is formulated to facilitate effective similarity search.
    NEVER include any personal information or metrics in the output.

    Example:
    - **user:** How many orders do we get each month?
    OUTPUT:
    {
    "short_summary": "Monthly orders count.",
    "detailed_summary": "How many orders do we get each month?"
    }
    """
    res = ask_gpt(prompt, "\n".join(content), ChatSummary)

    return res
