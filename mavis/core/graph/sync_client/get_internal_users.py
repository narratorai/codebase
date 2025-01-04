from typing import List

from .base_model import BaseModel


class GetInternalUsers(BaseModel):
    users: List["GetInternalUsersUsers"]


class GetInternalUsersUsers(BaseModel):
    email: str


GetInternalUsers.update_forward_refs()
GetInternalUsersUsers.update_forward_refs()
