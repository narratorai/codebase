from typing import Any, List, Optional

from .base_model import BaseModel


class GetAllActiveActivityMaintenance(BaseModel):
    activity_maintenance: List["GetAllActiveActivityMaintenanceActivityMaintenance"]


class GetAllActiveActivityMaintenanceActivityMaintenance(BaseModel):
    id: Any
    activity_id: Optional[Any]


GetAllActiveActivityMaintenance.update_forward_refs()
GetAllActiveActivityMaintenanceActivityMaintenance.update_forward_refs()
