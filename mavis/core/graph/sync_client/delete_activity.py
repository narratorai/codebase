from typing import Any, List, Optional

from .base_model import BaseModel


class DeleteActivity(BaseModel):
    delete_activity_by_pk: Optional["DeleteActivityDeleteActivityByPk"]
    update_dataset: Optional["DeleteActivityUpdateDataset"]
    update_narrative: Optional["DeleteActivityUpdateNarrative"]


class DeleteActivityDeleteActivityByPk(BaseModel):
    id: Any
    table_id: Optional[Any]
    slug: str


class DeleteActivityUpdateDataset(BaseModel):
    returning: List["DeleteActivityUpdateDatasetReturning"]


class DeleteActivityUpdateDatasetReturning(BaseModel):
    id: Any


class DeleteActivityUpdateNarrative(BaseModel):
    returning: List["DeleteActivityUpdateNarrativeReturning"]


class DeleteActivityUpdateNarrativeReturning(BaseModel):
    id: Any


DeleteActivity.update_forward_refs()
DeleteActivityDeleteActivityByPk.update_forward_refs()
DeleteActivityUpdateDataset.update_forward_refs()
DeleteActivityUpdateDatasetReturning.update_forward_refs()
DeleteActivityUpdateNarrative.update_forward_refs()
DeleteActivityUpdateNarrativeReturning.update_forward_refs()
