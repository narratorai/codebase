from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import maintenance_kinds_enum


class GetDimMaintenance(BaseModel):
    activity_maintenance: List["GetDimMaintenanceActivityMaintenance"]


class GetDimMaintenanceActivityMaintenance(BaseModel):
    id: Any
    kind: maintenance_kinds_enum
    notes: Optional[str]
    started_at: Any
    ended_at: Optional[Any]
    activity_id: Optional[Any]
    maintenance_kind: "GetDimMaintenanceActivityMaintenanceMaintenanceKind"


class GetDimMaintenanceActivityMaintenanceMaintenanceKind(BaseModel):
    description: Optional[str]


GetDimMaintenance.update_forward_refs()
GetDimMaintenanceActivityMaintenance.update_forward_refs()
GetDimMaintenanceActivityMaintenanceMaintenanceKind.update_forward_refs()
