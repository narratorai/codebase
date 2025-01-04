from typing import Any, Optional

from .base_model import BaseModel


class UpdateTaskSchedule(BaseModel):
    update_company_task_by_pk: Optional["UpdateTaskScheduleUpdateCompanyTaskByPk"]


class UpdateTaskScheduleUpdateCompanyTaskByPk(BaseModel):
    id: Any


UpdateTaskSchedule.update_forward_refs()
UpdateTaskScheduleUpdateCompanyTaskByPk.update_forward_refs()
