from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import user_role_enum


class GetUserByEmail(BaseModel):
    user: List["GetUserByEmailUser"]


class GetUserByEmailUser(BaseModel):
    id: Any
    role: Optional[user_role_enum]


GetUserByEmail.update_forward_refs()
GetUserByEmailUser.update_forward_refs()
