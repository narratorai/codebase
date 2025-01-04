from typing import Any, List, Optional

from .base_model import BaseModel


class InsertNarrative(BaseModel):
    insert_narrative_one: Optional["InsertNarrativeInsertNarrativeOne"]


class InsertNarrativeInsertNarrativeOne(BaseModel):
    id: Any
    narrative_datasets: List["InsertNarrativeInsertNarrativeOneNarrativeDatasets"]


class InsertNarrativeInsertNarrativeOneNarrativeDatasets(BaseModel):
    dataset_id: Any


InsertNarrative.update_forward_refs()
InsertNarrativeInsertNarrativeOne.update_forward_refs()
InsertNarrativeInsertNarrativeOneNarrativeDatasets.update_forward_refs()
