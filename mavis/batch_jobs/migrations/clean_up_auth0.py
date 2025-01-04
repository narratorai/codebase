import structlog

from core.graph import graph_client
from core.util.auth0 import get_api_client

logger = structlog.get_logger()


def clean_up_auth0(company_slug: str):
    if company_slug != "narrator":
        raise Exception("This batch job is only for the narrator instance")

    auth_client = get_api_client()
    # If there is a company that is archived in Narrator then it should be deleted in auth0
    # get all the companies in graph
    company_users = graph_client.execute(
        """
        query GetAllCompanies {
            company(where: {status: {_neq: archived}}) {
                id
                name
                slug
                company_users {
                    user {
                        email
                    }
                }
            }
        }
        """
    ).json()["data"]["company"]

    internal_companies = {c["slug"]: {u["user"]["email"] for u in c["company_users"]} for c in company_users}
    internal_admins = graph_client.execute(
        """
        query GetInternalUsers {
            users: user(where: {role: {_eq: internal_admin}}) {
                email
            }
        }
        """
    ).json()["data"]["users"]

    internal_admin_emails = {i["email"] for i in internal_admins}

    page = 0
    keep_going = True

    while keep_going:
        # get all the companies in auth0
        auth0_orgs = auth_client.organizations.all_organizations(page=page)

        # delete the companies in auth0 that are not in graph
        for org in auth0_orgs["organizations"]:
            # goo through the company and delete it
            if not internal_companies.get(org["name"]):
                # delete all the users unless they are part of another org
                all_users = auth_client.organizations.all_organization_members(org["id"])

                for user in all_users["members"]:
                    if not any(user["email"] in v for k, v in internal_companies.items() if k != org["name"]):
                        logger.info(f'DELETE User: {user["email"]}')
                        auth_client.users.delete(user["user_id"])

                logger.info(f'DELETE ORG: {org["name"]}')
                auth_client.organizations.delete_organization(org["id"])
            else:
                all_users = auth_client.organizations.all_organization_members(org["id"])
                remove_members = []

                for user in all_users["members"]:
                    if (
                        user["email"] not in internal_companies[org["name"]]
                        and user["email"] not in internal_admin_emails
                    ):
                        remove_members.append(user["user_id"])

                # remove the members
                if remove_members:
                    logger.info("deleting members")
                    auth_client.organizations.delete_organization_members(org["id"], dict(members=remove_members))

        page += 1
        # keep going if we are looking at all values
        keep_going = (auth0_orgs["start"] + auth0_orgs["limit"]) < auth0_orgs["total"]
