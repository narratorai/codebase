from typing import Any, Optional

from .base_model import BaseModel


class UpdateChatVote(BaseModel):
    update_chat_by_pk: Optional["UpdateChatVoteUpdateChatByPk"]


class UpdateChatVoteUpdateChatByPk(BaseModel):
    id: Any


UpdateChatVote.update_forward_refs()
UpdateChatVoteUpdateChatByPk.update_forward_refs()
