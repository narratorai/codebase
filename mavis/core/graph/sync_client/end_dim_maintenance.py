from typing import Optional

from .base_model import BaseModel


class EndDimMaintenance(BaseModel):
    update_activity_maintenance: Optional["EndDimMaintenanceUpdateActivityMaintenance"]


class EndDimMaintenanceUpdateActivityMaintenance(BaseModel):
    affected_rows: int


EndDimMaintenance.update_forward_refs()
EndDimMaintenanceUpdateActivityMaintenance.update_forward_refs()
