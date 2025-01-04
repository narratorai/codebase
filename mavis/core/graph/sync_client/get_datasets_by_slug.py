from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import status_enum


class GetDatasetsBySlug(BaseModel):
    dataset: List["GetDatasetsBySlugDataset"]


class GetDatasetsBySlugDataset(BaseModel):
    id: Any
    name: str
    slug: str
    description: Optional[str]
    status: status_enum


GetDatasetsBySlug.update_forward_refs()
GetDatasetsBySlugDataset.update_forward_refs()
