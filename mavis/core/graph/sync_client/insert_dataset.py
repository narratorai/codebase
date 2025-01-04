from typing import Any, Optional

from .base_model import BaseModel


class InsertDataset(BaseModel):
    insert_dataset_one: Optional["InsertDatasetInsertDatasetOne"]


class InsertDatasetInsertDatasetOne(BaseModel):
    id: Any
    slug: str


InsertDataset.update_forward_refs()
InsertDatasetInsertDatasetOne.update_forward_refs()
