from typing import Any, List, Optional

from .base_model import BaseModel


class DeleteUserTeam(BaseModel):
    delete_team_user: Optional["DeleteUserTeamDeleteTeamUser"]


class DeleteUserTeamDeleteTeamUser(BaseModel):
    returning: List["DeleteUserTeamDeleteTeamUserReturning"]


class DeleteUserTeamDeleteTeamUserReturning(BaseModel):
    id: Any


DeleteUserTeam.update_forward_refs()
DeleteUserTeamDeleteTeamUser.update_forward_refs()
DeleteUserTeamDeleteTeamUserReturning.update_forward_refs()
