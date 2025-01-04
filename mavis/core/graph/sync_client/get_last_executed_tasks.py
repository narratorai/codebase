from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import company_task_category_enum, task_execution_status_enum


class GetLastExecutedTasks(BaseModel):
    task_execution: List["GetLastExecutedTasksTaskExecution"]


class GetLastExecutedTasksTaskExecution(BaseModel):
    id: Any
    started_at: Optional[Any]
    completed_at: Optional[Any]
    status: task_execution_status_enum
    details: Any
    task: "GetLastExecutedTasksTaskExecutionTask"


class GetLastExecutedTasksTaskExecutionTask(BaseModel):
    schedule: str
    task_slug: str
    category: Optional[company_task_category_enum]


GetLastExecutedTasks.update_forward_refs()
GetLastExecutedTasksTaskExecution.update_forward_refs()
GetLastExecutedTasksTaskExecutionTask.update_forward_refs()
