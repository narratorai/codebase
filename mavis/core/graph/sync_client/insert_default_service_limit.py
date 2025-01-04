from typing import Any, Optional

from .base_model import BaseModel


class InsertDefaultServiceLimit(BaseModel):
    insert_service_limit_one: Optional["InsertDefaultServiceLimitInsertServiceLimitOne"]


class InsertDefaultServiceLimitInsertServiceLimitOne(BaseModel):
    id: Any
    transformation_limit: Optional[int]
    row_limit: Optional[Any]
    narrative_limit: Optional[int]
    materialization_limit: Optional[int]
    dataset_limit: Optional[int]
    activity_stream_limit: Optional[int]
    activity_limit: Optional[int]
    name: Optional[str]
    monthly_price: Optional[Any]
    disable_on: Optional[Any]


InsertDefaultServiceLimit.update_forward_refs()
InsertDefaultServiceLimitInsertServiceLimitOne.update_forward_refs()
