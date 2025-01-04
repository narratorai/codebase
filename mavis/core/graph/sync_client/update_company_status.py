from typing import Optional

from .base_model import BaseModel


class UpdateCompanyStatus(BaseModel):
    update_company: Optional["UpdateCompanyStatusUpdateCompany"]


class UpdateCompanyStatusUpdateCompany(BaseModel):
    affected_rows: int


UpdateCompanyStatus.update_forward_refs()
UpdateCompanyStatusUpdateCompany.update_forward_refs()
