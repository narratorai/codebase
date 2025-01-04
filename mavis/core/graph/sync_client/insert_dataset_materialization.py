from typing import Any, Optional

from .base_model import BaseModel


class InsertDatasetMaterialization(BaseModel):
    inserted_dataset_materialization: Optional["InsertDatasetMaterializationInsertedDatasetMaterialization"]


class InsertDatasetMaterializationInsertedDatasetMaterialization(BaseModel):
    id: Any


InsertDatasetMaterialization.update_forward_refs()
InsertDatasetMaterializationInsertedDatasetMaterialization.update_forward_refs()
