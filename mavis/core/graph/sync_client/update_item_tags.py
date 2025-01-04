from typing import Optional

from .base_model import BaseModel


class UpdateItemTags(BaseModel):
    delete_tag: Optional["UpdateItemTagsDeleteTag"]
    insert_tag: Optional["UpdateItemTagsInsertTag"]


class UpdateItemTagsDeleteTag(BaseModel):
    affected_rows: int


class UpdateItemTagsInsertTag(BaseModel):
    affected_rows: int


UpdateItemTags.update_forward_refs()
UpdateItemTagsDeleteTag.update_forward_refs()
UpdateItemTagsInsertTag.update_forward_refs()
