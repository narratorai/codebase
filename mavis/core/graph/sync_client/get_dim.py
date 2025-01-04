from typing import Any, List, Optional

from .base_model import BaseModel


class GetDim(BaseModel):
    dim_table_by_pk: Optional["GetDimDimTableByPk"]


class GetDimDimTableByPk(BaseModel):
    id: Any
    schema_: Optional[str]
    table: str
    join_key: Optional[str]
    description: Optional[str]
    columns: List["GetDimDimTableByPkColumns"]
    team_permissions: List["GetDimDimTableByPkTeamPermissions"]


class GetDimDimTableByPkColumns(BaseModel):
    id: Optional[Any]
    name: Optional[str]
    label: Optional[str]
    type: Optional[str]


class GetDimDimTableByPkTeamPermissions(BaseModel):
    team_id: Optional[Any]


GetDim.update_forward_refs()
GetDimDimTableByPk.update_forward_refs()
GetDimDimTableByPkColumns.update_forward_refs()
GetDimDimTableByPkTeamPermissions.update_forward_refs()
