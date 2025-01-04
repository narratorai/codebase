from enum import Enum

from pydantic import BaseModel, Field

from core import utils
from core.api.customer_facing.utils.pydantic import CamelModel
from core.models.ids import UUIDStr
from core.utils import DatasetInput


class PinnedEnum(Enum):
    LEFT = "left"
    RIGHT = "right"


class PivotOutput(BaseModel):
    values: list[str]


class DatasetResultColumnMapping(BaseModel):
    id: str
    label: str
    format: str
    pinned: PinnedEnum | None = None


class DatasetResultColumn(BaseModel):
    name: str
    friendly_name: str
    type: str | None


class DatasetResultData(BaseModel):
    columns: list[DatasetResultColumn] = []
    rows: list[dict] = []
    metadata: dict | None
    retreived_at: str | None
    job_id: str | None


class DatasetMetricColumn(BaseModel):
    id: str
    label: str
    type: str  # TODO enum
    kind: str  # TODO enum
    metrics_type: str  # TODO enum
    metrics: list[dict] = []  # TODO DatasetMetric type not dict


class DatasetOutput(BaseModel):
    query: str = ""
    data: DatasetResultData | None = None
    column_mapping: list[DatasetResultColumnMapping] = []
    metrics: list[DatasetMetricColumn] = []
    total_rows: int | None
    notification: utils.Notification | None
    is_approx: bool = True


class RunDatasetInput(CamelModel):
    dataset: DatasetInput


class DatasetMetricsInput(CamelModel):
    dataset: DatasetInput
    metric_kind: str | None  # TODO enum
    column_ids: list[str] | None


class DatasetMetricsOutput(BaseModel):
    total_rows: int | None
    columns: list[DatasetMetricColumn] = []


class DownloadCSVDatasetOutput(BaseModel):
    success: bool = False


class SnapshotOutput(BaseModel):
    datasest_slug: str


class ComputedValidateInput(CamelModel):
    dataset: DatasetInput
    freehand_string: str


class ComputedValidateOutput(BaseModel):
    column_sql: str
    output_type: str
    group_func: list[str] | None


class DatasetCountOutput(BaseModel):
    total_rows: int | None


class DatasetTranslateInput(CamelModel):
    dataset: DatasetInput


class DatasetTranslateOutput(BaseModel):
    query: str | None


class DatasetAutocompleteOutput(BaseModel):
    autocomplete: list[dict]
    all_functions: list[dict]


class UpdateDatasetInput(CamelModel):
    dataset: dict | None
    meta: dict | None

    id: UUIDStr | None
    name: str | None = "New Dataset"
    slug: str | None
    category: str | None
    description: str | None
    status: str | None = "in_progress"
    materializations: list[dict] = Field(default_factory=list)
    created_by: str | None
    hide_from_index: bool = False
    tags: list[str | dict] | None
    as_quick_save: bool = False
    locked: bool | None


class UpdateDatasetOutput(BaseModel):
    success: bool
    dataset_id: UUIDStr
    dataset_slug: str
    completed: list[str]
    notification: utils.Notification | None


class DatasetDuplicateInput(CamelModel):
    name: str


class DatasetCustomerJourneyInput(CamelModel):
    row: dict
    dataset_slug: str = None
    dataset: DatasetInput | None
    limit: int = 1000
    offset: int = 0


class ColumnAutocomplete(BaseModel):
    id: str
    label: str
    type: str


class Plots(BaseModel):
    slug: str
    label: str


class GroupAutocomplete(BaseModel):
    slug: str
    name: str
    columns: list[ColumnAutocomplete]
    plots: list[Plots]
