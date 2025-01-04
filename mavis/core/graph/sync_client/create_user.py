from typing import Any, Optional

from .base_model import BaseModel
from .enums import user_role_enum


class CreateUser(BaseModel):
    insert_user_one: Optional["CreateUserInsertUserOne"]


class CreateUserInsertUserOne(BaseModel):
    id: Any
    role: Optional[user_role_enum]


CreateUser.update_forward_refs()
CreateUserInsertUserOne.update_forward_refs()
