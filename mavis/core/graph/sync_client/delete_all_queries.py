from typing import Any, List, Optional

from .base_model import BaseModel


class DeleteAllQueries(BaseModel):
    delete_sql_queries: Optional["DeleteAllQueriesDeleteSqlQueries"]


class DeleteAllQueriesDeleteSqlQueries(BaseModel):
    returning: List["DeleteAllQueriesDeleteSqlQueriesReturning"]


class DeleteAllQueriesDeleteSqlQueriesReturning(BaseModel):
    id: Any


DeleteAllQueries.update_forward_refs()
DeleteAllQueriesDeleteSqlQueries.update_forward_refs()
DeleteAllQueriesDeleteSqlQueriesReturning.update_forward_refs()
