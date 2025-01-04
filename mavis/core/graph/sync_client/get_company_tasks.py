from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import company_task_category_enum, task_execution_status_enum


class GetCompanyTasks(BaseModel):
    company_task: List["GetCompanyTasksCompanyTask"]


class GetCompanyTasksCompanyTask(BaseModel):
    id: Any
    task_slug: str
    schedule: str
    category: Optional[company_task_category_enum]
    executions: List["GetCompanyTasksCompanyTaskExecutions"]


class GetCompanyTasksCompanyTaskExecutions(BaseModel):
    status: task_execution_status_enum
    started_at: Optional[Any]
    completed_at: Optional[Any]


GetCompanyTasks.update_forward_refs()
GetCompanyTasksCompanyTask.update_forward_refs()
GetCompanyTasksCompanyTaskExecutions.update_forward_refs()
