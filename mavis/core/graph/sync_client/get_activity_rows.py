from typing import Optional

from .base_model import BaseModel


class GetActivityRows(BaseModel):
    activity_by_pk: Optional["GetActivityRowsActivityByPk"]


class GetActivityRowsActivityByPk(BaseModel):
    row_count: Optional[int]
    name: Optional[str]


GetActivityRows.update_forward_refs()
GetActivityRowsActivityByPk.update_forward_refs()
