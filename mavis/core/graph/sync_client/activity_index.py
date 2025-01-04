from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import maintenance_kinds_enum


class ActivityIndex(BaseModel):
    all_activities: List["ActivityIndexAllActivities"]


class ActivityIndexAllActivities(BaseModel):
    id: Any
    name: Optional[str]
    slug: str
    description: Optional[str]
    category: Optional[str]
    updated_at: Any
    table_id: Optional[Any]
    row_count: Optional[int]
    maintainer_id: Optional[Any]
    company_table: Optional["ActivityIndexAllActivitiesCompanyTable"]
    activity_maintenances: List["ActivityIndexAllActivitiesActivityMaintenances"]


class ActivityIndexAllActivitiesCompanyTable(BaseModel):
    activity_stream: str
    maintainer_id: Optional[Any]


class ActivityIndexAllActivitiesActivityMaintenances(BaseModel):
    id: Any
    kind: maintenance_kinds_enum


ActivityIndex.update_forward_refs()
ActivityIndexAllActivities.update_forward_refs()
ActivityIndexAllActivitiesCompanyTable.update_forward_refs()
ActivityIndexAllActivitiesActivityMaintenances.update_forward_refs()
