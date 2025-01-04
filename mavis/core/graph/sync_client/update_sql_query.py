from typing import Any, Optional

from .base_model import BaseModel


class UpdateSqlQuery(BaseModel):
    updated_query: Optional["UpdateSqlQueryUpdatedQuery"]


class UpdateSqlQueryUpdatedQuery(BaseModel):
    id: Any
    updated_by: str
    updated_at: Any


UpdateSqlQuery.update_forward_refs()
UpdateSqlQueryUpdatedQuery.update_forward_refs()
