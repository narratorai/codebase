from typing import Any, Optional

from .base_model import BaseModel


class RevokeCompanyUserApiKey(BaseModel):
    update_company_user_api_key_by_pk: Optional["RevokeCompanyUserApiKeyUpdateCompanyUserApiKeyByPk"]


class RevokeCompanyUserApiKeyUpdateCompanyUserApiKeyByPk(BaseModel):
    id: Any
    revoked_at: Optional[Any]


RevokeCompanyUserApiKey.update_forward_refs()
RevokeCompanyUserApiKeyUpdateCompanyUserApiKeyByPk.update_forward_refs()
