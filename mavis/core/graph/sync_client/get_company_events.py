from typing import Any, List, Optional

from .base_model import BaseModel


class GetCompanyEvents(BaseModel):
    company_timeline: List["GetCompanyEventsCompanyTimeline"]


class GetCompanyEventsCompanyTimeline(BaseModel):
    name: str
    id: Any
    happened_at: Any
    description: Optional[str]
    updated_at: Any


GetCompanyEvents.update_forward_refs()
GetCompanyEventsCompanyTimeline.update_forward_refs()
