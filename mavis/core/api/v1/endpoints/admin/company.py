"""
Thin wrapper around data_sources create, edit, list, and get APIs.

Called company.py because managing a warehouse is part of the company page in Portal.
"""

import contextlib
from random import SystemRandom

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from batch_jobs.data_bridging.grant_missing_access import grant_missing_access
from batch_jobs.data_management.run_transformations import run_tutorial_narrative
from core.api.auth import get_current_company, get_mavis
from core.api.customer_facing.tasks.utils import TaskManager
from core.constants import (
    FIRST_ACTIVITY_EMAIL_TEMPLATE,
    FIRST_ACTIVITY_NARRATIVE_TEMPLATE,
    MASKED_FIELDS,
    MASKED_STR,
    REMOVE_FIELDS,
)
from core.decorators.task import task
from core.errors import ConnectionError, QueryRunError
from core.graph import graph_client
from core.graph.sync_client.enums import (
    company_config_warehouse_language_enum,
    company_status_enum,
    company_task_category_enum,
)
from core.logger import get_logger
from core.models.company import Company, query_graph_company
from core.models.ids import get_uuid
from core.util.tracking import fivetran_track
from core.v4.mavis import Mavis
from core.v4.query_mapping.config import CONFIG
from core.v4.queryMapper import QueryMapper

router = APIRouter(prefix="/company", tags=["admin", "company"])
logger = get_logger()


class CreateInput(BaseModel):
    name: str = Field(..., title="Name of the data source")
    type: company_config_warehouse_language_enum
    is_admin: bool = False
    options: dict | None
    config: dict | None


class Datasources(BaseModel):
    """Smaller datasource object returned when we query a list of data sources."""

    data_source: CreateInput | None
    admin_data_source: CreateInput | None
    allow_admin: bool


class DatasourceOption(BaseModel):
    type: str | None
    name: str | None
    config: dict | None


class TestConnection(BaseModel):
    message: str
    ok: str


class SaveOutput(BaseModel):
    id: int | None
    name: str | None
    type: company_config_warehouse_language_enum | None
    options: dict | None
    was_admin: bool = False
    is_admin: bool = False

    # for the notification
    message: str
    description: str | None
    success: bool
    narrative_to_show: str | None


@router.delete("/warehouse", status_code=204)
async def delete_data_source_internal(is_admin: bool = False, current_company: Company = Depends(get_current_company)):
    """Deletes the data source."""
    current_company._delete_secret(f"{current_company.warehouse_language}{'_admin' if is_admin else ''}")

    # if status is removed then go back to onboarding
    if not is_admin:
        graph_client.update_company_status(company_id=current_company.id, status="onboarding")

    return {}


@router.get("/get_warehouse", response_model=Datasources)
async def get_data_sources_internal(
    warehouse_language: company_config_warehouse_language_enum | None = None,
    current_company: Company = Depends(get_current_company),
    mavis: Mavis = Depends(get_mavis),
):
    """Get the internal connected warehouses."""
    # handle enum
    if warehouse_language is not None:
        use_warehouse = warehouse_language.value
    else:
        if current_company.status != company_status_enum.active:
            return dict(data_source=None, admin_data_source=None, allow_admin=False)
        use_warehouse = current_company.warehouse_language
    ds = CONFIG[use_warehouse]["query_runner"]

    try:
        options = mavis.company.load_secret(use_warehouse)
    except Exception:
        options = {}

    try:
        admin_options = mavis.company.load_secret(use_warehouse + "_admin")
    except Exception:
        admin_options = {}

    return dict(
        data_source=dict(
            id="primary_warehoue",
            name="Primary Warehouse",
            type=use_warehouse,
            options=mask_fields(options),
            config=ds.configuration_schema(),
        ),
        admin_data_source=dict(
            id="admin_warehouse",
            name="Admin Warehouse",
            type=use_warehouse,
            is_admin=True,
            options=mask_fields(admin_options),
            config=ds.configuration_schema(),
        ),
        allow_admin=use_warehouse in ("redshift", "pg", "snowflake", "databricks"),
    )


