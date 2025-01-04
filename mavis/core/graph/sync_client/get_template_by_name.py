from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import (
    narrative_template_kinds_enum,
    narrative_template_states_enum,
    narrative_types_enum,
)


class GetTemplateByName(BaseModel):
    narrative_template: List["GetTemplateByNameNarrativeTemplate"]


class GetTemplateByNameNarrativeTemplate(BaseModel):
    id: Any
    name: str
    created_by: Optional[Any]
    description: Optional[str]
    category: Optional[str]
    customer_iteration: int
    global_version: int
    state: narrative_template_states_enum
    question: Optional[str]
    narrative_template_kind: Optional["GetTemplateByNameNarrativeTemplateNarrativeTemplateKind"]
    display_companies_using: Optional[int]
    in_free_tier: Optional[bool]
    kind: Optional[narrative_template_kinds_enum]
    local_iteration: Optional[int]
    narratives: List["GetTemplateByNameNarrativeTemplateNarratives"]


class GetTemplateByNameNarrativeTemplateNarrativeTemplateKind(BaseModel):
    value: str


class GetTemplateByNameNarrativeTemplateNarratives(BaseModel):
    slug: str
    name: str
    type: Optional[narrative_types_enum]
    updated_at: Any
    id: Any
    narrative_runs: List["GetTemplateByNameNarrativeTemplateNarrativesNarrativeRuns"]
    company: "GetTemplateByNameNarrativeTemplateNarrativesCompany"


class GetTemplateByNameNarrativeTemplateNarrativesNarrativeRuns(BaseModel):
    s3_key: str


class GetTemplateByNameNarrativeTemplateNarrativesCompany(BaseModel):
    id: Any
    name: Optional[str]
    slug: str


GetTemplateByName.update_forward_refs()
GetTemplateByNameNarrativeTemplate.update_forward_refs()
GetTemplateByNameNarrativeTemplateNarrativeTemplateKind.update_forward_refs()
GetTemplateByNameNarrativeTemplateNarratives.update_forward_refs()
GetTemplateByNameNarrativeTemplateNarrativesNarrativeRuns.update_forward_refs()
GetTemplateByNameNarrativeTemplateNarrativesCompany.update_forward_refs()
