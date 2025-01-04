from typing import Any, Optional

from .base_model import BaseModel


class UpdateDataset(BaseModel):
    update_dataset_by_pk: Optional["UpdateDatasetUpdateDatasetByPk"]


class UpdateDatasetUpdateDatasetByPk(BaseModel):
    id: Any


UpdateDataset.update_forward_refs()
UpdateDatasetUpdateDatasetByPk.update_forward_refs()
