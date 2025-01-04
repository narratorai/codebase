from typing import Any, List

from .base_model import BaseModel
from .enums import task_execution_status_enum


class GetRunningExecutions(BaseModel):
    task_executions: List["GetRunningExecutionsTaskExecutions"]


class GetRunningExecutionsTaskExecutions(BaseModel):
    id: Any
    status: task_execution_status_enum
    task_id: Any


GetRunningExecutions.update_forward_refs()
GetRunningExecutionsTaskExecutions.update_forward_refs()
