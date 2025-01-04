from typing import Any, List, Optional

from .base_model import BaseModel


class DeleteDatasetNarrative(BaseModel):
    delete_dataset: Optional["DeleteDatasetNarrativeDeleteDataset"]
    delete_narrative: Optional["DeleteDatasetNarrativeDeleteNarrative"]


class DeleteDatasetNarrativeDeleteDataset(BaseModel):
    returning: List["DeleteDatasetNarrativeDeleteDatasetReturning"]


class DeleteDatasetNarrativeDeleteDatasetReturning(BaseModel):
    id: Any


class DeleteDatasetNarrativeDeleteNarrative(BaseModel):
    returning: List["DeleteDatasetNarrativeDeleteNarrativeReturning"]


class DeleteDatasetNarrativeDeleteNarrativeReturning(BaseModel):
    id: Any


DeleteDatasetNarrative.update_forward_refs()
DeleteDatasetNarrativeDeleteDataset.update_forward_refs()
DeleteDatasetNarrativeDeleteDatasetReturning.update_forward_refs()
DeleteDatasetNarrativeDeleteNarrative.update_forward_refs()
DeleteDatasetNarrativeDeleteNarrativeReturning.update_forward_refs()
