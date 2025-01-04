from typing import Any, Optional

from .base_model import BaseModel


class UpdateTag(BaseModel):
    update_company_tags_by_pk: Optional["UpdateTagUpdateCompanyTagsByPk"]


class UpdateTagUpdateCompanyTagsByPk(BaseModel):
    id: Any


UpdateTag.update_forward_refs()
UpdateTagUpdateCompanyTagsByPk.update_forward_refs()
