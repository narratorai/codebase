from datetime import datetime
from enum import StrEnum
from typing import Literal

from core.graph.sync_client.enums import company_status_enum
from core.models.company import CompanyTag, CompanyTeam
from core.models.ids import UUIDStr

from ..utils.pydantic import CamelModel


class UserDetail(CamelModel):
    id: UUIDStr
    user_id: UUIDStr
    first_name: str | None
    last_name: str | None
    avatar_url: str | None


class CompanyOutput(CamelModel):
    id: UUIDStr
    slug: str
    name: str
    production_schema: str
    warehouse_language: str
    datacenter_region: str
    batch_halt: bool
    status: company_status_enum
    created_at: datetime
    updated_at: datetime
    timezone: str
    currency: str
    locale: str
    logo_url: str | None
    teams: list[CompanyTeam]
    tags: list[CompanyTag]
    users: list[UserDetail]


class ConnectionOptions(StrEnum):
    AUTH0_USER_PASSWORD = "con_QgT5XPWydjKhbaM5"  # noqa
    AUTH0_GOOGLE = "con_Rz1xgcGoJFArXTNW"  # noqa
    AUTH0_MICROSOFT = "con_DNK8k8rDYj1khrpd"  # noqa


class UsedConnection(CamelModel):
    id: str
    name: str


class ConnectionOutput(CamelModel):
    connections: list[UsedConnection]
    options: list[dict]


class ConnectionUpdates(CamelModel):
    connection_ids: list[str]


class CreateCompanyInput(CamelModel):
    name: str
    region: Literal["US", "EU"] = "US"


class CreateCompanyOutput(CamelModel):
    id: UUIDStr
    slug: str
    api_key: str


class TagCreate(CamelModel):
    name: str
    color: str


class TagOutput(CamelModel):
    id: UUIDStr
    name: str
    color: str
    created_at: datetime
    updated_at: datetime
