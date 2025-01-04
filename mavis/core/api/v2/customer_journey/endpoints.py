from fastapi import APIRouter, Depends

from core.api.auth import get_mavis
from core.errors import SilenceError
from core.logger import get_logger
from core.utils import date_add, utcnow
from core.v4.mavis import Mavis

from .helpers import find_customers_for_activity, get_attributes, get_customer_journey, search_customer_table
from .models import ActivityJourneyOutput, JourneyAttribute, JourneyOutput, SearchOutput

router = APIRouter(prefix="/customer_journey", tags=["customer journey"])
logger = get_logger()


@router.get("/{table_id}/attributes", response_model=JourneyAttribute)
async def fetch_customer_attributes(
    table_id: str,
    customer: str,
    run_live: bool = False,
    mavis: Mavis = Depends(get_mavis),
) -> JourneyAttribute:
    attributes = get_attributes(mavis, table_id, customer, run_live)

    if attributes is None:
        logger.debug("No Customer dim for", table_id=table_id)
        raise SilenceError("Customer dimension table not found")

    return attributes


@router.get("/{table_id}/search", response_model=SearchOutput)
async def search_customers(
    table_id: str,
    search_term: str,
    mavis: Mavis = Depends(get_mavis),
) -> SearchOutput:
    searched_output = search_customer_table(mavis, table_id, search_term)

    if searched_output is None:
        raise SilenceError("Customer dimension table not found")

    return SearchOutput(customer_options=searched_output)


@router.get("/{table_id}/events", response_model=JourneyOutput)
async def fetch_all_actvities(
    table_id: str,
    customer: str,
    use_anonymous_id: bool = False,
    limit: int = 200,
    offset: int = 0,
    desc: bool = True,
    run_live: bool = False,
    mavis: Mavis = Depends(get_mavis),
):
    journey = get_customer_journey(
        mavis,
        table_id,
        customer,
        use_anonymous_id=use_anonymous_id,
        limit=limit,
        offset=offset,
        is_asc=not desc,
        run_live=run_live,
    )
    return journey


@router.get("/{table_id}/activity/{activity_slug}/examples", response_model=ActivityJourneyOutput)
async def get_activity_examples(
    table_id: str,
    activity_slug: str,
    from_time: str | None = None,
    mavis: Mavis = Depends(get_mavis),
):
    since = from_time or date_add(utcnow(), "day", -30)
    examples = find_customers_for_activity(mavis, table_id, activity_slug, since)

    return ActivityJourneyOutput(examples_found=examples)
