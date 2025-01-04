from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import access_role_enum, company_status_enum, user_role_enum


class AuthGetUserCompany(BaseModel):
    user: Optional["AuthGetUserCompanyUser"]
    companies: List["AuthGetUserCompanyCompanies"]


class AuthGetUserCompanyUser(BaseModel):
    id: Any
    email: str
    role: Optional[user_role_enum]
    company_users: List["AuthGetUserCompanyUserCompanyUsers"]


class AuthGetUserCompanyUserCompanyUsers(BaseModel):
    id: Any
    company_id: Any
    team_users: List["AuthGetUserCompanyUserCompanyUsersTeamUsers"]
    user_access_roles: List["AuthGetUserCompanyUserCompanyUsersUserAccessRoles"]


class AuthGetUserCompanyUserCompanyUsersTeamUsers(BaseModel):
    team_id: Any


class AuthGetUserCompanyUserCompanyUsersUserAccessRoles(BaseModel):
    role: access_role_enum


class AuthGetUserCompanyCompanies(BaseModel):
    id: Any
    slug: str
    name: Optional[str]
    status: company_status_enum
    auth0: Optional["AuthGetUserCompanyCompaniesAuth0"]
    teams: List["AuthGetUserCompanyCompaniesTeams"]
    company_tags: List["AuthGetUserCompanyCompaniesCompanyTags"]


class AuthGetUserCompanyCompaniesAuth0(BaseModel):
    org_id: str


class AuthGetUserCompanyCompaniesTeams(BaseModel):
    id: Any
    name: str


class AuthGetUserCompanyCompaniesCompanyTags(BaseModel):
    id: Any
    tag: str


AuthGetUserCompany.update_forward_refs()
AuthGetUserCompanyUser.update_forward_refs()
AuthGetUserCompanyUserCompanyUsers.update_forward_refs()
AuthGetUserCompanyUserCompanyUsersTeamUsers.update_forward_refs()
AuthGetUserCompanyUserCompanyUsersUserAccessRoles.update_forward_refs()
AuthGetUserCompanyCompanies.update_forward_refs()
AuthGetUserCompanyCompaniesAuth0.update_forward_refs()
AuthGetUserCompanyCompaniesTeams.update_forward_refs()
AuthGetUserCompanyCompaniesCompanyTags.update_forward_refs()
