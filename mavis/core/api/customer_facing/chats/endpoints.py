from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse

from batch_jobs.data_management import run_narrative
from core.api.auth import get_current_company, get_current_user, get_mavis
from core.api.customer_facing.activities.utils import ActivitiesQueryBuilder
from core.api.customer_facing.datasets.utils import DatasetManager
from core.api.v1.endpoints.narrative_template import run_narrative_glam_template
from core.constants import REQUEST_SUBMITTED_EMAIL_TEMPLATE
from core.errors import SilenceError
from core.graph import graph_client
from core.graph.sync_client.enums import access_role_enum
from core.logger import get_logger
from core.models.company import Company
from core.models.ids import UUIDStr
from core.models.user import AuthenticatedUser
from core.util.email import send_email
from core.utils import utcnow
from core.v4.llm.models import (
    NarrativeDetails,
    UIMessage,
    UserMessage,
    data_type_enum,
)
from core.v4.mavis import Mavis

from .helpers import extract_visible_messages, format_messages, get_narrative_results, get_next_messages, load_chat
from .models import (
    ChatRequestInput,
    ChatRequestOutput,
    ChatRow,
    ChatSuggestions,
    CreateChatInput,
    GetChatOutput,
    MessageHistory,
    QueryParams,
    VoteInput,
)
from .utils import ChatManager, ChatQueryBuilder, ChatUpdator

logger = get_logger()
router = APIRouter(prefix="/chats", tags=["chat"])


