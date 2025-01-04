from typing import Optional

from .base_model import BaseModel


class GetDatasetCount(BaseModel):
    dataset_aggregate: "GetDatasetCountDatasetAggregate"


class GetDatasetCountDatasetAggregate(BaseModel):
    aggregate: Optional["GetDatasetCountDatasetAggregateAggregate"]


class GetDatasetCountDatasetAggregateAggregate(BaseModel):
    count: int


GetDatasetCount.update_forward_refs()
GetDatasetCountDatasetAggregate.update_forward_refs()
GetDatasetCountDatasetAggregateAggregate.update_forward_refs()
