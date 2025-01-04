from typing import Any, Optional

from .base_model import BaseModel
from .enums import status_enum


class GetDatasetBasic(BaseModel):
    dataset_by_pk: Optional["GetDatasetBasicDatasetByPk"]


class GetDatasetBasicDatasetByPk(BaseModel):
    name: str
    description: Optional[str]
    status: status_enum
    slug: str
    created_by: Optional[Any]
    locked: Optional[bool]
    company_id: Any


GetDatasetBasic.update_forward_refs()
GetDatasetBasicDatasetByPk.update_forward_refs()
