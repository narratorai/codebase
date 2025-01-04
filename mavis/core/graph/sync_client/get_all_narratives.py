from typing import Any, List, Optional

from pydantic import Field

from .base_model import BaseModel
from .enums import status_enum


class GetAllNarratives(BaseModel):
    narrative_aggregate: "GetAllNarrativesNarrativeAggregate"
    narratives: List["GetAllNarrativesNarratives"]


class GetAllNarrativesNarrativeAggregate(BaseModel):
    aggregate: Optional["GetAllNarrativesNarrativeAggregateAggregate"]


class GetAllNarrativesNarrativeAggregateAggregate(BaseModel):
    total_count: int = Field(alias="totalCount")


class GetAllNarrativesNarratives(BaseModel):
    id: Any
    slug: str
    name: str
    description: Optional[str]
    state: status_enum
    snapshots: List["GetAllNarrativesNarrativesSnapshots"]
    tags: List["GetAllNarrativesNarrativesTags"]
    updated_by: Optional["GetAllNarrativesNarrativesUpdatedBy"]
    created_at: Any
    updated_at: Any


class GetAllNarrativesNarrativesSnapshots(BaseModel):
    id: Any
    created_at: Any


class GetAllNarrativesNarrativesTags(BaseModel):
    id: Optional[Any]
    tag: Optional["GetAllNarrativesNarrativesTagsTag"]
    created_at: Optional[Any]


class GetAllNarrativesNarrativesTagsTag(BaseModel):
    id: Any
    name: str


class GetAllNarrativesNarrativesUpdatedBy(BaseModel):
    id: Any
    email: str


GetAllNarratives.update_forward_refs()
GetAllNarrativesNarrativeAggregate.update_forward_refs()
GetAllNarrativesNarrativeAggregateAggregate.update_forward_refs()
GetAllNarrativesNarratives.update_forward_refs()
GetAllNarrativesNarrativesSnapshots.update_forward_refs()
GetAllNarrativesNarrativesTags.update_forward_refs()
GetAllNarrativesNarrativesTagsTag.update_forward_refs()
GetAllNarrativesNarrativesUpdatedBy.update_forward_refs()
