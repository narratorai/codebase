from typing import Any, List, Optional

from pydantic import Field

from .base_model import BaseModel
from .enums import (
    maintenance_kinds_enum,
    transformation_kinds_enum,
    transformation_update_types_enum,
)


class GetAllTransformations(BaseModel):
    transformation_aggregate: "GetAllTransformationsTransformationAggregate"
    transformations: List["GetAllTransformationsTransformations"]


class GetAllTransformationsTransformationAggregate(BaseModel):
    aggregate: Optional["GetAllTransformationsTransformationAggregateAggregate"]


class GetAllTransformationsTransformationAggregateAggregate(BaseModel):
    total_count: int = Field(alias="totalCount")


class GetAllTransformationsTransformations(BaseModel):
    id: Any
    slug: str
    name: Optional[str]
    kind: Optional[transformation_kinds_enum]
    update_type: Optional[transformation_update_types_enum]
    table: Optional[str]
    max_days_to_insert: Optional[int]
    start_data_after: Optional[Any]
    requires_identity_resolution: Optional[bool]
    is_aliasing: Optional[bool]
    transformations_activities: List["GetAllTransformationsTransformationsTransformationsActivities"]
    current_query: Optional["GetAllTransformationsTransformationsCurrentQuery"]
    production_queries: List["GetAllTransformationsTransformationsProductionQueries"]
    events: List["GetAllTransformationsTransformationsEvents"]
    created_at: Any
    updated_at: Any


class GetAllTransformationsTransformationsTransformationsActivities(BaseModel):
    activity: "GetAllTransformationsTransformationsTransformationsActivitiesActivity"


class GetAllTransformationsTransformationsTransformationsActivitiesActivity(BaseModel):
    id: Any
    slug: str
    name: Optional[str]


class GetAllTransformationsTransformationsCurrentQuery(BaseModel):
    id: Optional[Any]
    sql: Optional[str]
    notes: Optional[str]
    created_at: Optional[Any]
    updated_at: Optional[Any]


class GetAllTransformationsTransformationsProductionQueries(BaseModel):
    id: Optional[Any]
    sql: Optional[str]
    notes: Optional[str]
    created_at: Optional[Any]
    updated_at: Optional[Any]


class GetAllTransformationsTransformationsEvents(BaseModel):
    id: Any
    kind: maintenance_kinds_enum
    notes: Optional[str]
    started_at: Any


GetAllTransformations.update_forward_refs()
GetAllTransformationsTransformationAggregate.update_forward_refs()
GetAllTransformationsTransformationAggregateAggregate.update_forward_refs()
GetAllTransformationsTransformations.update_forward_refs()
GetAllTransformationsTransformationsTransformationsActivities.update_forward_refs()
GetAllTransformationsTransformationsTransformationsActivitiesActivity.update_forward_refs()
GetAllTransformationsTransformationsCurrentQuery.update_forward_refs()
GetAllTransformationsTransformationsProductionQueries.update_forward_refs()
GetAllTransformationsTransformationsEvents.update_forward_refs()
