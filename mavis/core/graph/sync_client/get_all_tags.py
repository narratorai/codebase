from typing import Any, List, Optional

from .base_model import BaseModel


class GetAllTags(BaseModel):
    company_tags: List["GetAllTagsCompanyTags"]


class GetAllTagsCompanyTags(BaseModel):
    id: Any
    tag: str
    color: Optional[str]
    description: Optional[str]


GetAllTags.update_forward_refs()
GetAllTagsCompanyTags.update_forward_refs()
