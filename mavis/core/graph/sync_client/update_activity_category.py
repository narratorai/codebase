from typing import Any, Optional

from .base_model import BaseModel


class UpdateActivityCategory(BaseModel):
    update_activity_by_pk: Optional["UpdateActivityCategoryUpdateActivityByPk"]


class UpdateActivityCategoryUpdateActivityByPk(BaseModel):
    id: Any


UpdateActivityCategory.update_forward_refs()
UpdateActivityCategoryUpdateActivityByPk.update_forward_refs()
