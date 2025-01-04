from typing import Any, List, Optional

from .base_model import BaseModel


class UpdateTransformationUpdateType(BaseModel):
    update_transformation: Optional["UpdateTransformationUpdateTypeUpdateTransformation"]


class UpdateTransformationUpdateTypeUpdateTransformation(BaseModel):
    returning: List["UpdateTransformationUpdateTypeUpdateTransformationReturning"]


class UpdateTransformationUpdateTypeUpdateTransformationReturning(BaseModel):
    id: Any


UpdateTransformationUpdateType.update_forward_refs()
UpdateTransformationUpdateTypeUpdateTransformation.update_forward_refs()
UpdateTransformationUpdateTypeUpdateTransformationReturning.update_forward_refs()
