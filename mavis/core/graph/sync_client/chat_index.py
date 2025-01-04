from typing import Any, List, Optional

from .base_model import BaseModel


class ChatIndex(BaseModel):
    chat: List["ChatIndexChat"]


class ChatIndexChat(BaseModel):
    id: Any
    table_id: Any
    created_by: Any
    created_at: Any
    question: Optional[str]
    rating: int


ChatIndex.update_forward_refs()
ChatIndexChat.update_forward_refs()
