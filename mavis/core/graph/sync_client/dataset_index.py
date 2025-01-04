from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import status_enum


class DatasetIndex(BaseModel):
    dataset: List["DatasetIndexDataset"]


class DatasetIndexDataset(BaseModel):
    created_by: Optional[Any]
    description: Optional[str]
    name: str
    slug: str
    status: status_enum
    category: Optional[str]
    updated_at: Any
    metric_id: Optional[Any]
    id: Any
    tags: List["DatasetIndexDatasetTags"]


class DatasetIndexDatasetTags(BaseModel):
    tag_id: Optional[Any]
    updated_at: Optional[Any]


DatasetIndex.update_forward_refs()
DatasetIndexDataset.update_forward_refs()
DatasetIndexDatasetTags.update_forward_refs()
