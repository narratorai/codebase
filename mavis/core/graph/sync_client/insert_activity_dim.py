from typing import Any, Optional

from .base_model import BaseModel


class InsertActivityDim(BaseModel):
    insert_activity_dim_one: Optional["InsertActivityDimInsertActivityDimOne"]


class InsertActivityDimInsertActivityDimOne(BaseModel):
    id: Any


InsertActivityDim.update_forward_refs()
InsertActivityDimInsertActivityDimOne.update_forward_refs()
