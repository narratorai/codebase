from typing import List, Optional

from pydantic import BaseModel, Field

from core.constants import LLM_AGENT_MODEL
from core.logger import get_logger
from core.util.llm import llm_client
from core.v4.dataset_comp.query.model import (
    ActivityColumns,
    AppendFetchTypeEnum,
    CohortFetchTypeEnum,
    ColumnCollectionEnum,
    DatasetObject,
    RefinementTimeDetails,
    RelationTypeEnum,
)
from core.v4.dataset_comp.query.util import Dataset
from core.v4.llm.helpers import load_prompt
from core.v4.llm.models import ActivityStore, ChatUserHelp, ReplyData, UIMessage, data_type_enum, reply_type_enum
from core.v4.llm.tools.get_related_activities import search_activities
from core.v4.mavis import Mavis

logger = get_logger()


class ChatActivity(BaseModel):
    slugs: list[str] = Field(default_factory=list)


class ChatCohortActivity(ChatActivity):
    fetch_type: CohortFetchTypeEnum


class AppendActivity(ChatActivity):
    fetch_type: AppendFetchTypeEnum
    relation: RelationTypeEnum
    time_refinements: List[RefinementTimeDetails] = Field(default_factory=list)


class ChatDatasetConfig(BaseModel):
    cohort_activity: Optional[ChatCohortActivity] = None
    append_activities: List[AppendActivity] = Field(default_factory=list)


class ChatDatasetConfigResponse(BaseModel):
    dataset_config: ChatDatasetConfig | ChatUserHelp


def generate_dataset_config(mavis: Mavis, table_id: str, question: str, message: UIMessage) -> UIMessage:
    # get the activities
    activity_data = search_activities(mavis.user, table_id, question)
    prompt = load_prompt(mavis.company, "dataset_config", activities=activity_data.content)
    messages = [
        dict(role="system", content=prompt),
    ]
    # TODO: add Few-Shot examples

    # Add the user question
    messages.append(dict(role="user", content=question))
    logger.debug("Asking LLM for dataset config", prompt=prompt, user_message=question)

    response = llm_client.beta.chat.completions.parse(
        model=LLM_AGENT_MODEL,
        messages=messages,
        response_format=ChatDatasetConfigResponse,
    )
    response = response.choices[0].message.parsed
    logger.debug("LLM returned dataset config", response=response.dict())

    if isinstance(response.dataset_config, ChatUserHelp):
        message.type = data_type_enum.user_message
        message.data = ReplyData(content=response.dataset_config.ask, suggestions=[], type=reply_type_enum.help_needed)
    else:
        res = response.dataset_config.dict()

        # Add the activity ids
        update_activity([res["cohort_activity"]] + res["append_activities"], activity_data.activities)
        message.data.dataset = DatasetObject(table_id=table_id, **res)

        message.data.dataset.columns = Dataset(mavis, model=message.data.dataset).get_available_columns(
            ColumnCollectionEnum.min
        )
    return message


def update_activity(objs: list[dict], activities: list[ActivityStore]):
    for obj in objs:
        # add the additional fields
        obj["activity_ids"] = [activity.id for activity in activities if activity.slug in obj["slugs"]]
        obj["display_name"] = ", ".join(
            [activity.name for activity in activities if activity.id in obj["activity_ids"]]
        )
        # Add the source
        obj["has_source"] = any(
            any(c.name == ActivityColumns.anonymous_customer_id for c in a.columns)
            for a in activities
            if a.id in obj["activity_ids"]
        )
