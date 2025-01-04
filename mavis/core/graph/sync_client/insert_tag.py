from typing import Any, Optional

from .base_model import BaseModel


class InsertTag(BaseModel):
    inserted_tag: Optional["InsertTagInsertedTag"]


class InsertTagInsertedTag(BaseModel):
    id: Any


InsertTag.update_forward_refs()
InsertTagInsertedTag.update_forward_refs()
