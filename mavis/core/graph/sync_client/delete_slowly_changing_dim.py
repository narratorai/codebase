from typing import Any, Optional

from .base_model import BaseModel


class DeleteSlowlyChangingDim(BaseModel):
    delete_slowly_changing_customer_dims_by_pk: Optional["DeleteSlowlyChangingDimDeleteSlowlyChangingCustomerDimsByPk"]


class DeleteSlowlyChangingDimDeleteSlowlyChangingCustomerDimsByPk(BaseModel):
    id: Any


DeleteSlowlyChangingDim.update_forward_refs()
DeleteSlowlyChangingDimDeleteSlowlyChangingCustomerDimsByPk.update_forward_refs()
