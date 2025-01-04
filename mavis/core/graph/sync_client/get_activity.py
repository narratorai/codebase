from typing import Any, List, Optional

from .base_model import BaseModel


class GetActivity(BaseModel):
    activity_by_pk: Optional["GetActivityActivityByPk"]


class GetActivityActivityByPk(BaseModel):
    id: Any
    name: Optional[str]
    slug: str
    created_at: Any
    updated_by: Optional[str]
    updated_at: Any
    table_id: Optional[Any]
    description: Optional[str]
    row_count: Optional[int]
    maintainer_id: Optional[Any]
    column_renames: List["GetActivityActivityByPkColumnRenames"]
    activity_dims: List["GetActivityActivityByPkActivityDims"]
    company_table: Optional["GetActivityActivityByPkCompanyTable"]
    transformations: List["GetActivityActivityByPkTransformations"]
    company_category: Optional["GetActivityActivityByPkCompanyCategory"]
    timeline: List["GetActivityActivityByPkTimeline"]


class GetActivityActivityByPkColumnRenames(BaseModel):
    id: Optional[Any]
    label: Optional[str]
    type: Optional[str]
    casting: Optional[str]
    name: Optional[str]
    has_data: Optional[bool]


class GetActivityActivityByPkActivityDims(BaseModel):
    id: Any
    activity_join_column: str
    slowly_changing_ts_column: Optional[str]
    dim_table: "GetActivityActivityByPkActivityDimsDimTable"


class GetActivityActivityByPkActivityDimsDimTable(BaseModel):
    id: Any
    schema_: Optional[str]
    table: str
    join_key: Optional[str]
    columns: List["GetActivityActivityByPkActivityDimsDimTableColumns"]


class GetActivityActivityByPkActivityDimsDimTableColumns(BaseModel):
    id: Optional[Any]
    name: Optional[str]
    label: Optional[str]
    type: Optional[str]


class GetActivityActivityByPkCompanyTable(BaseModel):
    slowly_changing_customer_dims: List["GetActivityActivityByPkCompanyTableSlowlyChangingCustomerDims"]


class GetActivityActivityByPkCompanyTableSlowlyChangingCustomerDims(BaseModel):
    slowly_changing_ts_column: str
    dim_table: "GetActivityActivityByPkCompanyTableSlowlyChangingCustomerDimsDimTable"


class GetActivityActivityByPkCompanyTableSlowlyChangingCustomerDimsDimTable(BaseModel):
    id: Any
    schema_: Optional[str]
    table: str
    join_key: Optional[str]
    columns: List["GetActivityActivityByPkCompanyTableSlowlyChangingCustomerDimsDimTableColumns"]


class GetActivityActivityByPkCompanyTableSlowlyChangingCustomerDimsDimTableColumns(BaseModel):
    id: Optional[Any]
    name: Optional[str]
    type: Optional[str]
    label: Optional[str]


class GetActivityActivityByPkTransformations(BaseModel):
    transformation: "GetActivityActivityByPkTransformationsTransformation"


class GetActivityActivityByPkTransformationsTransformation(BaseModel):
    id: Any
    name: Optional[str]
    notes: Optional[str]
    production_queries: List["GetActivityActivityByPkTransformationsTransformationProductionQueries"]


class GetActivityActivityByPkTransformationsTransformationProductionQueries(BaseModel):
    sql: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class GetActivityActivityByPkCompanyCategory(BaseModel):
    id: Any
    category: str


class GetActivityActivityByPkTimeline(BaseModel):
    id: Optional[Any]
    name: Optional[str]
    happened_at: Optional[Any]
    description: Optional[str]


GetActivity.update_forward_refs()
GetActivityActivityByPk.update_forward_refs()
GetActivityActivityByPkColumnRenames.update_forward_refs()
GetActivityActivityByPkActivityDims.update_forward_refs()
GetActivityActivityByPkActivityDimsDimTable.update_forward_refs()
GetActivityActivityByPkActivityDimsDimTableColumns.update_forward_refs()
GetActivityActivityByPkCompanyTable.update_forward_refs()
GetActivityActivityByPkCompanyTableSlowlyChangingCustomerDims.update_forward_refs()
GetActivityActivityByPkCompanyTableSlowlyChangingCustomerDimsDimTable.update_forward_refs()
GetActivityActivityByPkCompanyTableSlowlyChangingCustomerDimsDimTableColumns.update_forward_refs()
GetActivityActivityByPkTransformations.update_forward_refs()
GetActivityActivityByPkTransformationsTransformation.update_forward_refs()
GetActivityActivityByPkTransformationsTransformationProductionQueries.update_forward_refs()
GetActivityActivityByPkCompanyCategory.update_forward_refs()
GetActivityActivityByPkTimeline.update_forward_refs()
