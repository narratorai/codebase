from typing import Optional

from .base_model import BaseModel


class EndTransformationMaintenance(BaseModel):
    update_transformation_maintenance: Optional["EndTransformationMaintenanceUpdateTransformationMaintenance"]


class EndTransformationMaintenanceUpdateTransformationMaintenance(BaseModel):
    affected_rows: int


EndTransformationMaintenance.update_forward_refs()
EndTransformationMaintenanceUpdateTransformationMaintenance.update_forward_refs()