@router.get("/warehouse_options", response_model=list[DatasourceOption])
async def get_data_source_options(mavis: Mavis = Depends(get_mavis)):
    """Get a list of all the supported warehouses."""
    valid_datasources = [
        "redshift",
        "bigquery",
        "pg",
        "snowflake",
        "mssql_odbc",
        "databricks",
    ]

    return_data = []

    for v in valid_datasources:
        ds = CONFIG[v]["query_runner"]

        # Add the data needed
        return_data.append(dict(type=v, name=ds.name(), config=ds.configuration_schema()))

    return return_data


def mask_fields(options):
    if options is None:
        return None
    for k in MASKED_FIELDS:
        if options.get(k):
            options[k] = MASKED_STR

    for k in REMOVE_FIELDS:
        if k in options:
            options.pop(k)
    return options


@router.post("/connections/save", response_model=SaveOutput)
async def save_datasource(
    input: CreateInput,
    current_company: Company = Depends(get_current_company),
    mavis: Mavis = Depends(get_mavis),
):
    # track the user testing the connection
    fivetran_track(mavis.user, data=dict(action="test_connection", warehouse=input.type.value))

    was_admin = False
    s3_key = f'{input.type.value}{"_admin" if input.is_admin else ""}'
    # if the keys are masked then fetch them from prod
    if input.options:
        try:
            current_options = mavis.company.load_secret(s3_key)
        except Exception:
            current_options = None

        for k in MASKED_FIELDS:
            # if the key is masked then fetch it from prod
            if input.options.get(k) == MASKED_STR and current_options:
                input.options[k] = current_options.get(k)

        # if the keys are removed then fetch them from prod
        for k in REMOVE_FIELDS:
            if input.options.get(k) is None and current_options:
                input.options[k] = current_options.get(k)

    # update the values
    input.options = clean_db_input_options(input.options)
    mavis.company._upload_secret(s3_key, input.options)

    mavis.qm = QueryMapper(language=input.type.value, copy_role=current_company.resources.company_role)
    mavis._override_datasource(input.options, input.is_admin)
    logger.info(f"Testing connection for {input.type.value}")

    # check the connection
    try:
        datasource = mavis.get_datasource(use_admin=input.is_admin)
        datasource.test_connection()
    except KeyError:
        return dict(
            success=False,
            was_admin=was_admin,
            message="Missing connection fields. Please ensure all fields are entered",
            **input.dict(),
        )
    except Exception as e:
        raise ConnectionError(f"Unable to connect to warehouse: {e}")

    logger.info(f"Connection successful for {input.type.value}")
    if not input.is_admin and input.type in (
        input.type.redshift,
        input.type.pg,
    ):
        data = mavis.run_query(
            """
            SELECT *
            FROM pg_user u
            where u.usename = current_user
            """
        )

        # if the user is a super user then
        if data.rows[0]["usesuper"]:
            logger.info("Credentials are Admin")
            was_admin = True
            # Create the new user
            current_company._upload_secret(f"{input.type.value}_admin", input.options)
            new_warehouse = input.options | dict(
                user="narrator_portal_user_" + get_uuid()[:8],
                password="N" + get_uuid(),
            )
            # create the new user for reshift
            create_new_user(mavis, new_warehouse)

            # upload the secret
            current_company._upload_secret(input.type.value, new_warehouse)

            # override the non_admin query mapper as admin
            mavis._override_datasource(input.options, True)
            mavis._override_datasource(new_warehouse, False)

    logger.info("Testing permission")
    # tries and creates the schema to ensure data is accurate
    (can_create, kind) = test_permissions(mavis, input.type.value)

    if not can_create:
        return dict(
            success=False,
            was_admin=was_admin,
            message="Invalid Permission",
            description=f"User does not have the privileges to create a {kind} in your warehouse. Please connect a user with CREATE permissions.",
            **input.dict(),
        )

    # Create the tasks
    logger.info("Creatign the tasks")
    create_needed_tasks(mavis)

    # update graph for the company
    logger.info("Updating the graph with details")
    graph_client.update_datasource(
        company_id=current_company.id,
        status=company_status_enum.active.value,
        warehouse=input.type.value,
        project_id=input.options.get("projectId"),
    )

    # grant the necessary access need
    grant_missing_access.send(company_slug=current_company.slug)
    refresh_company_cache.send(company_slug=current_company.slug)

    # Run the tutorial
    logger.info("Running the tutorial")
    narrative_slug = run_tutorial_narrative(
        mavis,
        FIRST_ACTIVITY_NARRATIVE_TEMPLATE,
        override_template_email=FIRST_ACTIVITY_EMAIL_TEMPLATE,
        force_assemble=True,
    )

    # reset the connections
    query_graph_company(current_company.slug, True)

    input.options = mask_fields(input.options)
    return dict(
        success=True,
        was_admin=was_admin,
        narrative_to_show=narrative_slug,
        message=f'{"Created Narrator User, " if was_admin else ""}Successfully connected and saved',
        **input.dict(),
    )


