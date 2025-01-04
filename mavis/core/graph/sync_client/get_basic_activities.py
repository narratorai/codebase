from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import activity_status_enum


class GetBasicActivities(BaseModel):
    activities: List["GetBasicActivitiesActivities"]


class GetBasicActivitiesActivities(BaseModel):
    id: Any
    slug: str
    name: Optional[str]
    description: Optional[str]
    status: activity_status_enum


GetBasicActivities.update_forward_refs()
GetBasicActivitiesActivities.update_forward_refs()
