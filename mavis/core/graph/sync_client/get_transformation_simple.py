from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import transformation_kinds_enum, transformation_update_types_enum


class GetTransformationSimple(BaseModel):
    transformation: Optional["GetTransformationSimpleTransformation"]


class GetTransformationSimpleTransformation(BaseModel):
    id: Any
    kind: Optional[transformation_kinds_enum]
    update_type: Optional[transformation_update_types_enum]
    slug: str
    name: Optional[str]
    updated_at: Any
    start_data_after: Optional[Any]
    table: Optional[str]
    current_query: Optional["GetTransformationSimpleTransformationCurrentQuery"]
    company: "GetTransformationSimpleTransformationCompany"
    column_renames: List["GetTransformationSimpleTransformationColumnRenames"]


class GetTransformationSimpleTransformationCurrentQuery(BaseModel):
    sql: Optional[str]
    updated_at: Optional[Any]


class GetTransformationSimpleTransformationCompany(BaseModel):
    slug: str


class GetTransformationSimpleTransformationColumnRenames(BaseModel):
    id: Optional[Any]
    created_at: Optional[Any]
    name: Optional[str]
    type: Optional[str]
    casting: Optional[str]


GetTransformationSimple.update_forward_refs()
GetTransformationSimpleTransformation.update_forward_refs()
GetTransformationSimpleTransformationCurrentQuery.update_forward_refs()
GetTransformationSimpleTransformationCompany.update_forward_refs()
GetTransformationSimpleTransformationColumnRenames.update_forward_refs()
