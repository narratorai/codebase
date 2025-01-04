from typing import Any, List, Optional

from .base_model import BaseModel


class DeleteAllAlertsWithTasks(BaseModel):
    delete_company_task: Optional["DeleteAllAlertsWithTasksDeleteCompanyTask"]
    delete_sql_queries: Optional["DeleteAllAlertsWithTasksDeleteSqlQueries"]


class DeleteAllAlertsWithTasksDeleteCompanyTask(BaseModel):
    affected_rows: int


class DeleteAllAlertsWithTasksDeleteSqlQueries(BaseModel):
    returning: List["DeleteAllAlertsWithTasksDeleteSqlQueriesReturning"]
    affected_rows: int


class DeleteAllAlertsWithTasksDeleteSqlQueriesReturning(BaseModel):
    id: Any


DeleteAllAlertsWithTasks.update_forward_refs()
DeleteAllAlertsWithTasksDeleteCompanyTask.update_forward_refs()
DeleteAllAlertsWithTasksDeleteSqlQueries.update_forward_refs()
DeleteAllAlertsWithTasksDeleteSqlQueriesReturning.update_forward_refs()
