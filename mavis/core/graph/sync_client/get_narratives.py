from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import narrative_types_enum


class GetNarratives(BaseModel):
    narratives: List["GetNarrativesNarratives"]


class GetNarrativesNarratives(BaseModel):
    id: Any
    slug: str
    name: str
    description: Optional[str]
    type: Optional[narrative_types_enum]
    created_at: Any
    updated_at: Any
    created_by: Any
    runs: List["GetNarrativesNarrativesRuns"]
    tags: List["GetNarrativesNarrativesTags"]
    teams: List["GetNarrativesNarrativesTeams"]


class GetNarrativesNarrativesRuns(BaseModel):
    id: Any
    created_at: Any
    s3_key: str


class GetNarrativesNarrativesTags(BaseModel):
    id: Optional[Any]
    updated_at: Optional[Any]
    tag_id: Optional[Any]
    company_tag: Optional["GetNarrativesNarrativesTagsCompanyTag"]


class GetNarrativesNarrativesTagsCompanyTag(BaseModel):
    tag: str
    user_id: Optional[Any]


class GetNarrativesNarrativesTeams(BaseModel):
    id: Optional[Any]
    can_edit: Optional[bool]


GetNarratives.update_forward_refs()
GetNarrativesNarratives.update_forward_refs()
GetNarrativesNarrativesRuns.update_forward_refs()
GetNarrativesNarrativesTags.update_forward_refs()
GetNarrativesNarrativesTagsCompanyTag.update_forward_refs()
GetNarrativesNarrativesTeams.update_forward_refs()
