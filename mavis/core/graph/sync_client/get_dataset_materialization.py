from typing import Any, Optional

from .base_model import BaseModel
from .enums import materialization_type_enum


class GetDatasetMaterialization(BaseModel):
    materialization: Optional["GetDatasetMaterializationMaterialization"]


class GetDatasetMaterializationMaterialization(BaseModel):
    id: Any
    created_at: Any
    dataset_id: Any
    group_slug: Optional[str]
    label: str
    type: materialization_type_enum
    task_id: Optional[Any]
    company_task: Optional["GetDatasetMaterializationMaterializationCompanyTask"]


class GetDatasetMaterializationMaterializationCompanyTask(BaseModel):
    schedule: str


GetDatasetMaterialization.update_forward_refs()
GetDatasetMaterializationMaterialization.update_forward_refs()
GetDatasetMaterializationMaterializationCompanyTask.update_forward_refs()
