from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import narrative_types_enum, status_enum


class NarrativeIndex(BaseModel):
    narrative: List["NarrativeIndexNarrative"]


class NarrativeIndexNarrative(BaseModel):
    created_by: Any
    description: Optional[str]
    name: str
    id: Any
    slug: str
    state: status_enum
    type: Optional[narrative_types_enum]
    updated_at: Any
    narrative_runs: List["NarrativeIndexNarrativeNarrativeRuns"]
    tags: List["NarrativeIndexNarrativeTags"]


class NarrativeIndexNarrativeNarrativeRuns(BaseModel):
    s3_key: str


class NarrativeIndexNarrativeTags(BaseModel):
    tag_id: Optional[Any]
    updated_at: Optional[Any]


NarrativeIndex.update_forward_refs()
NarrativeIndexNarrative.update_forward_refs()
NarrativeIndexNarrativeNarrativeRuns.update_forward_refs()
NarrativeIndexNarrativeTags.update_forward_refs()
