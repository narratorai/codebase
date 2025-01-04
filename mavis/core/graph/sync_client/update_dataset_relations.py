from typing import Any, Optional

from .base_model import BaseModel


class UpdateDatasetRelations(BaseModel):
    delete_dataset_activities: Optional["UpdateDatasetRelationsDeleteDatasetActivities"]
    insert_dataset_activities: Optional["UpdateDatasetRelationsInsertDatasetActivities"]
    update_dataset_by_pk: Optional["UpdateDatasetRelationsUpdateDatasetByPk"]


class UpdateDatasetRelationsDeleteDatasetActivities(BaseModel):
    affected_rows: int


class UpdateDatasetRelationsInsertDatasetActivities(BaseModel):
    affected_rows: int


class UpdateDatasetRelationsUpdateDatasetByPk(BaseModel):
    id: Any


UpdateDatasetRelations.update_forward_refs()
UpdateDatasetRelationsDeleteDatasetActivities.update_forward_refs()
UpdateDatasetRelationsInsertDatasetActivities.update_forward_refs()
UpdateDatasetRelationsUpdateDatasetByPk.update_forward_refs()
