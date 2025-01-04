from pydantic import BaseModel, Field

from core.graph.sync_client.enums import company_config_warehouse_language_enum


class CreateInput(BaseModel):
    name: str = Field(..., title="Name of the data source")
    type: company_config_warehouse_language_enum
    is_admin: bool = False
    options: dict | None
    config: dict | None


class Datasources(BaseModel):
    """Smaller datasource object returned when we query a list of data sources."""

    data_source: CreateInput | None
    admin_data_source: CreateInput | None
    allow_admin: bool


class DatasourceOption(BaseModel):
    type: str | None
    name: str | None
    config: dict | None


class TestConnection(BaseModel):
    message: str
    ok: str


class SaveOutput(BaseModel):
    id: int | None
    name: str | None
    type: company_config_warehouse_language_enum | None
    options: dict | None
    was_admin: bool = False
    is_admin: bool = False

    # for the notification
    message: str
    description: str | None
    success: bool
    narrative_to_show: str | None
