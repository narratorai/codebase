from pydantic import BaseModel, Field, root_validator

from core.api.customer_facing.utils.pydantic import CamelModel
from core.constants import DATASET_LIMIT
from core.utils import DatasetInput
from core.v4.datasetPlotter import AntVPlot


class RunPlotInput(CamelModel):
    dataset: dict | None = None
    dataset_slug: str | None = None
    plot_slug: str
    group_slug: str


class DrillIntoInput(CamelModel):
    dataset_slug: str | None = None
    dataset: DatasetInput | None = None

    plot_row: dict
    group_slug: str
    plot_slug: str
    narrative_slug: str | None
    upload_key: str | None = None

    @root_validator()
    def validate_dataset_slug_or_obj(cls, values):
        if not values.get("dataset") and not values.get("dataset_slug"):
            raise ValueError("either 'dataset_slug' or 'dataset' is required")
        return values


class DrillIntoOutput(BaseModel):
    table_data: dict
    staged_dataset: dict
    new_group_slug: str
    current_row_count: int
    dataset_limit: int = DATASET_LIMIT


class LoadPlotInput(CamelModel):
    dataset_slug: str | None = None
    dataset: dict | None = None
    group_slug: str
    plot_slug: str | None
    is_copy: bool = False


class LoadPlotOutput(BaseModel):
    data_schema: dict | list = Field(..., alias="schema")
    ui_schema: dict
    data: dict | list
    internal_cache: dict


class AntVPlotOutput(AntVPlot):
    kpi_locked: bool | None
