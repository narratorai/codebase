from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import (
    company_config_warehouse_language_enum,
    company_status_enum,
    datacenter_region_enum,
)


class GetCompany(BaseModel):
    companies: List["GetCompanyCompanies"]


class GetCompanyCompanies(BaseModel):
    max_inserts: int
    currency_used: Optional[str]
    id: Any
    slug: str
    status: company_status_enum
    name: Optional[str]
    website: Optional[str]
    production_schema: Optional[str]
    materialize_schema: Optional[str]
    warehouse_language: company_config_warehouse_language_enum
    timezone: str
    cache_minutes: int
    start_data_on: Optional[Any]
    validation_months: Optional[int]
    batch_halt: bool
    project_id: Optional[str]
    logo_url: Optional[str]
    select_wlm_count: Optional[int]
    created_at: Any
    updated_at: Any
    plot_colors: Optional[str]
    spend_table: Optional[str]
    dataset_row_threshold: Optional[int]
    dataset_default_filter_days: Optional[int]
    warehouse_default_schemas: Optional[str]
    use_time_boundary: Optional[bool]
    week_day_offset: Optional[int]
    datacenter_region: Optional[datacenter_region_enum]
    tables: List["GetCompanyCompaniesTables"]
    tags: List["GetCompanyCompaniesTags"]
    teams: List["GetCompanyCompaniesTeams"]
    company_users: List["GetCompanyCompaniesCompanyUsers"]
    resources: Optional["GetCompanyCompaniesResources"]


class GetCompanyCompaniesTables(BaseModel):
    id: Any
    identifier: str
    updated_at: Any
    schema_name: Optional[str]
    activity_stream: str
    row_count: Optional[Any]
    index_table: Optional[bool]
    is_imported: Optional[bool]
    maintainer_id: Optional[Any]
    manually_partition_activity: Optional[bool]
    default_time_between: Optional[str]
    customer_dim_table_id: Optional[Any]
    customer_dim: Optional["GetCompanyCompaniesTablesCustomerDim"]
    team_permissions: List["GetCompanyCompaniesTablesTeamPermissions"]


class GetCompanyCompaniesTablesCustomerDim(BaseModel):
    id: Any
    schema_name: Optional[str]
    table: str


class GetCompanyCompaniesTablesTeamPermissions(BaseModel):
    team_id: Optional[Any]
    can_edit: Optional[bool]


class GetCompanyCompaniesTags(BaseModel):
    id: Any
    tag: str
    color: Optional[str]


class GetCompanyCompaniesTeams(BaseModel):
    id: Any
    name: str


class GetCompanyCompaniesCompanyUsers(BaseModel):
    id: Any
    user_id: Any
    first_name: Optional[str]
    last_name: Optional[str]
    preferences: Optional["GetCompanyCompaniesCompanyUsersPreferences"]
    user: "GetCompanyCompaniesCompanyUsersUser"


class GetCompanyCompaniesCompanyUsersPreferences(BaseModel):
    profile_picture: Optional[str]


class GetCompanyCompaniesCompanyUsersUser(BaseModel):
    email: str


class GetCompanyCompaniesResources(BaseModel):
    company_role: Optional[str]
    kms_key: Optional[str]
    s3_bucket: Optional[str]


GetCompany.update_forward_refs()
GetCompanyCompanies.update_forward_refs()
GetCompanyCompaniesTables.update_forward_refs()
GetCompanyCompaniesTablesCustomerDim.update_forward_refs()
GetCompanyCompaniesTablesTeamPermissions.update_forward_refs()
GetCompanyCompaniesTags.update_forward_refs()
GetCompanyCompaniesTeams.update_forward_refs()
GetCompanyCompaniesCompanyUsers.update_forward_refs()
GetCompanyCompaniesCompanyUsersPreferences.update_forward_refs()
GetCompanyCompaniesCompanyUsersUser.update_forward_refs()
GetCompanyCompaniesResources.update_forward_refs()
