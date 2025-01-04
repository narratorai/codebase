from typing import Any, Optional

from .base_model import BaseModel
from .enums import narrative_types_enum


class GetTemplate(BaseModel):
    narrative_template_by_pk: Optional["GetTemplateNarrativeTemplateByPk"]


class GetTemplateNarrativeTemplateByPk(BaseModel):
    id: Any
    name: str
    question: Optional[str]
    type: Optional[narrative_types_enum]
    description: Optional[str]
    template: str


GetTemplate.update_forward_refs()
GetTemplateNarrativeTemplateByPk.update_forward_refs()
