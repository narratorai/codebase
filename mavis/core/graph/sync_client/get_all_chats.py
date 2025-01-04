from typing import Any, List, Optional

from pydantic import Field

from .base_model import BaseModel


class GetAllChats(BaseModel):
    chat_aggregate: "GetAllChatsChatAggregate"
    chats: List["GetAllChatsChats"]


class GetAllChatsChatAggregate(BaseModel):
    aggregate: Optional["GetAllChatsChatAggregateAggregate"]


class GetAllChatsChatAggregateAggregate(BaseModel):
    total_count: int = Field(alias="totalCount")


class GetAllChatsChats(BaseModel):
    id: Any
    created_by: Any
    created_at: Any
    rating: int
    summary: Optional[str]
    detailed_summary: Optional[str]
    tags: List["GetAllChatsChatsTags"]


class GetAllChatsChatsTags(BaseModel):
    id: Optional[Any]


GetAllChats.update_forward_refs()
GetAllChatsChatAggregate.update_forward_refs()
GetAllChatsChatAggregateAggregate.update_forward_refs()
GetAllChatsChats.update_forward_refs()
GetAllChatsChatsTags.update_forward_refs()
