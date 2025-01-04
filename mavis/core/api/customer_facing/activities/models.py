from pydantic import Field

from core.models.ids import UUIDStr

from ..utils.pydantic import CamelModel, FilterParamWithTags


class QueryParams(FilterParamWithTags):
    table_id: UUIDStr | None = None
    in_maintenance: bool = False


class Column(CamelModel):
    name: str
    label: str
    type: str


class MaintenanceAlert(CamelModel):
    id: UUIDStr
    kind: str
    notes: str | None = None
    started_at: str
    ended_at: str | None = None


class BasicActivity(CamelModel):
    id: UUIDStr
    name: str
    slug: str
    description: str | None


class ActivityOutput(CamelModel):
    id: UUIDStr
    name: str
    slug: str
    description: str | None = None
    created_at: str
    table_id: str
    # row_count: int
    tag_ids: list[UUIDStr] = Field(default_factory=list)
    columns: list[Column] = Field(default_factory=list)
    favorited: bool = False
    team_ids: list[UUIDStr] = Field(default_factory=list)
    alert: MaintenanceAlert | None = None
    ended_alert: MaintenanceAlert | None = None


class GetActivityMetrics(CamelModel):
    total_in_maintenance: int


class GetActivitiesOutput(CamelModel):
    total_count: int
    page: int
    per_page: int
    data: list[ActivityOutput]

    class Config:
        schema_extra = {
            "examples": [
                {
                    "totalCount": 1,
                    "page": 1,
                    "perPage": 1,
                    "data": [
                        {
                            "id": "3b0daaa9-e7bf-4e62-9c5e-392cb193036d",
                            "name": "Opened Email",
                            "slug": "opened_email",
                            "description": None,
                            "rowCount": 10631,
                            "columns": [
                                {
                                    "id": "3b0daaa9-e7bf-4e62-9c5e-392cb193036d",
                                    "name": "customer",
                                    "label": "Email",
                                    "type": "string",
                                    "dimId": None,
                                }
                            ],
                            "tag_ids": ["db0daaa9-e7bf-4e62-9c5e-392cb193036d"],
                            "favorited": True,
                            "tableId": "5d676d46-aade-4ecf-b48b-bf9e8cecdbdb",
                            "alerts": {
                                "id": "3b0daaa9-e7bf-4e62-9c5e-392cb193036d",
                                "kind": "Duplicate Ids",
                                "notes": "Some details about the duplication",
                                "startedAt": "2023-05-27T18:28:18.000000+00:00",
                            },
                            "category": {
                                "id": "be071fbd-ab27-4093-98a8-9e020b21f87a",
                                "name": "demo",
                                "color": "#FFC107",
                            },
                            "teams": [
                                {
                                    "id": "db0daaa9-e7bf-4e62-9c5e-392cb193036d",
                                    "canEdit": True,
                                }
                            ],
                            "createdAt": "2023-05-27T18:28:18.000000+00:00",
                            "updatedAt": "2023-10-14T10:30:00.000000+00:00",
                        }
                    ],
                }
            ]
        }
