import json
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field, root_validator

from core.api.customer_facing.activities.models import BasicActivity
from core.api.customer_facing.journeys.models import JourneyAttribute, JourneyEventsOutput, JourneyFound
from core.api.v1.endpoints.narrative_template import NarrativeGLAMTemplate
from core.models.ids import get_uuid4
from core.models.table import TableData, _external_dict
from core.util.llm import SearchResults
from core.utils import utcnow
from core.v4.dataset_comp.query.model import ActivityColumns, DatasetObject
from core.v4.datasetPlotter import AntVPlot


class agent_name_enum(StrEnum):
    mavis_agent = "Mavis"
    dataset_agent = "Answer Data Question Agent"


class role_enum(StrEnum):
    user = "user"
    mavis = "assistant"
    tool = "tool"


class SetupModel(BaseModel):
    suggestions: list[str]


class UserMessage(BaseModel):
    content: str | None


class Loading(BaseModel):
    percent: float = 100.0
    message: str = "Done"


class data_type_enum(StrEnum):
    user_message = "user_message"
    reply = "reply"
    journey = "journey"
    dataset = "dataset"
    examples = "examples"
    internet_search = "internet_search"
    activities = "activities"
    question_recommendation = "question_recommendation"
    update_context = "update_context"
    context = "context"


class ChatUserHelp(BaseModel):
    ask: str

    @property
    def content(self):
        return self.ask


class ContextData(BaseModel):
    entity: str
    user: str | None = None
    company: str | None = None
    kpi: str | None = None

    @property
    def content(self):
        return f"Entity: {self.entity}\nUser Context: {self.user or 'None'}\nCompany Context: {self.company or 'None'}\nKPI Context: {self.kpi or 'None'}"


class reply_type_enum(StrEnum):
    normal = "normal"
    error = "error"
    help_needed = "help_needed"


class EachJourney(BaseModel):
    customer: str
    row: dict

    @property
    def content(self):
        return self.customer


class ExampleData(BaseModel):
    dataset_id: str
    examples: list[EachJourney]
    customer_key: str
    customer_column: str

    @property
    def content(self):
        return "Some examples are: " + "\n".join([e.content for e in self.examples])


class QuestionRecommendation(BaseModel):
    questions: list[str]
    skill: str

    @property
    def content(self):
        return f"Here is a question for the skill `{self.skill}`: {','.join(self.questions)}"


class ContextUpdate(BaseModel):
    context: str

    @property
    def content(self):
        return f"Context Updated: {self.context}"


class NarrativeDetails(BaseModel):
    slug: str
    id: str
    actionable: bool | None = None


class DatasetData(BaseModel):
    question: str
    # definition of the data
    dataset: DatasetObject | None

    # for running the data
    dataset_id: str | None = None
    tab_slug: str | None = None
    plot_slug: str | None = None
    analyzable: NarrativeGLAMTemplate | None = None
    analysis_narrative: NarrativeDetails | None = None
    plot_data: AntVPlot | None = None
    table_data: TableData | None = None
    sql: str | None = None

    @property
    def content(self):
        return "\n".join(
            [
                "The data is:",
                self.table_data.pretty(),
                "",
            ]
        )


class SearchData(SearchResults):
    term: str


class MessageData(BaseModel):
    text: str
    # FUTURE: Add images, and other types of data

    @property
    def content(self):
        return self.text


class GPTResponse(BaseModel):
    content: str
    suggestions: list[str]


class UpdateContext(BaseModel):
    kind: Literal["user", "company", "kpi"]
    context: str

    @property
    def content(self):
        return f"Context Updated: {self.context}"


class ReplyData(GPTResponse):
    type: reply_type_enum = reply_type_enum.normal

    @property
    def content(self):
        return json.dumps(dict(content=self.content, suggestions=self.suggestions))


class CustomerJourneyConfig(BaseModel):
    customer: JourneyFound
    customer_options: list[JourneyFound] = Field(default_factory=list)
    limit_activities: list[BasicActivity] | None = Field(default_factory=list)
    from_time: str | None = None
    to_time: str | None = None


class JourneyData(BaseModel):
    journey: JourneyEventsOutput | None = None
    attributes: JourneyAttribute | None = None
    config: CustomerJourneyConfig

    @property
    def content(self):
        content = [
            f"Here is the customer journey for the entity: {self.config.customer}"
            "The structure of the journey is `timestamp: activity: occurrence: revenue: activity_attributes`",
            "",
        ]
        content.extend(
            [
                f"{e.ts}: {e.activity}: {e.occurrence}: {e.revenue}: {', '.join([f'{a.name} = {a.value}' for a in e.attributes])}"
                for e in self.events
            ]
        )

        if self.attributes:
            content.append("\nAlso here are all the attributes we know:")
            content.extend([f"- {a.name}: {a.value}" for a in self.attributes.attributes])

        return "\n".join(content)


