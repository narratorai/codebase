from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import narrative_integration_kind_enum


class GetAllNarrativeIntegrations(BaseModel):
    narrative: Optional["GetAllNarrativeIntegrationsNarrative"]


class GetAllNarrativeIntegrationsNarrative(BaseModel):
    id: Any
    slug: str
    name: str
    integrations: List["GetAllNarrativeIntegrationsNarrativeIntegrations"]


class GetAllNarrativeIntegrationsNarrativeIntegrations(BaseModel):
    id: Any
    task_id: Any
    kind: narrative_integration_kind_enum


GetAllNarrativeIntegrations.update_forward_refs()
GetAllNarrativeIntegrationsNarrative.update_forward_refs()
GetAllNarrativeIntegrationsNarrativeIntegrations.update_forward_refs()
