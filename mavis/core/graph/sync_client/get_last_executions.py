from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import task_execution_status_enum


class GetLastExecutions(BaseModel):
    task_execution: List["GetLastExecutionsTaskExecution"]


class GetLastExecutionsTaskExecution(BaseModel):
    id: Any
    status: task_execution_status_enum
    started_at: Optional[Any]
    completed_at: Optional[Any]
    details: Any


GetLastExecutions.update_forward_refs()
GetLastExecutionsTaskExecution.update_forward_refs()
