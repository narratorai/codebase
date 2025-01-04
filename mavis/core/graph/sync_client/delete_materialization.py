from typing import Any, Optional

from .base_model import BaseModel
from .enums import materialization_type_enum


class DeleteMaterialization(BaseModel):
    delete_dataset_materialization_by_pk: Optional["DeleteMaterializationDeleteDatasetMaterializationByPk"]


class DeleteMaterializationDeleteDatasetMaterializationByPk(BaseModel):
    id: Any
    dataset_id: Any
    label: str
    type: materialization_type_enum
    task_id: Optional[Any]


DeleteMaterialization.update_forward_refs()
DeleteMaterializationDeleteDatasetMaterializationByPk.update_forward_refs()
