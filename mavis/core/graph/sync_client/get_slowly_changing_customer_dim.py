from typing import Any, List

from .base_model import BaseModel


class GetSlowlyChangingCustomerDim(BaseModel):
    slowly_changing_customer_dims: List["GetSlowlyChangingCustomerDimSlowlyChangingCustomerDims"]


class GetSlowlyChangingCustomerDimSlowlyChangingCustomerDims(BaseModel):
    dim_table_id: Any
    id: Any
    slowly_changing_ts_column: str


GetSlowlyChangingCustomerDim.update_forward_refs()
GetSlowlyChangingCustomerDimSlowlyChangingCustomerDims.update_forward_refs()