class ColumnStore(BaseModel):
    name: str
    label: str
    type: str
    examples: list[str] | None

    @property
    def content(self):
        if self.examples:
            example_text = f": (ex. {', '.join([e for e in self.examples])})"
        else:
            example_text = ""
        return f"   - {self.label} ({self.type}){example_text}"


class ActivityStore(BaseModel):
    id: str
    slug: str
    name: str
    description: str | None
    columns: list[ColumnStore] | None

    @property
    def content(self):
        txt = [
            f"{self.name} ({self.slug}) - {self.description}",
            "with columns:",
        ]
        txt.extend(
            [
                c.content
                for c in self.columns
                if c.name
                not in {
                    ActivityColumns.ts,
                    ActivityColumns.activity_id,
                    ActivityColumns.activity_occurrence,
                    ActivityColumns.activity_repeated_at,
                    ActivityColumns.customer,
                    ActivityColumns.anonymous_customer_id,
                }
            ]
        )
        return "\n".join(txt)


class ActivityData(BaseModel):
    activities: list[ActivityStore]

    @property
    def content(self):
        if self.activities:
            common_activities_note = "**NOTE**: Every Activity has `timestamp` (timestamp): The time the activity occurred, `activity_id` (string), `activity_occurrence` (number): The iteration of that activity for the customer, `activity_repeated_at` (timestamp): When the activity next occurred, `customer` (string): The entity that performed the activity"

            return [
                "Here are the activities that are related to the content:",
                "\n\n".join([a.content for a in self.activities]),
                common_activities_note,
            ]
        else:
            return "No related activities found for the content provided."


class LLMMessage(BaseModel):
    id: str = Field(default_factory=get_uuid4)
    role: role_enum = role_enum.mavis

    # whether it is a tool requested by the LLM
    tool_request: dict | None = None

    # This is used to keep track of the answer
    tool_call_id: str | None = None
    function_name: str | None = None

    hidden: bool = False  # does not show in UI
    # loading for the UI
    is_complete: bool = True
    loading: Loading = Field(default_factory=Loading)
    # This is the data that we need to send to the UI
    # If type is none, then we can ignore it for the UI
    type: data_type_enum | None = None
    data: (
        SearchData
        | MessageData
        | ReplyData
        | JourneyData
        | DatasetData
        | ExampleData
        | ActivityData
        | UpdateContext
        | ContextData
        | None
    ) = None

    @root_validator(pre=True)
    def check_data_type(cls, values):
        type_ = values.get("type")
        data = values.get("data")

        if type_ is None or data is None:
            return values

        data_type_mapping = {
            data_type_enum.user_message: MessageData,
            data_type_enum.reply: ReplyData,
            data_type_enum.journey: JourneyData,
            data_type_enum.dataset: DatasetData,
            data_type_enum.examples: ExampleData,
            data_type_enum.internet_search: SearchData,
            data_type_enum.activities: ActivityData,
            data_type_enum.question_recommendation: QuestionRecommendation,
            data_type_enum.update_context: UpdateContext,
            data_type_enum.context: ContextData,
        }
        if type_ not in data_type_mapping:
            raise ValueError(f"Invalid type: {type_}")

        if not isinstance(data, data_type_mapping[type_]):
            if isinstance(data, dict):
                values["data"] = data_type_mapping[type_](**data)
            else:
                raise ValueError(f"data must be of type {data_type_mapping[type_].__name__} when type is {type_}")
        return values

    def complete(self):
        self.is_complete = True
        self.loading = None

    def update_loading(self, percent: float, message: str):
        if percent <= 1.0:
            percent *= 100.0

        self.loading = Loading(percent=percent, message=message)
        self.is_complete = False


class UIMessage(LLMMessage):
    created_at: str = Field(default_factory=utcnow)
    updated_at: str | None = None
    rating: int = 0
    suggestions: list[str] = Field(default_factory=list)
    request_id: str | None = None

    def external_dict(self, **kwargs):
        # bring up the suggestions
        if (self.suggestions) == 0 and isinstance(self.data, ReplyData):
            self.suggestions = self.data.suggestions

        return _external_dict(self.__dict__)


class ReplyMessages(BaseModel):
    new_messages: list[UIMessage]

    def external_dict(self, **kwargs):
        return _external_dict(self.__dict__)
