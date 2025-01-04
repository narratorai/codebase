from typing import Any, Optional

from .base_model import BaseModel


class DeleteChat(BaseModel):
    delete_chat_by_pk: Optional["DeleteChatDeleteChatByPk"]


class DeleteChatDeleteChatByPk(BaseModel):
    id: Any
    table_id: Any


DeleteChat.update_forward_refs()
DeleteChatDeleteChatByPk.update_forward_refs()
