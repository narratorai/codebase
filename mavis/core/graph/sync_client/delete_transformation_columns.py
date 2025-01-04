from typing import Any, List, Optional

from .base_model import BaseModel


class DeleteTransformationColumns(BaseModel):
    delete_column_renames: Optional["DeleteTransformationColumnsDeleteColumnRenames"]


class DeleteTransformationColumnsDeleteColumnRenames(BaseModel):
    returning: List["DeleteTransformationColumnsDeleteColumnRenamesReturning"]


class DeleteTransformationColumnsDeleteColumnRenamesReturning(BaseModel):
    id: Any


DeleteTransformationColumns.update_forward_refs()
DeleteTransformationColumnsDeleteColumnRenames.update_forward_refs()
DeleteTransformationColumnsDeleteColumnRenamesReturning.update_forward_refs()
