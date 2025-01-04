from core.graph.sync_client.get_all_tags import GetAllTagsCompanyTags
from core.models.ids import UUIDStr

from ..utils.pydantic import CamelModel


class TagCreated(CamelModel):
    id: UUIDStr


class TagUpdate(CamelModel):
    tag: str
    color: str
    description: str | None = None


class GetTagOutput(CamelModel):
    total_count: int
    page: int
    per_page: int
    data: list[GetAllTagsCompanyTags]

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
                            "tag": "reporting",
                            "color": "#FF0000",
                            "description": "This is used for all reporting",
                        }
                    ],
                }
            ]
        }
