from typing import Any, Optional

from .base_model import BaseModel


class CreateNewActivity(BaseModel):
    insert_activity_one: Optional["CreateNewActivityInsertActivityOne"]


class CreateNewActivityInsertActivityOne(BaseModel):
    id: Any
    name: Optional[str]
    slug: str


CreateNewActivity.update_forward_refs()
CreateNewActivityInsertActivityOne.update_forward_refs()
