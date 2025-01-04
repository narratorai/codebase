from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import company_status_enum, company_user_role_enum


class GetAllCompaniesWithUserAndLimit(BaseModel):
    company: List["GetAllCompaniesWithUserAndLimitCompany"]


class GetAllCompaniesWithUserAndLimitCompany(BaseModel):
    id: Any
    slug: str
    created_at: Any
    status: company_status_enum
    demo_company: Optional[bool]
    name: Optional[str]
    created_for_user: Optional["GetAllCompaniesWithUserAndLimitCompanyCreatedForUser"]
    company_users: List["GetAllCompaniesWithUserAndLimitCompanyCompanyUsers"]
    service_limits: List["GetAllCompaniesWithUserAndLimitCompanyServiceLimits"]


class GetAllCompaniesWithUserAndLimitCompanyCreatedForUser(BaseModel):
    email: str


class GetAllCompaniesWithUserAndLimitCompanyCompanyUsers(BaseModel):
    id: Any
    role: company_user_role_enum


class GetAllCompaniesWithUserAndLimitCompanyServiceLimits(BaseModel):
    user_limit: Optional[int]
    admin_user_limit: Optional[int]
    start_on: Optional[Any]
    end_on: Optional[Any]
    monthly_price: Optional[Any]


GetAllCompaniesWithUserAndLimit.update_forward_refs()
GetAllCompaniesWithUserAndLimitCompany.update_forward_refs()
GetAllCompaniesWithUserAndLimitCompanyCreatedForUser.update_forward_refs()
GetAllCompaniesWithUserAndLimitCompanyCompanyUsers.update_forward_refs()
GetAllCompaniesWithUserAndLimitCompanyServiceLimits.update_forward_refs()
