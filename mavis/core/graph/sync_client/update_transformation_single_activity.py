from typing import Any, List, Optional

from .base_model import BaseModel


class UpdateTransformationSingleActivity(BaseModel):
    update_transformation: Optional["UpdateTransformationSingleActivityUpdateTransformation"]


class UpdateTransformationSingleActivityUpdateTransformation(BaseModel):
    returning: List["UpdateTransformationSingleActivityUpdateTransformationReturning"]


class UpdateTransformationSingleActivityUpdateTransformationReturning(BaseModel):
    id: Any


UpdateTransformationSingleActivity.update_forward_refs()
UpdateTransformationSingleActivityUpdateTransformation.update_forward_refs()
UpdateTransformationSingleActivityUpdateTransformationReturning.update_forward_refs()
