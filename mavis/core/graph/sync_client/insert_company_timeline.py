from typing import Any, Optional

from .base_model import BaseModel


class InsertCompanyTimeline(BaseModel):
    insert_company_timeline: Optional["InsertCompanyTimelineInsertCompanyTimeline"]


class InsertCompanyTimelineInsertCompanyTimeline(BaseModel):
    id: Any


InsertCompanyTimeline.update_forward_refs()
InsertCompanyTimelineInsertCompanyTimeline.update_forward_refs()
