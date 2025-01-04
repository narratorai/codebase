from typing import Any, List, Optional

from .base_model import BaseModel


class GetCompanyTable(BaseModel):
    company_table_by_pk: Optional["GetCompanyTableCompanyTableByPk"]


class GetCompanyTableCompanyTableByPk(BaseModel):
    team_permissions: List["GetCompanyTableCompanyTableByPkTeamPermissions"]


class GetCompanyTableCompanyTableByPkTeamPermissions(BaseModel):
    team_id: Optional[Any]


GetCompanyTable.update_forward_refs()
GetCompanyTableCompanyTableByPk.update_forward_refs()
GetCompanyTableCompanyTableByPkTeamPermissions.update_forward_refs()
