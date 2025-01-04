from typing import Any, Optional

from .base_model import BaseModel


class DeleteTaggedItem(BaseModel):
    delete_tag_by_pk: Optional["DeleteTaggedItemDeleteTagByPk"]


class DeleteTaggedItemDeleteTagByPk(BaseModel):
    id: Any


DeleteTaggedItem.update_forward_refs()
DeleteTaggedItemDeleteTagByPk.update_forward_refs()
