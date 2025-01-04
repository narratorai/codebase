from typing import Any, Optional

from .base_model import BaseModel


class UpdateTransformationName(BaseModel):
    update_transformation_by_pk: Optional["UpdateTransformationNameUpdateTransformationByPk"]


class UpdateTransformationNameUpdateTransformationByPk(BaseModel):
    id: Any


UpdateTransformationName.update_forward_refs()
UpdateTransformationNameUpdateTransformationByPk.update_forward_refs()
