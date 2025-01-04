from typing import Any, List, Optional

from .base_model import BaseModel


class DeleteActivityColumns(BaseModel):
    delete_column_renames: Optional["DeleteActivityColumnsDeleteColumnRenames"]


class DeleteActivityColumnsDeleteColumnRenames(BaseModel):
    returning: List["DeleteActivityColumnsDeleteColumnRenamesReturning"]


class DeleteActivityColumnsDeleteColumnRenamesReturning(BaseModel):
    id: Any


DeleteActivityColumns.update_forward_refs()
DeleteActivityColumnsDeleteColumnRenames.update_forward_refs()
DeleteActivityColumnsDeleteColumnRenamesReturning.update_forward_refs()
