from typing import Any, Optional

from .base_model import BaseModel


class InsertUserRole(BaseModel):
    insert_user_access_role_one: Optional["InsertUserRoleInsertUserAccessRoleOne"]


class InsertUserRoleInsertUserAccessRoleOne(BaseModel):
    id: Any


InsertUserRole.update_forward_refs()
InsertUserRoleInsertUserAccessRoleOne.update_forward_refs()
