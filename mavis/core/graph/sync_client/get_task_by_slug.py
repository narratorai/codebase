from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import company_task_category_enum


class GetTaskBySlug(BaseModel):
    company_task: List["GetTaskBySlugCompanyTask"]


class GetTaskBySlugCompanyTask(BaseModel):
    id: Any
    created_at: Any
    task_slug: str
    schedule: str
    category: Optional[company_task_category_enum]


GetTaskBySlug.update_forward_refs()
GetTaskBySlugCompanyTask.update_forward_refs()
