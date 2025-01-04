from typing import Any, Optional

from .base_model import BaseModel


class UpdateDatasource(BaseModel):
    update_company_by_pk: Optional["UpdateDatasourceUpdateCompanyByPk"]


class UpdateDatasourceUpdateCompanyByPk(BaseModel):
    id: Any


UpdateDatasource.update_forward_refs()
UpdateDatasourceUpdateCompanyByPk.update_forward_refs()
