from typing import Optional

from .base_model import BaseModel


class UpdateCompanyWithAuth0Org(BaseModel):
    update_company_auth0: Optional["UpdateCompanyWithAuth0OrgUpdateCompanyAuth0"]


class UpdateCompanyWithAuth0OrgUpdateCompanyAuth0(BaseModel):
    affected_rows: int


UpdateCompanyWithAuth0Org.update_forward_refs()
UpdateCompanyWithAuth0OrgUpdateCompanyAuth0.update_forward_refs()
