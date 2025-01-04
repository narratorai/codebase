from typing import Any, Optional

from .base_model import BaseModel


class UpdateNarrativeTemplate(BaseModel):
    update_narrative_template_by_pk: Optional["UpdateNarrativeTemplateUpdateNarrativeTemplateByPk"]


class UpdateNarrativeTemplateUpdateNarrativeTemplateByPk(BaseModel):
    id: Any


UpdateNarrativeTemplate.update_forward_refs()
UpdateNarrativeTemplateUpdateNarrativeTemplateByPk.update_forward_refs()
