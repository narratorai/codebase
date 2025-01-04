import contextlib
from random import SystemRandom

from fastapi import status

from core.api.customer_facing.tasks.utils import TaskManager
from core.constants import MASKED_FIELDS, MASKED_STR, REMOVE_FIELDS
from core.errors import QueryRunError, SilenceError
from core.graph import graph_client
from core.graph.sync_client.enums import company_status_enum, company_task_category_enum
from core.logger import get_logger
from core.models.company import Company, query_graph_company
from core.models.ids import get_uuid
from core.utils import utcnow
from core.v4.mavis import Mavis
from core.v4.queryMapper import QueryMapper

logger = get_logger()


def _key(warhouse_language: str, is_admin: bool = False):
    return f"{warhouse_language}{'_admin' if is_admin else ''}"


def mask_options(options: dict | None):
    if options:
        # hide the masked fields
        for k in MASKED_FIELDS:
            if options.get(k):
                options[k] = MASKED_STR

        # Remove wrong format fields
        for k in REMOVE_FIELDS:
            if options.get(k):
                del options[k]

        options["cached_at"] = utcnow()
    return options


def update_hidden_fields(company: Company, warehouse_language: str, options: dict, is_admin: bool = False):
    key = _key(warehouse_language, is_admin)
    current_options = company.load_secret(key)

    if current_options:
        for k in MASKED_FIELDS:
            # if the key is masked then fetch it from prod
            if options.get(k) == MASKED_STR:
                options[k] = current_options.get(k)

        # if the keys are removed then fetch them from prod
        for k in REMOVE_FIELDS:
            if options.get(k) is None:
                options[k] = current_options.get(k)

    # remove extra part for bigquery -- it's ok that it mutates
    if options.get("jsonKeyFile") and "," in options["jsonKeyFile"]:
        options["jsonKeyFile"] = options["jsonKeyFile"].split(",")[1]

    if options.get("server"):
        options["server"] = options["server"].replace(".database-windows.net", "")
    return None


