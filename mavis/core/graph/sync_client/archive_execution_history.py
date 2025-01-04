from typing import Optional

from .base_model import BaseModel


class ArchiveExecutionHistory(BaseModel):
    delete_task_execution: Optional["ArchiveExecutionHistoryDeleteTaskExecution"]


class ArchiveExecutionHistoryDeleteTaskExecution(BaseModel):
    affected_rows: int


ArchiveExecutionHistory.update_forward_refs()
ArchiveExecutionHistoryDeleteTaskExecution.update_forward_refs()
