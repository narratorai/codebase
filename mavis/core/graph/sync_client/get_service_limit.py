from typing import Any, List, Optional

from .base_model import BaseModel


class GetServiceLimit(BaseModel):
    service_limit: List["GetServiceLimitServiceLimit"]


class GetServiceLimitServiceLimit(BaseModel):
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


GetServiceLimit.update_forward_refs()
GetServiceLimitServiceLimit.update_forward_refs()
