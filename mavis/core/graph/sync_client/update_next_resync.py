from typing import Any, Optional

from .base_model import BaseModel


class UpdateNextResync(BaseModel):
    update_transformation_by_pk: Optional["UpdateNextResyncUpdateTransformationByPk"]


class UpdateNextResyncUpdateTransformationByPk(BaseModel):
    id: Any


UpdateNextResync.update_forward_refs()
UpdateNextResyncUpdateTransformationByPk.update_forward_refs()
