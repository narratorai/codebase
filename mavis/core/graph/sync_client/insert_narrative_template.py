from typing import Any, Optional

from .base_model import BaseModel


class InsertNarrativeTemplate(BaseModel):
    insert_narrative_template_one: Optional["InsertNarrativeTemplateInsertNarrativeTemplateOne"]


class InsertNarrativeTemplateInsertNarrativeTemplateOne(BaseModel):
    id: Any


InsertNarrativeTemplate.update_forward_refs()
InsertNarrativeTemplateInsertNarrativeTemplateOne.update_forward_refs()
