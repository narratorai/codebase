from typing import Any, Optional

from .base_model import BaseModel


class GetChat(BaseModel):
    chat_by_pk: Optional["GetChatChatByPk"]


class GetChatChatByPk(BaseModel):
    id: Any
    created_by: Any
    table_id: Any
    question: Optional[str]


GetChat.update_forward_refs()
GetChatChatByPk.update_forward_refs()
