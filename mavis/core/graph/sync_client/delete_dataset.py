from typing import Any, Optional

from .base_model import BaseModel


class DeleteDataset(BaseModel):
    delete_dataset_by_pk: Optional["DeleteDatasetDeleteDatasetByPk"]


class DeleteDatasetDeleteDatasetByPk(BaseModel):
    id: Any


DeleteDataset.update_forward_refs()
DeleteDatasetDeleteDatasetByPk.update_forward_refs()
