from typing import List, Optional

from .base_model import BaseModel


class GetAuthOrg(BaseModel):
    auth: List["GetAuthOrgAuth"]


class GetAuthOrgAuth(BaseModel):
    org_id: str
    connection_id: Optional[str]
    enforce_sso: Optional[bool]
    disable_sso: Optional[bool]


GetAuthOrg.update_forward_refs()
GetAuthOrgAuth.update_forward_refs()
