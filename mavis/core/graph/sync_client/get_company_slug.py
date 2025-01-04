from typing import Optional

from .base_model import BaseModel


class GetCompanySlug(BaseModel):
    company_by_pk: Optional["GetCompanySlugCompanyByPk"]


class GetCompanySlugCompanyByPk(BaseModel):
    name: Optional[str]
    slug: str
    batch_halt: bool


GetCompanySlug.update_forward_refs()
GetCompanySlugCompanyByPk.update_forward_refs()
