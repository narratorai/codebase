from typing import Any, Optional

from .base_model import BaseModel


class UpdateDatasetstatus(BaseModel):
    update_dataset_by_pk: Optional["UpdateDatasetstatusUpdateDatasetByPk"]


class UpdateDatasetstatusUpdateDatasetByPk(BaseModel):
    id: Any


UpdateDatasetstatus.update_forward_refs()
UpdateDatasetstatusUpdateDatasetByPk.update_forward_refs()
