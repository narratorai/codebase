from typing import Any, Optional

from .base_model import BaseModel


class UpdateRole(BaseModel):
    update_company_user_by_pk: Optional["UpdateRoleUpdateCompanyUserByPk"]


class UpdateRoleUpdateCompanyUserByPk(BaseModel):
    id: Any


UpdateRole.update_forward_refs()
UpdateRoleUpdateCompanyUserByPk.update_forward_refs()
