from typing import Any, Optional

from .base_model import BaseModel


class RecordTaskCancelled(BaseModel):
    update_task_execution_by_pk: Optional["RecordTaskCancelledUpdateTaskExecutionByPk"]


class RecordTaskCancelledUpdateTaskExecutionByPk(BaseModel):
    id: Any


RecordTaskCancelled.update_forward_refs()
RecordTaskCancelledUpdateTaskExecutionByPk.update_forward_refs()
