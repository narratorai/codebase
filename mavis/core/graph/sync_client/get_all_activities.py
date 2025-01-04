from typing import Any, List, Optional

from pydantic import Field

from .base_model import BaseModel
from .enums import maintenance_kinds_enum


class GetAllActivities(BaseModel):
    activity_aggregate: "GetAllActivitiesActivityAggregate"
    activities: List["GetAllActivitiesActivities"]


class GetAllActivitiesActivityAggregate(BaseModel):
    aggregate: Optional["GetAllActivitiesActivityAggregateAggregate"]


class GetAllActivitiesActivityAggregateAggregate(BaseModel):
    total_count: int = Field(alias="totalCount")


class GetAllActivitiesActivities(BaseModel):
    id: Any
    slug: str
    name: Optional[str]
    description: Optional[str]
    row_count: Optional[int]
    tags: List["GetAllActivitiesActivitiesTags"]
    category: Optional["GetAllActivitiesActivitiesCategory"]
    alerts: List["GetAllActivitiesActivitiesAlerts"]
    table_id: Optional[Any]
    created_at: Any
    updated_at: Any
    column_renames: List["GetAllActivitiesActivitiesColumnRenames"]
    activity_dims: List["GetAllActivitiesActivitiesActivityDims"]


class GetAllActivitiesActivitiesTags(BaseModel):
    id: Optional[Any]


class GetAllActivitiesActivitiesCategory(BaseModel):
    id: Any
    name: str
    color: Optional[str]


class GetAllActivitiesActivitiesAlerts(BaseModel):
    id: Any
    kind: maintenance_kinds_enum
    notes: Optional[str]
    started_at: Any


class GetAllActivitiesActivitiesColumnRenames(BaseModel):
    id: Optional[Any]
    label: Optional[str]
    type: Optional[str]
    name: Optional[str]
    has_data: Optional[bool]


class GetAllActivitiesActivitiesActivityDims(BaseModel):
    activity_join_column: str
    slowly_changing_ts_column: Optional[str]
    dim_table: "GetAllActivitiesActivitiesActivityDimsDimTable"


class GetAllActivitiesActivitiesActivityDimsDimTable(BaseModel):
    id: Any
    schema_: Optional[str]
    table: str
    join_key: Optional[str]
    columns: List["GetAllActivitiesActivitiesActivityDimsDimTableColumns"]


class GetAllActivitiesActivitiesActivityDimsDimTableColumns(BaseModel):
    id: Optional[Any]
    name: Optional[str]
    type: Optional[str]
    label: Optional[str]


GetAllActivities.update_forward_refs()
GetAllActivitiesActivityAggregate.update_forward_refs()
GetAllActivitiesActivityAggregateAggregate.update_forward_refs()
GetAllActivitiesActivities.update_forward_refs()
GetAllActivitiesActivitiesTags.update_forward_refs()
GetAllActivitiesActivitiesCategory.update_forward_refs()
GetAllActivitiesActivitiesAlerts.update_forward_refs()
GetAllActivitiesActivitiesColumnRenames.update_forward_refs()
GetAllActivitiesActivitiesActivityDims.update_forward_refs()
GetAllActivitiesActivitiesActivityDimsDimTable.update_forward_refs()
GetAllActivitiesActivitiesActivityDimsDimTableColumns.update_forward_refs()
