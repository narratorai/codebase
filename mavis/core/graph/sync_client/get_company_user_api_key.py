from typing import Any, Optional

from .base_model import BaseModel


class GetCompanyUserApiKey(BaseModel):
    api_key: Optional["GetCompanyUserApiKeyApiKey"]


class GetCompanyUserApiKeyApiKey(BaseModel):
    id: Any
    revoked_at: Optional[Any]
    company_user: "GetCompanyUserApiKeyApiKeyCompanyUser"


class GetCompanyUserApiKeyApiKeyCompanyUser(BaseModel):
    user: "GetCompanyUserApiKeyApiKeyCompanyUserUser"


class GetCompanyUserApiKeyApiKeyCompanyUserUser(BaseModel):
    id: Any


GetCompanyUserApiKey.update_forward_refs()
GetCompanyUserApiKeyApiKey.update_forward_refs()
GetCompanyUserApiKeyApiKeyCompanyUser.update_forward_refs()
GetCompanyUserApiKeyApiKeyCompanyUserUser.update_forward_refs()
