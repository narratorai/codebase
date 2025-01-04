from typing import Any, Optional

from .base_model import BaseModel


class InsertSlowlyChangingDim(BaseModel):
    insert_slowly_changing_customer_dims_one: Optional["InsertSlowlyChangingDimInsertSlowlyChangingCustomerDimsOne"]


class InsertSlowlyChangingDimInsertSlowlyChangingCustomerDimsOne(BaseModel):
    id: Any


InsertSlowlyChangingDim.update_forward_refs()
InsertSlowlyChangingDimInsertSlowlyChangingCustomerDimsOne.update_forward_refs()
