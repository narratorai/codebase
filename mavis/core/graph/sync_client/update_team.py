from typing import Any, Optional

from .base_model import BaseModel


class UpdateTeam(BaseModel):
    update_team_by_pk: Optional["UpdateTeamUpdateTeamByPk"]


class UpdateTeamUpdateTeamByPk(BaseModel):
    id: Any


UpdateTeam.update_forward_refs()
UpdateTeamUpdateTeamByPk.update_forward_refs()