def clean_db_input_options(options):
    # remove extra part for bigquery -- it's ok that it mutates
    if options.get("jsonKeyFile") and "," in options["jsonKeyFile"]:
        options["jsonKeyFile"] = options["jsonKeyFile"].split(",")[1]

    if options.get("server"):
        options["server"] = options["server"].replace(".database-windows.net", "")

    return options


@task()
def refresh_company_cache(company_slug):
    query_graph_company(company_slug, refresh_cache=True)


def create_needed_tasks(mavis: Mavis):
    """Check to see if the processing tasks exist based on the warehouse and add them if they don't."""
    company = mavis.company

    # creates all the needed tasks
    all_tasks = graph_client.get_company_tasks(company_id=company.id).company_task
    all_slugs = [t.task_slug for t in all_tasks]

    # create a really random key
    cryptogen = SystemRandom()
    rand_n = cryptogen.randrange
    task_updator = TaskManager(mavis=mavis)

    if "run_transformations" not in all_slugs:
        # Add the Run Execution task
        schedule = "0 */6 * * *"

        from batch_jobs.data_management.run_transformations import run_transformations

        task_updator.create(
            run_transformations,
            schedule,
            "run_transformations",
            label="Run Transformations",
            category=company_task_category_enum.processing.value,
            description="This is the main process of your data. This manages all your transformations including Enrichment, Spend and the Activity Stream Each time it runs it will grab all the new data (based on your update type) and insert it. At the end of the run, it will apply the *Identity Resolution* and recompute the cache columns Once a night it will diff the data based on what in production (over the last 15 days) and make sure your data is up-to-date. This is trying to handle the case where you backfilled data or EL was delayed",
        )

    if "run_async_transformations" not in all_slugs:
        schedule = "0 4 * * *"

        from batch_jobs.data_management.run_transformations import run_transformations

        task_updator.create(
            run_transformations,
            schedule,
            "run_async_transformations",
            label="Run Async Transformations",
            category=company_task_category_enum.processing.value,
            description="This is the main process of your data. This manages all your transformations including Enrichment, Spend and the Activity Stream Each time it runs it will grab all the new data (based on your update type) and insert it. At the end of the run, it will apply the *Identity Resolution* and recompute the cache columns Once a night it will diff the data based on what in production (over the last 15 days) and make sure your data is up-to-date. This is trying to handle the case where you backfilled data or EL was delayed",
            task_fields=dict(is_async=True),
        )

    if "reconcile_stream_processing" not in all_slugs:
        from batch_jobs.data_management.run_transformations import run_transformations

        task_updator.create(
            run_transformations,
            "0 5 */4 * *",
            "reconcile_stream_processing",
            label="Reconcile Stream Processing",
            category=company_task_category_enum.processing.value,
            description="This will update all incremental transformations by diffing the last X days set in the company processing page",
            task_fields=dict(is_reconcile=True),
        )

    # adding indexing customer
    # if "compute_column_summaries" not in all_slugs:
    #     from batch_jobs.data_management.index_activity_dims import index_activity_dims

    #     task_updator.create(
    #         index_activity_dims,
    #         f"0 2 * * {rand_n(6)}",
    #         task_slug="compute_column_summaries",
    #         category=company_task_category_enum.processing.value,
    #         description="This creates the column summaries you see in dataset",
    #     )

    # adding indexing customer
    if "run_data_diagnostics" not in all_slugs:
        from batch_jobs.data_management.validate_stream_assumptions import (
            validate_stream_assumptions,
        )

        task_updator.create(
            validate_stream_assumptions,
            f"0 4 * * {rand_n(6)}",
            "run_data_diagnostics",
            label="Run Data Diagnostics",
            category=company_task_category_enum.processing.value,
            description="Runs tests on activities or Dimensions (i.e. Duplication checks).",
        )

    # adding indexing customer
    if "compute_popular_items" not in all_slugs:
        from batch_jobs.data_management.update_popular_tags import update_popular_tags

        task_updator.create(
            update_popular_tags,
            f"0 {rand_n(23)} * * *",
            "compute_popular_items",
            label="Compute Popular Items",
            internal_only=True,
            category=company_task_category_enum.processing.value,
            description="This looks at all the viewed items in the past and tries to figure out what is popular for the company",
        )

    # check if the warehouse is redshift and add the results
    if company.warehouse_language in ("redshift", "pg", "databricks") and "vacuum_tables" not in all_slugs:
        from batch_jobs.data_management.clean_tables import clean_tables

        task_updator.create(
            clean_tables,
            f"0 {rand_n(23)} */3 * *",
            "vacuum_tables",
            label="Vacuum Tables",
            category=company_task_category_enum.processing.value,
            description="Runs a Vacuum Command on all tables in Narrator managed schemas",
        )

    elif company.warehouse_language != "redshift" and "vacuum_tables" in all_slugs:
        # delete the task if it is not needed
        tasks = graph_client.get_task_by_slug(company_id=company.id, slug="vacuum_tables").company_task

        if tasks:
            task_id = tasks[0].id
            TaskManager(mavis=mavis).delete(id=task_id)

    if "grant_missing_access" not in all_slugs or "refresh_schema_information" not in all_slugs:
        from batch_jobs.data_bridging.grant_missing_access import grant_missing_access

        task_updator.create(
            grant_missing_access,
            f"0 {rand_n(23)} * * *",
            category=company_task_category_enum.processing.value,
            task_slug="refresh_schema_information",
            description="Grants access using the admin warehouse user.  Also refreshes the schema index for the sql editor's sidebar.",
            internal_only=True,
        )
        grant_missing_access.send(company_slug=company.slug)


