from typing import Any, Optional

from .base_model import BaseModel
from .enums import narrative_types_enum


class CreateNarrative(BaseModel):
    narrative: Optional["CreateNarrativeNarrative"]


class CreateNarrativeNarrative(BaseModel):
    id: Any
    name: str
    description: Optional[str]
    type: Optional[narrative_types_enum]
    created_at: Any
    updated_at: Any


CreateNarrative.update_forward_refs()
CreateNarrativeNarrative.update_forward_refs()
