from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import narrative_types_enum


class UpdateNarrative(BaseModel):
    narrative: Optional["UpdateNarrativeNarrative"]


class UpdateNarrativeNarrative(BaseModel):
    id: Any
    slug: str
    name: str
    description: Optional[str]
    type: Optional[narrative_types_enum]
    created_at: Any
    updated_at: Any
    created_by: Any
    company_task: Optional["UpdateNarrativeNarrativeCompanyTask"]
    tags: List["UpdateNarrativeNarrativeTags"]
    teams: List["UpdateNarrativeNarrativeTeams"]


class UpdateNarrativeNarrativeCompanyTask(BaseModel):
    id: Any
    schedule: str


class UpdateNarrativeNarrativeTags(BaseModel):
    id: Optional[Any]
    updated_at: Optional[Any]
    tag_id: Optional[Any]
    company_tag: Optional["UpdateNarrativeNarrativeTagsCompanyTag"]


class UpdateNarrativeNarrativeTagsCompanyTag(BaseModel):
    tag: str
    user_id: Optional[Any]


class UpdateNarrativeNarrativeTeams(BaseModel):
    id: Optional[Any]
    can_edit: Optional[bool]


UpdateNarrative.update_forward_refs()
UpdateNarrativeNarrative.update_forward_refs()
UpdateNarrativeNarrativeCompanyTask.update_forward_refs()
UpdateNarrativeNarrativeTags.update_forward_refs()
UpdateNarrativeNarrativeTagsCompanyTag.update_forward_refs()
UpdateNarrativeNarrativeTeams.update_forward_refs()
