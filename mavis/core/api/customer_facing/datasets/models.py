from enum import StrEnum

from pydantic import Field

from core.graph.sync_client.enums import materialization_type_enum
from core.models.ids import UUIDStr
from core.models.table import ColumnTypeEnum, TableData
from core.v4.dataset_comp.integrations.model import Materialization
from core.v4.dataset_comp.query.model import DatasetObject, TabKindEnum

from ..utils.pydantic import (
    OUTPUT_MODEL_EXAMPLE_WITH_VIEWS,
    CamelModel,
    FilterParamWithAll,
    OutputModelWithViews,
)


class GroupingEnum(StrEnum):
    recently_viewed = "recently_viewed"
    recently_viewed_by_team = "recently_viewed_by_team"
    top_viewed_by_team = "top_viewed_by_team"
    top_favorited_by_team = "top_favorited_by_team"
    activated_data = "activated_data"
    exported_data = "exported_data"


class QueryParams(FilterParamWithAll):
    grouping: GroupingEnum | None = None
    locked: bool | None = None
    has_training: bool | None = None
    integration_types: list[materialization_type_enum] | None = None
    activities: list[UUIDStr] | None = None


class DatasetOutput(OutputModelWithViews):
    description: str | None
    locked: bool = False
    table_id: UUIDStr | None = None
    activities: list[UUIDStr] = Field(default_factory=list)
    integration_types: list[str] = Field(default_factory=list)
    dependents: list[str] = Field(default_factory=list)


class ParameterPlot(CamelModel):
    name: str
    slug: str


class ParameterColumn(CamelModel):
    id: str
    label: str
    type: ColumnTypeEnum = ColumnTypeEnum.string


class ParameterTab(CamelModel):
    kind: TabKindEnum
    slug: str
    label: str
    plots: list[ParameterPlot] = []
    columns: list[ParameterColumn] = []


class DatasetParameters(CamelModel):
    columns: list[ParameterColumn]
    all_tabs: list[ParameterTab]


class DatasetVersion(CamelModel):
    id: UUIDStr
    created_at: str
    user_id: UUIDStr


class DatasetVersions(CamelModel):
    page: int
    per_page: int
    data: list[DatasetVersion]


class DownloadCSVDatasetOutput(CamelModel):
    scheduled: bool
    message: str


class DuplicateInput(CamelModel):
    name: str
    applied_filters: dict | None = None


class DatasetDuplicateOutput(CamelModel):
    id: UUIDStr


class ColumnMetrics(CamelModel):
    pass


class DatasetCount(CamelModel):
    count: int


class ColumnValues(CamelModel):
    values: list[str]


class DatasetTable(CamelModel):
    data: TableData
    page: int
    per_page: int
    total_count: int


class DatasetWithRows(CamelModel):
    dataset: DatasetObject | None = None
    plot_row: dict


class DatasetProperties(CamelModel):
    name: str
    description: str | None = None
    tags: list[UUIDStr] = Field(default_factory=list)
    locked: bool = False
    hide_from_index: bool = False


# class GetDataset(CamelModel):
#     id: UUIDStr
#     created_by: UUIDStr
#     locked: bool = False
#     hide_from_index: bool = False
#     description: str | None = None


class DatasetIntegration(CamelModel):
    integrations: list[Materialization]


class GetDatasetOutput(CamelModel):
    total_count: int
    page: int
    per_page: int
    data: list[DatasetOutput]

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
                            "updatedAt": "2023-10-14T10:30:00.000000+00:00",
                            "description": "something about mrr",
                            "locked": False,
                            "hasTraining": False,
                            "integrationTypes": ["Google Sheet"],
                            "dependents": ["MRR daily narrative"],
                        }
                    ],
                }
            ]
        }
