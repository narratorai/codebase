from typing import Any, Optional

from .base_model import BaseModel


class DeleteTransformation(BaseModel):
    delete_transformation_by_pk: Optional["DeleteTransformationDeleteTransformationByPk"]


class DeleteTransformationDeleteTransformationByPk(BaseModel):
    id: Any


DeleteTransformation.update_forward_refs()
DeleteTransformationDeleteTransformationByPk.update_forward_refs()
