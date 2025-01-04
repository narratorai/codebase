from core.graph import graph_client
from core.logger import get_logger
from core.models.user import AuthenticatedUser
from core.util.auth0 import get_api_client

logger = get_logger()


def _update_internal_access(current_user: AuthenticatedUser, allow_narrator_employee_access: bool):
    auth0_client = get_api_client()

    # get all the internal admins
    internal_admins = graph_client.get_internal_users().users

    org_id = current_user.company.auth0_org_id

    # get all the org users
    mems = auth0_client.organizations.all_organization_members(org_id)
    email_to_id = {t["email"]: t["user_id"] for t in mems["members"]}

    current_members = []
    new_members = []
    for ia in internal_admins:
        if email_to_id.get(ia.email):
            current_members.append(email_to_id[ia.email])
        else:
            auth_user = auth0_client.users_by_email.search_users_by_email(ia.email)
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
