from typing import Any, Optional

from .base_model import BaseModel


class UpdateTask(BaseModel):
    update_company_task_by_pk: Optional["UpdateTaskUpdateCompanyTaskByPk"]


class UpdateTaskUpdateCompanyTaskByPk(BaseModel):
    id: Any


UpdateTask.update_forward_refs()
UpdateTaskUpdateCompanyTaskByPk.update_forward_refs()
