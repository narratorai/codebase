from typing import Any, Optional

from .base_model import BaseModel


class InsertTagItemOne(BaseModel):
    insert_tag_one: Optional["InsertTagItemOneInsertTagOne"]


class InsertTagItemOneInsertTagOne(BaseModel):
    id: Any


InsertTagItemOne.update_forward_refs()
InsertTagItemOneInsertTagOne.update_forward_refs()
