from typing import Any, List, Optional

from .base_model import BaseModel


class GetCompanyTableAggregationWColumns(BaseModel):
    company_table_aggregation_dim: List["GetCompanyTableAggregationWColumnsCompanyTableAggregationDim"]


class GetCompanyTableAggregationWColumnsCompanyTableAggregationDim(BaseModel):
    dim_table_id: Any
    company_table_id: Any
    created_at: Any
    dim_table: "GetCompanyTableAggregationWColumnsCompanyTableAggregationDimDimTable"


class GetCompanyTableAggregationWColumnsCompanyTableAggregationDimDimTable(BaseModel):
    id: Any
    schema_: Optional[str]
    table: str
    join_key: Optional[str]
    columns: List["GetCompanyTableAggregationWColumnsCompanyTableAggregationDimDimTableColumns"]


class GetCompanyTableAggregationWColumnsCompanyTableAggregationDimDimTableColumns(BaseModel):
    id: Optional[Any]
    name: Optional[str]
    label: Optional[str]
    type: Optional[str]


GetCompanyTableAggregationWColumns.update_forward_refs()
GetCompanyTableAggregationWColumnsCompanyTableAggregationDim.update_forward_refs()
GetCompanyTableAggregationWColumnsCompanyTableAggregationDimDimTable.update_forward_refs()
GetCompanyTableAggregationWColumnsCompanyTableAggregationDimDimTableColumns.update_forward_refs()
