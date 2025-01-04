from typing import Any, Optional

from .base_model import BaseModel


class UpdateCompanyTablePartition(BaseModel):
    update_company_table_by_pk: Optional["UpdateCompanyTablePartitionUpdateCompanyTableByPk"]
    update_company_by_pk: Optional["UpdateCompanyTablePartitionUpdateCompanyByPk"]


class UpdateCompanyTablePartitionUpdateCompanyTableByPk(BaseModel):
    id: Any


class UpdateCompanyTablePartitionUpdateCompanyByPk(BaseModel):
    slug: str


UpdateCompanyTablePartition.update_forward_refs()
UpdateCompanyTablePartitionUpdateCompanyTableByPk.update_forward_refs()
UpdateCompanyTablePartitionUpdateCompanyByPk.update_forward_refs()
