from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import narrative_integration_kind_enum


class GetNarrativeIntegration(BaseModel):
    narrative_integration: Optional["GetNarrativeIntegrationNarrativeIntegration"]


class GetNarrativeIntegrationNarrativeIntegration(BaseModel):
    id: Any
    kind: narrative_integration_kind_enum
    narrative_id: Any
    task_id: Any
    narrative: "GetNarrativeIntegrationNarrativeIntegrationNarrative"


class GetNarrativeIntegrationNarrativeIntegrationNarrative(BaseModel):
    slug: str
    name: str
    narrative_runs: List["GetNarrativeIntegrationNarrativeIntegrationNarrativeNarrativeRuns"]


class GetNarrativeIntegrationNarrativeIntegrationNarrativeNarrativeRuns(BaseModel):
    s3_key: str


GetNarrativeIntegration.update_forward_refs()
GetNarrativeIntegrationNarrativeIntegration.update_forward_refs()
GetNarrativeIntegrationNarrativeIntegrationNarrative.update_forward_refs()
GetNarrativeIntegrationNarrativeIntegrationNarrativeNarrativeRuns.update_forward_refs()
