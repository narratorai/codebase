from typing import Any, List, Optional

from .base_model import BaseModel


class ActivityIndexWColumns(BaseModel):
    all_activities: List["ActivityIndexWColumnsAllActivities"]


class ActivityIndexWColumnsAllActivities(BaseModel):
    category: Optional[str]
    description: Optional[str]
    id: Any
    name: Optional[str]
    slug: str
    updated_at: Any
    table_id: Optional[Any]
    company_table: Optional["ActivityIndexWColumnsAllActivitiesCompanyTable"]
    column_renames: List["ActivityIndexWColumnsAllActivitiesColumnRenames"]
    activity_dims: List["ActivityIndexWColumnsAllActivitiesActivityDims"]


class ActivityIndexWColumnsAllActivitiesCompanyTable(BaseModel):
    activity_stream: str


class ActivityIndexWColumnsAllActivitiesColumnRenames(BaseModel):
    id: Optional[Any]
    label: Optional[str]
    type: Optional[str]
    name: Optional[str]
    has_data: Optional[bool]


class ActivityIndexWColumnsAllActivitiesActivityDims(BaseModel):
    activity_join_column: str
    slowly_changing_ts_column: Optional[str]
    dim_table: "ActivityIndexWColumnsAllActivitiesActivityDimsDimTable"


class ActivityIndexWColumnsAllActivitiesActivityDimsDimTable(BaseModel):
    id: Any
    schema_: Optional[str]
    table: str
    join_key: Optional[str]
    columns: List["ActivityIndexWColumnsAllActivitiesActivityDimsDimTableColumns"]


class ActivityIndexWColumnsAllActivitiesActivityDimsDimTableColumns(BaseModel):
    id: Optional[Any]
    name: Optional[str]
    type: Optional[str]
    label: Optional[str]


ActivityIndexWColumns.update_forward_refs()
ActivityIndexWColumnsAllActivities.update_forward_refs()
ActivityIndexWColumnsAllActivitiesCompanyTable.update_forward_refs()
ActivityIndexWColumnsAllActivitiesColumnRenames.update_forward_refs()
ActivityIndexWColumnsAllActivitiesActivityDims.update_forward_refs()
ActivityIndexWColumnsAllActivitiesActivityDimsDimTable.update_forward_refs()
ActivityIndexWColumnsAllActivitiesActivityDimsDimTableColumns.update_forward_refs()
