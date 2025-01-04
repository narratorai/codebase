from typing import Any, Optional

from .base_model import BaseModel


class UpdateExecutionStatus(BaseModel):
    update_task_execution_by_pk: Optional["UpdateExecutionStatusUpdateTaskExecutionByPk"]


class UpdateExecutionStatusUpdateTaskExecutionByPk(BaseModel):
    id: Any


UpdateExecutionStatus.update_forward_refs()
UpdateExecutionStatusUpdateTaskExecutionByPk.update_forward_refs()
