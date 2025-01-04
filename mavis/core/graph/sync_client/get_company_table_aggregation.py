from typing import Any, List

from .base_model import BaseModel


class GetCompanyTableAggregation(BaseModel):
    company_table_aggregation_dim: List["GetCompanyTableAggregationCompanyTableAggregationDim"]


class GetCompanyTableAggregationCompanyTableAggregationDim(BaseModel):
    dim_table_id: Any
    company_table_id: Any
    created_at: Any


GetCompanyTableAggregation.update_forward_refs()
GetCompanyTableAggregationCompanyTableAggregationDim.update_forward_refs()
