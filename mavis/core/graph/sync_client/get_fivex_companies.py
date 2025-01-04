from typing import Any, List, Optional

from .base_model import BaseModel


class GetFivexCompanies(BaseModel):
    company: List["GetFivexCompaniesCompany"]


class GetFivexCompaniesCompany(BaseModel):
    id: Any
    name: Optional[str]
    created_at: Any
    created_for_user: Optional["GetFivexCompaniesCompanyCreatedForUser"]


class GetFivexCompaniesCompanyCreatedForUser(BaseModel):
    email: str


GetFivexCompanies.update_forward_refs()
GetFivexCompaniesCompany.update_forward_refs()
GetFivexCompaniesCompanyCreatedForUser.update_forward_refs()
