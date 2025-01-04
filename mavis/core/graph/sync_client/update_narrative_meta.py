from typing import Any, List, Optional

from .base_model import BaseModel


class UpdateNarrativeMeta(BaseModel):
    update_narrative: Optional["UpdateNarrativeMetaUpdateNarrative"]


class UpdateNarrativeMetaUpdateNarrative(BaseModel):
    returning: List["UpdateNarrativeMetaUpdateNarrativeReturning"]


class UpdateNarrativeMetaUpdateNarrativeReturning(BaseModel):
    id: Any


UpdateNarrativeMeta.update_forward_refs()
UpdateNarrativeMetaUpdateNarrative.update_forward_refs()
UpdateNarrativeMetaUpdateNarrativeReturning.update_forward_refs()
