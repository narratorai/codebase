from typing import Any, List, Optional

from .base_model import BaseModel


class UpdateUserContext(BaseModel):
    update_company_user: Optional["UpdateUserContextUpdateCompanyUser"]


class UpdateUserContextUpdateCompanyUser(BaseModel):
    returning: List["UpdateUserContextUpdateCompanyUserReturning"]


class UpdateUserContextUpdateCompanyUserReturning(BaseModel):
    id: Any


UpdateUserContext.update_forward_refs()
UpdateUserContextUpdateCompanyUser.update_forward_refs()
UpdateUserContextUpdateCompanyUserReturning.update_forward_refs()
