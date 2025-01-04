from typing import Any, Optional

from .base_model import BaseModel


class DeleteActivityDim(BaseModel):
    delete_activity_dim_by_pk: Optional["DeleteActivityDimDeleteActivityDimByPk"]


class DeleteActivityDimDeleteActivityDimByPk(BaseModel):
    id: Any


DeleteActivityDim.update_forward_refs()
DeleteActivityDimDeleteActivityDimByPk.update_forward_refs()
