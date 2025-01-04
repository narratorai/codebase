from typing import Optional

from .base_model import BaseModel


class RecordTaskQuery(BaseModel):
    update_task_execution: Optional["RecordTaskQueryUpdateTaskExecution"]


class RecordTaskQueryUpdateTaskExecution(BaseModel):
    affected_rows: int


RecordTaskQuery.update_forward_refs()
RecordTaskQueryUpdateTaskExecution.update_forward_refs()
