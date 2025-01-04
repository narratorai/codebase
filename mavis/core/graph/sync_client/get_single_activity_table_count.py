from typing import Optional

from .base_model import BaseModel


class GetSingleActivityTableCount(BaseModel):
    transformation_activities_aggregate: "GetSingleActivityTableCountTransformationActivitiesAggregate"


class GetSingleActivityTableCountTransformationActivitiesAggregate(BaseModel):
    aggregate: Optional["GetSingleActivityTableCountTransformationActivitiesAggregateAggregate"]


class GetSingleActivityTableCountTransformationActivitiesAggregateAggregate(BaseModel):
    count: int


GetSingleActivityTableCount.update_forward_refs()
GetSingleActivityTableCountTransformationActivitiesAggregate.update_forward_refs()
GetSingleActivityTableCountTransformationActivitiesAggregateAggregate.update_forward_refs()
