from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import narrative_template_states_enum, narrative_types_enum


class GetAllTemplates(BaseModel):
    narrative_template: List["GetAllTemplatesNarrativeTemplate"]


class GetAllTemplatesNarrativeTemplate(BaseModel):
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
    category: Optional[str]


GetAllTemplates.update_forward_refs()
GetAllTemplatesNarrativeTemplate.update_forward_refs()
