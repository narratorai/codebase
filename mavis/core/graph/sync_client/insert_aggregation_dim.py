from typing import Any, Optional

from .base_model import BaseModel


class InsertAggregationDim(BaseModel):
    inserted_aggregation_dim: Optional["InsertAggregationDimInsertedAggregationDim"]


class InsertAggregationDimInsertedAggregationDim(BaseModel):
    id: Any


InsertAggregationDim.update_forward_refs()
InsertAggregationDimInsertedAggregationDim.update_forward_refs()
