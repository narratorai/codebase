from typing import Any, Optional

from .base_model import BaseModel


class CreateCompanyUserApiKey(BaseModel):
    inserted_api_key: Optional["CreateCompanyUserApiKeyInsertedApiKey"]


class CreateCompanyUserApiKeyInsertedApiKey(BaseModel):
    id: Any
    label: Optional[str]
    created_at: Any
    company_user: "CreateCompanyUserApiKeyInsertedApiKeyCompanyUser"


class CreateCompanyUserApiKeyInsertedApiKeyCompanyUser(BaseModel):
    user: "CreateCompanyUserApiKeyInsertedApiKeyCompanyUserUser"


class CreateCompanyUserApiKeyInsertedApiKeyCompanyUserUser(BaseModel):
    id: Any
    email: str


CreateCompanyUserApiKey.update_forward_refs()
CreateCompanyUserApiKeyInsertedApiKey.update_forward_refs()
CreateCompanyUserApiKeyInsertedApiKeyCompanyUser.update_forward_refs()
CreateCompanyUserApiKeyInsertedApiKeyCompanyUserUser.update_forward_refs()
