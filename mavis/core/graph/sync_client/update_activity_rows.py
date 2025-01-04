from typing import Any, Optional

from .base_model import BaseModel


class UpdateActivityRows(BaseModel):
    update_activity_by_pk: Optional["UpdateActivityRowsUpdateActivityByPk"]


class UpdateActivityRowsUpdateActivityByPk(BaseModel):
    id: Any


UpdateActivityRows.update_forward_refs()
UpdateActivityRowsUpdateActivityByPk.update_forward_refs()
