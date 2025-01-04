from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import transformation_update_types_enum


class GetTransformationForProduction(BaseModel):
    transformation: Optional["GetTransformationForProductionTransformation"]


class GetTransformationForProductionTransformation(BaseModel):
    id: Any
    name: Optional[str]
    slug: str
    table: Optional[str]
    update_type: Optional[transformation_update_types_enum]
    production_queries: List["GetTransformationForProductionTransformationProductionQueries"]


class GetTransformationForProductionTransformationProductionQueries(BaseModel):
    created_at: Optional[Any]
    sql: Optional[str]
    updated_by: Optional[str]


GetTransformationForProduction.update_forward_refs()
GetTransformationForProductionTransformation.update_forward_refs()
GetTransformationForProductionTransformationProductionQueries.update_forward_refs()
