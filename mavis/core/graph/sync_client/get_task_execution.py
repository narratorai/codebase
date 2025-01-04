from typing import Any, Optional

from .base_model import BaseModel
from .enums import task_execution_status_enum


class GetTaskExecution(BaseModel):
    task_execution_by_pk: Optional["GetTaskExecutionTaskExecutionByPk"]


class GetTaskExecutionTaskExecutionByPk(BaseModel):
    id: Any
    is_running: Optional[bool]
    status: task_execution_status_enum
    orchestration_id: Optional[str]
    task_id: Any
    details: Any
    task: "GetTaskExecutionTaskExecutionByPkTask"


class GetTaskExecutionTaskExecutionByPkTask(BaseModel):
    id: Any
    function_name: Optional[str]
    function_path: Optional[str]
    kwargs: Optional[str]


GetTaskExecution.update_forward_refs()
GetTaskExecutionTaskExecutionByPk.update_forward_refs()
GetTaskExecutionTaskExecutionByPkTask.update_forward_refs()
