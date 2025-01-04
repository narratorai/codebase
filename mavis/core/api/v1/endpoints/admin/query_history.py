from fastapi import APIRouter, Depends
from pydantic import BaseModel, conint

from core.api.auth import get_mavis
from core.v4.mavis import Mavis

router = APIRouter()


class QueryHistoryItem(BaseModel):
    query: str
    data_source: int
    ts: str
    email: str | None
    kind: str = "system"
    dataset_slug: str | None
    group_slug: str | None


class QueryHistoryResponse(BaseModel):
    next_ts: str | None
    events: list[QueryHistoryItem]


@router.get("", response_model=QueryHistoryResponse)
def get_query_history(
    after: str | None,
    page_size: conint(ge=1, le=500) = 50,
    mavis: Mavis = Depends(get_mavis),
):
    # TODO: Log events and keep track of all the queries run
    return dict(events=[])
