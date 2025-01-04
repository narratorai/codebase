from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import maintenance_kinds_enum


class GetDimWithDependencies(BaseModel):
    dim_table_by_pk: Optional["GetDimWithDependenciesDimTableByPk"]


class GetDimWithDependenciesDimTableByPk(BaseModel):
    id: Any
    schema_: Optional[str]
    table: str
    join_key: Optional[str]
    columns: List["GetDimWithDependenciesDimTableByPkColumns"]
    activities: List["GetDimWithDependenciesDimTableByPkActivities"]
    customer_table: List["GetDimWithDependenciesDimTableByPkCustomerTable"]
    slowly_changing_customer_dims: List["GetDimWithDependenciesDimTableByPkSlowlyChangingCustomerDims"]
    company_table_aggregations: List["GetDimWithDependenciesDimTableByPkCompanyTableAggregations"]
    maintenances: List["GetDimWithDependenciesDimTableByPkMaintenances"]


class GetDimWithDependenciesDimTableByPkColumns(BaseModel):
    id: Optional[Any]
    name: Optional[str]
    label: Optional[str]
    type: Optional[str]


class GetDimWithDependenciesDimTableByPkActivities(BaseModel):
    id: Any
    activity_id: Any
    activity_join_column: str
    activity: "GetDimWithDependenciesDimTableByPkActivitiesActivity"
    slowly_changing_ts_column: Optional[str]


class GetDimWithDependenciesDimTableByPkActivitiesActivity(BaseModel):
    maintainer_id: Optional[Any]


class GetDimWithDependenciesDimTableByPkCustomerTable(BaseModel):
    maintainer_id: Optional[Any]
    id: Any
    activity_stream: str


class GetDimWithDependenciesDimTableByPkSlowlyChangingCustomerDims(BaseModel):
    id: Any
    table_id: Any
    slowly_changing_ts_column: str


class GetDimWithDependenciesDimTableByPkCompanyTableAggregations(BaseModel):
    company_table_id: Any
    company_table: "GetDimWithDependenciesDimTableByPkCompanyTableAggregationsCompanyTable"


class GetDimWithDependenciesDimTableByPkCompanyTableAggregationsCompanyTable(BaseModel):
    id: Any
    activity_stream: str
    maintainer_id: Optional[Any]


class GetDimWithDependenciesDimTableByPkMaintenances(BaseModel):
    id: Any
    kind: maintenance_kinds_enum
    started_at: Any
    activity_id: Optional[Any]
    notes: Optional[str]


GetDimWithDependencies.update_forward_refs()
GetDimWithDependenciesDimTableByPk.update_forward_refs()
GetDimWithDependenciesDimTableByPkColumns.update_forward_refs()
GetDimWithDependenciesDimTableByPkActivities.update_forward_refs()
GetDimWithDependenciesDimTableByPkActivitiesActivity.update_forward_refs()
GetDimWithDependenciesDimTableByPkCustomerTable.update_forward_refs()
GetDimWithDependenciesDimTableByPkSlowlyChangingCustomerDims.update_forward_refs()
GetDimWithDependenciesDimTableByPkCompanyTableAggregations.update_forward_refs()
GetDimWithDependenciesDimTableByPkCompanyTableAggregationsCompanyTable.update_forward_refs()
GetDimWithDependenciesDimTableByPkMaintenances.update_forward_refs()