@router.get(
    "",
    response_model=GetChatOutput,
    name="Get all chats",
    description="Get all chats of the current user.",
)
async def get_all(
    params: QueryParams = Depends(QueryParams),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    current_user.require_role(access_role_enum.view_chat)
    query_builder = ChatQueryBuilder(**params.dict(), user=current_user)
    return query_builder.get_results()


@router.delete("/{id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
async def delete_favorite_chat(
    id: UUIDStr,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    ChatManager(user=current_user).delete(id)


@router.post("/{id}/favorite", response_model=None, status_code=status.HTTP_201_CREATED)
async def favorite_chat(
    id: UUIDStr,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    ChatUpdator(user=current_user).favorite(id)
    return {"id": id}


@router.delete("/{id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
async def unfavorite_chat(
    id: UUIDStr,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    ChatUpdator(user=current_user).unfavorite(id)


@router.get(
    "/suggestions",
    response_model=ChatSuggestions,
    include_in_schema=False,
    name="Get suggestions",
    description="Get suggestions for the landing page of the chat page.",
)
async def get_suggestions(current_user: AuthenticatedUser = Depends(get_current_user)):
    """
    Suggestions for the landing page of the chat page
    """
    query_builder = ActivitiesQueryBuilder(user=current_user)
    query_builder.track("oppend_chat")
    activity = query_builder.get_results()
    suggestions = [
        "What can you do?",
        "What is coming soon?",
        "What is everything did by ",
        "What's the conversion rate from ..",
    ]

    if len(activity["data"]) > 1:
        suggestion = f"Show me total unique customer from {activity['data'][0]['name']} by if they did {activity['data'][0]['name']} ever"
    elif len(activity["data"]) == 1:
        suggestion = f"Show me total unique customer from {activity['data'][1]['name']} by month"

    if len(activity["data"]) > 0:
        suggestions.append(suggestion)

    return {"total_count": len(suggestions), "data": suggestions}


@router.post(
    "",
    response_model=ChatRow,
    status_code=status.HTTP_201_CREATED,
    name="Create a chat",
    description="Create a chat",
)
async def create(
    input: CreateChatInput,
    user: AuthenticatedUser = Depends(get_current_user),
):
    chat_id = ChatManager(user=user).create(input)
    return ChatRow(
        id=chat_id,
        summary=input.content,
        table_id=input.table_id,
        favorited=False,
        team_ids=[],
        created_at=utcnow(),
        created_by=user.id,
    )


@router.post(
    "/{id}/next",
    response_model=None,
    name="Get next messages",
    description="Returns a list of messages as a reply to the user message",
)
async def create_chat_reply(
    id: UUIDStr,
    input: UserMessage,
    stream: bool = False,
    mavis: Mavis = Depends(get_mavis),
):
    chat = load_chat(id, mavis.company)
    # chat.messages = chat.messages[:1]
    messages_generator = get_next_messages(chat, input.content, mavis)

    if stream:
        return StreamingResponse(format_messages(messages_generator), media_type="text/event-stream")
    else:
        for message in messages_generator:
            return message.external_dict()


@router.post(
    "/{id}/complete",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Complete chat",
    description="Reads the entire chat and create a better summary and detailed summary for indexing",
)
async def complete_chat(id: UUIDStr, company: Company = Depends(get_current_company)):
    ChatUpdator(company=company).resync_id(id)


@router.post(
    "/{id}/analyze/{message_id}",
    response_model=UIMessage,
    name="Analyze chat Message",
    description="Runs the processing of the analyze button",
)
async def analyze_chat(id: UUIDStr, message_id: str, mavis: Mavis = Depends(get_mavis)):
    chat = load_chat(id, mavis.company)
    message = next((message for message in chat.messages if message.id == message_id), None)

    if message is None:
        raise SilenceError("Message not found")

    if message.type != data_type_enum.dataset:
        raise SilenceError("Message is not a plot, so not clear what to analyze")

    # create the narrative
    if not message.data.analyzable:
        raise SilenceError("Not an analyzable plot")

    dataset_obj = DatasetManager(mavis=mavis).get_config(message.data.dataset_id)

    # create the narrative
    nar_res = run_narrative_glam_template(mavis, dataset_obj, message.data.analyzable)

    # running the Narrative in the background
    run_narrative.send(company_slug=mavis.company.slug, slug=nar_res["narrative_slug"])

    # Save it
    message.data.analysis_narrative = NarrativeDetails(
        slug=nar_res["narrative_slug"],
        id=nar_res["narrative_id"],
    )
    ChatManager(mavis=mavis).upload_messages(chat)

    return message


@router.get(
    "/{id}",
    response_model=dict,
    name="Get chat",
    description="Get a chat and all its messages",
)
async def get_chat(id: UUIDStr, company: Company = Depends(get_current_company)):
    chat = load_chat(id, company)
    # Handle delayed later
    for message in chat.messages:
        if (
            message.type == data_type_enum.dataset
            and message.data.analysis_narrative
            and message.data.analysis_narrative.actionable is not None
        ):
            message.data.analysis_narrative.actionable = get_narrative_results()
            ChatManager(company=company).upload_messages(chat)

    chat.messages = extract_visible_messages(chat.messages)
    return chat.external_dict()


@router.patch("/{id}/messages/{message_id}", response_model=MessageHistory)
async def update_chat_message(
    id: UUIDStr,
    message_id: str,
    input: UIMessage,
    company: Company = Depends(get_current_company),
):
    chat = load_chat(id, company)
    # chat_obj.messages = await update_message(
    #     mavis, chat_obj.table_id, chat_obj.messages, message_id, input
    # )
    ChatManager(company=company).upload_messages(chat)
    return chat.external_dict()


@router.post(
    "/{id}/vote/{message_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Vote",
    description="Marks a message a good or bad answer",
)
async def vote(
    id: UUIDStr,
    message_id: str,
    input: VoteInput,
    company: Company = Depends(get_current_company),
):
    graph_client.update_chat_vote(id=id, rating=input.rating)

    chat = load_chat(id, company)
    for message in chat.messages:
        if message.id == message_id:
            message.rating = input.rating
            break
    ChatManager(company=company).upload_messages(chat)


@router.post(
    "/{id}/request",
    response_model=ChatRequestOutput,
    name="Submit data request",
    description="Submit a data request pointing at an issue with the current data",
)
async def make_request(id: UUIDStr, input: ChatRequestInput, company: Company = Depends(get_current_company)):
    request_id = graph_client.insert_training_request(
        created_by=company.user.id,
        context=input.context,
        type=input.request_type,
        company_id=company.id,
        chat_id=id,
    ).insert_training_request_one.id

    # share the request id
    if input.message_id:
        chat = load_chat(id, company)
        for message in chat.messages:
            if message.id == input.message_id:
                message.request_id = request_id
                break
        ChatManager(company=company).upload_messages(chat)

    requester = graph_client.get_company_user_id(company.id, company.user.id).company_user[0]

    template_name = (
        f"{requester.first_name or ''} {requester.last_name or ''}" if requester.first_name else company.user.email
    )
    template_model = dict(
        name=template_name,
        job_title=requester.job_title,
        request_type=input.request_type.replace("\n", "<br>"),
        request_context=input.context.replace("\n", "<br>"),
        request_id=request_id,
    )

    # TODO: apply assignning rules here

    # send the email to the user
    send_email(
        company,
        "support@narrator.ai",
        REQUEST_SUBMITTED_EMAIL_TEMPLATE,
        template_model,
        tag="data_request_submitted",
        skip_opt_out=True,
        reply_to=company.user.email,
    )
    return dict(request_id=request_id)
