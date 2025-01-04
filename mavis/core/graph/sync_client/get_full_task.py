from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import (
    company_task_category_enum,
    materialization_type_enum,
    narrative_types_enum,
)


class GetFullTask(BaseModel):
    company_task_by_pk: Optional["GetFullTaskCompanyTaskByPk"]


class GetFullTaskCompanyTaskByPk(BaseModel):
    id: Any
    task_slug: str
    label: Optional[str]
    schedule: str
    category: Optional[company_task_category_enum]
    internal_only: bool
    dataset_materializations: List["GetFullTaskCompanyTaskByPkDatasetMaterializations"]
    narratives: List["GetFullTaskCompanyTaskByPkNarratives"]


class GetFullTaskCompanyTaskByPkDatasetMaterializations(BaseModel):
    type: materialization_type_enum
    label: str
    column_id: Optional[str]
    external_link: Optional[str]
    dataset: "GetFullTaskCompanyTaskByPkDatasetMaterializationsDataset"


class GetFullTaskCompanyTaskByPkDatasetMaterializationsDataset(BaseModel):
    id: Any
    slug: str
    name: str


class GetFullTaskCompanyTaskByPkNarratives(BaseModel):
    id: Any
    slug: str
    name: str
    type: Optional[narrative_types_enum]


GetFullTask.update_forward_refs()
GetFullTaskCompanyTaskByPk.update_forward_refs()
GetFullTaskCompanyTaskByPkDatasetMaterializations.update_forward_refs()
GetFullTaskCompanyTaskByPkDatasetMaterializationsDataset.update_forward_refs()
GetFullTaskCompanyTaskByPkNarratives.update_forward_refs()
