from typing import Any, Optional

from .base_model import BaseModel


class InsertTrainingRequest(BaseModel):
    insert_training_request_one: Optional["InsertTrainingRequestInsertTrainingRequestOne"]


class InsertTrainingRequestInsertTrainingRequestOne(BaseModel):
    id: Any


InsertTrainingRequest.update_forward_refs()
InsertTrainingRequestInsertTrainingRequestOne.update_forward_refs()
