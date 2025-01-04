from typing import Any, Optional

from .base_model import BaseModel


class InsertVersion(BaseModel):
    insert_versions_one: Optional["InsertVersionInsertVersionsOne"]


class InsertVersionInsertVersionsOne(BaseModel):
    id: Any
    created_at: Any
    user_id: Optional[Any]
    s3_key: str


InsertVersion.update_forward_refs()
InsertVersionInsertVersionsOne.update_forward_refs()
