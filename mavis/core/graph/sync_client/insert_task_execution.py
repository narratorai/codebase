from typing import Any, Optional

from .base_model import BaseModel


class InsertTaskExecution(BaseModel):
    inserted_task_execution: Optional["InsertTaskExecutionInsertedTaskExecution"]


class InsertTaskExecutionInsertedTaskExecution(BaseModel):
    id: Any


InsertTaskExecution.update_forward_refs()
InsertTaskExecutionInsertedTaskExecution.update_forward_refs()
