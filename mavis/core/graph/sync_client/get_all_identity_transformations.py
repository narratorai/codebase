from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import transformation_kinds_enum, transformation_update_types_enum


class GetAllIdentityTransformations(BaseModel):
    all_transformations: List["GetAllIdentityTransformationsAllTransformations"]


class GetAllIdentityTransformationsAllTransformations(BaseModel):
    id: Any
    kind: Optional[transformation_kinds_enum]
    name: Optional[str]
    next_resync_at: Optional[Any]
    last_diff_data_and_insert_at: Optional[Any]
    has_source: Optional[bool]
    is_aliasing: Optional[bool]
    remove_customers: Optional[bool]
    mutable_day_window: Optional[int]
    delete_window: Optional[int]
    table: Optional[str]
    slug: str
    update_type: Optional[transformation_update_types_enum]
    column_renames: List["GetAllIdentityTransformationsAllTransformationsColumnRenames"]


class GetAllIdentityTransformationsAllTransformationsColumnRenames(BaseModel):
    id: Optional[Any]
    name: Optional[str]
    label: Optional[str]
    has_data: Optional[bool]
    type: Optional[str]
    casting: Optional[str]
    description: Optional[str]


GetAllIdentityTransformations.update_forward_refs()
GetAllIdentityTransformationsAllTransformations.update_forward_refs()
GetAllIdentityTransformationsAllTransformationsColumnRenames.update_forward_refs()
