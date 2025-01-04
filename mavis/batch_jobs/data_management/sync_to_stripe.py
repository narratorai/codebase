import time

import stripe

from core import utils
from core.constants import (
    INTERNAL_EMAIL_TEMPLATE,
    STRIPE_PRODUCT_ID,
    TRIAL_DAYS,
)
from core.decorators import mutex_task, with_mavis
from core.errors import ForbiddenError
from core.graph import graph_client
from core.graph.sync_client.enums import company_status_enum
from core.logger import get_logger
from core.models.ids import get_uuid4
from core.models.internal_link import PORTAL_URL
from core.models.settings import settings
from core.util.email import send_email
from core.v4.blocks.company_edit import archive_company
from core.v4.mavis import Mavis

logger = get_logger()


def _check_fivex_ussage(mavis):
    all_companies = graph_client.get_fivex_companies().company

    two_weeks_ago = utils.date_add(utils.utcnow(), "day", -14)
    all_companies = [c for c in all_companies if c.created_at < two_weeks_ago]
    send_email(
        mavis.company,
        "ahmed@narrator.ai",
        INTERNAL_EMAIL_TEMPLATE,
        dict(
            process="FiveX Companies",
            notes=f"Five X has {len(all_companies)}: {', '.join([c.name for c in all_companies])}",
        ),
    )


