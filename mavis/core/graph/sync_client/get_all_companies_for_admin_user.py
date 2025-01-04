from typing import Any, List, Optional

from .base_model import BaseModel


class GetAllCompaniesForAdminUser(BaseModel):
    company_user: List["GetAllCompaniesForAdminUserCompanyUser"]


class GetAllCompaniesForAdminUserCompanyUser(BaseModel):
    id: Any
    user_id: Any
    company_id: Any
    company: "GetAllCompaniesForAdminUserCompanyUserCompany"
    phone: Optional[str]
    user: "GetAllCompaniesForAdminUserCompanyUserUser"
    first_name: Optional[str]


class GetAllCompaniesForAdminUserCompanyUserCompany(BaseModel):
    name: Optional[str]


class GetAllCompaniesForAdminUserCompanyUserUser(BaseModel):
    email: str


GetAllCompaniesForAdminUser.update_forward_refs()
GetAllCompaniesForAdminUserCompanyUser.update_forward_refs()
GetAllCompaniesForAdminUserCompanyUserCompany.update_forward_refs()
GetAllCompaniesForAdminUserCompanyUserUser.update_forward_refs()
