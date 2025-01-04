import stripe
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from core import utils
from core.api.auth import get_current_company, get_mavis
from core.constants import (
    ENTERPRISE_ONBOARDING_EMAIL_TEMPLATE,
    STRIPE_CONFIGURATION_ID,
    STRIPE_PRICE_ID,
    TRIAL_DAYS,
)
from core.errors import UnexpectedError
from core.graph import graph_client
from core.models.company import Company
from core.models.internal_link import PORTAL_URL
from core.models.settings import settings
from core.util.email import send_email
from core.v4.mavis import Mavis

router = APIRouter(prefix="/billing", tags=["admin", "billing"])

stripe.api_key = settings.stripe_key.get_secret_value()


class Result(BaseModel):
    success: bool = True


class IntentResults(BaseModel):
    client_secret: str
    id: str


class ValidationData(BaseModel):
    apiAccess: bool | None
    dataTeamRequests: int | None
    integrations: bool | None
    sso: bool | None


@router.post("/validate", response_model=Result)
@router.get("/validate", response_model=Result)
async def validate_billing(input: ValidationData, mavis: Mavis = Depends(get_mavis)):
    query = f"metadata['company_id']:'{mavis.company.id}'"
    stripe_customer = stripe.Customer.search(query=query)["data"][0]
    credit_cards = stripe.Customer.list_payment_methods(stripe_customer["id"], type="card")["data"]

    if not credit_cards:
        raise ValueError("Please add a valid credit card to your account")

    if credit_cards[0]["billing_details"]["address"] is None:
        raise ValueError("Please add the company address (we need this for tax purposes)")

    # update the address based on the billing address
    stripe.Customer.modify(
        stripe_customer["id"],
        address=credit_cards[0]["billing_details"]["address"],
        invoice_settings={"default_payment_method": credit_cards[0]["id"]},
    )

    # Get all the subscriptions
    subscriptions = stripe.Subscription.list(customer=stripe_customer["id"])["data"]
    # look for the correct subscription
    if subscriptions:
        # check if they have the subscription
        stripe_subscription_item = next(
            (p for p in subscriptions[0]["items"]["data"] if p["price"]["id"] == STRIPE_PRICE_ID),
            None,
        )

    if not subscriptions or stripe_subscription_item is None:
        # create the service limit
        graph_client.insert_service_limit(
            company_id=mavis.company.id,
            user_limit=5,
            monthly_price=500,
            name="Standard Platform",
            start_on=utils.date_add(utils.utcnow(), "day", TRIAL_DAYS)[:10],
        )
        # create the subscription item in strip
        stripe.Subscription.create(
            customer=stripe_customer["id"],
            items=[
                # this is the tiered price
                {"price": STRIPE_PRICE_ID},
            ],
            trial_period_days=TRIAL_DAYS,
        )

    # update the company status
    company = mavis.company
    datasource_option = mavis.get_datasource()
    if datasource_option:
        graph_client.update_company_status(company_id=company.id, status="active")
    else:
        graph_client.update_company_status(company_id=company.id, status="onboarding")

    if input and any(v for v in input.dict().values() if v):
        send_email(
            mavis.company,
            settings.data_alert_recipients,
            ENTERPRISE_ONBOARDING_EMAIL_TEMPLATE,
            template_model={
                "interest": [dict(key=k, value=v) for k, v in input.dict().items()],
            },
            tag="enterprise-interest",
        )

    return dict(success=True)


@router.post("/cancel", response_model=Result)
async def cancel_billing(company: Company = Depends(get_current_company)):
    # TODO: actually finish this
    query = f"metadata['company_id']:'{company.id}'"
    stripe_customer = stripe.Customer.search(query=query)["data"][0]
    subscriptions = stripe.Subscription.list(customer=stripe_customer["id"])

    # Cancel at the end of pay period
    for s in subscriptions[0]["items"]["data"]:
        stripe.Subscription.modify(s["id"], cancel_at_period_end=True)

    return dict(success=True)


@router.post("/setup_intent", response_model=dict)
@router.get("/setup_intent", response_model=dict)
async def crete_setup_intent(company: Company = Depends(get_current_company)):
    """
    Creates a stripe setup intent.
    See https://docs.stripe.com/api/setup_intents/object
    """
    query = f"metadata['company_id']:'{company.id}'"
    customers = stripe.Customer.search(query=query)["data"]

    if customers:
        stripe_customer = customers[0]
        return stripe.SetupIntent.create(
            customer=stripe_customer["id"],
            payment_method_types=["card", "us_bank_account"],
            use_stripe_sdk=True,
        )
    else:
        raise UnexpectedError("No customer found")


@router.get("/session", response_model=dict)
async def get_billing_session(company: Company = Depends(get_current_company)):
    query = f"metadata['company_id']:'{company.id}'"
    stripe_customer = stripe.Customer.search(query=query)["data"][0]

    return stripe.billing_portal.Session.create(
        customer=stripe_customer["id"],
        configuration=STRIPE_CONFIGURATION_ID,
        return_url=f"{PORTAL_URL}/{company.slug}/manage/billing",
    )
