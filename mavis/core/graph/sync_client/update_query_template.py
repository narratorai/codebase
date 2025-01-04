from typing import Any, Optional

from .base_model import BaseModel


class UpdateQueryTemplate(BaseModel):
    update_query_template_by_pk: Optional["UpdateQueryTemplateUpdateQueryTemplateByPk"]


class UpdateQueryTemplateUpdateQueryTemplateByPk(BaseModel):
    id: Any


UpdateQueryTemplate.update_forward_refs()
UpdateQueryTemplateUpdateQueryTemplateByPk.update_forward_refs()
