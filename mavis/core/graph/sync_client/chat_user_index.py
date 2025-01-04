from typing import Any, List, Optional

from .base_model import BaseModel


class ChatUserIndex(BaseModel):
    chat: List["ChatUserIndexChat"]


class ChatUserIndexChat(BaseModel):
    id: Any
    table_id: Any
    created_by: Any
    created_at: Any
    question: Optional[str]
    rating: int


ChatUserIndex.update_forward_refs()
ChatUserIndexChat.update_forward_refs()
