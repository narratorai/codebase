from typing import Any, Optional

from .base_model import BaseModel


class InsertQueryTemplate(BaseModel):
    inserted_template: Optional["InsertQueryTemplateInsertedTemplate"]


class InsertQueryTemplateInsertedTemplate(BaseModel):
    id: Any


InsertQueryTemplate.update_forward_refs()
InsertQueryTemplateInsertedTemplate.update_forward_refs()
