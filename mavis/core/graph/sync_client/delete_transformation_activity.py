from typing import List, Optional

from .base_model import BaseModel


class DeleteTransformationActivity(BaseModel):
    delete_transformation_activities: Optional["DeleteTransformationActivityDeleteTransformationActivities"]


class DeleteTransformationActivityDeleteTransformationActivities(BaseModel):
    returning: List["DeleteTransformationActivityDeleteTransformationActivitiesReturning"]


class DeleteTransformationActivityDeleteTransformationActivitiesReturning(BaseModel):
    id: int


DeleteTransformationActivity.update_forward_refs()
DeleteTransformationActivityDeleteTransformationActivities.update_forward_refs()
DeleteTransformationActivityDeleteTransformationActivitiesReturning.update_forward_refs()
