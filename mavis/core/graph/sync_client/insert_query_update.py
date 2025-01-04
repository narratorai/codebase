from typing import Any, List, Optional

from .base_model import BaseModel


class InsertQueryUpdate(BaseModel):
    insert_query_updates: Optional["InsertQueryUpdateInsertQueryUpdates"]


class InsertQueryUpdateInsertQueryUpdates(BaseModel):
    returning: List["InsertQueryUpdateInsertQueryUpdatesReturning"]


class InsertQueryUpdateInsertQueryUpdatesReturning(BaseModel):
    id: Any


InsertQueryUpdate.update_forward_refs()
InsertQueryUpdateInsertQueryUpdates.update_forward_refs()
InsertQueryUpdateInsertQueryUpdatesReturning.update_forward_refs()
