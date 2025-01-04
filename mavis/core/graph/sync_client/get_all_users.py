from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import user_role_enum


class GetAllUsers(BaseModel):
    user: List["GetAllUsersUser"]


class GetAllUsersUser(BaseModel):
    id: Any
    email: str
    role: Optional[user_role_enum]


GetAllUsers.update_forward_refs()
GetAllUsersUser.update_forward_refs()
