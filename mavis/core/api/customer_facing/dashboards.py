from fastapi import APIRouter, Depends

from core.api.auth import get_mavis
from core.graph import graph_client
from core.graph.sync_client.get_all_narratives import GetAllNarrativesNarratives
from core.graph.sync_client.input_types import narrative_types_enum
from core.models.ids import UUIDStr
from core.v4.mavis import Mavis

from .analyses import NarrativeTag
from .utils.pydantic import CamelModel, PaginationParams

router = APIRouter(prefix="/dashboards", tags=["Dashboards"])


class QueryParams(PaginationParams):
    pass


class DashboardOutput(CamelModel, GetAllNarrativesNarratives):
    id: UUIDStr
    tags: list[NarrativeTag]


class GetDashboardsOutput(CamelModel):
    total_count: int
    page: int
    per_page: int
    data: list[DashboardOutput]

    class Config:
        schema_extra = {
            "examples": [
                {
                    "totalCount": 1,
                    "page": 1,
                    "perPage": 10,
                    "data": [
                        {
                            "id": "9913473e-4b70-45b3-a527-3018051fc30f",
                            "slug": "sales_conversion_rate_BU_HwrnJh",
                            "name": "Sales Conversion Rate",
                            "description": "Measures the effectiveness of the sales team",
                            "state": "in_progress",
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
                        }
                    ],
                }
            ]
        }


@router.get(
    "",
    response_model=GetDashboardsOutput,
    name="Get all dashboards",
    description="Get all dashboards the user has access to",
)
async def get_all(params: QueryParams = Depends(QueryParams), mavis: Mavis = Depends(get_mavis)):
    data = graph_client.get_all_narratives(
        company_id=mavis.company.id,
        user_id=mavis.user.id,
        type=narrative_types_enum.dashboard,
        offset=params.per_page * (params.page - 1),
        limit=params.per_page,
    ).dict()

    agg, dashboards = data["narrative_aggregate"], data["narratives"]

    for dashboard in dashboards:
        for tag in dashboard["tags"]:
            tag["id"] = tag["tag"]["id"] if tag["tag"] else None
            tag["name"] = tag["tag"]["name"] if tag["tag"] else None

    return {
        "total_count": agg["aggregate"]["total_count"],
        "page": params.page,
        "per_page": params.per_page,
        "data": dashboards,
    }
