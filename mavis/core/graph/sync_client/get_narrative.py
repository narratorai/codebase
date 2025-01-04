from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import narrative_types_enum, status_enum


class GetNarrative(BaseModel):
    narrative_by_pk: Optional["GetNarrativeNarrativeByPk"]


class GetNarrativeNarrativeByPk(BaseModel):
    id: Any
    name: str
    created_by: Any
    created_at: Any
    updated_at: Any
    description: Optional[str]
    type: Optional[narrative_types_enum]
    company_id: Any
    state: status_enum
    tags: List["GetNarrativeNarrativeByPkTags"]
    team_permissions: List["GetNarrativeNarrativeByPkTeamPermissions"]


class GetNarrativeNarrativeByPkTags(BaseModel):
    id: Optional[Any]
    updated_at: Optional[Any]
    tag_id: Optional[Any]
    company_tag: Optional["GetNarrativeNarrativeByPkTagsCompanyTag"]


class GetNarrativeNarrativeByPkTagsCompanyTag(BaseModel):
    tag: str
    user_id: Optional[Any]


class GetNarrativeNarrativeByPkTeamPermissions(BaseModel):
    team_id: Optional[Any]
    can_edit: Optional[bool]


GetNarrative.update_forward_refs()
GetNarrativeNarrativeByPk.update_forward_refs()
GetNarrativeNarrativeByPkTags.update_forward_refs()
GetNarrativeNarrativeByPkTagsCompanyTag.update_forward_refs()
GetNarrativeNarrativeByPkTeamPermissions.update_forward_refs()
