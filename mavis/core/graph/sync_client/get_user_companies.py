from typing import Any, List, Optional

from .base_model import BaseModel


class GetUserCompanies(BaseModel):
    company_user: List["GetUserCompaniesCompanyUser"]


class GetUserCompaniesCompanyUser(BaseModel):
    id: Any
    company: "GetUserCompaniesCompanyUserCompany"


class GetUserCompaniesCompanyUserCompany(BaseModel):
    id: Any
    slug: str
    name: Optional[str]


GetUserCompanies.update_forward_refs()
GetUserCompaniesCompanyUser.update_forward_refs()
GetUserCompaniesCompanyUserCompany.update_forward_refs()
