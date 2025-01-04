from typing import Any, List, Optional

from .base_model import BaseModel


class DeleteTemplateByName(BaseModel):
    delete_narrative_template: Optional["DeleteTemplateByNameDeleteNarrativeTemplate"]


class DeleteTemplateByNameDeleteNarrativeTemplate(BaseModel):
    returning: List["DeleteTemplateByNameDeleteNarrativeTemplateReturning"]


class DeleteTemplateByNameDeleteNarrativeTemplateReturning(BaseModel):
    id: Any


DeleteTemplateByName.update_forward_refs()
DeleteTemplateByNameDeleteNarrativeTemplate.update_forward_refs()
DeleteTemplateByNameDeleteNarrativeTemplateReturning.update_forward_refs()
