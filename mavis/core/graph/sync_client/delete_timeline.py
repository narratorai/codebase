from typing import Any, Optional

from .base_model import BaseModel


class DeleteTimeline(BaseModel):
    delete_company_timeline_by_pk: Optional["DeleteTimelineDeleteCompanyTimelineByPk"]


class DeleteTimelineDeleteCompanyTimelineByPk(BaseModel):
    id: Any


DeleteTimeline.update_forward_refs()
DeleteTimelineDeleteCompanyTimelineByPk.update_forward_refs()
