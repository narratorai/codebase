from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import transformation_kinds_enum, transformation_update_types_enum


class GetTransformationsForActivity(BaseModel):
    transformation_activities: List["GetTransformationsForActivityTransformationActivities"]


class GetTransformationsForActivityTransformationActivities(BaseModel):
    activity_id: Any
    transformation: "GetTransformationsForActivityTransformationActivitiesTransformation"


class GetTransformationsForActivityTransformationActivitiesTransformation(BaseModel):
    id: Any
    slug: str
    name: Optional[str]
    kind: Optional[transformation_kinds_enum]
    task_id: Optional[Any]
    update_type: Optional[transformation_update_types_enum]
    production_queries: List["GetTransformationsForActivityTransformationActivitiesTransformationProductionQueries"]
    column_renames: List["GetTransformationsForActivityTransformationActivitiesTransformationColumnRenames"]


class GetTransformationsForActivityTransformationActivitiesTransformationProductionQueries(BaseModel):
    sql: Optional[str]
    updated_by: Optional[str]


class GetTransformationsForActivityTransformationActivitiesTransformationColumnRenames(BaseModel):
    type: Optional[str]
    label: Optional[str]
    name: Optional[str]
    casting: Optional[str]
    has_data: Optional[bool]


GetTransformationsForActivity.update_forward_refs()
GetTransformationsForActivityTransformationActivities.update_forward_refs()
GetTransformationsForActivityTransformationActivitiesTransformation.update_forward_refs()
GetTransformationsForActivityTransformationActivitiesTransformationProductionQueries.update_forward_refs()
GetTransformationsForActivityTransformationActivitiesTransformationColumnRenames.update_forward_refs()
