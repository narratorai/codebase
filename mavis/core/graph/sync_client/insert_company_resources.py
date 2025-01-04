from typing import Any, Optional

from .base_model import BaseModel


class InsertCompanyResources(BaseModel):
    insert_company_resources_one: Optional["InsertCompanyResourcesInsertCompanyResourcesOne"]


class InsertCompanyResourcesInsertCompanyResourcesOne(BaseModel):
    id: Any


InsertCompanyResources.update_forward_refs()
InsertCompanyResourcesInsertCompanyResourcesOne.update_forward_refs()
