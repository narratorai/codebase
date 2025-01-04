from typing import Any, Optional

from .base_model import BaseModel


class DeleteQueryTemplate(BaseModel):
    delete_query_template_by_pk: Optional["DeleteQueryTemplateDeleteQueryTemplateByPk"]


class DeleteQueryTemplateDeleteQueryTemplateByPk(BaseModel):
    id: Any


DeleteQueryTemplate.update_forward_refs()
DeleteQueryTemplateDeleteQueryTemplateByPk.update_forward_refs()
