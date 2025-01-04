from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import trainining_request_status_enum


class TrainingRequestIndex(BaseModel):
    training_request: List["TrainingRequestIndexTrainingRequest"]


class TrainingRequestIndexTrainingRequest(BaseModel):
    context: Optional[str]
    created_by: Any
    created_at: Any
    updated_at: Any
    type: Optional[str]
    status: trainining_request_status_enum
    training_id: Optional[Any]
    email_requester: Optional[bool]
    email_sent_at: Optional[Any]
    status_updated_at: Optional[Any]
    chat: "TrainingRequestIndexTrainingRequestChat"


class TrainingRequestIndexTrainingRequestChat(BaseModel):
    question: Optional[str]


TrainingRequestIndex.update_forward_refs()
TrainingRequestIndexTrainingRequest.update_forward_refs()
TrainingRequestIndexTrainingRequestChat.update_forward_refs()
