from typing import Any, Optional

from .base_model import BaseModel


class InsertTask(BaseModel):
    inserted_task: Optional["InsertTaskInsertedTask"]


class InsertTaskInsertedTask(BaseModel):
    id: Any


InsertTask.update_forward_refs()
InsertTaskInsertedTask.update_forward_refs()
