from typing import Any, List, Optional

from .base_model import BaseModel


class GetTeam(BaseModel):
    team_by_pk: Optional["GetTeamTeamByPk"]


class GetTeamTeamByPk(BaseModel):
    name: str
    id: Any
    created_at: Any
    users: List["GetTeamTeamByPkUsers"]


class GetTeamTeamByPkUsers(BaseModel):
    company_user: "GetTeamTeamByPkUsersCompanyUser"


class GetTeamTeamByPkUsersCompanyUser(BaseModel):
    id: Any
    user_id: Any


GetTeam.update_forward_refs()
GetTeamTeamByPk.update_forward_refs()
GetTeamTeamByPkUsers.update_forward_refs()
GetTeamTeamByPkUsersCompanyUser.update_forward_refs()
