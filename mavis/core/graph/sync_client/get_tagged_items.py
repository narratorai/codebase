from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import tag_relations_enum


class GetTaggedItems(BaseModel):
    tag: List["GetTaggedItemsTag"]


class GetTaggedItemsTag(BaseModel):
    related_id: Any
    related_to: tag_relations_enum
    tag_id: Any
    updated_at: Optional[Any]
    id: Any


GetTaggedItems.update_forward_refs()
GetTaggedItemsTag.update_forward_refs()
