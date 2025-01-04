from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field

from core.api.customer_facing.datasets.models import DatasetOutput
from core.api.customer_facing.reports.prosmirror import ProsmirrorNode
from core.graph.sync_client.enums import narrative_types_enum
from core.models.ids import UUIDStr
from core.models.table import ColumnTypeEnum, DisplayFormatEnum, TableData
from core.v4.dataset_comp.query.model import AnyFilter, ParentFilterExpression
from core.v4.datasetPlotter import AntVPlot

from ..utils.pydantic import (
    OUTPUT_MODEL_EXAMPLE_WITH_VIEWS,
    BasicObject,
    CamelModel,
    FilterParamWithAll,
    GraphTask,
    NodeDatasetConfig,
    OutputModelWithViews,
    TeamPermission,
)


class GetReportQueryParams(CamelModel):
    version_id: UUIDStr | Literal["latest", "lastRun"] = "lastRun"  # Later we add here `run_key`, too


class UsedDataset(CamelModel):
    dataset: DatasetOutput
    tab_slugs: list[str | None]


class UsedDatasetsResponse(CamelModel):
    total_count: int
    data: list[UsedDataset]


class ProsemirrorSchema(CamelModel):
    type: Literal["prosemirrorSchema"]
    content: list[dict]
    meta: dict = Field(default_factory=dict)
    text: str | None = None


class Dependency(CamelModel):
    # Only run uid id if the depends_on_ids all have been run
    id: UUIDStr
    depends_on_ids: list[UUIDStr]


class ReportContent(CamelModel):
    document: ProsemirrorSchema | None
    ordered_dependencies: list[Dependency] = Field(default_factory=list)
    id: UUIDStr | None = None
    version_id: UUIDStr | None = None


class TextComponents(BaseModel):
    summary: str
    key_takeaways: list[str]


class node_type_enum(StrEnum):
    plot = "plot"
    table = "table"
    data_table = "dataTable"
    metric = "datasetMetric"
    filter = "filter"
    decision = "decision"


class FilterKind(StrEnum):
    normal = "normal"
    single_select = "single_select"
    multi_select = "multi_select"
    current_user = "current_user"


class SimpleTab(CamelModel):
    slug: str
    as_parent_filter: bool = False


class DatasetColumnFilter(CamelModel):
    id: str
    label: str
    type: ColumnTypeEnum
    dataset: BasicObject
    tab: SimpleTab | None


class FilterData(CamelModel):
    constraint_list: list[str | bool | float] | None = None
    default_value: str | None = None
    is_editable: bool = True


class AppliedFilter(CamelModel):
    filter_id: UUIDStr
    applied_on: list[DatasetColumnFilter]
    filter: AnyFilter


class DatasetColumnReplace(DatasetColumnFilter):
    replace_content: str


class DatasetConfig(CamelModel):
    dataset: NodeDatasetConfig


class NodeApplyDatasetConfig(NodeDatasetConfig):
    apply_on: list[DatasetColumnReplace] = Field(default_factory=list)


class DecisionOutput(CamelModel):
    type: Literal["group_value", "text", "number", "boolean", "timestamp", "group_value_list", "number_list"]
    format: Literal[DisplayFormatEnum.currency, DisplayFormatEnum.percent, DisplayFormatEnum.decimal] | None = None
    color: str = "#48494B"


class DecisionNodeConfig(CamelModel):
    title: str | None = None
    prompt: str
    output: DecisionOutput
    input_data: list[NodeDatasetConfig] = Field(default_factory=list)
    applied_on: list[DatasetColumnReplace] = Field(default_factory=list)


class DecisionNodeOutput(CamelModel):
    node_id: UUIDStr | str
    value: str | float | bool | list[str] | list[float] | None
    content: ProsmirrorNode
    applied_on: list[DatasetColumnReplace] = Field(default_factory=list)


class RunDetails(CamelModel):
    id: UUIDStr | None = None
    version_id: UUIDStr | None = None
    run_key: str | None = None
    applied_filters: list[AppliedFilter] = Field(default_factory=list)
    decisions: list[DecisionNodeOutput] = Field(default_factory=list)


class EachUsedFilter(BaseModel):
    id: str
    used_at: str
    filters: list[AppliedFilter]


class UsedFilter(BaseModel):
    used_filters: list[EachUsedFilter]


class LogRun(CamelModel):
    run_details: RunDetails


class DatasetNodeDetails(CamelModel):
    dataset_name: str | None
    dataset_id: str | None
    version_id: str | None
    tab_slug: str | None
    group_name: str | None
    snapshot_time: str | None
    applied_filters: list | None = None


class MetricData(CamelModel):
    title: str
    color: str = "#48494B"
    current_value: float | str | None
    comparison_value: float | str | None
    show_ticker: bool = False
    format: DisplayFormatEnum
    plot_data: dict | None
    context: DatasetNodeDetails


