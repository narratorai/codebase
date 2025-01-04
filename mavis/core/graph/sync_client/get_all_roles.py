from typing import List

from .base_model import BaseModel


class GetAllRoles(BaseModel):
    access_role: List["GetAllRolesAccessRole"]


class GetAllRolesAccessRole(BaseModel):
    value: str
    description: str


GetAllRoles.update_forward_refs()
GetAllRolesAccessRole.update_forward_refs()
