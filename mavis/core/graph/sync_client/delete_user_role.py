from typing import Any, List, Optional

from .base_model import BaseModel


class DeleteUserRole(BaseModel):
    delete_user_access_role: Optional["DeleteUserRoleDeleteUserAccessRole"]


class DeleteUserRoleDeleteUserAccessRole(BaseModel):
    returning: List["DeleteUserRoleDeleteUserAccessRoleReturning"]


class DeleteUserRoleDeleteUserAccessRoleReturning(BaseModel):
    id: Any


DeleteUserRole.update_forward_refs()
DeleteUserRoleDeleteUserAccessRole.update_forward_refs()
DeleteUserRoleDeleteUserAccessRoleReturning.update_forward_refs()
