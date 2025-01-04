from typing import Any, Optional

from .base_model import BaseModel


class RecordTaskFailed(BaseModel):
    update_task_execution_by_pk: Optional["RecordTaskFailedUpdateTaskExecutionByPk"]


class RecordTaskFailedUpdateTaskExecutionByPk(BaseModel):
    id: Any


RecordTaskFailed.update_forward_refs()
RecordTaskFailedUpdateTaskExecutionByPk.update_forward_refs()
