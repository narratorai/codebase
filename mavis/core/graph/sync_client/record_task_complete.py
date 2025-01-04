from typing import Any, Optional

from .base_model import BaseModel


class RecordTaskComplete(BaseModel):
    update_task_execution_by_pk: Optional["RecordTaskCompleteUpdateTaskExecutionByPk"]


class RecordTaskCompleteUpdateTaskExecutionByPk(BaseModel):
    id: Any


RecordTaskComplete.update_forward_refs()
RecordTaskCompleteUpdateTaskExecutionByPk.update_forward_refs()
