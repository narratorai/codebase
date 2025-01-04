from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import maintenance_kinds_enum


class GetActiveTransformationMaintenance(BaseModel):
    transformation_maintenance: List["GetActiveTransformationMaintenanceTransformationMaintenance"]


class GetActiveTransformationMaintenanceTransformationMaintenance(BaseModel):
    id: Any
    kind: maintenance_kinds_enum
    notes: Optional[str]
    started_at: Any
    ended_at: Optional[Any]
    transformation_id: Any


GetActiveTransformationMaintenance.update_forward_refs()
GetActiveTransformationMaintenanceTransformationMaintenance.update_forward_refs()
