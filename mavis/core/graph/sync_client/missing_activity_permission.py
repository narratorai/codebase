from typing import Any, List, Optional

from .base_model import BaseModel


class MissingActivityPermission(BaseModel):
    activity: List["MissingActivityPermissionActivity"]


class MissingActivityPermissionActivity(BaseModel):
    id: Any
    name: Optional[str]


MissingActivityPermission.update_forward_refs()
MissingActivityPermissionActivity.update_forward_refs()
