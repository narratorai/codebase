from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import transformation_kinds_enum, transformation_update_types_enum


class GetTransformationForProcessing(BaseModel):
    transformation: Optional["GetTransformationForProcessingTransformation"]


class GetTransformationForProcessingTransformation(BaseModel):
    id: Any
    name: Optional[str]
    delete_window: Optional[int]
    has_source: Optional[bool]
    do_not_delete_on_resync: Optional[bool]
    is_aliasing: Optional[bool]
    kind: Optional[transformation_kinds_enum]
    max_days_to_insert: Optional[int]
    mutable_day_window: Optional[int]
    last_resynced_at: Optional[Any]
    next_resync_at: Optional[Any]
    single_activity: Optional[bool]
    notify_row_count_percent_change: Optional[Any]
    do_not_update_on_percent_change: Optional[bool]
    slug: str
    allow_future_data: Optional[bool]
    start_data_after: Optional[Any]
    table: Optional[str]
    update_type: Optional[transformation_update_types_enum]
    production_queries: List["GetTransformationForProcessingTransformationProductionQueries"]
    column_renames: List["GetTransformationForProcessingTransformationColumnRenames"]
    depends_on_transformations: List["GetTransformationForProcessingTransformationDependsOnTransformations"]
    activities: List["GetTransformationForProcessingTransformationActivities"]
    query_updates: List["GetTransformationForProcessingTransformationQueryUpdates"]


class GetTransformationForProcessingTransformationProductionQueries(BaseModel):
    id: Optional[Any]
    sql: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class GetTransformationForProcessingTransformationColumnRenames(BaseModel):
    id: Optional[Any]
    created_at: Optional[Any]
    name: Optional[str]
    label: Optional[str]
    type: Optional[str]
    casting: Optional[str]


class GetTransformationForProcessingTransformationDependsOnTransformations(BaseModel):
    depends_on_transformation_id: Any


class GetTransformationForProcessingTransformationActivities(BaseModel):
    activity_id: Any
    activity: "GetTransformationForProcessingTransformationActivitiesActivity"


class GetTransformationForProcessingTransformationActivitiesActivity(BaseModel):
    id: Any
    slug: str
    row_count: Optional[int]


class GetTransformationForProcessingTransformationQueryUpdates(BaseModel):
    created_at: Any
    rows_inserted: int
    from_sync_time: Any
    to_sync_time: Any


GetTransformationForProcessing.update_forward_refs()
GetTransformationForProcessingTransformation.update_forward_refs()
GetTransformationForProcessingTransformationProductionQueries.update_forward_refs()
GetTransformationForProcessingTransformationColumnRenames.update_forward_refs()
GetTransformationForProcessingTransformationDependsOnTransformations.update_forward_refs()
GetTransformationForProcessingTransformationActivities.update_forward_refs()
GetTransformationForProcessingTransformationActivitiesActivity.update_forward_refs()
GetTransformationForProcessingTransformationQueryUpdates.update_forward_refs()
