from typing import Any, List, Optional

from .base_model import BaseModel


class RecordTasksStuck(BaseModel):
    update: Optional["RecordTasksStuckUpdate"]


class RecordTasksStuckUpdate(BaseModel):
    affected_rows: int
    returning: List["RecordTasksStuckUpdateReturning"]


class RecordTasksStuckUpdateReturning(BaseModel):
    id: Any


RecordTasksStuck.update_forward_refs()
RecordTasksStuckUpdate.update_forward_refs()
RecordTasksStuckUpdateReturning.update_forward_refs()
