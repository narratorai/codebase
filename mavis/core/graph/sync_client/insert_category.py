from typing import Any, Optional

from .base_model import BaseModel


class InsertCategory(BaseModel):
    inserted_category: Optional["InsertCategoryInsertedCategory"]


class InsertCategoryInsertedCategory(BaseModel):
    id: Any


InsertCategory.update_forward_refs()
InsertCategoryInsertedCategory.update_forward_refs()
