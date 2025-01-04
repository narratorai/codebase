from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import company_task_category_enum


class GetCompanyTasksByPath(BaseModel):
    company_task: List["GetCompanyTasksByPathCompanyTask"]


class GetCompanyTasksByPathCompanyTask(BaseModel):
    id: Any
    task_slug: str
    label: Optional[str]
    schedule: str
    category: Optional[company_task_category_enum]


GetCompanyTasksByPath.update_forward_refs()
GetCompanyTasksByPathCompanyTask.update_forward_refs()
