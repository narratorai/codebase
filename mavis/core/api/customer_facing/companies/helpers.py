import stripe
from python_terraform import IsFlagged, IsNotFlagged, Terraform

from core import utils
from core.api.customer_facing.accesses.helpers import _update_internal_access
from core.api.customer_facing.users.utils import UserManager
from core.api.v1.api_keys.helpers import create_api_key
from core.constants import GETTING_STARTED_EMAIL_TEMPLATE
from core.graph import graph_client
from core.graph.sync_client.enums import company_user_role_enum
from core.logger import get_logger
from core.models.company import query_graph_company
from core.models.settings import settings
from core.models.user import AuthenticatedUser, UserCompany, UserTags
from core.util.auth0 import get_api_client
from core.util.email import send_email

logger = get_logger()


def create_tag(company_id: str, name: str, color: str | None = None):
    if color is None:
        color = utils.new_color()
    return graph_client.insert_tag(company_id=company_id, tag=name, color=color).inserted_tag


def archive_company(company: UserCompany):
    company_id = company.id
    auth_client = get_api_client()
    # delete the org
    auth_client.organizations.delete_organization(company.auth0_org_id)

    # handle stripe
    stripe.api_key = settings.stripe_key.get_secret_value()
    customers = stripe.Customer.search(
        query=f"metadata['company_id']:'{company_id}'",
    ).to_dict()["data"]
    if customers:
        subscriptions = stripe.Subscription.list(customer=customers[0]["id"]).to_dict()["data"]

        # delete all subscriptions
        for sub in subscriptions:
            stripe.Subscription.delete(sub["id"])

    # archive the company
    graph_client.archive_company(company_id=company_id)

    query_graph_company(company.slug, True)
    return None


def create_key_for_user(user: AuthenticatedUser, label: str | None = None, ttl: int | None = None):
    relationships = graph_client.get_all_companies_for_user(user_id=user.id).company_user

    try:
        company = user.company
        company_user = next(filter(lambda x: x.company_id == company.id, relationships))
        data = graph_client.create_company_user_api_key(company_user_id=company_user.id, label=label).inserted_api_key

        if data:
            key_id = data.id
            api_key = create_api_key(key_id=key_id, user_id=user.id, company=company, ttl=ttl)

            return data, api_key
    except StopIteration:
        return None


def create_resources(company_slug: str, region="US"):
    # replace this path and move the terraform module inside mavis to make our life easier
    if region == "US":
        working_dir = "terraform/company-provisioner/"
    elif region == "EU":
        working_dir = "terraform/company-provisioner-eu/"
    else:
        raise ValueError(f"Invalid region: {region}")

    tf = Terraform(working_dir=working_dir)
    tf.init(backend_config={"key": f"customers/{company_slug}/terraform.tfstate"})

    # add checks to the code if something goes wrong to handle the error and report it to sentry
    tf.apply(
        no_color=IsFlagged,
        refresh=False,
        skip_plan=True,
        var={"company_slug": company_slug},
    )

    terraform_outputs = tf.output()

    return {
        "bucket_name": terraform_outputs["bucket_name"]["value"],
        "key_arn": terraform_outputs["key_arn"]["value"],
        "read_arn": terraform_outputs["read_arn"]["value"],
        "role_arn": terraform_outputs["role_arn"]["value"],
        "write_arn": terraform_outputs["write_arn"]["value"],
    }


def create_company_resources(company_id: str, company_slug: str, region: str):
    logger.info("Creating company resources", company_slug=company_slug, region=region)

    # create the company resources
    output_variables = create_resources(company_slug, region)

    graph_client.insert_company_resources(
        company_id=company_id,
        s3_bucket=output_variables["bucket_name"],
        kms_key=output_variables["key_arn"],
        company_role=output_variables["role_arn"],
        read_policy=output_variables["read_arn"],
        write_policy=output_variables["write_arn"],
    )


def create_stripe_customer(company_id: str, company_slug: str, name: str, email: str):
    logger.info("Creating company in stripe")
    stripe.api_key = settings.stripe_key.get_secret_value()

    customers = stripe.Customer.search(query=f"metadata['company_id']:'{company_id}'")
    if not customers.data:
        stripe.Customer.create(
            name=name,
            description=name,
            email=email,
            metadata=dict(company_id=company_id, company_name=company_slug),
        )


def destroy_resources(company_slug):
    tf = Terraform(working_dir="terraform/company-provisioner/")
    tf.init(backend_config={"key": f"customers/{company_slug}/terraform.tfstate"})
    tf.destroy(
        capture_output="yes",
        no_color=IsFlagged,
        force=IsNotFlagged,
        auto_approve=True,
        var={"company_slug": company_slug},
    )


