from typing import Any, Optional

from .base_model import BaseModel


class InsertCompany(BaseModel):
    insert_company_one: Optional["InsertCompanyInsertCompanyOne"]


class InsertCompanyInsertCompanyOne(BaseModel):
    id: Any


InsertCompany.update_forward_refs()
InsertCompanyInsertCompanyOne.update_forward_refs()
