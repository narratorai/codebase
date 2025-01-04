from typing import Any, Optional

from .base_model import BaseModel


class DeleteNarrativeIntegration(BaseModel):
    delete_narrative_integrations_by_pk: Optional["DeleteNarrativeIntegrationDeleteNarrativeIntegrationsByPk"]


class DeleteNarrativeIntegrationDeleteNarrativeIntegrationsByPk(BaseModel):
    id: Any


DeleteNarrativeIntegration.update_forward_refs()
DeleteNarrativeIntegrationDeleteNarrativeIntegrationsByPk.update_forward_refs()
