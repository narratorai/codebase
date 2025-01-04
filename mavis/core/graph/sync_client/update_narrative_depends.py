from typing import Any, List, Optional

from .base_model import BaseModel


class UpdateNarrativeDepends(BaseModel):
    delete_narrative_narratives: Optional["UpdateNarrativeDependsDeleteNarrativeNarratives"]
    insert_narrative_narratives: Optional["UpdateNarrativeDependsInsertNarrativeNarratives"]


class UpdateNarrativeDependsDeleteNarrativeNarratives(BaseModel):
    returning: List["UpdateNarrativeDependsDeleteNarrativeNarrativesReturning"]


class UpdateNarrativeDependsDeleteNarrativeNarrativesReturning(BaseModel):
    id: Any


class UpdateNarrativeDependsInsertNarrativeNarratives(BaseModel):
    returning: List["UpdateNarrativeDependsInsertNarrativeNarrativesReturning"]


class UpdateNarrativeDependsInsertNarrativeNarrativesReturning(BaseModel):
    id: Any


UpdateNarrativeDepends.update_forward_refs()
UpdateNarrativeDependsDeleteNarrativeNarratives.update_forward_refs()
UpdateNarrativeDependsDeleteNarrativeNarrativesReturning.update_forward_refs()
UpdateNarrativeDependsInsertNarrativeNarratives.update_forward_refs()
UpdateNarrativeDependsInsertNarrativeNarrativesReturning.update_forward_refs()
