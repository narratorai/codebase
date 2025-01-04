from typing import Any, Optional

from .base_model import BaseModel
from .enums import trainining_request_status_enum


class GetTrainingRequest(BaseModel):
    training_request_by_pk: Optional["GetTrainingRequestTrainingRequestByPk"]


class GetTrainingRequestTrainingRequestByPk(BaseModel):
    chat_id: Any
    created_by: Any
    context: Optional[str]
    company_id: Optional[Any]
    dataset_id: Optional[Any]
    group_slug: Optional[str]
    plot_slug: Optional[str]
    email_requester: Optional[bool]
    email_sent_at: Optional[Any]
    status_updated_at: Optional[Any]
    email_context: Optional[str]
    status: trainining_request_status_enum
    type: Optional[str]
    training_id: Optional[Any]


GetTrainingRequest.update_forward_refs()
GetTrainingRequestTrainingRequestByPk.update_forward_refs()
