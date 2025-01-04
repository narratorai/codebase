from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import access_role_enum


class GetCompanyUsers(BaseModel):
    company_user: List["GetCompanyUsersCompanyUser"]


class GetCompanyUsersCompanyUser(BaseModel):
    id: Any
    user_id: Any
    first_name: Optional[str]
    last_name: Optional[str]
    phone: Optional[str]
    user: "GetCompanyUsersCompanyUserUser"
    team_users: List["GetCompanyUsersCompanyUserTeamUsers"]
    user_access_roles: List["GetCompanyUsersCompanyUserUserAccessRoles"]
    created_at: Any
    updated_at: Any


class GetCompanyUsersCompanyUserUser(BaseModel):
    email: str


class GetCompanyUsersCompanyUserTeamUsers(BaseModel):
    team_id: Any


class GetCompanyUsersCompanyUserUserAccessRoles(BaseModel):
    role: access_role_enum


GetCompanyUsers.update_forward_refs()
GetCompanyUsersCompanyUser.update_forward_refs()
GetCompanyUsersCompanyUserUser.update_forward_refs()
GetCompanyUsersCompanyUserTeamUsers.update_forward_refs()
GetCompanyUsersCompanyUserUserAccessRoles.update_forward_refs()
