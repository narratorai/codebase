from typing import Any, Optional

from .base_model import BaseModel


class DeleteTeam(BaseModel):
    delete_team_by_pk: Optional["DeleteTeamDeleteTeamByPk"]


class DeleteTeamDeleteTeamByPk(BaseModel):
    id: Any


DeleteTeam.update_forward_refs()
DeleteTeamDeleteTeamByPk.update_forward_refs()
