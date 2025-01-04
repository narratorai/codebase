from typing import Any, List

from .base_model import BaseModel


class GetAllActiveTransformationMaintenance(BaseModel):
    transformation_maintenance: List["GetAllActiveTransformationMaintenanceTransformationMaintenance"]


class GetAllActiveTransformationMaintenanceTransformationMaintenance(BaseModel):
    id: Any
    transformation_id: Any


GetAllActiveTransformationMaintenance.update_forward_refs()
GetAllActiveTransformationMaintenanceTransformationMaintenance.update_forward_refs()
