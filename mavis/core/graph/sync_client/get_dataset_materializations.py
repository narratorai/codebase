from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import company_task_category_enum, materialization_type_enum


class GetDatasetMaterializations(BaseModel):
    materializations: List["GetDatasetMaterializationsMaterializations"]


class GetDatasetMaterializationsMaterializations(BaseModel):
    id: Any
    label: str
    sheet_key: Optional[str]
    type: materialization_type_enum
    group_slug: Optional[str]
    external_link: Optional[str]
    company_task: Optional["GetDatasetMaterializationsMaterializationsCompanyTask"]


class GetDatasetMaterializationsMaterializationsCompanyTask(BaseModel):
    id: Any
    schedule: str
    task_slug: str
    updated_at: Any
    description: Optional[str]
    category: Optional[company_task_category_enum]


GetDatasetMaterializations.update_forward_refs()
GetDatasetMaterializationsMaterializations.update_forward_refs()
GetDatasetMaterializationsMaterializationsCompanyTask.update_forward_refs()
