from typing import Any, List, Optional

from .base_model import BaseModel


class TransferApiKeys(BaseModel):
    update_company_user_api_key: Optional["TransferApiKeysUpdateCompanyUserApiKey"]


class TransferApiKeysUpdateCompanyUserApiKey(BaseModel):
    returning: List["TransferApiKeysUpdateCompanyUserApiKeyReturning"]


class TransferApiKeysUpdateCompanyUserApiKeyReturning(BaseModel):
    id: Any


TransferApiKeys.update_forward_refs()
TransferApiKeysUpdateCompanyUserApiKey.update_forward_refs()
TransferApiKeysUpdateCompanyUserApiKeyReturning.update_forward_refs()
