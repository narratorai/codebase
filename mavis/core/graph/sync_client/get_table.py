from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import transformation_kinds_enum, transformation_update_types_enum


class GetTable(BaseModel):
    transformation: List["GetTableTransformation"]


class GetTableTransformation(BaseModel):
    id: Any
    kind: Optional[transformation_kinds_enum]
    name: Optional[str]
    table: Optional[str]
    last_resynced_at: Optional[Any]
    update_type: Optional[transformation_update_types_enum]
    column_renames: List["GetTableTransformationColumnRenames"]
    production_queries_aggregate: "GetTableTransformationProductionQueriesAggregate"


class GetTableTransformationColumnRenames(BaseModel):
    label: Optional[str]
    name: Optional[str]
    type: Optional[str]
    casting: Optional[str]
    created_at: Optional[Any]


class GetTableTransformationProductionQueriesAggregate(BaseModel):
    aggregate: Optional["GetTableTransformationProductionQueriesAggregateAggregate"]


class GetTableTransformationProductionQueriesAggregateAggregate(BaseModel):
    count: int


GetTable.update_forward_refs()
GetTableTransformation.update_forward_refs()
GetTableTransformationColumnRenames.update_forward_refs()
GetTableTransformationProductionQueriesAggregate.update_forward_refs()
GetTableTransformationProductionQueriesAggregateAggregate.update_forward_refs()