def upsert_company(user_id: str, slug: str, region: str = "US", is_demo: bool = False):
    try:
        name = utils.title(slug)

        logger.info("Creating company", slug=slug, name=name, region=region, is_demo=is_demo)
        company_id = graph_client.insert_company(
            slug=slug,
            name=name,
            created_for=user_id,
            is_demo=is_demo,
            region=region,
        ).insert_company_one.id

    except Exception as e:
        if "valid_slug" in utils.get_error_message(e):
            raise ValueError("Invalid slug. Please keep it to only letter, number and `-`.") from e

        current_comp = graph_client.get_company(slug=slug).companies

        if not current_comp:
            raise ValueError from e

        if current_comp[0].created_at < utils.date_add(utils.utcnow(), "day", -1):
            raise ValueError("This slug is old and has already been used") from e
        company_id = graph_client.get_company(slug=slug).companies[0].id

    return company_id


def create_auth0_org(company_id: str, company_slug: str):
    logger.debug("Getting auth0 org")
    auth_org = graph_client.get_auth_org(company_id=company_id).auth

    if auth_org:
        return auth_org[0].org_id
    else:
        logger.debug("Creating the auth0 org")

        auth0_client = get_api_client()
        try:
            auth0_org = auth0_client.organizations.create_organization(
                dict(
                    name=company_slug,
                    display_name=utils.title(company_slug),
                    metadata=dict(id=company_id),
                )
            )
        except Exception:
            logger.info("Organization already exists")
            auth0_org = auth0_client.organizations.get_organization_by_name(company_slug)

        try:
            auth0_client.organizations.create_organization_connection(
                auth0_org["id"], dict(connection_id="con_QgT5XPWydjKhbaM5")
            )
        except Exception:
            logger.info("Connection already exists")

        try:
            auth0_client.organizations.create_organization_connection(
                auth0_org["id"], dict(connection_id="con_Rz1xgcGoJFArXTNW")
            )
        except Exception:
            logger.info("Connection already exists")

        try:
            graph_client.insert_company_org(company_id=company_id, org_id=auth0_org["id"])
        except Exception:
            logger.info("Updating the auth0 org for the company")
            graph_client.update_company_with_auth0_org(company_id=company_id, org_id=auth0_org["id"])

        return auth0_org["id"]


def get_connections(org_id: str):
    auth0_client = get_api_client()
    return auth0_client.organizations.all_organization_connections(org_id)


def update_connections(org_id: str, connections: list[str]):
    auth0_client = get_api_client()
    current_connections = auth0_client.organizations.all_organization_connections(org_id)
    for connection in current_connections:
        if connection not in connections:
            auth0_client.organizations.delete_organization_connection(org_id, connection["id"])
        else:
            connections.remove(connection)

    for connection in connections:
        auth0_client.organizations.create_organization_connection(org_id, dict(connection_id=connection))


def create_company(
    current_user_id: str,
    slug: str,
    email: str,
    payment_handled: bool = False,
    is_demo: bool = False,
    region: str = "US",
):
    company_id = upsert_company(current_user_id, slug, region, is_demo)

    # create the teams
    everyone_id = graph_client.insert_team(company_id, "Everyone").insert_team_one.id

    auth_org_id = create_auth0_org(company_id, slug)

    # create all the necessary company resources
    create_company_resources(company_id, slug, region)

    # manually create it since it doesn't exist yet
    current_user = AuthenticatedUser(  # noqa: S106
        id=current_user_id,
        email=email,
        tags=UserTags(favorite=None, recently_viewed=None),
        is_admin=True,
        is_internal_admin=True,
        company=UserCompany(
            id=company_id, slug=slug, name=utils.title(slug), auth0_org_id=auth_org_id, everyone_team_id=everyone_id
        ),
        token="",
    )

    # reset the company object
    query_graph_company(slug, refresh_cache=True)

    # Flip status to onboarding
    logger.info("Updating company status")
    graph_client.update_company_status(company_id=company_id, status="onboarding")

    logger.info("Syncing internal users")
    _update_internal_access(current_user, True)

    create_stripe_customer(company_id, slug, name=slug, email=email)
    if not payment_handled:
        graph_client.update_company_status(company_id=company_id, status="missing_payment")
        # When we flip it, we should collect the users ADDRESS and CREDIT CARD
    else:
        logger.info("updating company status")
        graph_client.update_company_status(company_id=company_id, status="onboarding")

    # add the user to the company and get the invite url
    logger.info("Adding the user to the company")

    user_updator = UserManager(current_user)
    template_model = user_updator.create(email=email, skip_email=True)
    company_user_id = user_updator.get_company_user(template_model["user_id"]).id

    # As a Backfill
    graph_client.update_role(id=company_user_id, role=company_user_role_enum.admin)

    send_email(
        current_user.company,
        email,
        GETTING_STARTED_EMAIL_TEMPLATE,
        template_model,
        tag="new_company",
    )

    return current_user
