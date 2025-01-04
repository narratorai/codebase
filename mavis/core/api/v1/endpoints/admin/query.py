import unicodedata

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from core.api.auth import get_mavis
from core.v4.mavis import Mavis

router = APIRouter(prefix="/query", tags=["admin", "query"])

FIVETRAN_TRACKING_URL = "https://webhooks.fivetran.com/webhooks/b34e5fd5-7913-438a-993d-2ca3c464dca9"


class RunQueryInput(BaseModel):
    sql: str


class RunQueryOutput(BaseModel):
    data: dict | None


@router.post("/run", response_model=RunQueryOutput)
async def admin_run_query(input: RunQueryInput, mavis: Mavis = Depends(get_mavis)):
    query = unicodedata.normalize("NFKC", input.sql)
    data = mavis.run_query(query, as_admin=True)
    # creates the proper response when you have data
    # fivetran_track(mavis.user, FIVETRAN_TRACKING_URL, dict(action="ran_admin_query"))
    return dict(data=data.to_old() if data else None)
