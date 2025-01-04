from typing import Any, List, Optional

from .base_model import BaseModel


class GetPopularTags(BaseModel):
    company_tags: List["GetPopularTagsCompanyTags"]


class GetPopularTagsCompanyTags(BaseModel):
    id: Any
    tag: str
    color: Optional[str]


GetPopularTags.update_forward_refs()
GetPopularTagsCompanyTags.update_forward_refs()
