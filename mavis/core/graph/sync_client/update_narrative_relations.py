from typing import Any, List, Optional

from .base_model import BaseModel


class UpdateNarrativeRelations(BaseModel):
    delete_narrative_datasets: Optional["UpdateNarrativeRelationsDeleteNarrativeDatasets"]
    insert_narrative_datasets: Optional["UpdateNarrativeRelationsInsertNarrativeDatasets"]


class UpdateNarrativeRelationsDeleteNarrativeDatasets(BaseModel):
    returning: List["UpdateNarrativeRelationsDeleteNarrativeDatasetsReturning"]


class UpdateNarrativeRelationsDeleteNarrativeDatasetsReturning(BaseModel):
    id: Any


class UpdateNarrativeRelationsInsertNarrativeDatasets(BaseModel):
    returning: List["UpdateNarrativeRelationsInsertNarrativeDatasetsReturning"]


class UpdateNarrativeRelationsInsertNarrativeDatasetsReturning(BaseModel):
    id: Any


UpdateNarrativeRelations.update_forward_refs()
UpdateNarrativeRelationsDeleteNarrativeDatasets.update_forward_refs()
UpdateNarrativeRelationsDeleteNarrativeDatasetsReturning.update_forward_refs()
UpdateNarrativeRelationsInsertNarrativeDatasets.update_forward_refs()
UpdateNarrativeRelationsInsertNarrativeDatasetsReturning.update_forward_refs()
