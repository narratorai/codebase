from typing import Any, Optional

from .base_model import BaseModel


class InsertDimTable(BaseModel):
    insert_dim_table_one: Optional["InsertDimTableInsertDimTableOne"]


class InsertDimTableInsertDimTableOne(BaseModel):
    id: Any


InsertDimTable.update_forward_refs()
InsertDimTableInsertDimTableOne.update_forward_refs()
