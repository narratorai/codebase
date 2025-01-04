from typing import Any, Optional

from .base_model import BaseModel
from .enums import narrative_types_enum


class GetNarrativeBasic(BaseModel):
    narrative_by_pk: Optional["GetNarrativeBasicNarrativeByPk"]


class GetNarrativeBasicNarrativeByPk(BaseModel):
    id: Any
    slug: str
    name: str
    description: Optional[str]
    type: Optional[narrative_types_enum]
    created_at: Any
    updated_at: Any
    created_by: Any
    company_id: Any


GetNarrativeBasic.update_forward_refs()
GetNarrativeBasicNarrativeByPk.update_forward_refs()
