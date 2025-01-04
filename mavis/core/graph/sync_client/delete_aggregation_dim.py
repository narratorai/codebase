from typing import Any, List, Optional

from .base_model import BaseModel


class DeleteAggregationDim(BaseModel):
    delete_company_table_aggregation_dim: Optional["DeleteAggregationDimDeleteCompanyTableAggregationDim"]


class DeleteAggregationDimDeleteCompanyTableAggregationDim(BaseModel):
    returning: List["DeleteAggregationDimDeleteCompanyTableAggregationDimReturning"]


class DeleteAggregationDimDeleteCompanyTableAggregationDimReturning(BaseModel):
    id: Any


DeleteAggregationDim.update_forward_refs()
DeleteAggregationDimDeleteCompanyTableAggregationDim.update_forward_refs()
DeleteAggregationDimDeleteCompanyTableAggregationDimReturning.update_forward_refs()
