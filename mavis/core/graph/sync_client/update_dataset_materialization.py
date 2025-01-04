from typing import Any, Optional

from .base_model import BaseModel


class UpdateDatasetMaterialization(BaseModel):
    update_dataset_materialization_by_pk: Optional["UpdateDatasetMaterializationUpdateDatasetMaterializationByPk"]


class UpdateDatasetMaterializationUpdateDatasetMaterializationByPk(BaseModel):
    id: Any


UpdateDatasetMaterialization.update_forward_refs()
UpdateDatasetMaterializationUpdateDatasetMaterializationByPk.update_forward_refs()
