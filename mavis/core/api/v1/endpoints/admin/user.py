from fastapi import APIRouter, Depends
from pydantic import BaseModel

from core.api.auth import get_current_company, get_mavis
from core.api.customer_facing.users.utils import UserManager
from core.constants import (
    INVITED_TO_COMPANY_EMAIL_TEMPLATE,
)
from core.graph import graph_client
from core.graph.sync_client.enums import access_role_enum, company_user_role_enum
from core.logger import get_logger
from core.models.company import Company
from core.models.ids import UUIDStr
from core.models.user import get_user_company
from core.util.auth0 import get_api_client
from core.util.email import send_email
from core.utils import make_local, utcnow
from core.v4.mavis import Mavis

router = APIRouter(prefix="/user", tags=["admin", "user"])
logger = get_logger()


class Results(BaseModel):
    success: bool
    reason: str | None


class UserCreate(Results):
    user_id: str
    company_user_id: str


class TranferUserInput(BaseModel):
    from_user_id: str
    to_user_id: str


class DeleteUser(BaseModel):
    user_id: str
    to_user_id: str


class UpdateAccess(BaseModel):
    allow_narrator_employee_access: bool = False


class NewUserInput(BaseModel):
    email: str
    first_name: str | None
    last_name: str | None
    role: company_user_role_enum = company_user_role_enum.user


@router.post("/transfer", response_model=Results)
async def transfer_user_items(input: TranferUserInput, current_company: Company = Depends(get_current_company)):
    """Transfer a user's items to another user."""
    graph_client.transfer_user_items(
        company_id=current_company.id,
        user_id=input.from_user_id,
        new_user_id=input.to_user_id,
    )
    return dict(success=True)


@router.post("/delete", response_model=Results)
async def delete_user(input: DeleteUser, current_company: Company = Depends(get_current_company)):
    """Delete a user from a company."""
    if remove_user_from_company(
        user_id=input.user_id,
        to_user_id=input.to_user_id,
        current_company=current_company,
    ):
        return dict(success=True)
    else:
        return dict(success=False, reason="User is the last user in the company")


def transfer_all_user_items(*, company_id: UUIDStr, user_id: UUIDStr, to_user_id: UUIDStr):
    company_users = graph_client.get_company_user_id(user_id=to_user_id, company_id=company_id).company_user

    try:
        to_company_user = company_users[0]
    except StopIteration:
        return False
    else:
        graph_client.transfer_api_keys(
            company_id=company_id,
            user_id=user_id,
            new_company_user_id=to_company_user.id,
        )
        graph_client.transfer_user_items(user_id=user_id, new_user_id=to_user_id, company_id=company_id)


def remove_user_from_company(*, user_id: UUIDStr, to_user_id: UUIDStr, current_company: Company):
    transfer_all_user_items(company_id=current_company.id, user_id=user_id, to_user_id=to_user_id)

    # get all companies for user
    company_user = graph_client.get_user_companies(user_id=user_id).company_user
    current_user = graph_client.get_user(id=user_id).user_by_pk
    auth_org = graph_client.get_auth_org(company_id=current_company.id).auth[0]

    # Find the auth0 user
    auth0_client = get_api_client()
    auth0_users = auth0_client.users_by_email.search_users_by_email(current_user.email)

    if len(company_user) > 1:
        graph_client.delete_company_user(user_id=user_id, company_id=current_company.id)
        # remove the user from auth0
        if auth0_users:
            auth0_client.organizations.delete_organization_members(
                auth_org.org_id, dict(members=[u["user_id"] for u in auth0_users])
            )
    else:
        graph_client.delete_user(user_id=user_id)

        if auth0_users:
            auth0_client.users.delete([u["user_id"] for u in auth0_users])

    # refresh the caches
    get_user_company(user_id, auth_org.org_id, refresh_cache=True)
    return True


@router.post("", response_model=Results)
@router.post("/new", response_model=Results)
async def new_user(input: NewUserInput, mavis: Mavis = Depends(get_mavis)):
    """Create a new user."""
    return _new_user(input, mavis)


def _new_user(input: NewUserInput, mavis: Mavis):
    user_id, company_user_id = _add_user_to_company(
        mavis,
        email=input.email,
        first_name=input.first_name,
        last_name=input.last_name,
        role=input.role,
    )

    return dict(success=True, user_id=user_id, company_user_id=company_user_id)


@router.post("/update_internal_access", response_model=Results)
async def update_internal_access(input: UpdateAccess, mavis: Mavis = Depends(get_mavis)):
    """Give Narrator access to the company."""
    _update_internal_access(mavis, input.allow_narrator_employee_access)
    graph_client.execute(
        """
        mutation UpdateCompany(
            $id: uuid!
            $allow_narrator_employee_access: Boolean!
        ) {
            update_company_by_pk(
                pk_columns: { id: $id }
                _set: {
                    allow_narrator_employee_access: $allow_narrator_employee_access
                }
            ) {
                id
            }
        }
        """,
        dict(
            id=mavis.company.id,
            allow_narrator_employee_access=input.allow_narrator_employee_access,
        ),
    )

    return dict(success=True)


