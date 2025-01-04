from pydantic import BaseModel, Field

from core.models.ids import UUIDStr
from core.utils import Notification
from core.v4 import createDataset


class Node(BaseModel):
    id: str
    data: dict


class Branch(BaseModel):
    id: str
    source: str
    target: str


class GraphOutput(BaseModel):
    nodes: list[Node]
    branches: list[Branch]


class FieldInput(BaseModel):
    field_configs: list[dict]
    field_configs_changed: list[dict] | None = None
    input_fields: dict = Field(None, alias="fields")


class FieldsResults(BaseModel):
    input_fields: dict = Field(..., alias="fields")
    updated: list[str] | None = None


class ComponentInput(BaseModel):
    content: dict | str | None = None
    contents: list[dict] | None = None
    input_fields: dict = Field(None, alias="fields")


class NarrativeResult(BaseModel):
    output_key: str | None
    narrative: dict  # TODO: make a model for a narrative


class NarrativeIconInput(BaseModel):
    narrative_id: UUIDStr
    image: str


class DynamicInput(BaseModel):
    name: str
    value: str | list[str] | float | dict | None
    filter: createDataset.Filter | None


class DynamicNarrativeInput(BaseModel):
    slug: str
    run_timestamp: str
    user_inputs: list[DynamicInput]


class FilterOption(BaseModel):
    visible: bool = True
    selected_filters: list[createDataset.PossibleColumnFilter] | None
    column_options: list[createDataset.PossibleColumn] | None


class TimeFilterOption(BaseModel):
    visible: bool = True
    selected_filter: createDataset.Filter = dict(operator="time_range", from_type="start_of_time", to_type="now")


class TimeResolutionOption(BaseModel):
    visible: bool = True
    resolution: createDataset.ResolutionEnum | None


class FilterOptionsOutput(BaseModel):
    customer_options: FilterOption = FilterOption()
    cohort_activity_options: FilterOption = FilterOption()
    cohort_activity: dict | None
    time_option: TimeFilterOption = TimeFilterOption()
    time_resolution_option: TimeResolutionOption = TimeResolutionOption()
    details: str | None


class NarrativeLoadInput(BaseModel):
    slug: str
    snapshot: str
    dynamic_fields: list[DynamicInput] | None


class NarrativeLoadOutput(BaseModel):
    narrative: dict
    upload_key: str = None
    input_fields: dict = Field(..., alias="fields")
    field_configs: list[dict]
    dynamic_fields: list[dict] | None
    applied_filters: list[str] | None
    filtered_for_user: str | None
    selected_filters: int | None
    questions: list[dict] | None
    _last_modified_at: str | None


class NarrativeConfigInput(BaseModel):
    narrative: dict
    field_configs: list[dict]
    dynamic_filters: list[dict] | None
    datasets: list[dict] | None
    input_fields: dict = Field(None, alias="fields")
    questions: list[dict] | None
    type: str | None


class NarrativeConfigOutput(BaseModel):
    narrative: dict
    input_fields: dict = Field(..., alias="fields")
    field_configs: list[dict]
    dynamic_filters: list[dict] = None
    datasets: list[dict] = None
    refresh: bool
    updated: list[str] = None
    questions: list[dict] = None


class NarrativeConfigBlockInput(BaseModel):
    narrative: dict
    type: str


class NarrativeUpdateOutput(BaseModel):
    success: bool
    narrative_id: UUIDStr
    narrative_slug: str
    completed: list[str]
    notification: Notification | None = None


class NarrativeUpdateBasicOutput(BaseModel):
    success: bool
    rerun: bool


class NarrativeUpdateInput(BaseModel):
    name: str
    narrative_id: UUIDStr | None
    description: str | None
    category: str | None
    tags: list[str] | None
    schedule: str | None
    state: str = "in_progress"
    slug: str
    requested_by: UUIDStr | None
    created_by: UUIDStr | None
    type: str | None
    depends_on: list[UUIDStr] | None
    config: NarrativeConfigInput | None


class NarrativeDuplicateInput(BaseModel):
    name: str
    duplicate_datasets: bool = True


class BlockResult(BaseModel):
    data_schema: dict | list = Field(..., alias="schema")
    ui_schema: dict
    data: dict | list
    internal_cache: dict


class BlockInput(BaseModel):
    block_slug: str
    input_fields: dict = Field(..., alias="fields")
    data: dict | list | None
