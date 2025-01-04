from typing import Any, Optional

from .base_model import BaseModel


class DeleteCompanyTable(BaseModel):
    delete_company_table_by_pk: Optional["DeleteCompanyTableDeleteCompanyTableByPk"]


class DeleteCompanyTableDeleteCompanyTableByPk(BaseModel):
    id: Any


DeleteCompanyTable.update_forward_refs()
DeleteCompanyTableDeleteCompanyTableByPk.update_forward_refs()
