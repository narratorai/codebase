from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import narrative_template_states_enum, narrative_types_enum


class GetCompanyTemplates(BaseModel):
    company_narrative_templates: List["GetCompanyTemplatesCompanyNarrativeTemplates"]


class GetCompanyTemplatesCompanyNarrativeTemplates(BaseModel):
    templates: List["GetCompanyTemplatesCompanyNarrativeTemplatesTemplates"]


class GetCompanyTemplatesCompanyNarrativeTemplatesTemplates(BaseModel):
    id: Any
    name: str
    question: Optional[str]
    description: Optional[str]
    customer_iteration: int
    local_iteration: Optional[int]
    global_version: int
    category: Optional[str]
    in_free_tier: Optional[bool]
    state: narrative_template_states_enum
    type: Optional[narrative_types_enum]
    display_companies_using: Optional[int]


GetCompanyTemplates.update_forward_refs()
GetCompanyTemplatesCompanyNarrativeTemplates.update_forward_refs()
GetCompanyTemplatesCompanyNarrativeTemplatesTemplates.update_forward_refs()