@router.patch("/{user_id}", response_model=Results)
async def update_user(
    user_id: UUIDStr,
    input: NewUserInput,
    current_company: Company = Depends(get_current_company),
):
    _update_user(user_id, input, current_company)

    return dict(success=True)


@router.post("/resend_invitation", response_model=Results)
async def resend_invitation(input: NewUserInput, mavis: Mavis = Depends(get_mavis)):
    return _resend_invitation(mavis, input.email, input.first_name, input.last_name)


def _resend_invitation(
    mavis: Mavis,
    email: str,
    role=company_user_role_enum.user,
    first_name=None,
    last_name=None,
):
    data = graph_client.get_auth_org(company_id=mavis.company.id)
    auth_org = data.auth[0]
    auth0_client = get_api_client()

    current_invitations = auth0_client.organizations.all_organization_invitations(auth_org.org_id)
    invitation = next((i for i in current_invitations if i["invitee"]["email"] == email), None)

    # handle deleting an invitiation
    if invitation and invitation["expires_at"] < utcnow():
        auth0_client.organizations.delete_organization_invitation(auth_org.org_id, invitation["id"])
        invitation = None

    # if the invitation exists then resend it
    if invitation:
        template_model = dict(
            invitation_url=invitation["invitation_url"],
            expires_at=make_local(invitation["expires_at"], mavis.company.timezone, pretty=True),
            timezone=mavis.company.timezone,
        )
        send_email(
            mavis.company,
            email,
            INVITED_TO_COMPANY_EMAIL_TEMPLATE,
            template_model,
            tag="welcome",
        )
        return dict(success=True, reason="Invitation Resent")
    else:
        user_id, company_user_id = _add_user_to_company(
            mavis, email=email, first_name=first_name, last_name=last_name, role=role
        )
        return dict(success=True, user_id=user_id, company_user_id=company_user_id)


def _update_internal_access(mavis: Mavis, allow_narrator_employee_access: bool):
    auth0_client = get_api_client()

    # Get the company info you need
    company = graph_client.get_auth_org(company_id=mavis.company.id).auth[0]
    logger.debug("auth0 org fetched", org_id=company.org_id)

    # get all the internal admins
    data = graph_client.execute(
        """
        query GetInternalUsers {
            users: user(where: {role: {_eq: internal_admin}}) {
                email
            }
        }
        """
    ).json()
    internal_admins = data["data"]["users"]

    org_id = company.org_id

    # get all the org users
    mems = auth0_client.organizations.all_organization_members(org_id)
    email_to_id = {t["email"]: t["user_id"] for t in mems["members"]}

    current_members = []
    new_members = []
    for ia in internal_admins:
        if email_to_id.get(ia["email"]):
            current_members.append(email_to_id[ia["email"]])
        else:
            auth_user = auth0_client.users_by_email.search_users_by_email(ia["email"])
            user_id = next(
                (u["user_id"] for u in auth_user if u["user_id"].startswith("google-oauth2")),
                None,
            )

            if user_id:
                logger.info("Adding member")
                new_members.append(user_id)

    # create or remove the members
    if allow_narrator_employee_access and new_members:
        auth0_client.organizations.create_organization_members(org_id, dict(members=new_members))
    elif not allow_narrator_employee_access and current_members:
        auth0_client.organizations.delete_organization_members(org_id, dict(members=current_members))


def _add_user_to_company(
    mavis: Mavis,
    *,
    email: str,
    first_name: str = None,
    last_name: str = None,
    role: company_user_role_enum = company_user_role_enum.user,
    skip_email=False,
):
    user_updator = UserManager(mavis.company.current_user)
    (user_id, company_user_id) = user_updator.create(
        email=email, first_name=first_name, last_name=last_name, skip_email=skip_email
    )
    _update_role(user_updator, user_id, role)

    return (user_id, company_user_id)


def _update_role(user_updator: UserManager, user_id, role):
    company_user_id = user_updator.get_company_user(user_id).id
    if role == company_user_role_enum.admin:
        user_updator.add_role(user_id, role=access_role_enum.admin)
    else:
        user_updator.delete_role(user_id, role=access_role_enum.admin)

    graph_client.update_role(id=company_user_id, role=role)


def _update_user(user_id: UUIDStr, input: NewUserInput, current_company: Company):
    user_updator = UserManager(current_company.current_user)
    user_updator.update_properties(
        user_id,
        first_name=input.first_name,
        last_name=input.last_name,
    )
    _update_role(user_updator, user_id, input.role)

    graph_client.add_user_to_company(
        company_id=current_company.id,
        user_id=user_id,
        first_name=input.first_name,
        last_name=input.last_name,
        role=input.role,
    )