def create_new_user(mavis: Mavis, new_warehouse):
    """
    Grant the necessary access to redshift.

    - Creates a User
    - Creates a group - to help manage permissions
    - Grants ability to create in the warehouse - Allows us to create a schema and tables
    - Changes the default privillages to allow anyone in Narrator group to have access.
    """
    user = new_warehouse["user"]
    password = new_warehouse["password"]
    warehouse = new_warehouse["dbname"]

    mavis.run_query(f"CREATE USER {user} password '{password}';")

    with contextlib.suppress(QueryRunError):
        mavis.run_query("CREATE GROUP narrator;")

    mavis.run_query(f"ALTER GROUP narrator add user {user};")
    mavis.run_query(f"GRANT CREATE ON DATABASE {warehouse} TO {user};")
    mavis.run_query(f"ALTER DEFAULT PRIVILEGES for user {user} GRANT SELECT ON tables to group narrator")


def test_permissions(mavis: Mavis, language):
    try:
        mavis.create_schema(language=language)
    except Exception as e:
        logger.error("Error creating schema", exc_info=e)
        # if the schema exist, check we have table create access
        warehouse_schema = mavis.company.warehouse_schema
        try:
            test_table = mavis.qm.Table(schema=warehouse_schema, table="test")
            mavis.run_query(mavis.qm.get_create_table_query(test_table, [dict(name="id", type="string")]))
            mavis.run_query(mavis.qm.get_drop_table_query(test_table))

            return True, None
        except Exception:
            return False, "table"
    return True, None
