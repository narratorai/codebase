from typing import Any, Optional

from .base_model import BaseModel


class CreateNewColumn(BaseModel):
    insert_column_renames_one: Optional["CreateNewColumnInsertColumnRenamesOne"]


class CreateNewColumnInsertColumnRenamesOne(BaseModel):
    id: Any


CreateNewColumn.update_forward_refs()
CreateNewColumnInsertColumnRenamesOne.update_forward_refs()
