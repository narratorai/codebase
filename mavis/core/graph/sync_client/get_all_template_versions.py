from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import narrative_template_kinds_enum, narrative_template_states_enum


class GetAllTemplateVersions(BaseModel):
    narrative_template: List["GetAllTemplateVersionsNarrativeTemplate"]


class GetAllTemplateVersionsNarrativeTemplate(BaseModel):
    id: Any
    name: str
    question: Optional[str]
    created_by: Optional[Any]
    description: Optional[str]
    state: narrative_template_states_enum
    global_version: int
    display_companies_using: Optional[int]
    kind: Optional[narrative_template_kinds_enum]
    customer_iteration: int
    local_iteration: Optional[int]
    narrative_template_kind: Optional["GetAllTemplateVersionsNarrativeTemplateNarrativeTemplateKind"]


class GetAllTemplateVersionsNarrativeTemplateNarrativeTemplateKind(BaseModel):
    value: str


GetAllTemplateVersions.update_forward_refs()
GetAllTemplateVersionsNarrativeTemplate.update_forward_refs()
GetAllTemplateVersionsNarrativeTemplateNarrativeTemplateKind.update_forward_refs()
