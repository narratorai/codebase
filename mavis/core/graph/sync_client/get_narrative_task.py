from typing import Any, Optional

from .base_model import BaseModel


class GetNarrativeTask(BaseModel):
    narrative_by_pk: Optional["GetNarrativeTaskNarrativeByPk"]


class GetNarrativeTaskNarrativeByPk(BaseModel):
    id: Any
    name: str
    slug: str
    company_task: Optional["GetNarrativeTaskNarrativeByPkCompanyTask"]


class GetNarrativeTaskNarrativeByPkCompanyTask(BaseModel):
    id: Any
    label: Optional[str]
    schedule: str


GetNarrativeTask.update_forward_refs()
GetNarrativeTaskNarrativeByPk.update_forward_refs()
GetNarrativeTaskNarrativeByPkCompanyTask.update_forward_refs()
