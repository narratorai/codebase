from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import maintenance_kinds_enum


class GetFullActivity(BaseModel):
    activity_by_pk: Optional["GetFullActivityActivityByPk"]


class GetFullActivityActivityByPk(BaseModel):
    id: Any
    created_at: Any
    updated_at: Any
    slug: str
    name: Optional[str]
    description: Optional[str]
    table_id: Optional[Any]
    company_id: Any
    category: Optional[str]
    row_count: Optional[int]
    team_permissions: List["GetFullActivityActivityByPkTeamPermissions"]
    tags: List["GetFullActivityActivityByPkTags"]
    alerts: List["GetFullActivityActivityByPkAlerts"]
    column_renames: List["GetFullActivityActivityByPkColumnRenames"]
    activity_dims: List["GetFullActivityActivityByPkActivityDims"]


class GetFullActivityActivityByPkTeamPermissions(BaseModel):
    team_id: Optional[Any]
    can_edit: Optional[bool]


class GetFullActivityActivityByPkTags(BaseModel):
    tag_id: Optional[Any]
    company_tag: Optional["GetFullActivityActivityByPkTagsCompanyTag"]


class GetFullActivityActivityByPkTagsCompanyTag(BaseModel):
    tag: str
    user_id: Optional[Any]


class GetFullActivityActivityByPkAlerts(BaseModel):
    id: Any
    kind: maintenance_kinds_enum
    notes: Optional[str]
    started_at: Any


class GetFullActivityActivityByPkColumnRenames(BaseModel):
    id: Optional[Any]
    label: Optional[str]
    type: Optional[str]
    name: Optional[str]
    has_data: Optional[bool]


class GetFullActivityActivityByPkActivityDims(BaseModel):
    activity_join_column: str
    slowly_changing_ts_column: Optional[str]
    dim_table: "GetFullActivityActivityByPkActivityDimsDimTable"


class GetFullActivityActivityByPkActivityDimsDimTable(BaseModel):
    id: Any
    schema_: Optional[str]
    table: str
    join_key: Optional[str]
    columns: List["GetFullActivityActivityByPkActivityDimsDimTableColumns"]


class GetFullActivityActivityByPkActivityDimsDimTableColumns(BaseModel):
    id: Optional[Any]
    name: Optional[str]
    type: Optional[str]
    label: Optional[str]


GetFullActivity.update_forward_refs()
GetFullActivityActivityByPk.update_forward_refs()
GetFullActivityActivityByPkTeamPermissions.update_forward_refs()
GetFullActivityActivityByPkTags.update_forward_refs()
GetFullActivityActivityByPkTagsCompanyTag.update_forward_refs()
GetFullActivityActivityByPkAlerts.update_forward_refs()
GetFullActivityActivityByPkColumnRenames.update_forward_refs()
GetFullActivityActivityByPkActivityDims.update_forward_refs()
GetFullActivityActivityByPkActivityDimsDimTable.update_forward_refs()
GetFullActivityActivityByPkActivityDimsDimTableColumns.update_forward_refs()
