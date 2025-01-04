from typing import Optional

from .base_model import BaseModel


class ArchiveQueryUpdates(BaseModel):
    delete_query_updates: Optional["ArchiveQueryUpdatesDeleteQueryUpdates"]


class ArchiveQueryUpdatesDeleteQueryUpdates(BaseModel):
    affected_rows: int


ArchiveQueryUpdates.update_forward_refs()
ArchiveQueryUpdatesDeleteQueryUpdates.update_forward_refs()
