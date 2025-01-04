from typing import Any, List, Optional

from .base_model import BaseModel


class InsertServiceLimit(BaseModel):
    update_service_limit: Optional["InsertServiceLimitUpdateServiceLimit"]
    insert_service_limit_one: Optional["InsertServiceLimitInsertServiceLimitOne"]


class InsertServiceLimitUpdateServiceLimit(BaseModel):
    returning: List["InsertServiceLimitUpdateServiceLimitReturning"]


class InsertServiceLimitUpdateServiceLimitReturning(BaseModel):
    company_id: Any


class InsertServiceLimitInsertServiceLimitOne(BaseModel):
    id: Any


InsertServiceLimit.update_forward_refs()
InsertServiceLimitUpdateServiceLimit.update_forward_refs()
InsertServiceLimitUpdateServiceLimitReturning.update_forward_refs()
InsertServiceLimitInsertServiceLimitOne.update_forward_refs()
