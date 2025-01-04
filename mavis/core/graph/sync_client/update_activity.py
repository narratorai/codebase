from typing import Any, List, Optional

from .base_model import BaseModel


class UpdateActivity(BaseModel):
    update_activity: Optional["UpdateActivityUpdateActivity"]


class UpdateActivityUpdateActivity(BaseModel):
    returning: List["UpdateActivityUpdateActivityReturning"]


class UpdateActivityUpdateActivityReturning(BaseModel):
    id: Any


UpdateActivity.update_forward_refs()
UpdateActivityUpdateActivity.update_forward_refs()
UpdateActivityUpdateActivityReturning.update_forward_refs()
