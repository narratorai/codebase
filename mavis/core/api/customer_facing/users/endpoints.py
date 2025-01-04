from fastapi import APIRouter, Depends, status

from core.api.auth import get_current_user
from core.errors import MissingUserError
from core.graph import graph_client
from core.graph.sync_client.enums import access_role_enum
from core.models.ids import UUIDStr
from core.models.user import AuthenticatedUser

from .models import (
    CreateUserInput,
    CreateUserOutput,
    CurrentFavoritesOutput,
    GetUserOutput,
    QueryParams,
    SeedOutput,
    TransferInput,
    UpdateUserAvatarInput,
    UpdateUserInput,
    UserCompanies,
)
from .utils import UserManager, UserQueryBuilder

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "",
    response_model=GetUserOutput,
    name="Get all users",
    description="Get all users of the current company.",
)
async def get_all(
    params: QueryParams = Depends(QueryParams),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    current_user.require_role(access_role_enum.manage_users)
    # add the filters
    query_builder = UserQueryBuilder(**params.dict(), user=current_user)
    return query_builder.get_results()


@router.post(
    "/{user_id}/teams/{team_id}",
    status_code=status.HTTP_201_CREATED,
    name="Add team",
    description="Add a team to the user.",
)
async def add_team_to_user(
    user_id: UUIDStr,
    team_id: UUIDStr,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    current_user.require_role(access_role_enum.manage_users)
    UserManager(current_user).add_team(user_id, team_id)

    return None


@router.delete(
    "/{user_id}/teams/{team_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Remove team",
    description="Remove a team from the user.",
)
async def remove_team_from_user(
    user_id: UUIDStr,
    team_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    current_user.require_role(access_role_enum.manage_users)
    UserManager(current_user).delete_team(user_id, team_id)
    return None


@router.post(
    "/{user_id}/roles/{role}",
    status_code=status.HTTP_201_CREATED,
    name="Add role",
    description="Add a role to the user.",
)
async def add_role_to_user(
    user_id: UUIDStr,
    role: access_role_enum,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    UserManager(current_user).add_role(user_id, role)
    return None


@router.delete(
    "/{user_id}/roles/{role}",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Remove role",
    description="Remove a role from the user.",
)
async def remove_role_from_user(
    user_id: UUIDStr,
    role: access_role_enum,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    UserManager(current_user).delete_role(user_id, role)
    return None


@router.patch(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Update user",
    description="Updates some of the properties of the user.",
)
async def update_user(
    user_id: UUIDStr,
    input: UpdateUserInput,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    current_user.require_role(access_role_enum.manage_users)
    UserManager(current_user).update(user_id, input.first_name, input.last_name, input.job_title)


@router.patch(
    "/{user_id}/avatar",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Update user avatar",
    description="Updates the avatar of the user.",
)
async def update_user_avatar(
    user_id: UUIDStr,
    input: UpdateUserAvatarInput,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    current_user.require_role(access_role_enum.manage_users)
    UserManager(current_user).update_avatar(user_id, input.avatar_url)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Delete user",
    description="Deletes the user from the company.",
)
async def delete_user(user_id: UUIDStr, current_user: AuthenticatedUser = Depends(get_current_user)):
    current_user.require_role(access_role_enum.manage_users)
    UserManager(current_user).delete(user_id)


@router.post(
    "/{user_id}/transfer",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Transfer user",
)
async def tranfer_users(
    user_id: UUIDStr,
    input: TransferInput,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    UserManager(current_user).transfer_user(user_id, input.to_user_id)


@router.post(
    "/{user_id}/resend_invitation",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Resend invitation",
    description="Sends the user a new invitation to be able to join the company.",
)
async def resend_invitation(
    user_id: UUIDStr,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    current_user.require_role(access_role_enum.manage_users)
    if user := graph_client.get_user(id=user_id).user_by_pk:
        UserManager(current_user).resend_invitation(user.email)
    else:
        raise MissingUserError("User not found")


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=CreateUserOutput,
    name="Create user",
    description="Create a new user in the current company",
)
async def create_user(input: CreateUserInput, current_user: AuthenticatedUser = Depends(get_current_user)):
    current_user.require_role(access_role_enum.manage_users)
    user_id = UserManager(current_user).create(
        email=input.email,
        first_name=input.first_name,
        last_name=input.last_name,
        job_title=input.job_title,
    )
    return CreateUserOutput(**input.dict(), id=user_id, team_ids=[current_user.company.everyone_team_id])


@router.get(
    "/current/companies",
    response_model=UserCompanies,
    name="gets the current users companies",
    description="Gets all the companies for the users",
)
async def get_user_companies(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    return dict(companies=_get_user_companies(current_user))


def _get_user_companies(current_user: AuthenticatedUser):
    if current_user.is_internal_admin:
        return graph_client.get_all_companies().company

    company_user = graph_client.get_user_companies(user_id=current_user.id).company_user
    return [c.company for c in company_user]


@router.get(
    "/current/favorites",
    response_model=CurrentFavoritesOutput,
    name="Gets all the boomarked Items for the user",
    description="Gets all the boomarked Items for the user",
)
async def get_user_favorites(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    return _get_favorites(current_user)


def _get_favorites(current_user):
    favs = graph_client.get_items_for_tag(tag_id=current_user.tags.favorite).company_tags_by_pk
    return dict(
        activities=[t.activity for t in favs.tagged_items if t.activity],
        datasets=[t.dataset for t in favs.tagged_items if t.dataset],
        reports=[
            dict(
                id=t.narrative.id,
                name=t.narrative.name,
            )
            for t in favs.tagged_items
            if t.narrative
        ],
        chats=[],
    )


@router.get(
    "/current",
    response_model=SeedOutput,
    name="Get current user seed",
    description="Gets all the bookmarked, teams, companies and access roles for the user",
)
async def get_user_seed(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    return dict(
        access_roles=[r.value for r in access_role_enum] if current_user.is_admin else current_user.access_roles,
        team_ids=current_user.team_ids,
        companies=_get_user_companies(current_user),
        favorites=_get_favorites(current_user),
    )
