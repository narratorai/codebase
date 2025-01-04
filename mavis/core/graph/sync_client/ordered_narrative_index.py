from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import status_enum


class OrderedNarrativeIndex(BaseModel):
    narrative: List["OrderedNarrativeIndexNarrative"]


class OrderedNarrativeIndexNarrative(BaseModel):
    id: Any
    created_by: Any
    updated_at: Any
    name: str
    slug: str
    description: Optional[str]
    state: status_enum


OrderedNarrativeIndex.update_forward_refs()
OrderedNarrativeIndexNarrative.update_forward_refs()
