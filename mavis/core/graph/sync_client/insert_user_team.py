from typing import Any, Optional

from .base_model import BaseModel


class InsertUserTeam(BaseModel):
    insert_team_user_one: Optional["InsertUserTeamInsertTeamUserOne"]


class InsertUserTeamInsertTeamUserOne(BaseModel):
    id: Any


InsertUserTeam.update_forward_refs()
InsertUserTeamInsertTeamUserOne.update_forward_refs()
