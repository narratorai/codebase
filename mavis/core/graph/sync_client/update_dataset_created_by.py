from typing import Any, Optional

from .base_model import BaseModel


class UpdateDatasetCreatedBy(BaseModel):
    update_dataset_by_pk: Optional["UpdateDatasetCreatedByUpdateDatasetByPk"]


class UpdateDatasetCreatedByUpdateDatasetByPk(BaseModel):
    id: Any


UpdateDatasetCreatedBy.update_forward_refs()
UpdateDatasetCreatedByUpdateDatasetByPk.update_forward_refs()
