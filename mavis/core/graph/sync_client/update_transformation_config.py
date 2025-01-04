from typing import Any, Optional

from .base_model import BaseModel


class UpdateTransformationConfig(BaseModel):
    update_transformation_by_pk: Optional["UpdateTransformationConfigUpdateTransformationByPk"]


class UpdateTransformationConfigUpdateTransformationByPk(BaseModel):
    id: Any


UpdateTransformationConfig.update_forward_refs()
UpdateTransformationConfigUpdateTransformationByPk.update_forward_refs()
