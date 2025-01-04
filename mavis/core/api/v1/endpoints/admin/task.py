from fastapi import APIRouter, Depends
from pydantic import BaseModel

from batch_jobs.task_manager import task_manager
from core.api.auth import get_current_company, get_current_user
from core.api.customer_facing.tasks.utils import TaskManager
from core.errors import TaskPendingError
from core.models.company import Company
from core.models.ids import UUIDStr
from core.models.user import AuthenticatedUser

router = APIRouter(prefix="/task", tags=["admin", "task"])


class TaskInput(BaseModel):
    task_id: UUIDStr


class UpdataBatchHalt(BaseModel):
    batch_halt: bool


class TaskScheduleInput(BaseModel):
    task_id: UUIDStr
    schedule: str


class TaskUpdated(BaseModel):
    id: UUIDStr


class TaskCancelInput(BaseModel):
    id: UUIDStr


class TaskCancelOutput(BaseModel):
    id: UUIDStr
    orchestration_id: str


@router.post("/execution/cancel", response_model=TaskCancelOutput)
async def cancel_task(input: TaskCancelInput, current_company: Company = Depends(get_current_company)):
    """Cancel a running task."""
    orchestration_id = task_manager.cancel(input.id, current_company.current_user.id)
    if orchestration_id:
        return {"id": input.id, "orchestration_id": orchestration_id}
    else:
        raise TaskPendingError(message="Task is not running.", code="TaskNotFound", http_status_code=404)


@router.post("/run", response_model=TaskCancelOutput)
async def run_task(
    input: TaskInput,
    current_company: Company = Depends(get_current_company),
):
    if message := task_manager.run(input.task_id):
        return dict(id=input.task_id, orchestration_id=message.message_id)
    else:
        raise TaskPendingError()


@router.post("/update_schedule", response_model=TaskUpdated)
async def update_schedule(
    input: TaskScheduleInput,
    current_company: Company = Depends(get_current_company),
):
    TaskManager(company=current_company).update_properties(input.task_id, schedule=input.schedule)
    return dict(id=input.task_id)


@router.post("/toggle_batch_halt", response_model=UpdataBatchHalt)
async def toggle_batch_halt(input: UpdataBatchHalt, user: AuthenticatedUser = Depends(get_current_user)):
    TaskManager(user=user).update_batch_halt(input.batch_halt)
    return input
