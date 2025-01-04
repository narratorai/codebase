from typing import Any, Optional

from .base_model import BaseModel


class GetActivitySimple(BaseModel):
    activity_by_pk: Optional["GetActivitySimpleActivityByPk"]


class GetActivitySimpleActivityByPk(BaseModel):
    id: Any
    name: Optional[str]
    slug: str
    category: Optional[str]
    created_at: Any
    updated_by: Optional[str]
    updated_at: Any
    table_id: Optional[Any]
    description: Optional[str]
    row_count: Optional[int]
    maintainer_id: Optional[Any]


GetActivitySimple.update_forward_refs()
GetActivitySimpleActivityByPk.update_forward_refs()
