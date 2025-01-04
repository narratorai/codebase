from typing import Any, List, Optional

from .base_model import BaseModel


class GetAllCompaniesForUser(BaseModel):
    company_user: List["GetAllCompaniesForUserCompanyUser"]


class GetAllCompaniesForUserCompanyUser(BaseModel):
    id: Any
    user_id: Any
    company_id: Any
    company: "GetAllCompaniesForUserCompanyUserCompany"
    phone: Optional[str]
    user: "GetAllCompaniesForUserCompanyUserUser"
    first_name: Optional[str]


class GetAllCompaniesForUserCompanyUserCompany(BaseModel):
    name: Optional[str]


class GetAllCompaniesForUserCompanyUserUser(BaseModel):
    email: str


GetAllCompaniesForUser.update_forward_refs()
GetAllCompaniesForUserCompanyUser.update_forward_refs()
GetAllCompaniesForUserCompanyUserCompany.update_forward_refs()
GetAllCompaniesForUserCompanyUserUser.update_forward_refs()
