from typing import Any, List, Optional

from .base_model import BaseModel


class GetChatContext(BaseModel):
    company_tags: Optional["GetChatContextCompanyTags"]
    company_user: List["GetChatContextCompanyUser"]
    chat: List["GetChatContextChat"]


class GetChatContextCompanyTags(BaseModel):
    tagged_items: List["GetChatContextCompanyTagsTaggedItems"]


class GetChatContextCompanyTagsTaggedItems(BaseModel):
    activity: Optional["GetChatContextCompanyTagsTaggedItemsActivity"]


class GetChatContextCompanyTagsTaggedItemsActivity(BaseModel):
    id: Any
    slug: str
    name: Optional[str]
    category: Optional[str]
    description: Optional[str]


class GetChatContextCompanyUser(BaseModel):
    user_context: Optional[str]
    company_context: Optional[str]
    metrics_context: Optional[str]


class GetChatContextChat(BaseModel):
    id: Any
    created_at: Any
    summary: Optional[str]
    detailed_summary: Optional[str]


GetChatContext.update_forward_refs()
GetChatContextCompanyTags.update_forward_refs()
GetChatContextCompanyTagsTaggedItems.update_forward_refs()
GetChatContextCompanyTagsTaggedItemsActivity.update_forward_refs()
GetChatContextCompanyUser.update_forward_refs()
GetChatContextChat.update_forward_refs()
