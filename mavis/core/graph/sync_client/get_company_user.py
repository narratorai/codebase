from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import access_role_enum, company_user_role_enum


class GetCompanyUser(BaseModel):
    company_user_by_pk: Optional["GetCompanyUserCompanyUserByPk"]


class GetCompanyUserCompanyUserByPk(BaseModel):
    id: Any
    created_at: Any
    first_name: Optional[str]
    last_name: Optional[str]
    job_title: Optional[str]
    phone: Optional[str]
    role: company_user_role_enum
    user: "GetCompanyUserCompanyUserByPkUser"
    team_users: List["GetCompanyUserCompanyUserByPkTeamUsers"]
    user_access_roles: List["GetCompanyUserCompanyUserByPkUserAccessRoles"]


class GetCompanyUserCompanyUserByPkUser(BaseModel):
    id: Any
    email: str


class GetCompanyUserCompanyUserByPkTeamUsers(BaseModel):
    team_id: Any


class GetCompanyUserCompanyUserByPkUserAccessRoles(BaseModel):
    role: access_role_enum


GetCompanyUser.update_forward_refs()
GetCompanyUserCompanyUserByPk.update_forward_refs()
GetCompanyUserCompanyUserByPkUser.update_forward_refs()
GetCompanyUserCompanyUserByPkTeamUsers.update_forward_refs()
GetCompanyUserCompanyUserByPkUserAccessRoles.update_forward_refs()
