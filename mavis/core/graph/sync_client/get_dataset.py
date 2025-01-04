from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import materialization_type_enum, status_enum, user_role_enum


class GetDataset(BaseModel):
    dataset_by_pk: Optional["GetDatasetDatasetByPk"]


class GetDatasetDatasetByPk(BaseModel):
    name: str
    description: Optional[str]
    status: status_enum
    slug: str
    locked: Optional[bool]
    company_category: Optional["GetDatasetDatasetByPkCompanyCategory"]
    user: Optional["GetDatasetDatasetByPkUser"]
    materializations: List["GetDatasetDatasetByPkMaterializations"]
    dependent_narratives: List["GetDatasetDatasetByPkDependentNarratives"]


class GetDatasetDatasetByPkCompanyCategory(BaseModel):
    category: str


class GetDatasetDatasetByPkUser(BaseModel):
    id: Any
    role: Optional[user_role_enum]
    email: str


class GetDatasetDatasetByPkMaterializations(BaseModel):
    id: Any
    type: materialization_type_enum
    company_task: Optional["GetDatasetDatasetByPkMaterializationsCompanyTask"]
    label: str
    column_id: Optional[str]
    group_slug: Optional[str]
    sheet_key: Optional[str]
    days_to_resync: Optional[int]


class GetDatasetDatasetByPkMaterializationsCompanyTask(BaseModel):
    id: Any
    task_slug: str
    schedule: str
    description: Optional[str]


class GetDatasetDatasetByPkDependentNarratives(BaseModel):
    narrative: "GetDatasetDatasetByPkDependentNarrativesNarrative"


class GetDatasetDatasetByPkDependentNarrativesNarrative(BaseModel):
    id: Any
    name: str
    created_by: Any
    task_id: Optional[Any]
    template_id: Optional[Any]
    user: "GetDatasetDatasetByPkDependentNarrativesNarrativeUser"


class GetDatasetDatasetByPkDependentNarrativesNarrativeUser(BaseModel):
    email: str


GetDataset.update_forward_refs()
GetDatasetDatasetByPk.update_forward_refs()
GetDatasetDatasetByPkCompanyCategory.update_forward_refs()
GetDatasetDatasetByPkUser.update_forward_refs()
GetDatasetDatasetByPkMaterializations.update_forward_refs()
GetDatasetDatasetByPkMaterializationsCompanyTask.update_forward_refs()
GetDatasetDatasetByPkDependentNarratives.update_forward_refs()
GetDatasetDatasetByPkDependentNarrativesNarrative.update_forward_refs()
GetDatasetDatasetByPkDependentNarrativesNarrativeUser.update_forward_refs()
