from typing import Any, List, Optional

from .base_model import BaseModel


class DeleteTagItem(BaseModel):
    delete_tag: Optional["DeleteTagItemDeleteTag"]


class DeleteTagItemDeleteTag(BaseModel):
    returning: List["DeleteTagItemDeleteTagReturning"]


class DeleteTagItemDeleteTagReturning(BaseModel):
    id: Any


DeleteTagItem.update_forward_refs()
DeleteTagItemDeleteTag.update_forward_refs()
DeleteTagItemDeleteTagReturning.update_forward_refs()
