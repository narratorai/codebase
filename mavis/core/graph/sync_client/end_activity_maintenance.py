from typing import Optional

from .base_model import BaseModel


class EndActivityMaintenance(BaseModel):
    update_activity_maintenance: Optional["EndActivityMaintenanceUpdateActivityMaintenance"]


class EndActivityMaintenanceUpdateActivityMaintenance(BaseModel):
    affected_rows: int


EndActivityMaintenance.update_forward_refs()
EndActivityMaintenanceUpdateActivityMaintenance.update_forward_refs()
