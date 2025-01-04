from typing import Any, List, Optional

from .base_model import BaseModel


class UpdateTeamPermissions(BaseModel):
    delete_team_permission: Optional["UpdateTeamPermissionsDeleteTeamPermission"]
    insert_team_permission: Optional["UpdateTeamPermissionsInsertTeamPermission"]


class UpdateTeamPermissionsDeleteTeamPermission(BaseModel):
    affected_rows: int


class UpdateTeamPermissionsInsertTeamPermission(BaseModel):
    returning: List["UpdateTeamPermissionsInsertTeamPermissionReturning"]


class UpdateTeamPermissionsInsertTeamPermissionReturning(BaseModel):
    id: Any


UpdateTeamPermissions.update_forward_refs()
UpdateTeamPermissionsDeleteTeamPermission.update_forward_refs()
UpdateTeamPermissionsInsertTeamPermission.update_forward_refs()
UpdateTeamPermissionsInsertTeamPermissionReturning.update_forward_refs()
