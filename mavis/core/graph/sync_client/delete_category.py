from typing import Any, Optional

from .base_model import BaseModel


class DeleteCategory(BaseModel):
    delete_company_categories_by_pk: Optional["DeleteCategoryDeleteCompanyCategoriesByPk"]


class DeleteCategoryDeleteCompanyCategoriesByPk(BaseModel):
    id: Any


DeleteCategory.update_forward_refs()
DeleteCategoryDeleteCompanyCategoriesByPk.update_forward_refs()
