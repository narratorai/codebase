from fastapi import APIRouter, Depends

from core.api.auth import get_current_user
from core.constants import RECONCILE_TRANSFORMATION_PROCESS, RUN_TRANSFORMATION_PATH
from core.graph import graph_client
from core.graph.sync_client.enums import access_role_enum
from core.graph.sync_client.get_company_tasks_by_path import GetCompanyTasksByPath
from core.models.user import AuthenticatedUser

from .models import GetTransformationCounts, GetTransformationOutput, QueryParams
from .utils import TransformationQueryBuilder

router = APIRouter(prefix="/transformations", tags=["transformations"])


@router.get(
    "",
    response_model=GetTransformationOutput,
    name="Get all transformations",
    description="Get all transformations of the current company.",
)
async def get_all(
    params: QueryParams = Depends(QueryParams),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    current_user.require_role(access_role_enum.view_processing)
    query_builder = TransformationQueryBuilder(**params.dict(), user=current_user)
    return query_builder.get_results()


@router.get(
    "/metrics",
    response_model=GetTransformationCounts,
    name="Get the transformation metric headers",
    description="Returns a couple of metrics on the transformations",
)
async def get_metrics(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    return GetTransformationCounts(
        total_in_maintenance=len(
            graph_client.get_all_active_transformation_maintenance(current_user.company_id).transformation_maintenance
        )
    )


@router.get(
    "/tasks",
    response_model=GetCompanyTasksByPath,
    name="Get processing task schedules",
    description="Get processing task schedules",
)
async def get_processing_task_schedules(
    params: QueryParams = Depends(QueryParams),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    return dict(
        company_tasks=[
            t.dict()
            for t in graph_client.get_company_tasks_by_path(current_user.company.id, path=RUN_TRANSFORMATION_PATH).tasks
            if t.slug != RECONCILE_TRANSFORMATION_PROCESS
        ]
    )
