from typing import Any, List

from .base_model import BaseModel


class GetViewTag(BaseModel):
    company_tags: List["GetViewTagCompanyTags"]


class GetViewTagCompanyTags(BaseModel):
    id: Any
    tag: str


GetViewTag.update_forward_refs()
GetViewTagCompanyTags.update_forward_refs()
