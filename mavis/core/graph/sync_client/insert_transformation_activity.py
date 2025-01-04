from typing import List, Optional

from .base_model import BaseModel


class InsertTransformationActivity(BaseModel):
    insert_transformation_activities: Optional["InsertTransformationActivityInsertTransformationActivities"]


class InsertTransformationActivityInsertTransformationActivities(BaseModel):
    returning: List["InsertTransformationActivityInsertTransformationActivitiesReturning"]


class InsertTransformationActivityInsertTransformationActivitiesReturning(BaseModel):
    id: int


InsertTransformationActivity.update_forward_refs()
InsertTransformationActivityInsertTransformationActivities.update_forward_refs()
InsertTransformationActivityInsertTransformationActivitiesReturning.update_forward_refs()
