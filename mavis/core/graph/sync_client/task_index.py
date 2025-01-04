from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import company_task_category_enum


class TaskIndex(BaseModel):
    company_task: List["TaskIndexCompanyTask"]


class TaskIndexCompanyTask(BaseModel):
    category: Optional[company_task_category_enum]
    created_at: Any
    id: Any
    task_slug: str
    schedule: str


TaskIndex.update_forward_refs()
TaskIndexCompanyTask.update_forward_refs()
