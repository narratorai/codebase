from typing import Any, List, Optional

from .base_model import BaseModel


class DeleteColumns(BaseModel):
    delete_column_renames: Optional["DeleteColumnsDeleteColumnRenames"]


class DeleteColumnsDeleteColumnRenames(BaseModel):
    returning: List["DeleteColumnsDeleteColumnRenamesReturning"]


class DeleteColumnsDeleteColumnRenamesReturning(BaseModel):
    id: Any


DeleteColumns.update_forward_refs()
DeleteColumnsDeleteColumnRenames.update_forward_refs()
DeleteColumnsDeleteColumnRenamesReturning.update_forward_refs()
