from typing import Any, Optional

from .base_model import BaseModel


class DeleteCompanyResource(BaseModel):
    delete_company_resources_by_pk: Optional["DeleteCompanyResourceDeleteCompanyResourcesByPk"]


class DeleteCompanyResourceDeleteCompanyResourcesByPk(BaseModel):
    id: Any


DeleteCompanyResource.update_forward_refs()
DeleteCompanyResourceDeleteCompanyResourcesByPk.update_forward_refs()
