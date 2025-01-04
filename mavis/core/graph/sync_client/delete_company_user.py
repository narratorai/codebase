from typing import Any, List, Optional

from .base_model import BaseModel


class DeleteCompanyUser(BaseModel):
    company_user: Optional["DeleteCompanyUserCompanyUser"]


class DeleteCompanyUserCompanyUser(BaseModel):
    returning: List["DeleteCompanyUserCompanyUserReturning"]


class DeleteCompanyUserCompanyUserReturning(BaseModel):
    id: Any


DeleteCompanyUser.update_forward_refs()
DeleteCompanyUserCompanyUser.update_forward_refs()
DeleteCompanyUserCompanyUserReturning.update_forward_refs()
