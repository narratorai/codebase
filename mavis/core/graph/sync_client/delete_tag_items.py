from typing import Optional

from .base_model import BaseModel


class DeleteTagItems(BaseModel):
    delete_tag: Optional["DeleteTagItemsDeleteTag"]


class DeleteTagItemsDeleteTag(BaseModel):
    affected_rows: int


DeleteTagItems.update_forward_refs()
DeleteTagItemsDeleteTag.update_forward_refs()
