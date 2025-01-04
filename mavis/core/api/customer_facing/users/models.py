from core.graph.sync_client.enums import access_role_enum
from core.models.ids import UUIDStr

from ..utils.pydantic import CamelModel, SearchParamsWPermissions


class QueryParams(SearchParamsWPermissions):
    awaiting_invitation: bool | None = None
    roles: list[access_role_enum] | None = None


class OtherCompany(CamelModel):
    id: UUIDStr
    name: str
    slug: str


class BasicItem(CamelModel):
    id: UUIDStr
    name: str


class BasicActivity(CamelModel):
    id: UUIDStr
    name: str
    table_id: UUIDStr


class ReportItem(BasicItem):
    pass


class CurrentFavoritesOutput(CamelModel):
    activities: list[BasicActivity]
    datasets: list[BasicItem]
    reports: list[ReportItem]
    chats: list[BasicItem]


class UserCompanies(CamelModel):
    companies: list[OtherCompany]


class SeedOutput(CamelModel):
    favorites: CurrentFavoritesOutput
    companies: list[OtherCompany]
    access_roles: list[access_role_enum]
    team_ids: list[UUIDStr]


class UpdateUserAvatarInput(CamelModel):
    avatar_url: str


class UserOutput(CamelModel):
    id: UUIDStr
    email: str
    created_at: str
    team_ids: list[UUIDStr]
    roles: list[access_role_enum]
    first_name: str | None = None
    last_name: str | None = None
    job_title: str | None = None
    awaiting_invitation: bool = False
    invitation_expires_at: str | None = None


class TransferInput(CamelModel):
    to_user_id: str


class UpdateUserInput(CamelModel):
    first_name: str | None = None
    last_name: str | None = None
    job_ttitle: str | None = None


class CreateUserInput(UpdateUserInput):
    email: str


class CreateUserOutput(CamelModel):
    id: UUIDStr
    email: str
    created_at: str
    first_name: str | None = None
    last_name: str | None = None
    team_ids: list[UUIDStr] | None = None


class GetUserOutput(CamelModel):
    total_count: int
    page: int
    per_page: int
    data: list[UserOutput]

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
                            "email": "some@example.com",
                            "createdAt": "2023-05-27T18:28:18.000000+00:00",
                            "firstName": "John",
                            "lastName": "Doe",
                            "jobTitle": "Software Engineer",
                            "roles": ["admin"],
                            "teamIds": ["5b0daaa9-e7bf-4e62-9c5e-392cb193036d"],
                            "awaitingInvitation": True,
                            "invitationExpiresAt": "2023-05-27T18:28:18.000000+00:00",
                        }
                    ],
                }
            ]
        }
