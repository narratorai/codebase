from typing import Any, Optional

from .base_model import BaseModel


class AddUserToCompany(BaseModel):
    insert_company_user_one: Optional["AddUserToCompanyInsertCompanyUserOne"]


class AddUserToCompanyInsertCompanyUserOne(BaseModel):
    id: Any


AddUserToCompany.update_forward_refs()
AddUserToCompanyInsertCompanyUserOne.update_forward_refs()
