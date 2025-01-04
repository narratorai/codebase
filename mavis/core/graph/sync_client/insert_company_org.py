from typing import Any, Optional

from .base_model import BaseModel


class InsertCompanyOrg(BaseModel):
    insert_company_auth0_one: Optional["InsertCompanyOrgInsertCompanyAuth0One"]


class InsertCompanyOrgInsertCompanyAuth0One(BaseModel):
    id: Any
    org_id: str


InsertCompanyOrg.update_forward_refs()
InsertCompanyOrgInsertCompanyAuth0One.update_forward_refs()
