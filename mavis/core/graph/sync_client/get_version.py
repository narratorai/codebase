from typing import Any, Optional

from .base_model import BaseModel


class GetVersion(BaseModel):
    versions_by_pk: Optional["GetVersionVersionsByPk"]


class GetVersionVersionsByPk(BaseModel):
    id: Any
    created_at: Any
    s3_key: str
    user_id: Optional[Any]


GetVersion.update_forward_refs()
GetVersionVersionsByPk.update_forward_refs()
