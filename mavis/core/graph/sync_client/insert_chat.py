from typing import Any, Optional

from .base_model import BaseModel


class InsertChat(BaseModel):
    insert_chat_one: Optional["InsertChatInsertChatOne"]


class InsertChatInsertChatOne(BaseModel):
    id: Any


InsertChat.update_forward_refs()
InsertChatInsertChatOne.update_forward_refs()
