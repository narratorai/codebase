from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import maintenance_kinds_enum


class GetDatasetMaintenance(BaseModel):
    activity_maintenance: List["GetDatasetMaintenanceActivityMaintenance"]


class GetDatasetMaintenanceActivityMaintenance(BaseModel):
    id: Any
    kind: maintenance_kinds_enum
    notes: Optional[str]
    started_at: Any
    ended_at: Optional[Any]
    activity_id: Optional[Any]
    dim_table: Optional["GetDatasetMaintenanceActivityMaintenanceDimTable"]
    maintenance_kind: "GetDatasetMaintenanceActivityMaintenanceMaintenanceKind"


class GetDatasetMaintenanceActivityMaintenanceDimTable(BaseModel):
    schema_: Optional[str]
    table: str


class GetDatasetMaintenanceActivityMaintenanceMaintenanceKind(BaseModel):
    description: Optional[str]


GetDatasetMaintenance.update_forward_refs()
GetDatasetMaintenanceActivityMaintenance.update_forward_refs()
GetDatasetMaintenanceActivityMaintenanceDimTable.update_forward_refs()
GetDatasetMaintenanceActivityMaintenanceMaintenanceKind.update_forward_refs()
