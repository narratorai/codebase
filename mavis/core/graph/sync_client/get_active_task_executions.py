from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import task_execution_status_enum


class GetActiveTaskExecutions(BaseModel):
    task_executions: List["GetActiveTaskExecutionsTaskExecutions"]


class GetActiveTaskExecutionsTaskExecutions(BaseModel):
    id: Any
    task_id: Any
    status: task_execution_status_enum
    started_at: Optional[Any]
    orchestration_id: Optional[str]


GetActiveTaskExecutions.update_forward_refs()
GetActiveTaskExecutionsTaskExecutions.update_forward_refs()
