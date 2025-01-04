from core.graph.sync_client.enums import access_role_enum

from ..utils.pydantic import CamelModel


class InternalAccess(CamelModel):
    allow_internal_access: bool


class RoleDetails(CamelModel):
    role: access_role_enum
    label: str
    description: str


class GetRoleOutput(CamelModel):
    total_count: int
    page: int
    per_page: int
    data: list[RoleDetails]

    class Config:
        schema_extra = {
            "examples": [
                {
                    "totalCount": 1,
                    "page": 1,
                    "perPage": 1,
                    "data": [
                        {
                            "role": "create_dataset",
                            "label": "Create a new dataset",
                            "description": "Can create a new dataset",
                        }
                    ],
                }
            ]
        }
