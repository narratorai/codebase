from typing import Any, Optional

from .base_model import BaseModel


class InsertTeam(BaseModel):
    insert_team_one: Optional["InsertTeamInsertTeamOne"]


class InsertTeamInsertTeamOne(BaseModel):
    id: Any


InsertTeam.update_forward_refs()
InsertTeamInsertTeamOne.update_forward_refs()
