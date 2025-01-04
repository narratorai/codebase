from typing import Any, List, Optional

from .base_model import BaseModel


class GetChats(BaseModel):
    chats: List["GetChatsChats"]


class GetChatsChats(BaseModel):
    id: Any
    table_id: Any
    summary: Optional[str]
    detailed_summary: Optional[str]
    created_by: Any
    created_at: Any
    tags: List["GetChatsChatsTags"]


class GetChatsChatsTags(BaseModel):
    tag_id: Optional[Any]


GetChats.update_forward_refs()
GetChatsChats.update_forward_refs()
GetChatsChatsTags.update_forward_refs()
