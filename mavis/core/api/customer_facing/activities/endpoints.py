from fastapi import APIRouter, Depends, status

from core.api.auth import get_current_user
from core.graph import graph_client
from core.graph.sync_client.enums import access_role_enum
from core.models.ids import UUIDStr
from core.models.user import AuthenticatedUser

from ..utils.pydantic import ShareInput, Tags
from .models import GetActivitiesOutput, GetActivityMetrics, QueryParams
from .utils import ActivitiesQueryBuilder, ActivityManager

router = APIRouter(prefix="/activities", tags=["Activities"])


@router.get(
    "",
    response_model=GetActivitiesOutput,
    name="Get all activities",
    description="Get all activities of the current company.",
)
async def get_all(
    params: QueryParams = Depends(QueryParams),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    current_user.require_role(access_role_enum.view_activities)
    query_builder = ActivitiesQueryBuilder(**params.dict(), user=current_user, include_maintenance=True)
    return query_builder.get_results()


@router.get(
    "/metrics",
    response_model=GetActivityMetrics,
    name="Get the activity metric headers",
    description="Returns a couple of metrics on the activities",
)
async def get_metrics(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    current_user.require_role(access_role_enum.view_activities)
    return GetActivityMetrics(
        total_in_maintenance=len(
            graph_client.get_all_active_activity_maintenance(current_user.company_id).transformation_maintenance
        )
    )


@router.post("/{id}/favorite", response_model=None, status_code=status.HTTP_201_CREATED)
async def favorite_activity(
    id: UUIDStr,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    ActivityManager(user=current_user).favorite(id)
    return {"id": id}


@router.delete("/{id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
async def unfavorite_activity(
    id: UUIDStr,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    ActivityManager(user=current_user).unfavorite(id)


@router.patch(
    "/{id}/share",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Update a table with the teams you now want to share with",
    description="Update a table with the teams you now want to share with",
)
async def update_teams_to_share_with(
    id: UUIDStr,
    input: ShareInput,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    ActivityManager(current_user).update_permissions(
        id, input.permissions, share_with_everyone=input.share_with_everyone
    )


@router.patch(
    "/{id}/tags",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Update a table with the teams you now want to share with",
    description="Update a table with the teams you now want to share with",
)
async def update_tags(
    id: UUIDStr,
    input: Tags,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    ActivityManager(current_user).update_tags(id, input.tags)
