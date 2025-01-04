from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import narrative_template_states_enum, narrative_types_enum


class GetFreeTemplates(BaseModel):
    narrative_template: List["GetFreeTemplatesNarrativeTemplate"]


class GetFreeTemplatesNarrativeTemplate(BaseModel):
    id: Any
    name: str
    company_id: Optional[Any]
    question: Optional[str]
    category: Optional[str]
    description: Optional[str]
    customer_iteration: int
    local_iteration: Optional[int]
    global_version: int
    state: narrative_template_states_enum
    in_free_tier: Optional[bool]
    type: Optional[narrative_types_enum]
    display_companies_using: Optional[int]


GetFreeTemplates.update_forward_refs()
GetFreeTemplatesNarrativeTemplate.update_forward_refs()
