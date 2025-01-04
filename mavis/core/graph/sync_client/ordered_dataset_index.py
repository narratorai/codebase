from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import status_enum


class OrderedDatasetIndex(BaseModel):
    dataset: List["OrderedDatasetIndexDataset"]


class OrderedDatasetIndexDataset(BaseModel):
    created_by: Optional[Any]
    description: Optional[str]
    name: str
    slug: str
    status: status_enum
    category: Optional[str]
    updated_at: Any
    metric_id: Optional[Any]
    id: Any
    tags: List["OrderedDatasetIndexDatasetTags"]


class OrderedDatasetIndexDatasetTags(BaseModel):
    tag_id: Optional[Any]
    updated_at: Optional[Any]


OrderedDatasetIndex.update_forward_refs()
OrderedDatasetIndexDataset.update_forward_refs()
OrderedDatasetIndexDatasetTags.update_forward_refs()
