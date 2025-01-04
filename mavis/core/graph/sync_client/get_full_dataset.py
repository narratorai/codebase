from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import materialization_type_enum, status_enum


class GetFullDataset(BaseModel):
    dataset_by_pk: Optional["GetFullDatasetDatasetByPk"]


class GetFullDatasetDatasetByPk(BaseModel):
    id: Any
    name: str
    description: Optional[str]
    status: status_enum
    slug: str
    locked: Optional[bool]
    created_by: Optional[Any]
    created_at: Any
    company_id: Any
    updated_at: Any
    dataset_activities: List["GetFullDatasetDatasetByPkDatasetActivities"]
    tags: List["GetFullDatasetDatasetByPkTags"]
    materializations: List["GetFullDatasetDatasetByPkMaterializations"]
    dependent_narratives: List["GetFullDatasetDatasetByPkDependentNarratives"]
    team_permissions: List["GetFullDatasetDatasetByPkTeamPermissions"]
    has_training: Optional[bool]
    hide_from_index: Optional[bool]


class GetFullDatasetDatasetByPkDatasetActivities(BaseModel):
    activity: "GetFullDatasetDatasetByPkDatasetActivitiesActivity"


class GetFullDatasetDatasetByPkDatasetActivitiesActivity(BaseModel):
    id: Any
    table_id: Optional[Any]


class GetFullDatasetDatasetByPkTags(BaseModel):
    id: Optional[Any]
    updated_at: Optional[Any]
    tag_id: Optional[Any]
    company_tag: Optional["GetFullDatasetDatasetByPkTagsCompanyTag"]


class GetFullDatasetDatasetByPkTagsCompanyTag(BaseModel):
    tag: str
    user_id: Optional[Any]


class GetFullDatasetDatasetByPkMaterializations(BaseModel):
    id: Any
    type: materialization_type_enum
    label: str


class GetFullDatasetDatasetByPkDependentNarratives(BaseModel):
    narrative: "GetFullDatasetDatasetByPkDependentNarrativesNarrative"


class GetFullDatasetDatasetByPkDependentNarrativesNarrative(BaseModel):
    id: Any
    name: str


class GetFullDatasetDatasetByPkTeamPermissions(BaseModel):
    team_id: Optional[Any]
    can_edit: Optional[bool]


GetFullDataset.update_forward_refs()
GetFullDatasetDatasetByPk.update_forward_refs()
GetFullDatasetDatasetByPkDatasetActivities.update_forward_refs()
GetFullDatasetDatasetByPkDatasetActivitiesActivity.update_forward_refs()
GetFullDatasetDatasetByPkTags.update_forward_refs()
GetFullDatasetDatasetByPkTagsCompanyTag.update_forward_refs()
GetFullDatasetDatasetByPkMaterializations.update_forward_refs()
GetFullDatasetDatasetByPkDependentNarratives.update_forward_refs()
GetFullDatasetDatasetByPkDependentNarrativesNarrative.update_forward_refs()
GetFullDatasetDatasetByPkTeamPermissions.update_forward_refs()
