from typing import Optional

from .base_model import BaseModel


class GetNarrativeCount(BaseModel):
    narrative_aggregate: "GetNarrativeCountNarrativeAggregate"


class GetNarrativeCountNarrativeAggregate(BaseModel):
    aggregate: Optional["GetNarrativeCountNarrativeAggregateAggregate"]


class GetNarrativeCountNarrativeAggregateAggregate(BaseModel):
    count: int


GetNarrativeCount.update_forward_refs()
GetNarrativeCountNarrativeAggregate.update_forward_refs()
GetNarrativeCountNarrativeAggregateAggregate.update_forward_refs()
