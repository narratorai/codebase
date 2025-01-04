from typing import Any, Optional

from .base_model import BaseModel


class UpdateCompanyTable(BaseModel):
    update_company_table_by_pk: Optional["UpdateCompanyTableUpdateCompanyTableByPk"]


class UpdateCompanyTableUpdateCompanyTableByPk(BaseModel):
    id: Any


UpdateCompanyTable.update_forward_refs()
UpdateCompanyTableUpdateCompanyTableByPk.update_forward_refs()
