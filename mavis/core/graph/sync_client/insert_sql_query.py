from typing import Any, Optional

from .base_model import BaseModel


class InsertSqlQuery(BaseModel):
    inserted_query: Optional["InsertSqlQueryInsertedQuery"]


class InsertSqlQueryInsertedQuery(BaseModel):
    id: Any
    updated_by: str
    updated_at: Any


InsertSqlQuery.update_forward_refs()
InsertSqlQueryInsertedQuery.update_forward_refs()