class NarrativeRun(CamelModel):
    id: UUIDStr
    created_at: str
    version_id: UUIDStr
    run_key: str


class NarrativeRuns(CamelModel):
    page: int
    per_page: int
    data: list[NarrativeRun]


class NarrativeVersion(CamelModel):
    id: UUIDStr
    created_at: str
    user_id: UUIDStr
    s3_key: str


class NarrativeVersions(CamelModel):
    page: int
    per_page: int
    data: list[NarrativeVersion]


class NarrativeConfig(CamelModel):
    config: dict


class CreateReportInput(CamelModel):
    name: str = Field(min_length=3, max_length=50)
    description: str | None = Field(max_length=100)
    cron_schedule: str | None


class UpdateReportContentIO(CamelModel):
    content: ReportContent
    notify_overlap_updated_by: UUIDStr | None = None


class SendReportEmail(CamelModel):
    user_ids: list[UUIDStr]
    run_details: RunDetails = Field(default_factory=RunDetails)


class DownloadInput(CamelModel):
    format: Literal["png", "pdf"] = "pdf"
    run_details: RunDetails = Field(default_factory=RunDetails)


class CreateReportOutput(CamelModel):
    id: UUIDStr
    name: str
    description: str | None = None
    content: ReportContent | None = None
    updated_at: str
    updated_by: UUIDStr
    notify_overlap_updated_by: UUIDStr | None = None


class QueryParams(FilterParamWithAll):
    pass


class LastRun(CamelModel):
    version_id: UUIDStr | None
    run_key: str | None
    created_at: str | None


class ReportScreenshot(CamelModel):
    attachment_id: UUIDStr
    file_extension: str


class ReportOutput(OutputModelWithViews):
    description: str | None
    last_run: LastRun | None
    scheduled: bool = False
    screenshot: ReportScreenshot | None = None


class NarrativeGet(CamelModel):
    id: UUIDStr
    created_at: str | None
    created_by: UUIDStr | None
    updated_at: str | None
    updated_by: UUIDStr | None
    version_id: UUIDStr | None
    name: str
    description: str | None
    template_id: UUIDStr | None
    type: narrative_types_enum
    company_task: GraphTask | None
    tag_ids: list[UUIDStr]
    favorited: bool = False
    last_run: LastRun | None
    team_permissions: list[TeamPermission]
    shared_with_everyone: bool = False
    datasets: list[BasicObject]
    can_edit: bool
    content: ReportContent | None


class NarrativeSchedule(CamelModel):
    cron_schedule: str
    label: str | None


class NarrativeRunOutput(CamelModel):
    s3_key: str


class SnapshotOutput(CamelModel):
    id: str
    created_at: str
    s3_key: str


class NarrativeSnapshotOutput(CamelModel):
    snapshots: list[SnapshotOutput]


class MetricNodeConfig(CamelModel):
    title: str | None = None
    color: str = "#48494B"
    dataset: NodeApplyDatasetConfig
    filters: ParentFilterExpression | None = None
    comparison_filter: ParentFilterExpression | None = None
    show_plot: bool = False
    show_ticker: bool = False
    # deprecated
    plot_color: str = "#48494B"


class FilterDefaultStateEnum(StrEnum):
    none = "none"
    first = "first"
    custom = "custom"
    current_user = "current_user"


class FilterNodeConfig(CamelModel):
    name: str
    type: ColumnTypeEnum
    operator: str
    default_state: FilterDefaultStateEnum = FilterDefaultStateEnum.none
    # only if equals, not equals, in or not in
    give_dropdown_options: bool = False
    # if the default state is custom, then the user can put a default value or just leave it blank
    default_value: str | None = None
    # where to apply the filter
    apply_on: list[DatasetColumnFilter]
    # unless admin, the user cannot edit this filter
    is_editable: bool = True


class CompileNode(CamelModel):
    type: node_type_enum
    attrs: dict


class CompileInput(CamelModel):
    node: CompileNode
    run_details: RunDetails = Field(default_factory=RunDetails)


class CompileOutput(CamelModel):
    type: node_type_enum
    content: AntVPlot | TableData | MetricData | DecisionNodeOutput | FilterData


class GetReportsOutput(CamelModel):
    total_count: int
    page: int
    per_page: int
    data: list[ReportOutput]

    class Config:
        schema_extra = {
            "examples": [
                {
                    "totalCount": 1,
                    "page": 1,
                    "perPage": 1,
                    "data": [
                        {
                            **OUTPUT_MODEL_EXAMPLE_WITH_VIEWS,
                            "description": "Report Details",
                            "type": "dashboard",
                        }
                    ],
                }
            ]
        }
