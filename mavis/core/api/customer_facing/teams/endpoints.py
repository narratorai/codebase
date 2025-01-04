from fastapi import APIRouter, Depends, status

from core.api.auth import get_current_company, get_current_user
from core.models.company import Company
from core.models.ids import UUIDStr
from core.models.user import AuthenticatedUser

from ..utils.pydantic import PaginationParams
from .models import GetTeamOutput, Team, TeamCreated, TeamUpdate
from .utils import TeamUpdator

router = APIRouter(prefix="/teams", tags=["tean"])


@router.get(
    "",
    response_model=GetTeamOutput,
    name="Get all teams",
    description="Get all teams associated with the company",
)
async def get_all(
    params: PaginationParams = Depends(PaginationParams),
    company: Company = Depends(get_current_company),
):
    teams = company.teams
    return dict(
        totalCount=len(teams),
        page=1,
        perPage=params.per_page,
        data=[t.dict() for t in teams],
    )


@router.get(
    "/{id}/members",
    response_model=Team,
    name="Get all teams",
    description="Get all teams associated with the company",
)
async def get_team_members(
    id: UUIDStr,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    team = TeamUpdator(current_user).fetch_graph_data([id])

    return dict(
        id=team.id,
        name=team.name,
        created_at=team.created_at,
        users=[u.company_user.user_id for u in team.users],
    )


@router.post(
    "/",
    response_model=TeamCreated,
    name="Creates a team",
    description="Creates a team from the company",
)
async def craete_team(
    input: TeamUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    id = TeamUpdator(current_user).create(input.name)
    return TeamCreated(id=id)


@router.patch(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Update a table with the teams you now want to share with",
    description="Update a table with the teams you now want to share with",
)
async def update_team(
    id: UUIDStr,
    input: TeamUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    TeamUpdator(current_user).update(id, name=input.name)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Deletes a team",
    description="Deletes a team from the company",
)
async def delete_team(
    id: UUIDStr,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    TeamUpdator(current_user).delete(id)
