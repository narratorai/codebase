from typing import Literal

from fastapi import APIRouter, Depends

from core.api.auth import get_mavis
from core.api.customer_facing.activities.utils import ActivitiesQueryBuilder
from core.errors import InvalidPermission, SilenceError
from core.graph.sync_client.enums import access_role_enum
from core.logger import get_logger
from core.v4.mavis import Mavis

from .helpers import (
    find_customers_for_activity,
    get_attributes,
    get_customer_journey,
    search_customer_table,
)
from .models import GetJourneyOutput, JourneyAttribute, JourneyEventsOutput, QueryParams

router = APIRouter(prefix="/journeys", tags=["customer_journey"])
logger = get_logger()


@router.get(
    "/{table_id}",
    response_model=GetJourneyOutput,
    name="Get a list of customer that can be used for a journey",
    description="Get a list of customer that can be used for a journey",
)
async def get_all(
    table_id: str,
    params: QueryParams = Depends(QueryParams),
    mavis: Mavis = Depends(get_mavis),
):
    mavis.user.require_role(access_role_enum.view_customer_journey)
    if params.activity_id is not None:
        activities = ActivitiesQueryBuilder(mavis=mavis).get_with_permissions([params.activity_id])
        if len(activities) == 0:
            raise InvalidPermission("You do not have access to this activity")

        if params.search:
            raise NotImplementedError("Search by activity is not supported yet")
        else:
            searched_output = find_customers_for_activity(mavis, table_id, activities[0]["slug"], params.run_live)
    elif params.search is not None:
        searched_output = search_customer_table(mavis, table_id, params.search)
    else:
        raise ValueError("No search term or activity id provided")

    return GetJourneyOutput(total_count=len(searched_output), page=1, per_page=100, data=searched_output)


@router.get("/{table_id}/attributes", response_model=JourneyAttribute)
async def fetch_customer_attributes(
    table_id: str,
    customer: str,
    run_live: bool = False,
    mavis: Mavis = Depends(get_mavis),
) -> JourneyAttribute:
    mavis.user.require_role(access_role_enum.view_customer_journey)
    attributes = get_attributes(mavis, table_id, customer, run_live)

    if attributes is None:
        logger.debug("No Customer dim for", table_id=table_id)
        raise SilenceError("Customer dimension table not found")

    return attributes


@router.get("/{table_id}/events", response_model=JourneyEventsOutput)
async def fetch_all_actvities(
    table_id: str,
    customer: str,
    use_anonymous_id: bool = False,
    limit: int = 200,
    offset: int = 0,
    desc: bool = True,
    activity_action: Literal["include", "exclude"] | None = None,
    limit_activities: list[str] | None = None,
    from_time: str | None = None,
    to_time: str | None = None,
    run_live: bool = False,
    mavis: Mavis = Depends(get_mavis),
):
    mavis.user.require_role(access_role_enum.view_customer_journey)
    journey = get_customer_journey(
        mavis,
        table_id,
        customer,
        use_anonymous_id=use_anonymous_id,
        activity_action=activity_action,
        limit_activities=limit_activities,
        limit=limit,
        offset=offset,
        is_asc=not desc,
        run_live=run_live,
        from_time=from_time,
        to_time=to_time,
    )
    return journey
