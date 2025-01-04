from typing import Any, Optional

from .base_model import BaseModel


class UpdateTransformationColumnCasting(BaseModel):
    update_column_renames_by_pk: Optional["UpdateTransformationColumnCastingUpdateColumnRenamesByPk"]


class UpdateTransformationColumnCastingUpdateColumnRenamesByPk(BaseModel):
    id: Any


UpdateTransformationColumnCasting.update_forward_refs()
UpdateTransformationColumnCastingUpdateColumnRenamesByPk.update_forward_refs()
