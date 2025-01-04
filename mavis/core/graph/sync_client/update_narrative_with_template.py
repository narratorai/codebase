from typing import Any, List, Optional

from .base_model import BaseModel


class UpdateNarrativeWithTemplate(BaseModel):
    update_narrative: Optional["UpdateNarrativeWithTemplateUpdateNarrative"]


class UpdateNarrativeWithTemplateUpdateNarrative(BaseModel):
    returning: List["UpdateNarrativeWithTemplateUpdateNarrativeReturning"]


class UpdateNarrativeWithTemplateUpdateNarrativeReturning(BaseModel):
    id: Any


UpdateNarrativeWithTemplate.update_forward_refs()
UpdateNarrativeWithTemplateUpdateNarrative.update_forward_refs()
UpdateNarrativeWithTemplateUpdateNarrativeReturning.update_forward_refs()
