from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import activity_status_enum, maintenance_kinds_enum


class GetAllActivitiesFull(BaseModel):
    all_activities: List["GetAllActivitiesFullAllActivities"]


class GetAllActivitiesFullAllActivities(BaseModel):
    category: Optional[str]
    description: Optional[str]
    id: Any
    name: Optional[str]
    slug: str
    status: activity_status_enum
    validated: bool
    next_index_at: Optional[Any]
    updated_at: Any
    company_table: Optional["GetAllActivitiesFullAllActivitiesCompanyTable"]
    activity_maintenances: List["GetAllActivitiesFullAllActivitiesActivityMaintenances"]
    column_renames: List["GetAllActivitiesFullAllActivitiesColumnRenames"]
    transformations: List["GetAllActivitiesFullAllActivitiesTransformations"]


class GetAllActivitiesFullAllActivitiesCompanyTable(BaseModel):
    activity_stream: str


class GetAllActivitiesFullAllActivitiesActivityMaintenances(BaseModel):
    started_at: Any
    notes: Optional[str]
    kind: maintenance_kinds_enum
    id: Any


class GetAllActivitiesFullAllActivitiesColumnRenames(BaseModel):
    id: Optional[Any]
    name: Optional[str]
    has_data: Optional[bool]


class GetAllActivitiesFullAllActivitiesTransformations(BaseModel):
    transformation: "GetAllActivitiesFullAllActivitiesTransformationsTransformation"


class GetAllActivitiesFullAllActivitiesTransformationsTransformation(BaseModel):
    id: Any
    name: Optional[str]
    slug: str


GetAllActivitiesFull.update_forward_refs()
GetAllActivitiesFullAllActivities.update_forward_refs()
GetAllActivitiesFullAllActivitiesCompanyTable.update_forward_refs()
GetAllActivitiesFullAllActivitiesActivityMaintenances.update_forward_refs()
GetAllActivitiesFullAllActivitiesColumnRenames.update_forward_refs()
GetAllActivitiesFullAllActivitiesTransformations.update_forward_refs()
GetAllActivitiesFullAllActivitiesTransformationsTransformation.update_forward_refs()
