from typing import Any, Optional

from .base_model import BaseModel


class DeleteTag(BaseModel):
    delete_company_tags_by_pk: Optional["DeleteTagDeleteCompanyTagsByPk"]


class DeleteTagDeleteCompanyTagsByPk(BaseModel):
    id: Any


DeleteTag.update_forward_refs()
DeleteTagDeleteCompanyTagsByPk.update_forward_refs()
