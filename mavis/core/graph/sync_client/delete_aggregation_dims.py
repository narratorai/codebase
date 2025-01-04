from typing import Any, List, Optional

from .base_model import BaseModel


class DeleteAggregationDims(BaseModel):
    delete_company_table_aggregation_dim: Optional["DeleteAggregationDimsDeleteCompanyTableAggregationDim"]


class DeleteAggregationDimsDeleteCompanyTableAggregationDim(BaseModel):
    returning: List["DeleteAggregationDimsDeleteCompanyTableAggregationDimReturning"]


class DeleteAggregationDimsDeleteCompanyTableAggregationDimReturning(BaseModel):
    id: Any


DeleteAggregationDims.update_forward_refs()
DeleteAggregationDimsDeleteCompanyTableAggregationDim.update_forward_refs()
DeleteAggregationDimsDeleteCompanyTableAggregationDimReturning.update_forward_refs()
