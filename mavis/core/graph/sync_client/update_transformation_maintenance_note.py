from typing import Any, Optional

from .base_model import BaseModel
from .enums import maintenance_kinds_enum


class UpdateTransformationMaintenanceNote(BaseModel):
    update_transformation_maintenance_by_pk: Optional[
        "UpdateTransformationMaintenanceNoteUpdateTransformationMaintenanceByPk"
    ]


class UpdateTransformationMaintenanceNoteUpdateTransformationMaintenanceByPk(BaseModel):
    id: Any
    started_at: Any
    ended_at: Optional[Any]
    notes: Optional[str]
    kind: maintenance_kinds_enum


UpdateTransformationMaintenanceNote.update_forward_refs()
UpdateTransformationMaintenanceNoteUpdateTransformationMaintenanceByPk.update_forward_refs()
