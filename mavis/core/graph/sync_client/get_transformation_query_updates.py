from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import transformation_update_types_enum


class GetTransformationQueryUpdates(BaseModel):
    query_updates: List["GetTransformationQueryUpdatesQueryUpdates"]


class GetTransformationQueryUpdatesQueryUpdates(BaseModel):
    processed_at: Any
    rows_inserted: int
    update_duration: Optional[int]
    from_sync_time: Any
    to_sync_time: Any
    transformation_id: Any
    transformation: "GetTransformationQueryUpdatesQueryUpdatesTransformation"


class GetTransformationQueryUpdatesQueryUpdatesTransformation(BaseModel):
    name: Optional[str]
    table: Optional[str]
    update_type: Optional[transformation_update_types_enum]


GetTransformationQueryUpdates.update_forward_refs()
GetTransformationQueryUpdatesQueryUpdates.update_forward_refs()
GetTransformationQueryUpdatesQueryUpdatesTransformation.update_forward_refs()
