from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import transformation_kinds_enum, transformation_update_types_enum


class TransformationIndex(BaseModel):
    all_transformations: List["TransformationIndexAllTransformations"]


class TransformationIndexAllTransformations(BaseModel):
    id: Any
    slug: str
    name: Optional[str]
    kind: Optional[transformation_kinds_enum]
    created_at: Any
    update_type: Optional[transformation_update_types_enum]
    table: Optional[str]
    task_id: Optional[Any]
    activities: List["TransformationIndexAllTransformationsActivities"]
    production_queries_aggregate: "TransformationIndexAllTransformationsProductionQueriesAggregate"


class TransformationIndexAllTransformationsActivities(BaseModel):
    activity_id: Any


class TransformationIndexAllTransformationsProductionQueriesAggregate(BaseModel):
    aggregate: Optional["TransformationIndexAllTransformationsProductionQueriesAggregateAggregate"]


class TransformationIndexAllTransformationsProductionQueriesAggregateAggregate(BaseModel):
    count: int


TransformationIndex.update_forward_refs()
TransformationIndexAllTransformations.update_forward_refs()
TransformationIndexAllTransformationsActivities.update_forward_refs()
TransformationIndexAllTransformationsProductionQueriesAggregate.update_forward_refs()
TransformationIndexAllTransformationsProductionQueriesAggregateAggregate.update_forward_refs()
