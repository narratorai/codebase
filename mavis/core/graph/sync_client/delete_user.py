from typing import Any, Optional

from .base_model import BaseModel


class DeleteUser(BaseModel):
    user: Optional["DeleteUserUser"]


class DeleteUserUser(BaseModel):
    id: Any


DeleteUser.update_forward_refs()
DeleteUserUser.update_forward_refs()
