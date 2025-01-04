from typing import Any, List, Optional

from .base_model import BaseModel


class GetActivityWColumns(BaseModel):
    activity: Optional["GetActivityWColumnsActivity"]


class GetActivityWColumnsActivity(BaseModel):
    id: Any
    slug: str
    name: Optional[str]
    description: Optional[str]
    category: Optional[str]
    table_id: Optional[Any]
    row_count: Optional[int]
    company_table: Optional["GetActivityWColumnsActivityCompanyTable"]
    column_renames: List["GetActivityWColumnsActivityColumnRenames"]
    activity_dims: List["GetActivityWColumnsActivityActivityDims"]


class GetActivityWColumnsActivityCompanyTable(BaseModel):
    slowly_changing_customer_dims: List["GetActivityWColumnsActivityCompanyTableSlowlyChangingCustomerDims"]


class GetActivityWColumnsActivityCompanyTableSlowlyChangingCustomerDims(BaseModel):
    slowly_changing_ts_column: str
    dim_table: "GetActivityWColumnsActivityCompanyTableSlowlyChangingCustomerDimsDimTable"


class GetActivityWColumnsActivityCompanyTableSlowlyChangingCustomerDimsDimTable(BaseModel):
    id: Any
    schema_: Optional[str]
    table: str
    join_key: Optional[str]
    columns: List["GetActivityWColumnsActivityCompanyTableSlowlyChangingCustomerDimsDimTableColumns"]


class GetActivityWColumnsActivityCompanyTableSlowlyChangingCustomerDimsDimTableColumns(BaseModel):
    id: Optional[Any]
    name: Optional[str]
    type: Optional[str]
    label: Optional[str]


class GetActivityWColumnsActivityColumnRenames(BaseModel):
    id: Optional[Any]
    label: Optional[str]
    type: Optional[str]
    name: Optional[str]
    has_data: Optional[bool]


class GetActivityWColumnsActivityActivityDims(BaseModel):
    activity_join_column: str
    slowly_changing_ts_column: Optional[str]
    dim_table: "GetActivityWColumnsActivityActivityDimsDimTable"


class GetActivityWColumnsActivityActivityDimsDimTable(BaseModel):
    id: Any
    schema_: Optional[str]
    table: str
    join_key: Optional[str]
    columns: List["GetActivityWColumnsActivityActivityDimsDimTableColumns"]


class GetActivityWColumnsActivityActivityDimsDimTableColumns(BaseModel):
    id: Optional[Any]
    name: Optional[str]
    type: Optional[str]
    label: Optional[str]


GetActivityWColumns.update_forward_refs()
GetActivityWColumnsActivity.update_forward_refs()
GetActivityWColumnsActivityCompanyTable.update_forward_refs()
GetActivityWColumnsActivityCompanyTableSlowlyChangingCustomerDims.update_forward_refs()
GetActivityWColumnsActivityCompanyTableSlowlyChangingCustomerDimsDimTable.update_forward_refs()
GetActivityWColumnsActivityCompanyTableSlowlyChangingCustomerDimsDimTableColumns.update_forward_refs()
GetActivityWColumnsActivityColumnRenames.update_forward_refs()
GetActivityWColumnsActivityActivityDims.update_forward_refs()
GetActivityWColumnsActivityActivityDimsDimTable.update_forward_refs()
GetActivityWColumnsActivityActivityDimsDimTableColumns.update_forward_refs()
