from typing import Any, Optional

from .base_model import BaseModel
from .enums import user_role_enum


class GetUser(BaseModel):
    user_by_pk: Optional["GetUserUserByPk"]


class GetUserUserByPk(BaseModel):
    id: Any
    role: Optional[user_role_enum]
    email: str


GetUser.update_forward_refs()
GetUserUserByPk.update_forward_refs()
