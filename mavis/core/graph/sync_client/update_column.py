from typing import Any, List, Optional

from .base_model import BaseModel


class UpdateColumn(BaseModel):
    update_column_renames: Optional["UpdateColumnUpdateColumnRenames"]


class UpdateColumnUpdateColumnRenames(BaseModel):
    returning: List["UpdateColumnUpdateColumnRenamesReturning"]


class UpdateColumnUpdateColumnRenamesReturning(BaseModel):
    id: Any


UpdateColumn.update_forward_refs()
UpdateColumnUpdateColumnRenames.update_forward_refs()
UpdateColumnUpdateColumnRenamesReturning.update_forward_refs()
