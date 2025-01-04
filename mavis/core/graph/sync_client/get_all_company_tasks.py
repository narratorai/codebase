from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import datacenter_region_enum


class GetAllCompanyTasks(BaseModel):
    company: List["GetAllCompanyTasksCompany"]


class GetAllCompanyTasksCompany(BaseModel):
    id: Any
    slug: str
    batch_halt: bool
    datacenter_region: Optional[datacenter_region_enum]
    timezone: str
    tasks: List["GetAllCompanyTasksCompanyTasks"]


class GetAllCompanyTasksCompanyTasks(BaseModel):
    id: Any
    created_at: Any
    task_slug: str
    schedule: str
    function_name: Optional[str]
    function_path: Optional[str]
    kwargs: Optional[str]


GetAllCompanyTasks.update_forward_refs()
GetAllCompanyTasksCompany.update_forward_refs()
GetAllCompanyTasksCompanyTasks.update_forward_refs()
