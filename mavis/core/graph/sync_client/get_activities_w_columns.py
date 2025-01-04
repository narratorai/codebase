from typing import Any, List, Optional

from .base_model import BaseModel


class GetActivitiesWColumns(BaseModel):
    activities: List["GetActivitiesWColumnsActivities"]


class GetActivitiesWColumnsActivities(BaseModel):
    id: Any
    slug: str
    name: Optional[str]
    description: Optional[str]
    table_id: Optional[Any]
    category: Optional[str]
    row_count: Optional[int]
    company_table: Optional["GetActivitiesWColumnsActivitiesCompanyTable"]
    column_renames: List["GetActivitiesWColumnsActivitiesColumnRenames"]
    activity_dims: List["GetActivitiesWColumnsActivitiesActivityDims"]


class GetActivitiesWColumnsActivitiesCompanyTable(BaseModel):
    activity_stream: str
    slowly_changing_customer_dims: List["GetActivitiesWColumnsActivitiesCompanyTableSlowlyChangingCustomerDims"]


class GetActivitiesWColumnsActivitiesCompanyTableSlowlyChangingCustomerDims(BaseModel):
    slowly_changing_ts_column: str
    dim_table: "GetActivitiesWColumnsActivitiesCompanyTableSlowlyChangingCustomerDimsDimTable"


class GetActivitiesWColumnsActivitiesCompanyTableSlowlyChangingCustomerDimsDimTable(BaseModel):
    id: Any
    schema_: Optional[str]
    table: str
    join_key: Optional[str]
    columns: List["GetActivitiesWColumnsActivitiesCompanyTableSlowlyChangingCustomerDimsDimTableColumns"]


class GetActivitiesWColumnsActivitiesCompanyTableSlowlyChangingCustomerDimsDimTableColumns(BaseModel):
    id: Optional[Any]
    name: Optional[str]
    type: Optional[str]
    label: Optional[str]


class GetActivitiesWColumnsActivitiesColumnRenames(BaseModel):
    id: Optional[Any]
    label: Optional[str]
    type: Optional[str]
    name: Optional[str]
    has_data: Optional[bool]


class GetActivitiesWColumnsActivitiesActivityDims(BaseModel):
    activity_join_column: str
    slowly_changing_ts_column: Optional[str]
    dim_table: "GetActivitiesWColumnsActivitiesActivityDimsDimTable"


class GetActivitiesWColumnsActivitiesActivityDimsDimTable(BaseModel):
    id: Any
    schema_: Optional[str]
    table: str
    join_key: Optional[str]
    columns: List["GetActivitiesWColumnsActivitiesActivityDimsDimTableColumns"]


class GetActivitiesWColumnsActivitiesActivityDimsDimTableColumns(BaseModel):
    id: Optional[Any]
    name: Optional[str]
    type: Optional[str]
    label: Optional[str]


GetActivitiesWColumns.update_forward_refs()
GetActivitiesWColumnsActivities.update_forward_refs()
GetActivitiesWColumnsActivitiesCompanyTable.update_forward_refs()
GetActivitiesWColumnsActivitiesCompanyTableSlowlyChangingCustomerDims.update_forward_refs()
GetActivitiesWColumnsActivitiesCompanyTableSlowlyChangingCustomerDimsDimTable.update_forward_refs()
GetActivitiesWColumnsActivitiesCompanyTableSlowlyChangingCustomerDimsDimTableColumns.update_forward_refs()
GetActivitiesWColumnsActivitiesColumnRenames.update_forward_refs()
GetActivitiesWColumnsActivitiesActivityDims.update_forward_refs()
GetActivitiesWColumnsActivitiesActivityDimsDimTable.update_forward_refs()
GetActivitiesWColumnsActivitiesActivityDimsDimTableColumns.update_forward_refs()
