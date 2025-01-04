from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import company_timeline_relations_enum


class GetTimeline(BaseModel):
    company_timeline: List["GetTimelineCompanyTimeline"]


class GetTimelineCompanyTimeline(BaseModel):
    happened_at: Any
    id: Any
    name: str
    description: Optional[str]
    related_to: company_timeline_relations_enum
    related_to_id: Any


GetTimeline.update_forward_refs()
GetTimelineCompanyTimeline.update_forward_refs()
