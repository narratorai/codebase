# TODO: all the function stuff

from core.constants import (
    ADDED_TO_COMPANY_EMAIL_TEMPLATE,
    INVITED_TO_COMPANY_EMAIL_TEMPLATE,
)
from core.graph import graph_client
from core.logger import get_logger
from core.models.ids import UUIDStr
from core.models.settings import settings
from core.models.user import UserCompany
from core.util.auth0 import get_api_client
from core.util.email import send_email
from core.utils import make_local, utcnow

logger = get_logger()


def add_user_to_company_auth(company: UserCompany, user_id, email, first_name, skip_email=False):
    auth0_client = get_api_client()

    # does the user exist
    auth_users = auth0_client.users_by_email.search_users_by_email(email)

    auth_method = None

    if auth_users:
        logger.info("Adding user to organzation")
        auth0_client.organizations.create_organization_members(
            company.auth0_org_id,
            dict(members=[u["user_id"] for u in auth_users]),
        )

        # get the best auth method
        for auth_user in auth_users:
            auth_user_id = auth_user["user_id"]
            if auth_user_id.startswith("google-auth") or auth_user_id.startswith("google-oauth2"):
                auth_method = "Google Auth"
            elif not auth_method and auth_user_id.startswith("auth0"):
                auth_method = "your username and password"
            elif auth_user_id.startswith("google-apps"):
                auth_method = "Google SS0"
            elif auth_user_id.startswith("windowslive"):
                auth_method = "Microsoft Account"
            elif "|" in auth_user_id and auth_user_id.split("|")[1] == company.slug:
                auth_method = "SSO Connection (via Okta)"

        # get create the template
        template_model = dict(
            customer_name=first_name,
            auth_method=auth_method or "Your Credentials",
            user_id=user_id,
        )

        if not skip_email:
            send_email(
                company,
                to_emails=email,
                template_id=ADDED_TO_COMPANY_EMAIL_TEMPLATE,
                template_model=template_model,
                tag="welcome",
                skip_opt_out=True,
            )

    else:
        logger.info("Creating user invitation")
        # sync user to graph's Organization Auth0
        invitation = auth0_client.organizations.create_organization_invitation(
            company.auth0_org_id,
            dict(
                inviter=dict(
                    name="Narrator",
                ),
                invitee=dict(
                    email=email,
                ),
                app_metadata=dict(
                    id=user_id,
                ),
                # USES the portal application id
                client_id=settings.auth0_portal_client_id,
                send_invitation_email=False,
                ttl_sec=2_592_000,  # Set expiration to 7 days (in seconds)
            ),
        )

        # send email to user to set password
        template_model = dict(
            invitation_url=invitation["invitation_url"],
            expires_at=make_local(invitation["expires_at"], "EST", pretty=True),
            timezone="EST",
            user_id=user_id,
        )

        if not skip_email:
            send_email(
                company,
                email,
                INVITED_TO_COMPANY_EMAIL_TEMPLATE,
                template_model,
                tag="welcome",
                skip_opt_out=True,
            )
    return template_model


def remove_user_from_company_auth(user_id: UUIDStr, company: UserCompany):
    company_user = graph_client.get_company_user_id(company_id=company.id, user_id=user_id).company_user
    # Find the auth0 user
    auth0_client = get_api_client()

    auth0_users = auth0_client.users_by_email.search_users_by_email(company_user.user.email)

    if len(company_user) > 1:
        graph_client.delete_company_user(user_id=company_user.user_id, company_id=company.id)
        # remove the user from auth0
        if auth0_users:
            auth0_client.organizations.delete_organization_members(
                company.auth0_org_id,
                dict(members=[u["user_id"] for u in auth0_users]),
            )
    else:
        graph_client.delete_user(user_id=company_user.user_id)

        if auth0_users:
            auth0_client.users.delete([u["user_id"] for u in auth0_users])


def get_all_invitations(company: UserCompany) -> dict:
    auth0_client = get_api_client()
    awaiting_invitations = auth0_client.organizations.all_organization_invitations(company.auth0_org_id)
    return {i["invitee"]["email"]: i["expires_at"] for i in awaiting_invitations}


def update_inventation(email: str, company: UserCompany):
    auth0_client = get_api_client()

    current_invitations = auth0_client.organizations.all_organization_invitations(company.auth0_org_id)
    invitation = next((i for i in current_invitations if i["invitee"]["email"] == email), None)

    # handle deleting an invitiation
    if invitation and invitation["expires_at"] < utcnow():
        auth0_client.organizations.delete_organization_invitation(company.auth0_org_id, invitation["id"])
        invitation = None

    return invitation


def email_invitation(invitation, company: UserCompany, email: str):
    template_model = dict(
        invitation_url=invitation["invitation_url"],
        expires_at=make_local(invitation["expires_at"], "EST", pretty=True),
        timezone="EST",
    )

    send_email(
        company_id=company.id,
        company_slug=company.slug,
        company_name=company.name,
        local_time=make_local(utcnow(), "EST"),
        to_emails=email,
        template_id=INVITED_TO_COMPANY_EMAIL_TEMPLATE,
        template_model=template_model,
        tag="welcome",
        skip_opt_out=True,
    )
