from typing import Any, Optional

from .base_model import BaseModel


class UpdateCompanyBatchHalt(BaseModel):
    update_company_by_pk: Optional["UpdateCompanyBatchHaltUpdateCompanyByPk"]


class UpdateCompanyBatchHaltUpdateCompanyByPk(BaseModel):
    id: Any


UpdateCompanyBatchHalt.update_forward_refs()
UpdateCompanyBatchHaltUpdateCompanyByPk.update_forward_refs()
