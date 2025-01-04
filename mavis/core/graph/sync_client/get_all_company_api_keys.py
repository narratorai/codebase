from typing import Any, List, Optional

from .base_model import BaseModel


class GetAllCompanyApiKeys(BaseModel):
    api_keys: List["GetAllCompanyApiKeysApiKeys"]


class GetAllCompanyApiKeysApiKeys(BaseModel):
    id: Any
    label: Optional[str]
    created_at: Any
    last_used_at: Optional[Any]
    company_user: "GetAllCompanyApiKeysApiKeysCompanyUser"


class GetAllCompanyApiKeysApiKeysCompanyUser(BaseModel):
    user: "GetAllCompanyApiKeysApiKeysCompanyUserUser"


class GetAllCompanyApiKeysApiKeysCompanyUserUser(BaseModel):
    id: Any
    email: str


GetAllCompanyApiKeys.update_forward_refs()
GetAllCompanyApiKeysApiKeys.update_forward_refs()
GetAllCompanyApiKeysApiKeysCompanyUser.update_forward_refs()
GetAllCompanyApiKeysApiKeysCompanyUserUser.update_forward_refs()
