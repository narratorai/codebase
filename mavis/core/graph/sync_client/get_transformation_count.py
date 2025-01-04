from typing import Optional

from .base_model import BaseModel


class GetTransformationCount(BaseModel):
    transformation_aggregate: "GetTransformationCountTransformationAggregate"


class GetTransformationCountTransformationAggregate(BaseModel):
    aggregate: Optional["GetTransformationCountTransformationAggregateAggregate"]


class GetTransformationCountTransformationAggregateAggregate(BaseModel):
    count: int


GetTransformationCount.update_forward_refs()
GetTransformationCountTransformationAggregate.update_forward_refs()
GetTransformationCountTransformationAggregateAggregate.update_forward_refs()
