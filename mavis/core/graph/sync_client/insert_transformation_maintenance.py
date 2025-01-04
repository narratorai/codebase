from typing import Any, Optional

from .base_model import BaseModel
from .enums import maintenance_kinds_enum


class InsertTransformationMaintenance(BaseModel):
    insert_transformation_maintenance_one: Optional["InsertTransformationMaintenanceInsertTransformationMaintenanceOne"]


class InsertTransformationMaintenanceInsertTransformationMaintenanceOne(BaseModel):
    transformation_id: Any
    id: Any
    kind: maintenance_kinds_enum
    notes: Optional[str]
    started_at: Any
    ended_at: Optional[Any]
    transformation: "InsertTransformationMaintenanceInsertTransformationMaintenanceOneTransformation"


class InsertTransformationMaintenanceInsertTransformationMaintenanceOneTransformation(BaseModel):
    table: Optional[str]
    name: Optional[str]


InsertTransformationMaintenance.update_forward_refs()
InsertTransformationMaintenanceInsertTransformationMaintenanceOne.update_forward_refs()
InsertTransformationMaintenanceInsertTransformationMaintenanceOneTransformation.update_forward_refs()
