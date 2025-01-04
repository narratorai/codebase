import stripe
from python_terraform import IsFlagged, IsNotFlagged, Terraform

from core import utils
from core.api.v1.endpoints.admin.user import (
    _add_user_to_company,
    _update_internal_access,
)
from core.constants import GETTING_STARTED_EMAIL_TEMPLATE
from core.graph import graph_client
from core.graph.sync_client.enums import company_user_role_enum
from core.logger import get_logger
from core.models.company import Company, query_graph_company
from core.models.settings import settings
from core.models.user import AuthenticatedUser, UserCompany
from core.util.auth0 import get_api_client
from core.util.email import send_email
from core.util.opentelemetry import tracer
from core.v4.mavis import Mavis

logger = get_logger()


@tracer.start_as_current_span("create_resources")
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


@tracer.start_as_current_span("create_company_resources")
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


@tracer.start_as_current_span("create_stripe_customer")
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


@tracer.start_as_current_span("destroy_resources")
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


@tracer.start_as_current_span("upsert_company")
def upsert_company(user_id: str, slug: str, region: str = "US", is_demo: bool = False):
    try:
        name = utils.title(slug)

        logger.info("Creating company", slug=slug, name=name, region=region, is_demo=is_demo)
        company_id = graph_client.execute(
            """
            mutation CreateCompany(
                $name: String!
                $created_for: uuid!
                $slug: String!
                $is_demo: Boolean
                $region: datacenter_region_enum
            ) {
                insert_company_one(
                    object: {
                        name: $name
                        created_for: $created_for
                        slug: $slug
                        demo_company: $is_demo
                        allow_narrator_employee_access: true
                        datacenter_region: $region
                    }
                ) {
                    id
                }
            }
            """,
            dict(
                slug=slug,
                name=name,
                created_for=user_id,
                is_demo=is_demo,
                region=region,
            ),
        ).json()["data"]["insert_company_one"]["id"]
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


@tracer.start_as_current_span("create_auth0_org")
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


@tracer.start_as_current_span("create_company")
def create_company(
    slug: str,
    email: str,
    payment_handled: bool = False,
    is_demo: bool = False,
    region: str = "US",
):
    user_id = graph_client.create_user(email=email).insert_user_one.id
    company_id = upsert_company(user_id, slug, region, is_demo)

    # TODO: Create the TEAMS:
    # - Admins
    # - Everyone

    auth_org_id = create_auth0_org(company_id, slug)

    # create all the necessary company resources
    create_company_resources(company_id, slug, region)

    # create the teams
    everyone_id = graph_client.insert_team(company_id, "Everyone").insert_team_one.id

    # reset the company object
    company_data = query_graph_company(slug, refresh_cache=True)
    # manually create it since it doesn't exist yet
    current_user = AuthenticatedUser(  # noqa: S106
        id=user_id,
        email=email,
        role="admin",
        company=UserCompany(
            id=company_id,
            slug=slug,
            auth0_org_id=auth_org_id,
            everyone_team_id=everyone_id,
        ),
        token="",
    )
    company = Company(**company_data.dict(), current_user=current_user)
    mavis = Mavis(company=company)

    # Flip status to onboarding
    logger.info("Updating company status")
    graph_client.update_company_status(company_id=company_id, status="onboarding")

    logger.info("Syncing internal users")
    _update_internal_access(mavis, True)

    create_stripe_customer(company_id, slug, name=slug, email=email)
    if not payment_handled:
        graph_client.update_company_status(company_id=company_id, status="missing_payment")
        # When we flip it, we should collect the users ADDRESS and CREDIT CARD
    else:
        logger.info("updating company status")
        graph_client.update_company_status(company_id=company_id, status="onboarding")

    # add the user to the company and get the invite url
    logger.info("Adding the user to the company")
    template_model = _add_user_to_company(mavis, email=email, skip_email=True, role=company_user_role_enum.admin)
    send_email(
        mavis.company,
        email,
        GETTING_STARTED_EMAIL_TEMPLATE,
        template_model,
        tag="new_company",
    )

    return mavis
