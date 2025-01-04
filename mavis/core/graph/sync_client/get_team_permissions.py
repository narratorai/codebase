from typing import Any, List, Optional

from .base_model import BaseModel


class GetTeamPermissions(BaseModel):
    team_permission: List["GetTeamPermissionsTeamPermission"]


class GetTeamPermissionsTeamPermission(BaseModel):
    id: Any
    team_id: Any
    can_edit: Optional[bool]


GetTeamPermissions.update_forward_refs()
GetTeamPermissionsTeamPermission.update_forward_refs()
