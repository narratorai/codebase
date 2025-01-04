from fastapi import APIRouter, Depends, status

from batch_jobs import task_manager
from core.api.auth import get_current_user
from core.errors import ForbiddenError, TaskPendingError
from core.graph import graph_client
from core.graph.sync_client.enums import access_role_enum
from core.models.ids import UUIDStr
from core.models.user import AuthenticatedUser

from .models import GetTaskDebugDetails, GetTaskOutput, QueryParams, TaskScheduleInput
from .utils import TaskManager, TaskQueryBuilder, trace_time

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get(
    "",
    response_model=GetTaskOutput,
    name="Get all tasks",
    description="Get all tasks of the current company.",
)
async def get_all(
    params: QueryParams = Depends(QueryParams),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    current_user.require_role(access_role_enum.view_processing)
    query_builder = TaskQueryBuilder(**params.dict(), user=current_user)
    return query_builder.get_results()


@router.post("/executions/{execution_id}/cancel", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_task(execution_id: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    """Cancel a running task."""
    current_user.require_role(access_role_enum.manage_processing)
    tm = TaskManager(current_user)
    tm.track("canceled_task_execution", object_id=execution_id)
    task_manager.cancel_task_execution(execution_id)


@router.get(
    "/{id}/executions/{execution_id}/debug",
    response_model=GetTaskDebugDetails,
)
async def get_debug_details(
    id: UUIDStr,
    execution_id: UUIDStr,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    if not current_user.is_internal_admin:
        raise ForbiddenError("You do not have permission to view debug details.")

    execution = graph_client.get_task_execution(execution_id).task_execution_by_pk

    debug_details = dict(
        task_id=id,
        execution_id=str(execution_id),
        function_name=execution.task.function_name,
        function_path=execution.task.function_path,
        used_args="&".join([f"{k}={v}" for k, v in execution.task.kwargs.items()]),
        orchestration_id=execution.orchestration_id,
        error=execution.details.get("error"),
    )
    if trace_context := execution.details.get("trace_context"):
        debug_details["trace_id"] = trace_id = trace_context.get("trace_id")

        # add the link
        debug_details["honecomb_link"] = (
            f"http://ui.honeycomb.io/narrator-ai/datasets/mavis-worker/trace?trace_id={trace_id}&trace_start_ts={trace_time(execution.started_at, -10)}&trace_end_ts={trace_time(execution.completed_at, 5)}"
        )

    return debug_details


@router.post("/{id}/run", status_code=status.HTTP_204_NO_CONTENT)
async def run_task(
    id: UUIDStr,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    current_user.require_role(access_role_enum.manage_processing)
    taskm = TaskManager(current_user)
    taskm.track("ran_task", object_id=id)

    if not current_user.is_admin:
        raise ForbiddenError("You do not have permission to run tasks.")

    if task_manager.run(id):
        return None
    else:
        raise TaskPendingError()


@router.patch("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def update_task(
    id: UUIDStr,
    input: TaskScheduleInput,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    current_user.require_role(access_role_enum.manage_processing_config)
    TaskManager(current_user).update_properties(id, input.dict())


@router.post("/all/processing", status_code=status.HTTP_204_NO_CONTENT)
async def turn_on_all_processing(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    current_user.require_role(access_role_enum.manage_processing)
    taskm = TaskManager(current_user)
    taskm.update_batch_halt(True)
    taskm.track("turned_on_all_processing")


@router.delete("/all/processing", status_code=status.HTTP_204_NO_CONTENT)
async def turn_off_all_processing(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    current_user.require_role(access_role_enum.manage_processing)
    taskm = TaskManager(current_user)
    taskm.update_batch_halt(False)
    taskm.track("turned_off_all_processing")
