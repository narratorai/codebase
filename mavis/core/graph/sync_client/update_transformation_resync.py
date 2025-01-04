from typing import Any, List, Optional

from .base_model import BaseModel


class UpdateTransformationResync(BaseModel):
    update_transformation: Optional["UpdateTransformationResyncUpdateTransformation"]


class UpdateTransformationResyncUpdateTransformation(BaseModel):
    returning: List["UpdateTransformationResyncUpdateTransformationReturning"]


class UpdateTransformationResyncUpdateTransformationReturning(BaseModel):
    id: Any


UpdateTransformationResync.update_forward_refs()
UpdateTransformationResyncUpdateTransformation.update_forward_refs()
UpdateTransformationResyncUpdateTransformationReturning.update_forward_refs()
