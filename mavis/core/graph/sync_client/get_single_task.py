from typing import Any, Optional

from .base_model import BaseModel
from .enums import company_task_category_enum


class GetSingleTask(BaseModel):
    company_task_by_pk: Optional["GetSingleTaskCompanyTaskByPk"]


class GetSingleTaskCompanyTaskByPk(BaseModel):
    id: Any
    task_slug: str
    schedule: str
    category: Optional[company_task_category_enum]
    function_name: Optional[str]
    function_path: Optional[str]
    kwargs: Optional[str]
    company: "GetSingleTaskCompanyTaskByPkCompany"


class GetSingleTaskCompanyTaskByPkCompany(BaseModel):
    id: Any
    slug: str


GetSingleTask.update_forward_refs()
GetSingleTaskCompanyTaskByPk.update_forward_refs()
GetSingleTaskCompanyTaskByPkCompany.update_forward_refs()
