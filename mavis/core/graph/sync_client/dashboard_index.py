from typing import Any, List

from .base_model import BaseModel
from .enums import status_enum


class DashboardIndex(BaseModel):
    narrative: List["DashboardIndexNarrative"]


class DashboardIndexNarrative(BaseModel):
    id: Any
    slug: str
    name: str
    state: status_enum


DashboardIndex.update_forward_refs()
DashboardIndexNarrative.update_forward_refs()
