from typing import Any, Optional

from .base_model import BaseModel
from .enums import maintenance_kinds_enum


class InsertActivityMaintenance(BaseModel):
    insert_activity_maintenance_one: Optional["InsertActivityMaintenanceInsertActivityMaintenanceOne"]


class InsertActivityMaintenanceInsertActivityMaintenanceOne(BaseModel):
    activity_id: Optional[Any]
    id: Any
    kind: maintenance_kinds_enum
    notes: Optional[str]
    started_at: Any
    ended_at: Optional[Any]
    activity: Optional["InsertActivityMaintenanceInsertActivityMaintenanceOneActivity"]
    maintenance_kind: "InsertActivityMaintenanceInsertActivityMaintenanceOneMaintenanceKind"


class InsertActivityMaintenanceInsertActivityMaintenanceOneActivity(BaseModel):
    name: Optional[str]
    table_id: Optional[Any]


class InsertActivityMaintenanceInsertActivityMaintenanceOneMaintenanceKind(BaseModel):
    description: Optional[str]


InsertActivityMaintenance.update_forward_refs()
InsertActivityMaintenanceInsertActivityMaintenanceOne.update_forward_refs()
InsertActivityMaintenanceInsertActivityMaintenanceOneActivity.update_forward_refs()
InsertActivityMaintenanceInsertActivityMaintenanceOneMaintenanceKind.update_forward_refs()
