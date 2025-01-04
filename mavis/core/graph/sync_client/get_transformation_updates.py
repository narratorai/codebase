from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import maintenance_kinds_enum, transformation_update_types_enum


class GetTransformationUpdates(BaseModel):
    transformation: Optional["GetTransformationUpdatesTransformation"]


class GetTransformationUpdatesTransformation(BaseModel):
    last_diff_data_and_insert_at: Optional[Any]
    last_resynced_at: Optional[Any]
    next_resync_at: Optional[Any]
    start_data_after: Optional[Any]
    has_source: Optional[bool]
    query_updates: List["GetTransformationUpdatesTransformationQueryUpdates"]
    transformation_maintenances: List["GetTransformationUpdatesTransformationTransformationMaintenances"]
    activities: List["GetTransformationUpdatesTransformationActivities"]


class GetTransformationUpdatesTransformationQueryUpdates(BaseModel):
    transformation_id: Any
    to_sync_time: Any
    rows_inserted: int
    update_duration: Optional[int]
    processed_at: Any
    update_kind: Optional[transformation_update_types_enum]
    from_sync_time: Any


class GetTransformationUpdatesTransformationTransformationMaintenances(BaseModel):
    notes: Optional[str]
    started_at: Any
    ended_at: Optional[Any]
    kind: maintenance_kinds_enum


class GetTransformationUpdatesTransformationActivities(BaseModel):
    activity: "GetTransformationUpdatesTransformationActivitiesActivity"


class GetTransformationUpdatesTransformationActivitiesActivity(BaseModel):
    name: Optional[str]
    activity_maintenances: List["GetTransformationUpdatesTransformationActivitiesActivityActivityMaintenances"]


class GetTransformationUpdatesTransformationActivitiesActivityActivityMaintenances(BaseModel):
    notes: Optional[str]
    started_at: Any
    ended_at: Optional[Any]
    kind: maintenance_kinds_enum


GetTransformationUpdates.update_forward_refs()
GetTransformationUpdatesTransformation.update_forward_refs()
GetTransformationUpdatesTransformationQueryUpdates.update_forward_refs()
GetTransformationUpdatesTransformationTransformationMaintenances.update_forward_refs()
GetTransformationUpdatesTransformationActivities.update_forward_refs()
GetTransformationUpdatesTransformationActivitiesActivity.update_forward_refs()
GetTransformationUpdatesTransformationActivitiesActivityActivityMaintenances.update_forward_refs()
