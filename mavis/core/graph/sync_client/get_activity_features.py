from typing import Any, List, Optional

from .base_model import BaseModel


class GetActivityFeatures(BaseModel):
    all_activities: List["GetActivityFeaturesAllActivities"]


class GetActivityFeaturesAllActivities(BaseModel):
    column_renames: List["GetActivityFeaturesAllActivitiesColumnRenames"]
    slug: str
    name: Optional[str]
    description: Optional[str]
    transformations: List["GetActivityFeaturesAllActivitiesTransformations"]


class GetActivityFeaturesAllActivitiesColumnRenames(BaseModel):
    id: Optional[Any]
    label: Optional[str]
    type: Optional[str]
    name: Optional[str]
    has_data: Optional[bool]


class GetActivityFeaturesAllActivitiesTransformations(BaseModel):
    transformation_id: Any


GetActivityFeatures.update_forward_refs()
GetActivityFeaturesAllActivities.update_forward_refs()
GetActivityFeaturesAllActivitiesColumnRenames.update_forward_refs()
GetActivityFeaturesAllActivitiesTransformations.update_forward_refs()
