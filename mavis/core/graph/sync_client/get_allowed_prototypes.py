from typing import Any, List

from .base_model import BaseModel


class GetAllowedPrototypes(BaseModel):
    company_prototypes: List["GetAllowedPrototypesCompanyPrototypes"]


class GetAllowedPrototypesCompanyPrototypes(BaseModel):
    block_slug: str
    id: Any


GetAllowedPrototypes.update_forward_refs()
GetAllowedPrototypesCompanyPrototypes.update_forward_refs()
