from typing import Any, List, Optional

from .base_model import BaseModel


class GetVersions(BaseModel):
    versions: List["GetVersionsVersions"]


class GetVersionsVersions(BaseModel):
    id: Any
    created_at: Any
    s3_key: str
    user_id: Optional[Any]


GetVersions.update_forward_refs()
GetVersionsVersions.update_forward_refs()
