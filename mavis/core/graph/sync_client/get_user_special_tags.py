from typing import Any, List, Optional

from .base_model import BaseModel


class GetUserSpecialTags(BaseModel):
    company_tags: List["GetUserSpecialTagsCompanyTags"]


class GetUserSpecialTagsCompanyTags(BaseModel):
    id: Any
    user_id: Optional[Any]
    tag: str


GetUserSpecialTags.update_forward_refs()
GetUserSpecialTagsCompanyTags.update_forward_refs()
