from typing import Any, List, Optional

from .base_model import BaseModel


class GetActivitiesBySlugs(BaseModel):
    activities: List["GetActivitiesBySlugsActivities"]


class GetActivitiesBySlugsActivities(BaseModel):
    id: Any
    slug: str
    name: Optional[str]
    description: Optional[str]
    table_id: Optional[Any]
    row_count: Optional[int]


GetActivitiesBySlugs.update_forward_refs()
GetActivitiesBySlugsActivities.update_forward_refs()
