from fastapi import APIRouter, Depends

from core.api.auth import get_mavis
from core.graph import graph_client
from core.graph.sync_client.get_all_narratives import GetAllNarrativesNarratives
from core.graph.sync_client.input_types import narrative_types_enum
from core.models.ids import UUIDStr
from core.v4.mavis import Mavis

from .utils.pydantic import CamelModel, PaginationParams

router = APIRouter(prefix="/analyses", tags=["Analyses"])


class QueryParams(PaginationParams):
    pass


class NarrativeTag(CamelModel):
    id: UUIDStr
    name: str
    created_at: str | None


class AnalysisOutput(CamelModel, GetAllNarrativesNarratives):
    id: UUIDStr
    tags: list[NarrativeTag]


class GetAnalysesOutput(CamelModel):
    total_count: int
    page: int
    per_page: int
    data: list[AnalysisOutput]

    class Config:
        schema_extra = {
            "examples": [
                {
                    "totalCount": 1,
                    "page": 1,
                    "perPage": 10,
                    "data": [
                        {
                            "id": "207dbd60-e41f-4e54-b556-48c07f159571",
                            "slug": "customer_acquisition_cost_cac",
                            "name": "Customer Acquisition Cost (CAC)",
                            "description": "How much does it cost to acquire a customer?",
                            "state": "live",
                            "snapshots": [
                                {
                                    "id": "9a321799-d969-479c-91d9-6d6b57e40392",
                                    "created_at": "2023-10-16T18:03:49.458173+00:00",
                                },
                            ],
                            "tags": [
                                {
                                    "id": "ec9bdbdb-7f20-4ec6-a4fc-717411d618ae",
                                    "name": "recently_viewed",
                                    "created_at": "2023-10-19T04:40:01.872251+00:00",
                                }
                            ],
                            "updated_by": {
                                "id": "1d7bcf05-307a-4a60-a541-d7f3583e9300",
                                "email": "support@narrator.ai",
                            },
                            "created_at": "2023-10-09T20:51:34.123396+00:00",
                            "updated_at": "2023-10-18T18:01:52.822663+00:00",
                        },
                    ],
                }
            ]
        }


@router.get(
    "",
    response_model=GetAnalysesOutput,
    name="Get all analyses",
    description="Get all analyses the user has access to",
)
async def get_all(params: QueryParams = Depends(QueryParams), mavis: Mavis = Depends(get_mavis)):
    data = graph_client.get_all_narratives(
        company_id=mavis.company.id,
        user_id=mavis.user.id,
        type=narrative_types_enum.analysis,
        offset=params.per_page * (params.page - 1),
        limit=params.per_page,
    ).dict()
    agg, analyses = data["narrative_aggregate"], data["narratives"]

    for analysis in analyses:
        for tag in analysis["tags"]:
            tag["id"] = tag["tag"]["id"] if tag["tag"] else None
            tag["name"] = tag["tag"]["name"] if tag["tag"] else None

    return {
        "total_count": agg["aggregate"]["total_count"],
        "page": params.page,
        "per_page": params.per_page,
        "data": analyses,
    }
