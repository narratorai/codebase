from typing import Any, Optional

from .base_model import BaseModel


class UpdateTaskOrchestrationId(BaseModel):
    update_task_execution_by_pk: Optional["UpdateTaskOrchestrationIdUpdateTaskExecutionByPk"]


class UpdateTaskOrchestrationIdUpdateTaskExecutionByPk(BaseModel):
    id: Any


UpdateTaskOrchestrationId.update_forward_refs()
UpdateTaskOrchestrationIdUpdateTaskExecutionByPk.update_forward_refs()
