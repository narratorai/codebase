from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import (
    narrative_template_kinds_enum,
    narrative_template_states_enum,
    narrative_types_enum,
)


class GetInternalTemplateByName(BaseModel):
    narrative_template: List["GetInternalTemplateByNameNarrativeTemplate"]


class GetInternalTemplateByNameNarrativeTemplate(BaseModel):
    id: Any
    name: str
    created_by: Optional[Any]
    description: Optional[str]
    customer_iteration: int
    global_version: int
    state: narrative_template_states_enum
    question: Optional[str]
    narrative_template_kind: Optional["GetInternalTemplateByNameNarrativeTemplateNarrativeTemplateKind"]
    display_companies_using: Optional[int]
    in_free_tier: Optional[bool]
    kind: Optional[narrative_template_kinds_enum]
    local_iteration: Optional[int]
    narratives: List["GetInternalTemplateByNameNarrativeTemplateNarratives"]


class GetInternalTemplateByNameNarrativeTemplateNarrativeTemplateKind(BaseModel):
    value: str


class GetInternalTemplateByNameNarrativeTemplateNarratives(BaseModel):
    slug: str
    name: str
    type: Optional[narrative_types_enum]
    updated_at: Any
    id: Any
    narrative_runs: List["GetInternalTemplateByNameNarrativeTemplateNarrativesNarrativeRuns"]
    company: "GetInternalTemplateByNameNarrativeTemplateNarrativesCompany"


class GetInternalTemplateByNameNarrativeTemplateNarrativesNarrativeRuns(BaseModel):
    s3_key: str


class GetInternalTemplateByNameNarrativeTemplateNarrativesCompany(BaseModel):
    id: Any
    name: Optional[str]
    slug: str


GetInternalTemplateByName.update_forward_refs()
GetInternalTemplateByNameNarrativeTemplate.update_forward_refs()
GetInternalTemplateByNameNarrativeTemplateNarrativeTemplateKind.update_forward_refs()
GetInternalTemplateByNameNarrativeTemplateNarratives.update_forward_refs()
GetInternalTemplateByNameNarrativeTemplateNarrativesNarrativeRuns.update_forward_refs()
GetInternalTemplateByNameNarrativeTemplateNarrativesCompany.update_forward_refs()
