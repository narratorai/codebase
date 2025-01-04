from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import narrative_template_states_enum, narrative_types_enum


class GetAllInternalTemplates(BaseModel):
    narrative_template: List["GetAllInternalTemplatesNarrativeTemplate"]


class GetAllInternalTemplatesNarrativeTemplate(BaseModel):
    id: Any
    name: str
    question: Optional[str]
    description: Optional[str]
    customer_iteration: int
    local_iteration: Optional[int]
    global_version: int
    state: narrative_template_states_enum
    type: Optional[narrative_types_enum]
    display_companies_using: Optional[int]
    company_id: Optional[Any]


GetAllInternalTemplates.update_forward_refs()
GetAllInternalTemplatesNarrativeTemplate.update_forward_refs()
