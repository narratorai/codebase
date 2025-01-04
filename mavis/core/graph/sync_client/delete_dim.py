from typing import Any, Optional

from .base_model import BaseModel


class DeleteDim(BaseModel):
    delete_dim_table_by_pk: Optional["DeleteDimDeleteDimTableByPk"]


class DeleteDimDeleteDimTableByPk(BaseModel):
    id: Any


DeleteDim.update_forward_refs()
DeleteDimDeleteDimTableByPk.update_forward_refs()
