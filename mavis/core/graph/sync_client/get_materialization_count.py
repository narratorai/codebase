from typing import Optional

from .base_model import BaseModel


class GetMaterializationCount(BaseModel):
    dataset_materialization_aggregate: "GetMaterializationCountDatasetMaterializationAggregate"


class GetMaterializationCountDatasetMaterializationAggregate(BaseModel):
    aggregate: Optional["GetMaterializationCountDatasetMaterializationAggregateAggregate"]


class GetMaterializationCountDatasetMaterializationAggregateAggregate(BaseModel):
    count: int


GetMaterializationCount.update_forward_refs()
GetMaterializationCountDatasetMaterializationAggregate.update_forward_refs()
GetMaterializationCountDatasetMaterializationAggregateAggregate.update_forward_refs()
