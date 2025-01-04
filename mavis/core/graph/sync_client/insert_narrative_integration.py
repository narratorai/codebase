from typing import Any, Optional

from .base_model import BaseModel
from .enums import narrative_integration_kind_enum


class InsertNarrativeIntegration(BaseModel):
    insert_narrative_integrations_one: Optional["InsertNarrativeIntegrationInsertNarrativeIntegrationsOne"]


class InsertNarrativeIntegrationInsertNarrativeIntegrationsOne(BaseModel):
    kind: narrative_integration_kind_enum
    narrative_id: Any
    id: Any


InsertNarrativeIntegration.update_forward_refs()
InsertNarrativeIntegrationInsertNarrativeIntegrationsOne.update_forward_refs()