def create_datasource(mavis: Mavis, warehouse_language: str, options: dict, is_admin: bool = False):
    was_admin = False
    update_hidden_fields(mavis.company, warehouse_language, options, is_admin)

    s3_key = _key(warehouse_language, is_admin)
    mavis.company._upload_secret(s3_key, input.options)

    mavis.qm = QueryMapper(language=warehouse_language, copy_role=mavis.company.resources.company_role)
    # override the datasource
    mavis._override_datasource(options, is_admin)

    # test the warehouse connection
    logger.info(f"Testing connection for {warehouse_language}")
    test_datasource(mavis, is_admin)

    logger.info(f"Connection successful for {warehouse_language}")
    if not is_admin and warehouse_language in ("redshift", "pg"):
        was_admin = handle_super_admin(mavis)

    # Test user permissions
    (can_create, kind) = test_permissions(mavis, warehouse_language)

    if not can_create:
        raise SilenceError(
            f"Invalid Permission: User does not have the privileges to create a {kind} in your warehouse. Please connect a user with CREATE permissions.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    # Create the tasks
    logger.info("Creatign the tasks")
    create_needed_tasks(mavis.company)

    # update graph for the company
    logger.info("Updating the graph with details")
    graph_client.update_datasource(
        company_id=mavis.company.id,
        status=company_status_enum.active.value,
        warehouse=warehouse_language,
        project_id=options.get("projectId"),
    )
    query_graph_company(mavis.company.slug, refresh=True)

    return (options, was_admin)


def test_datasource(mavis: Mavis, is_admin: bool = False):
    # check the connection
    try:
        datasource = mavis.get_datasource(use_admin=is_admin)
        datasource.test_connection()
    except KeyError:
        raise ConnectionError(
            "Missing connection fields. Please ensure all fields are entered",
            code="missing_fields",
            http_status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )
    except Exception as e:
        raise ConnectionError(f"Unable to connect to warehouse: {e}")


def handle_super_admin(mavis: Mavis, options: dict):
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
        # Create the new user
        mavis.company._upload_secret(f"{mavis.qm.language}_admin", options)
        new_warehouse = options | dict(
            user="narrator_portal_user_" + get_uuid()[:8],
            password="N" + get_uuid(),
        )
        # create the new user for reshift
        create_new_user(mavis, new_warehouse)

        # upload the secret
        mavis.company._upload_secret(mavis.qm.language, new_warehouse)

        # override the non_admin query mapper as admin
        mavis._override_datasource(options, True)
        mavis._override_datasource(new_warehouse, False)

        return True
    return False


def create_needed_tasks(company: Company):
    """Check to see if the processing tasks exist based on the warehouse and add them if they don't."""

    # creates all the needed tasks
    all_tasks = graph_client.get_company_tasks(company_id=company.id).company_task
    all_slugs = [t.task_slug for t in all_tasks]

    # create a really random key
    cryptogen = SystemRandom()
    rand_n = cryptogen.randrange
    task_updator = TaskManager(company=company)

    if "run_transformations" not in all_slugs:
        # Add the Run Execution task
        schedule = "0 */6 * * *"

        from batch_jobs.data_management.run_transformations import run_transformations

        task_updator.create(
            run_transformations,
            schedule,
            "run_transformations",
            "Default Incremental Processing",
            category=company_task_category_enum.processing.value,
            description="This is the main process of your data. This manages all your transformations including Enrichment, Spend and the Activity Stream Each time it runs it will grab all the new data (based on your update type) and insert it. At the end of the run, it will apply the *Identity Resolution* and recompute the cache columns Once a night it will diff the data based on what in production (over the last 15 days) and make sure your data is up-to-date. This is trying to handle the case where you backfilled data or EL was delayed",
        )

    if "run_async_transformations" not in all_slugs:
        schedule = "0 4 * * *"

        from batch_jobs.data_management.run_transformations import run_transformations

        # RENAME to Default Non-Incremental Processing
        task_updator.create(
            run_transformations,
            schedule,
            "run_async_transformations",
            "Default Non-Incremental Processing",
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
            "Recent Day Diff processing",
            category=company_task_category_enum.processing.value,
            description="This will update all incremental transformations by diffing the last X days set in the company processing page. This is useful for handling any joins that might have dropped a row due to EL async updates.",
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
            "Run Data Diagnostics",
            category=company_task_category_enum.processing.value,
            description="Runs tests on activities or Dimensions (i.e. Duplication checks).",
        )

    # check if the warehouse is redshift and add the results
    if company.warehouse_language in ("redshift", "pg", "databricks") and "vacuum_tables" not in all_slugs:
        from batch_jobs.data_management.clean_tables import clean_tables

        task_updator.create(
            clean_tables,
            f"0 {rand_n(23)} */3 * *",
            "vacuum_tables",
            "Run Vacuum on Narrator Tables",
            category=company_task_category_enum.processing.value,
            description="Runs a Vacuum Command on all tables in Narrator managed schemas",
        )

    elif company.warehouse_language != "redshift" and "vacuum_tables" in all_slugs:
        # delete the task if it is not needed
        tasks = graph_client.get_task_by_slug(company_id=company.id, slug="vacuum_tables").company_task

        if tasks:
            task_id = tasks[0].id
            task_updator.delete(id=task_id)

    if "grant_missing_access" not in all_slugs or "refresh_schema_information" not in all_slugs:
        from batch_jobs.data_bridging.grant_missing_access import grant_missing_access

        task_updator.create(
            grant_missing_access,
            f"0 {rand_n(23)} * * *",
            "refresh_schema_information",
            "Refresh Schema Information",
            category=company_task_category_enum.processing.value,
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
        try:
            test_table = mavis.qm.Table(schema=mavis.company.warehouse_schema, table="test")
            mavis.run_query(mavis.qm.get_create_table_query(test_table, [dict(name="id", type="string")]))
            mavis.run_query(mavis.qm.get_drop_table_query(test_table))

            return True, None
        except Exception:
            return False, "table"
    return True, None
