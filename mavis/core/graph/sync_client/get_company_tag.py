from typing import Any, List, Optional

from .base_model import BaseModel


class GetCompanyTag(BaseModel):
    company_tags: List["GetCompanyTagCompanyTags"]


class GetCompanyTagCompanyTags(BaseModel):
    id: Any
    tag: str
    color: Optional[str]
    user_id: Optional[Any]
    description: Optional[str]


GetCompanyTag.update_forward_refs()
GetCompanyTagCompanyTags.update_forward_refs()