@mutex_task()
@with_mavis
def sync_to_stripe(mavis: Mavis, **kwargs):
    if mavis.company.slug != "narrator":
        raise ForbiddenError("This batch job is only for the narrator instance")

    _check_fivex_ussage(mavis)
    # Get all active companies service
    stripe.api_key = settings.stripe_key.get_secret_value()

    # If there is a company that is archived in Narrator then it should be deleted in auth0
    # get all the companies in graph
    all_companies = graph_client.get_all_companies_with_user_and_limit().company

    notice_60_days = utils.date_add(utils.utcnow(), "day", -60)

    for company in all_companies:
        if company.demo_company:
            logger.info(f"Demo company: {company.slug}")
            continue

        add_days = TRIAL_DAYS if len(company.service_limits) == 1 else 0
        active_limits = [
            limit
            for limit in company.service_limits
            if limit.start_on
            and utils.date_add(limit.start_on, "day", -1 * add_days) < utils.utcnow() < (limit.end_on or "2100-01-01")
        ]

        # no subscription
        if len(active_limits) == 0 and company.created_at < utils.date_add(utils.utcnow(), "day", -TRIAL_DAYS):
            if company.status == company_status_enum.missing_payment:
                # archive the company
                archive_company(company.id)
                continue

            elif company.created_for_user and company.created_for_user.email == "platformadmin@5x.co":
                logger.info(f"5x company: {company.slug}")
                continue

            logger.info(f"NO ACTIVE LIMITS FOR {company.slug}")
            send_email(
                mavis.company,
                "ahmed@narrator.ai",
                INTERNAL_EMAIL_TEMPLATE,
                dict(
                    company_slug=company.slug,
                    company_name=company.name,
                    company_url=PORTAL_URL + f"/{company.slug}",
                    process=f"MISSISNG any active Service limit FOR {company.slug}",
                    notes="The company does not have any active service limits",
                ),
            )

        # endign subscription
        limit = next(
            (limit.end_on < notice_60_days for limit in active_limits if limit.end_on),
            None,
        )

        if limit:
            logger.info(f"LIMIT ENDING IN {company.slug}")
            send_email(
                mavis.company,
                "ahmed@narrator.ai",
                INTERNAL_EMAIL_TEMPLATE,
                dict(
                    company_slug=company.slug,
                    company_name=company.name,
                    company_url=PORTAL_URL + f"/{company.slug}",
                    process=f"{utils.date_diff(limit.end_on, utils.utcnow(), 'day')} Day Notice FOR {company.slug}",
                    notes="The company has hit its notice limit, please make sure we update the service limit",
                ),
            )

        # find the customer
        search_customers = stripe.Customer.search(
            query=f"metadata['company_id']:'{company.id}'",
        )

        # create the company if it doesn't exist
        if not search_customers.data:
            continue

        stripe_customer = search_customers.data[0]
        # check the subscription of the customer
        subscriptions = stripe.Subscription.list(customer=stripe_customer["id"])["data"]

        if not subscriptions:
            if len(active_limits) > 0:
                send_email(
                    mavis.company,
                    "ahmed@narrator.ai",
                    INTERNAL_EMAIL_TEMPLATE,
                    dict(
                        company_slug=company.slug,
                        company_name=company.name,
                        company_url=PORTAL_URL + f"/{company.slug}",
                        process=f"Limit and No Subscription FOR {company.slug}",
                        notes="The company has a service limit but no subscription, please make sure we update the service limit",
                    ),
                )
        else:
            stripe_subscription_item = next(
                (p for p in subscriptions[0]["items"]["data"] if p["price"]["product"] == STRIPE_PRODUCT_ID),
                None,
            )

        # Don't bother if there is no subscription
        if subscriptions and stripe_subscription_item:
            # UPDATE USER COUNT
            subscription_item_id = stripe_subscription_item["id"]

            # The usage number you've been keeping track of in your database for
            timestamp = int(time.time())

            # The idempotency key allows you to retry this usage record call if it fails.
            idempotency_key = get_uuid4()

            current_users = len(company.company_users)

            # update stripe
            try:
                stripe.SubscriptionItem.create_usage_record(
                    subscription_item_id,
                    quantity=current_users,
                    timestamp=timestamp,
                    action="set",
                    idempotency_key=idempotency_key,
                )
                new_price = (
                    500.0
                    + 100 * min(max(0, current_users - 5), 5)
                    + 50 * min(max(0, current_users - 10), 50)
                    + 25 * max(0, current_users - 50)
                )

                if new_price != sum(float(limit.monthly_price or 0) for limit in active_limits):
                    logger.info(f"UPDATING PRICE FOR {company.slug} to {new_price}")
                    graph_client.insert_service_limit(
                        user_limit=current_users,
                        # update the price
                        monthly_price=new_price,
                        name="Standard Platform",
                        company_id=company.id,
                        start_on=utils.utcnow()[:10],
                    )

            except stripe.error.StripeError as e:
                send_email(
                    mavis.company,
                    "ahmed@narrator.ai",
                    INTERNAL_EMAIL_TEMPLATE,
                    dict(
                        company_slug=company.slug,
                        company_name=company.name,
                        company_url=PORTAL_URL + f"/{company.slug}",
                        process=f"Creating Service limit for {company.slug}",
                        notes="Usage report failed for item ID %s with idempotency key %s: %s"
                        % (
                            subscription_item_id,
                            idempotency_key,
                            utils.get_error_message(e),
                        ),
                    ),
                )

            # Update the service limit
        elif active_limits:
            allowed_users = sum(lim.user_limit if lim.user_limit is not None else 1000000 for lim in active_limits)
            allowed_admins = sum(
                lim.admin_user_limit if lim.admin_user_limit is not None else 1000000 for lim in active_limits
            )

            current_admins = 0
            current_users = 0

            for c in company.company_users:
                if c.role == c.role.admin:
                    current_admins += 1
                else:
                    current_users += 1

            if allowed_admins < current_admins or allowed_users < current_users:
                logger.info("Notifying of exceeded limit", company_slug=company.slug)
                send_email(
                    mavis.company,
                    "ahmed@narrator.ai",
                    INTERNAL_EMAIL_TEMPLATE,
                    dict(
                        company_slug=company.slug,
                        company_name=company.name,
                        company_url=PORTAL_URL + f"/{company.slug}",
                        process=f"Company Exceeded limits {company.slug}",
                        notes=f"allowed admins: {allowed_admins} current admins: {current_admins} \n <br> \n allowed users: {allowed_users} current users: {current_users}",
                    ),
                )
