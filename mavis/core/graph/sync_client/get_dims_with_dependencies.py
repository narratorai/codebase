from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import maintenance_kinds_enum


class GetDimsWithDependencies(BaseModel):
    dim_tables: List["GetDimsWithDependenciesDimTables"]


class GetDimsWithDependenciesDimTables(BaseModel):
    id: Any
    schema_: Optional[str]
    table: str
    join_key: Optional[str]
    activities: List["GetDimsWithDependenciesDimTablesActivities"]
    customer_table: List["GetDimsWithDependenciesDimTablesCustomerTable"]
    slowly_changing_customer_dims: List["GetDimsWithDependenciesDimTablesSlowlyChangingCustomerDims"]
    company_table_aggregations: List["GetDimsWithDependenciesDimTablesCompanyTableAggregations"]
    maintenances: List["GetDimsWithDependenciesDimTablesMaintenances"]


class GetDimsWithDependenciesDimTablesActivities(BaseModel):
    activity_id: Any
    slowly_changing_ts_column: Optional[str]
    activity: "GetDimsWithDependenciesDimTablesActivitiesActivity"


class GetDimsWithDependenciesDimTablesActivitiesActivity(BaseModel):
    maintainer_id: Optional[Any]


class GetDimsWithDependenciesDimTablesCustomerTable(BaseModel):
    maintainer_id: Optional[Any]
    activity_stream: str


class GetDimsWithDependenciesDimTablesSlowlyChangingCustomerDims(BaseModel):
    table_id: Any
    slowly_changing_ts_column: str


class GetDimsWithDependenciesDimTablesCompanyTableAggregations(BaseModel):
    company_table_id: Any
    company_table: "GetDimsWithDependenciesDimTablesCompanyTableAggregationsCompanyTable"


class GetDimsWithDependenciesDimTablesCompanyTableAggregationsCompanyTable(BaseModel):
    id: Any
    maintainer_id: Optional[Any]


class GetDimsWithDependenciesDimTablesMaintenances(BaseModel):
    id: Any
    kind: maintenance_kinds_enum
    started_at: Any
    activity_id: Optional[Any]
    notes: Optional[str]


GetDimsWithDependencies.update_forward_refs()
GetDimsWithDependenciesDimTables.update_forward_refs()
GetDimsWithDependenciesDimTablesActivities.update_forward_refs()
GetDimsWithDependenciesDimTablesActivitiesActivity.update_forward_refs()
GetDimsWithDependenciesDimTablesCustomerTable.update_forward_refs()
GetDimsWithDependenciesDimTablesSlowlyChangingCustomerDims.update_forward_refs()
GetDimsWithDependenciesDimTablesCompanyTableAggregations.update_forward_refs()
GetDimsWithDependenciesDimTablesCompanyTableAggregationsCompanyTable.update_forward_refs()
GetDimsWithDependenciesDimTablesMaintenances.update_forward_refs()
