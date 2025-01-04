from typing import Any, Optional

from .base_model import BaseModel


class UpdateChatSummary(BaseModel):
    update_chat_by_pk: Optional["UpdateChatSummaryUpdateChatByPk"]


class UpdateChatSummaryUpdateChatByPk(BaseModel):
    id: Any


UpdateChatSummary.update_forward_refs()
UpdateChatSummaryUpdateChatByPk.update_forward_refs()
