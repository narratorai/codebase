from typing import Any, List

from .base_model import BaseModel


class GetAllCategories(BaseModel):
    company_categories: List["GetAllCategoriesCompanyCategories"]


class GetAllCategoriesCompanyCategories(BaseModel):
    id: Any
    category: str


GetAllCategories.update_forward_refs()
GetAllCategoriesCompanyCategories.update_forward_refs()
