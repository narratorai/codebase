from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import task_execution_status_enum


class GetAllTasksProcessingNoBatchHalt(BaseModel):
    tasks: List["GetAllTasksProcessingNoBatchHaltTasks"]


class GetAllTasksProcessingNoBatchHaltTasks(BaseModel):
    id: Any
    task_slug: str
    schedule: str
    executions: List["GetAllTasksProcessingNoBatchHaltTasksExecutions"]


class GetAllTasksProcessingNoBatchHaltTasksExecutions(BaseModel):
    status: task_execution_status_enum
    started_at: Optional[Any]
    created_at: Any


GetAllTasksProcessingNoBatchHalt.update_forward_refs()
GetAllTasksProcessingNoBatchHaltTasks.update_forward_refs()
GetAllTasksProcessingNoBatchHaltTasksExecutions.update_forward_refs()
