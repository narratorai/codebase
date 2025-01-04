from typing import Any, Optional

from .base_model import BaseModel


class UpdateCompany(BaseModel):
    update_company_by_pk: Optional["UpdateCompanyUpdateCompanyByPk"]


class UpdateCompanyUpdateCompanyByPk(BaseModel):
    id: Any


UpdateCompany.update_forward_refs()
UpdateCompanyUpdateCompanyByPk.update_forward_refs()
