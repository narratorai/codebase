from typing import Any, Optional

from .base_model import BaseModel


class UpdateTrainingRequest(BaseModel):
    update_training_request_by_pk: Optional["UpdateTrainingRequestUpdateTrainingRequestByPk"]


class UpdateTrainingRequestUpdateTrainingRequestByPk(BaseModel):
    id: Any


UpdateTrainingRequest.update_forward_refs()
UpdateTrainingRequestUpdateTrainingRequestByPk.update_forward_refs()
