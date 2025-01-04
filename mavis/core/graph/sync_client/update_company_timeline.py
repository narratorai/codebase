from typing import Any, Optional

from .base_model import BaseModel


class UpdateCompanyTimeline(BaseModel):
    update_company_timeline_by_pk: Optional["UpdateCompanyTimelineUpdateCompanyTimelineByPk"]


class UpdateCompanyTimelineUpdateCompanyTimelineByPk(BaseModel):
    id: Any


UpdateCompanyTimeline.update_forward_refs()
UpdateCompanyTimelineUpdateCompanyTimelineByPk.update_forward_refs()
