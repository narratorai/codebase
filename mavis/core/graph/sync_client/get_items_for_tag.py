from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import narrative_types_enum


class GetItemsForTag(BaseModel):
    company_tags_by_pk: Optional["GetItemsForTagCompanyTagsByPk"]


class GetItemsForTagCompanyTagsByPk(BaseModel):
    tagged_items: List["GetItemsForTagCompanyTagsByPkTaggedItems"]


class GetItemsForTagCompanyTagsByPkTaggedItems(BaseModel):
    activity: Optional["GetItemsForTagCompanyTagsByPkTaggedItemsActivity"]
    dataset: Optional["GetItemsForTagCompanyTagsByPkTaggedItemsDataset"]
    narrative: Optional["GetItemsForTagCompanyTagsByPkTaggedItemsNarrative"]


class GetItemsForTagCompanyTagsByPkTaggedItemsActivity(BaseModel):
    id: Any
    name: Optional[str]
    table_id: Optional[Any]


class GetItemsForTagCompanyTagsByPkTaggedItemsDataset(BaseModel):
    id: Any
    name: str


class GetItemsForTagCompanyTagsByPkTaggedItemsNarrative(BaseModel):
    id: Any
    name: str
    type: Optional[narrative_types_enum]


GetItemsForTag.update_forward_refs()
GetItemsForTagCompanyTagsByPk.update_forward_refs()
GetItemsForTagCompanyTagsByPkTaggedItems.update_forward_refs()
GetItemsForTagCompanyTagsByPkTaggedItemsActivity.update_forward_refs()
GetItemsForTagCompanyTagsByPkTaggedItemsDataset.update_forward_refs()
GetItemsForTagCompanyTagsByPkTaggedItemsNarrative.update_forward_refs()
