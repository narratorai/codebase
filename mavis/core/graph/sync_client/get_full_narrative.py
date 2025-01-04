from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import narrative_types_enum


class GetFullNarrative(BaseModel):
    narrative_by_pk: Optional["GetFullNarrativeNarrativeByPk"]


class GetFullNarrativeNarrativeByPk(BaseModel):
    id: Any
    name: str
    created_by: Any
    created_at: Any
    updated_at: Any
    description: Optional[str]
    type: Optional[narrative_types_enum]
    company_id: Any
    template_id: Optional[Any]
    tags: List["GetFullNarrativeNarrativeByPkTags"]
    datasets: List["GetFullNarrativeNarrativeByPkDatasets"]
    company_task: Optional["GetFullNarrativeNarrativeByPkCompanyTask"]
    team_permissions: List["GetFullNarrativeNarrativeByPkTeamPermissions"]
    compiled_versions: List["GetFullNarrativeNarrativeByPkCompiledVersions"]


class GetFullNarrativeNarrativeByPkTags(BaseModel):
    id: Optional[Any]
    updated_at: Optional[Any]
    tag_id: Optional[Any]
    company_tag: Optional["GetFullNarrativeNarrativeByPkTagsCompanyTag"]


class GetFullNarrativeNarrativeByPkTagsCompanyTag(BaseModel):
    tag: str
    user_id: Optional[Any]
    color: Optional[str]


class GetFullNarrativeNarrativeByPkDatasets(BaseModel):
    dataset: "GetFullNarrativeNarrativeByPkDatasetsDataset"


class GetFullNarrativeNarrativeByPkDatasetsDataset(BaseModel):
    id: Any
    name: str


class GetFullNarrativeNarrativeByPkCompanyTask(BaseModel):
    id: Any
    label: Optional[str]
    schedule: str


class GetFullNarrativeNarrativeByPkTeamPermissions(BaseModel):
    id: Optional[Any]
    can_edit: Optional[bool]


class GetFullNarrativeNarrativeByPkCompiledVersions(BaseModel):
    id: Optional[Any]
    created_at: Optional[Any]
    s3_key: Optional[str]


GetFullNarrative.update_forward_refs()
GetFullNarrativeNarrativeByPk.update_forward_refs()
GetFullNarrativeNarrativeByPkTags.update_forward_refs()
GetFullNarrativeNarrativeByPkTagsCompanyTag.update_forward_refs()
GetFullNarrativeNarrativeByPkDatasets.update_forward_refs()
GetFullNarrativeNarrativeByPkDatasetsDataset.update_forward_refs()
GetFullNarrativeNarrativeByPkCompanyTask.update_forward_refs()
GetFullNarrativeNarrativeByPkTeamPermissions.update_forward_refs()
GetFullNarrativeNarrativeByPkCompiledVersions.update_forward_refs()
