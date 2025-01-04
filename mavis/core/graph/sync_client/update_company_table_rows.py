from typing import Any, Optional

from .base_model import BaseModel


class UpdateCompanyTableRows(BaseModel):
    update_company_table_by_pk: Optional["UpdateCompanyTableRowsUpdateCompanyTableByPk"]


class UpdateCompanyTableRowsUpdateCompanyTableByPk(BaseModel):
    id: Any


UpdateCompanyTableRows.update_forward_refs()
UpdateCompanyTableRowsUpdateCompanyTableByPk.update_forward_refs()
