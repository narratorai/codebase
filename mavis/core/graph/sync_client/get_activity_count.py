from typing import Optional

from .base_model import BaseModel


class GetActivityCount(BaseModel):
    activity_aggregate: "GetActivityCountActivityAggregate"


class GetActivityCountActivityAggregate(BaseModel):
    aggregate: Optional["GetActivityCountActivityAggregateAggregate"]


class GetActivityCountActivityAggregateAggregate(BaseModel):
    count: int


GetActivityCount.update_forward_refs()
GetActivityCountActivityAggregate.update_forward_refs()
GetActivityCountActivityAggregateAggregate.update_forward_refs()
