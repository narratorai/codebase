from core.graph.sync_client.get_company import GetCompanyCompaniesTeams
from core.models.ids import UUIDStr

from ..utils.pydantic import CamelModel


class TeamUpdate(CamelModel):
    name: str


class TeamCreated(CamelModel):
    id: UUIDStr


class Team(CamelModel):
    id: UUIDStr
    name: str
    created_at: str
    users: list[UUIDStr]


class GetTeamOutput(CamelModel):
    total_count: int
    page: int
    per_page: int
    data: list[GetCompanyCompaniesTeams]

    class Config:
        schema_extra = {
            "examples": [
                {
                    "totalCount": 1,
                    "page": 1,
                    "perPage": 1,
                    "data": [
                        {
                            "id": "db0daaa9-e7bf-4e62-9c5e-392cb193036d",
                            "name": "Marketing",
                        }
                    ],
                }
            ]
        }
