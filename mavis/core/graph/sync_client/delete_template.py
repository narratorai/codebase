from typing import Any, Optional

from .base_model import BaseModel


class DeleteTemplate(BaseModel):
    delete_narrative_template_by_pk: Optional["DeleteTemplateDeleteNarrativeTemplateByPk"]


class DeleteTemplateDeleteNarrativeTemplateByPk(BaseModel):
    id: Any


DeleteTemplate.update_forward_refs()
DeleteTemplateDeleteNarrativeTemplateByPk.update_forward_refs()
