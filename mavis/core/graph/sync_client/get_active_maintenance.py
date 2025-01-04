from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import maintenance_kinds_enum


class GetActiveMaintenance(BaseModel):
    activity_maintenance: List["GetActiveMaintenanceActivityMaintenance"]


class GetActiveMaintenanceActivityMaintenance(BaseModel):
    id: Any
    kind: maintenance_kinds_enum
    notes: Optional[str]
    started_at: Any
    ended_at: Optional[Any]
    activity_id: Optional[Any]
    maintenance_kind: "GetActiveMaintenanceActivityMaintenanceMaintenanceKind"


class GetActiveMaintenanceActivityMaintenanceMaintenanceKind(BaseModel):
    description: Optional[str]


GetActiveMaintenance.update_forward_refs()
GetActiveMaintenanceActivityMaintenance.update_forward_refs()
GetActiveMaintenanceActivityMaintenanceMaintenanceKind.update_forward_refs()
