import json
from collections import defaultdict
from time import sleep

import sentry_sdk

from core import utils
from core.constants import ENRICHED_ID_COLS, ENRICHED_TS_COLS
from core.decorators.task import task
from core.errors import SilenceError, WarehouseRandomError
from core.graph import graph_client
from core.graph.sync_client.get_transformation_simple import GetTransformationSimple
from core.models.internal_link import PORTAL_URL, InternalLink
from core.models.table import TableColumn, TableColumnContext, TableData
from core.util.opentelemetry import tracer
from core.utils import get_error_message
from core.v4.blocks.shared_ui_elements import _drop_down
from core.v4.mavis import Mavis, initialize_mavis

TITLE = "Transformation Tests"
DESCRIPTION = "Run a test in the transformations"
VERSION = 1


ALL_TESTS = [
    dict(
        slug="check_id_duplication",
        title="Check for ID Duplication",
        success_name="No `activity_id` or `enriched_activity_id` duplication",
        failure_name="Found `activity_id` or `enriched_activity_id` duplication ",
        pending_name="Checking for ID duplication",
        group="Required Validations",
        description="\n\n".join(
            [
                "**For Activity:** Validate that `activity_id` and `activity` are unique",
                "**For Dimensions:** Validate that `id` is unique",
            ]
        ),
    ),
    dict(
        slug="check_missing_columns",
        title="Check for Missing Columns",
        success_name="All required columns are available",
        failure_name="Some required columns are missing",
        pending_name="Searching for required columns",
        group="Required Validations",
        description="Each kind of transformation has a set of columns that are required. This will validate that the columns are available.",
    ),
    dict(
        slug="check_null_columns",
        title="Check for NULL Values in Required Columns",
        success_name="No NULL values in required columns",
        failure_name="Found NULL values in required columns",
        pending_name="Searching for NULL values in required columns",
        group="Required Validations",
        description="\n\n".join(
            [
                "**For Activity:** Validate that `activity_id`, `activity`, `ts` and at least one customer column (`anonymous_customer_id` or `customer`) are available",
                "**For Dimensions:** Validate that `id` is available",
                "**For Customer Attribute:** Validate that `customer` is available",
            ]
        ),
    ),
    dict(
        slug="check_limit",
        title="Check for LIMIT Clauses",
        success_name="No LIMIT in query",
        failure_name="Found LIMIT in query",
        pending_name="Checking query for LIMIT clause",
        group="Required Validations",
        description="Ensures the query doesn't have a LIMIT",
    ),
    dict(
        slug="check_types",
        title="Validate the types used",
        success_name="All types are valid",
        failure_name="Mismatched types found across transformation",
        pending_name="Comparing the types to all other transformations",
        group="Required Validations",
        description="Will look to make sure the types that are in the transformations match with all other transformations",
    ),
    dict(
        slug="check_decimation",
        title="Check for Duplicate Timestamps",
        success_name="No duplicate timestamps found",
        failure_name="Found duplication in the timestamp column",
        pending_name="Checking for timestamp duplication",
        group="Other Validations",
        description="Searches for timestamps that are duplicated for the same customer (often caused by double firing).  You can dedupe the query to avoid unnecessary activities in your Activity Stream.",
    ),
    dict(
        slug="get_stream_context",
        title="Generate temporal joins to Other Activities",
        success_name="Activity temporal joins",
        failure_name="Activity temporal joins",
        pending_name="Checking Activity temporal joins",
        group="Generate Details",
        description="How does the transformation relate to other activities in the Activity Stream?",
    ),
    dict(
        slug="update_column_names",
        title="Infer Column Names",
        success_name="Updated Column",
        failure_name="Failed to Column Name Checks ",
        pending_name="Processing the Columns",
        group="Required Validations",
        description="Parses the query to auto-generate default column names",
    ),
    dict(
        slug="check_sources",
        title="Find Sources Used",
        success_name="Found all Sources used",
        failure_name="Found all Sources used",
        pending_name="Querying for Sources used",
        group="Generate Details",
        description="Generate the source values used for identity resolution",
    ),
    dict(
        slug="check_unnecessary_mapping",
        title="Check unnecessary identity resolution",
        success_name="This is a great use of identity resolution",
        failure_name="",
        pending_name="Checking if too many identity mappings are happenings",
        group="Generate Details",
        description="Generate the source values used for identity resolution",
    ),
    dict(
        slug="check_activities",
        title="Find Activities Generated",
        success_name="Found all activities generated",
        failure_name="Found all activities generated",
        pending_name="Querying for activities generated",
        group="Generate Details",
        description="Find the activities created by the transformation",
    ),
    dict(
        slug="check_identity_resolution",
        title="Check common Identity Resolution mistakes",
        success_name="Activities use of Identity Resolution looks great!",
        failure_name="Something went wrong",
        pending_name="Checking common Identity Resolution mistakes",
        group="Generate Details",
        description="Check common Identity Resolution mistakes",
    ),
]

CACHE_TIME = 60 * 24

DISPLAY_CONTENT_STARTSWITH_KEY = "But"

CASTED_COLUMNMS = dict(
    activity_id="string",
    ts="timestamp",
    revenue_impact="float",
    feature_1="string",
    feature_2="string",
    feature_3="string",
    enriched_activity_id="string",
    activity="string",
    source="string",
    source_id="string",
    anonymous_customer_id="string",
    link="string",
    customer="string",
)

OVERRIDE_NAMES = dict(ts="Timestamp")


@tracer.start_as_current_span("get_schema")
def get_schema(mavis: Mavis, internal_cache: dict):
    # load from cache
    all_transformations = internal_cache["all_transformations"]

    n_days = mavis.config.validation_days
    validate_data_from = utils.date_add(utils.utcnow(), "day", -n_days)[:10]

    schema = dict(
        title=TITLE,
        description=DESCRIPTION,
        type="object",
        properties=dict(
            id=_drop_down(all_transformations, "id", "name", title="Transformation"),
            test=_drop_down(ALL_TESTS, "slug", "title", title="Test to Run"),
            validate_data_from=dict(
                type="string",
                format="date",
                default=validate_data_from,
                title="Validate data from",
            ),
            show_query=dict(type="boolean", default=True, title="show SQL Ran"),
        ),
        required=["slug", "test"],
    )

    schema_ui = dict()

    return schema, schema_ui


@tracer.start_as_current_span("get_get_internal_cacheschema")
def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    # get the activity mapping
    if not internal["all_transformations"]:
        all_transformations = graph_client.transformation_index(company_id=mavis.company.id).all_transformations

        internal["all_transformations"] = [dict(id=t.id, name=t.name) for t in all_transformations]
    return internal


def process_data(mavis: Mavis, data: dict, update_field_slug: str | None):
    return data


def __run_test(
    slug,
    mavis: Mavis,
    transform: GetTransformationSimple,
    validate_data_from=None,
    run_live=False,
):
    if slug == "check_types":
        res = _check_types(mavis, transform, validate_data_from, run_live)
    elif slug == "check_activities":
        res = _check_activities(mavis, transform, validate_data_from, run_live)
    elif slug == "check_id_duplication":
        res = _check_id_duplication(mavis, transform, validate_data_from, run_live)
    elif slug == "check_decimation":
        res = _check_decimation(mavis, transform, validate_data_from, run_live)
    elif slug == "check_limit":
        res = _check_limit(mavis, transform, validate_data_from, run_live)
    elif slug == "check_identity_resolution":
        res = _check_identity_resolution(mavis, transform, validate_data_from, run_live)
    elif slug == "check_missing_columns":
        res = _check_missing_columns(mavis, transform, validate_data_from, run_live)
    elif slug == "check_null_columns":
        res = _check_null_columns(mavis, transform, validate_data_from, run_live)
    elif slug == "update_column_names":
        res = _update_column_names(mavis, transform, validate_data_from, run_live)
    elif slug == "check_sources":
        res = _check_sources(mavis, transform, validate_data_from, run_live)
    elif slug == "check_unnecessary_mapping":
        res = _check_unnecessary_mapping(mavis, transform, validate_data_from, run_live)
    elif slug == "get_stream_context":
        res = _get_stream_context(mavis, transform, validate_data_from, run_live)
    else:
        raise ValueError(f"{slug} test is not found")
    return res


def run_data(mavis: Mavis, data: dict):
    # get the traansformton
    transform = graph_client.get_transformation_simple(id=data["id"]).transformation
    test_created_at = utils.utcnow()
    # run the data
    res = __run_test(data["test"], mavis, transform, data["validate_data_from"], False)

    # if failed check not because of an error and the test is old then rerun it with live data
    if not res["passed"] and res.get("retrieved_at") and res["retrieved_at"] < test_created_at:
        res = __run_test(data["test"], mavis, transform, data["validate_data_from"], True)

    return dict(type="markdown", value=json.dumps(res, indent=2))


@task()
def aysnc_run_single_test(
    company_slug,
    transformation_id,
    validate_data_from,
    test_slug,
    test_id,
    test_created_at,
    user_id,
):
    mavis = initialize_mavis(company_slug, user_id)
    transform = graph_client.get_transformation_simple(transformation_id).transformation
    return run_single_test(
        mavis,
        transform,
        validate_data_from,
        test_slug,
        test_id,
        test_created_at,
    )


@tracer.start_as_current_span("run_single_test")
def run_single_test(mavis: Mavis, transform, validate_data_from, test_slug, test_id, test_created_at):
    # run the data
    try:
        res = __run_test(test_slug, mavis, transform, validate_data_from, False)

        # if failed check not because of an error and the test is old then rerun it with live data
        if not res["passed"] and res.get("retrieved_at") and res["retrieved_at"] < test_created_at:
            res = __run_test(test_slug, mavis, transform, validate_data_from, True)
    except Exception as e:
        sentry_sdk.capture_exception(e)
        res = dict(content=f"Error: {get_error_message(e)}", passed=False)

    # update graph with the data
    graph_client.update_test(
        id=test_id,
        status="Passed" if res["passed"] else "Failed",
        content=res.get("content"),
        sql_query=res.get("query"),
        validate_data_from=validate_data_from,
        data=json.dumps(res["data"]) if res.get("data") else None,
    )

    return res


def make_pretty(passed, slug, content):
    test = next((t for t in ALL_TESTS if t["slug"] == slug), dict())

    # get the name
    name = test.get("title") or utils.title(slug)

    if "validation" in (test.get("group") or "").lower():
        name = ("No " if passed else "Found ") + name

    # create the header
    header = "{icon} {name}".format(icon="✓" if passed else "❌", name=name)
    details = test.get("description") or "No description"

    # add th body
    body = f"_{details}_\n\n <br>\n\n" + content + "\n\n<br>"

    return header, body


@tracer.start_as_current_span("_update_column_names")
def _update_column_names(mavis: Mavis, transform, validate_data_from, run_live=False, use_prod=False):
    try:
        query = __get_query(mavis, transform, validate_data_from, use_prod=use_prod)
        raw_data = __run_query(mavis, query, run_live)
    except Exception:
        # Try again without the limit on the data
        query = __get_query(mavis, transform, None, use_prod=use_prod)
        raw_data = __run_query(mavis, query, run_live)

    # deal with types
    content = ["Updated the columns based on the transformations"]
    column_types = dict()
    trans_columns = []

    # if you pushing an enrichment or customer attribute then delete the columns
    if transform.kind == transform.kind.stream:
        shared_transforms = []
        feature_col = utils.find_first_val([c.field for c in raw_data.columns], ["feature_%"])
        # if you have feature_json columns then get the activity
        if feature_col and feature_col[-1] not in ("1", "2", "3") and not use_prod:
            res = _check_activities(mavis, transform, validate_data_from, run_live)

            if not res["passed"]:
                res = _check_activities(mavis, transform, "1900-01-01", run_live)
                if not res["passed"]:
                    res["content"] = "Couldn't find the activities to ensure the are no mismatched type"
                    return res

            activity_slugs = [r["activity"] for r in res["data"]["rows"] if r["activity"]]

            all_activities = {
                a.slug: a for a in graph_client.activity_index(company_id=mavis.company.id).all_activities
            }
            # add the activity transformation
            for a in activity_slugs or []:
                if all_activities.get(a):
                    trans = graph_client.get_transformations_for_activity(
                        activity_id=all_activities[a].id
                    ).transformation_activities
                    shared_transforms.extend([t.transformation for t in trans])
    else:
        shared_transforms = [
            t
            for t in graph_client.get_table(company_id=mavis.company.id, table=transform.table).transformation
            if t.production_queries_aggregate.aggregate.count > 0
        ]

    # get the shared transformations in prod
    shared_transform = [t for t in shared_transforms if t.id != transform.id]
    other_trans = ""

    # add the names and types
    if len(shared_transform) > 0:
        column_types = {c.name: c.casting or c.type for c in shared_transform[0].column_renames}
        other_trans = (
            f"[{shared_transform[0].name}]({InternalLink(mavis.company.slug).transformation(shared_transform[0].id)})"
        )

    # handle the customer reserved col
    reserved_cols = utils.get_stream_columns()
    reserved_cols.remove("ts")
    reserved_cols.remove("customer")

    # update the columns
    for c in raw_data.columns:
        # HANDLE the columns to see if they can be added
        if transform.kind == transform.kind.stream and not (
            c.lower_name in utils.get_stream_columns() or c.lower_name.startswith("feature_")
        ):
            continue

        elif transform.kind != transform.kind.stream and c.lower_name in reserved_cols:
            return dict(
                passed=False,
                content=f"A Dimension table is using one of the RESERVED activity columns.  Please rename `{c.lower_name}`",
                query=query.to_query(),
            )

        elif (
            transform.kind != transform.kind.stream
            and len(shared_transform) > 0
            and c.lower_name not in column_types.keys()
        ):
            return dict(
                passed=False,
                content=f"The column `{c.lower_name}` is missing from {other_trans} transformation that is also updating this table.",
                query=query.to_query(),
            )
        # add the feature
        elif c.lower_name == "feature_json":
            return dict(
                passed=False,
                content="Cannot have column called `feature_json`, please use feature_XXX for the feature columns. \n\n*This is important since we use the columns to get and manage the types*",
                query=query.to_query(),
            )

        elif c.lower_name.startswith("feature"):
            c.header_name = utils.title(c.field[8:])
        else:
            c.header_name = OVERRIDE_NAMES.get(c.field, utils.title(c.field))

        casting = CASTED_COLUMNMS.get(c.field)
        shared_type = column_types.get(c.field)
        # Should be casted
        if shared_type:
            if c.type is None:
                c.type = shared_type

            elif not utils.same_types(c.type, shared_type):
                # if it is a column we cast then GREAT
                if CASTED_COLUMNMS.get(c.lower_name):
                    casting = CASTED_COLUMNMS[c.lower_name]
                else:
                    # Error out because of different types
                    return dict(
                        passed=False,
                        content=f"The column {c.header_name} has the type {c.type} but the {other_trans} has the type {shared_type}.",
                        query=query.to_query(),
                    )

        trans_columns.append((c, casting))

    # delete transformation columns
    graph_client.delete_transformation_columns(transformation_id=transform.id)
    for tc, casting in trans_columns:
        graph_client.create_new_column(
            related_to="transformation",
            related_to_id=transform.id,
            has_data=True,
            name=tc.lower_name,
            label=tc.header_name,
            type=tc.type or "string",
            casting=casting,
        )

        # add the content
        content.append(f" + {tc.lower_name} column as {tc.header_name} - {tc.type or 'string'}")

    return dict(
        passed=True,
        content="\n\n".join(content),
        query=query.to_query(),
    )


@tracer.start_as_current_span("_check_missing_columns")
def _check_missing_columns(mavis: Mavis, transform: GetTransformationSimple, validate_data_from, run_live=False):
    """
    # - check if any of the enrichment/Customer Attributes/features columns are timestamps
    # - check if columns are reused in enrichment
    # - Check if 'first', 'last' is in the enrichment/customer_attributes name
    """
    if transform.kind == transform.kind.stream:
        ids = ["activity", "activity_id", "ts", "customer", "anonymous_customer_id"]
    elif transform.kind in (transform.kind.enrichment, transform.kind.spend):
        transform = ensure_columns(transform)
        ids = [utils.find_first_val([c.name for c in transform.column_renames], ENRICHED_ID_COLS)]

        # handle missing column
        if not ids:
            return dict(
                passed=False,
                content="Dimensions table is missing the `id` column",
                query=None,
            )
    elif transform.kind == transform.kind.customer_attribute:
        ids = ["customer"]
    else:
        dict(status="pass", type="markdown", content="")

    query = __get_query(mavis, transform, validate_data_from)
    try:
        raw_data = __run_query(mavis, query, run_live)
    except Exception:
        query = __get_query(mavis, transform, None)
        raw_data = __run_query(mavis, query, run_live)
        return dict(
            passed=False,
            content="Could not find `ts` column so could not apply filter",
            query=query.to_query(),
            retrieved_at=raw_data.retrieved_at,
        )

    # run for all the data
    if raw_data.total_rows == 0:
        query = __get_query(mavis, transform, None)

        raw_data = __run_query(mavis, query, run_live)

    missing_columns = []
    columns_found = {c.field: c for c in raw_data.columns}
    content = []

    non_used_cols = ", ".join(
        c.field
        for c in raw_data.columns
        if transform.kind == transform.kind.stream
        and c.field not in utils.get_stream_columns()
        and not c.field.lower().startswith("feature_")
    )
    issues = []

    if non_used_cols:
        issues.append(
            f" - **{non_used_cols} is in the transformation but will never be used.** Activity Transformations have a rigid schema. [Learn more: Valid Columns](https://docs.narrator.ai/docs/activity-transformations)"
        )
    for col in ids:
        # make sure that the column is a timestamp
        if (
            col
            in (
                "ts",
                "enriched_ts",
            )
            and columns_found[col].type != "timestamp"
        ):
            missing_columns.append(col)
            content.append(
                "- INVALID Column Type {} needs to be a Timestamp (was {})".format(col, columns_found[col].type)
            )

        if col not in columns_found.keys():
            missing_columns.append(col)
            content.append(f" - {col} is missing")

    first_last_cols = []
    time_cols_cols = []
    duplicate_cols = []

    # check for some weird choices
    for col in raw_data.columns:
        if col.lower_name in ids:
            continue

        if any(col.lower_name.lower().startswith(k) for k in ("first", "last")):
            first_last_cols.append(col.header_name)

        if col.type == "timestamp" and transform.kind in (
            transform.kind.customer_attribute,
            transform.kind.stream,
        ):
            time_cols_cols.append(col.header_name)

        if any(
            temp_c
            for temp_c in raw_data.columns
            if temp_c.lower_name != col.lower_name
            and temp_c.lower_name.startswith(col.lower_name)
            and temp_c.lower_name.lstrip(col.lower_name).isdigit()
        ):
            duplicate_cols.append(col.header_name)

    # handle the duplicate columns
    if duplicate_cols:
        content.insert(0, "Duplicate Columns Found")
        content.append(
            f" - {', '.join(duplicate_cols)}** appears more than once in the query output. Did you mean to use it twice?"
        )

    if first_last_cols:
        issues.append(
            f" - **`{', '.join(first_last_cols)}`** are a time-based feature (like first/last). Time-based features should be computed within a dataset instead of within the transformation logic. Consider removing the time-based logic from your activity. [Learn more: Do's and Don'ts of Creating Activities](https://docs.narrator.ai/page/dos-and-donts-of-creating-activities#dont-define-time-based-features-or-activity-names-in-the-activity-definition)"
        )

    if time_cols_cols:
        issues.append(
            f" - **`{', '.join(time_cols_cols)}`** is a timestamp. Consider creating a separate activity to represent the action that happened at this timestamp. [Learn more: Do's and Don'ts of Creating Activities](https://docs.narrator.ai/page/dos-and-donts-of-creating-activities#dont-define-time-based-features-or-activity-names-in-the-activity-definition)"
        )

    if len(duplicate_cols) > 0:
        return dict(
            passed=False,
            content="\n".join(content),
            query=query.to_query(),
            retrieved_at=raw_data.retrieved_at,
        )
    elif len(missing_columns) > 0:
        content.insert(0, "Missing Required columns")
        return dict(
            passed=False,
            content="\n".join(content),
            query=query.to_query(),
            retrieved_at=raw_data.retrieved_at,
        )
    elif len(issues) > 0:
        return dict(
            passed=True,
            content=f"{DISPLAY_CONTENT_STARTSWITH_KEY}" + "\n".join(issues),
            query=query.to_query(),
        )
    else:
        return dict(
            passed=True,
            content="No missing columns",
            query=query.to_query(),
        )


@tracer.start_as_current_span("_check_types")
def _check_types(mavis, transform, validate_data_from, run_live=False):
    # this only applies to enrichment
    if transform.kind not in (transform.kind.enrichment, transform.kind.spend):
        return dict(passed=True, status="pass", type="markdown", content="")

    # check if another transformation for the same table exists
    transformation_index = graph_client.get_enrichment_tables(company_id=mavis.company.id).all_transformations

    same_table_transformations = [
        t
        for t in transformation_index
        if t.table == transform.table and t.production_queries_aggregate.aggregate.count > 0 and t.id != transform.id
    ]

    if len(same_table_transformations) == 0:
        return dict(
            passed=True,
            status="pass",
            content="Not a shared transformation",
            query=None,
        )

    # get the columns for the current transformation
    query = __get_query(mavis, transform, validate_data_from)
    raw_data = __run_query(mavis, query, run_live)

    columns_found = {c.field: c for c in raw_data.columns}

    # Diff the columns
    content = ["We found mismatched types"]

    for prod_transform in same_table_transformations:
        for prod_col in prod_transform.column_renames:
            if (
                prod_col.name not in ("enriched_activity_id", "id")
                and columns_found[prod_col.name].type
                and not utils.same_types(prod_col.type, columns_found[prod_col.name].type)
            ):
                content.extend(
                    [
                        f" - Production transformation `{prod_transform.name}` has the **{prod_col.name}** column with type `{prod_col.type}` and but it is a **{columns_found[prod_col.name].type}** in this transformation",
                        " \n <details>How do change the type for both<summary></summary>",
                        "1. Run the validation for one of them and DO NOT MERGE",
                        "2. Run the validation for the second one, this one should now pass",
                        "3. Merge that one",
                        "4. Rerun validation for this one and then it will pass and you can merge it" "</details>",
                    ]
                )

    if len(content) > 1:
        return dict(
            passed=False,
            content="\n".join(content),
            query=query.to_query(),
            retrieved_at=raw_data.retrieved_at,
        )
    else:
        return dict(
            passed=True,
            content="All types match",
            query=query.to_query(),
        )


@tracer.start_as_current_span("_check_activities")
def _check_activities(mavis: Mavis, transform: GetTransformationSimple, validate_data_from, run_live=False):
    """
    # - Check if the activity slug is used by another activity
    # - check if slug is changing
    # - check if the slug has 'first', 'last' in the name

    """
    # only run for stream
    if transform.kind != transform.kind.stream:
        return __not_for_kind(transform.kind.value)

    # get the activities
    query = __get_count_of(mavis, transform, validate_data_from, ["activity"], ["customer"])
    # add the count handling
    query.add_fields(**mavis.qm.get_default_fields(is_count=True, from_sync_time=validate_data_from))
    raw_data = __run_query(mavis, query, run_live)

    # update the code based on the data
    if raw_data.total_rows == 0:
        return dict(
            passed=False,
            content="No Activities found in the Transformation",
            data=raw_data.dict(),
            query=query.to_query(),
            retrieved_at=raw_data.retrieved_at,
        )
    elif not all(r["activity"] for r in raw_data.rows):
        return dict(
            passed=False,
            content="Invalid Activity: Null found",
            data=raw_data.dict(),
            query=query.to_query(),
            retrieved_at=raw_data.retrieved_at,
        )
    else:
        issues = []

        # get the activities being created
        new_activities = [r["activity"] for r in raw_data.rows]

        # get all the current activities
        all_activites = graph_client.get_all_activities_full(company_id=mavis.company.id).all_activities

        # group all the activities
        current_activities = []
        shared_transformations = defaultdict(list)
        for a in all_activites:
            # only focus on the activities in this stream
            if a.company_table.activity_stream != transform.table:
                continue

            for t in a.transformations:
                if transform.id == t.transformation.id:
                    current_activities.append(a.slug)

                elif a.slug in new_activities:
                    shared_transformations[a.slug].append(t.transformation.name)

        removed_activities = [a for a in current_activities if a not in new_activities]
        added_activities = [a for a in new_activities if a not in current_activities]

        # handle empty activities
        for a in added_activities:
            if a is not None and a.strip() == "":
                issues.append(
                    "- **Empty activity was found** Please update the query to remove that empty activity to avoid unnecessary processing."
                )
        # remove the empty activities
        added_activities = [a for a in added_activities if a.strip() != ""]

        if removed_activities:
            if len(removed_activities) == 1 and len(added_activities) == 1:
                activity_id = next(a.id for a in all_activites if a.slug == removed_activities[0])
                issues.append(
                    f"- **Are you sure you want to change `{removed_activities[0]}` to `{added_activities[0]}`?** This will break any downstream dependencies. Consider renaming it on the [Activity Details]({PORTAL_URL}/{mavis.company.slug}/activities/edit/{activity_id}) page instead. [Learn more: Do's and Don'ts of Creating Activities](https://docs.narrator.ai/page/dos-and-donts-of-creating-activities#dont-use-timestamps-as-features)"
                )

            else:
                if added_activities:
                    extra = f" and add `{', '.join (added_activities)}`"
                else:
                    extra = ""

                issues.append(
                    f" - **Are you sure you want to remove `{', '.join(removed_activities)}` {extra}?** This can break any downstream dependencies. [Learn more: Do's and Don'ts of Creating Activities](https://docs.narrator.ai/page/dos-and-donts-of-creating-activities#dont-use-timestamps-as-features)"
                )

        # handle the shared activities
        if shared_transformations:
            shared_details = ", ".join([f'{k} is updated by {"& ".join(v)}' for k, v in shared_transformations.items()])

            issues.append(
                f" - **Multiple transformations are updating the {', '.join(shared_transformations.keys())} activities!** {shared_details} [Learn more: Using multiple transformations for a single activity](https://docs.narrator.ai/page/can-i-use-multiple-transformations-to-define-an-activity)"
            )

        # check for bad activity names
        for a_slug in new_activities:
            if any(a_slug.lower().startswith(k) for k in ("first", "last")):
                issues.append(
                    f" - **`{a_slug}` is a time-based.** Consider removing the time-based logic from your activity. This logic should be computed within a dataset instead of within the transformation logic. [Learn more: Do's and Don'ts of Creating Activities](https://docs.narrator.ai/page/dos-and-donts-of-creating-activities#dont-define-time-based-features-or-activity-names-in-the-activity-definition)"
                )

        return dict(
            passed=True,
            content="\n".join(issues),
            data=raw_data.dict(),
            query=query.to_query(),
        )


@tracer.start_as_current_span("_check_sources")
def _check_sources(mavis, transform, validate_data_from, run_live=False):
    # only run for stream
    if transform.kind != transform.kind.stream:
        return __not_for_kind(transform.kind.value)

    # get the sources
    query = __get_count_of(mavis, transform, validate_data_from, [])
    query.add_fields(**mavis.qm.get_default_fields(is_count=True, from_sync_time=validate_data_from))
    query.set_where(
        mavis.qm.Condition(
            operator="not_is_null",
            left=mavis.qm.Column(table_column="anonymous_customer_id"),
        )
    )

    raw_data = __run_query(mavis, query, run_live)

    return dict(
        passed=True,
        content=("Found Alternative Ids" if raw_data.rows[0]["total_rows"] > 0 else "No Identity Resolution needed"),
        data=raw_data.dict(),
        query=query.to_query(),
        retrieved_at=raw_data.retrieved_at,
    )


@tracer.start_as_current_span("_check_unnecessary_mapping")
def _check_unnecessary_mapping(mavis: Mavis, transform: GetTransformationSimple, validate_data_from, run_live=False):
    # only run for stream
    if transform.kind != transform.kind.stream:
        return __not_for_kind(transform.kind.value)

    # get the sources
    query = __get_count_of(mavis, transform, validate_data_from, ["anonymous_customer_id", "customer"])
    query.add_fields(**mavis.qm.get_default_fields(is_count=True, from_sync_time=validate_data_from))
    query.set_where(
        mavis.qm.Condition(
            operator="not_is_null",
            left=mavis.qm.Column(table_column="anonymous_customer_id"),
        )
    )
    query.add_order_by(3, "desc")

    raw_data = __run_query(mavis, query, run_live)

    content = "Everything is good"

    if len([r for r in raw_data.rows if r["total_rows"] > 1000]) > 50:
        content = f"{DISPLAY_CONTENT_STARTSWITH_KEY}" + "\n".join(
            [
                " - **You have a lot of unnecessary mapping (>50 users have > 1000 identical mappings).** This can cause a lot of unnecessary processing. Consider [creating a dedicated transformation for Identity Resolution](https://docs.narrator.ai/docs/identity-resolution-1)"
            ]
        )

    return dict(
        passed=True,
        content=content,
        query=query.to_query(),
        retrieved_at=raw_data.retrieved_at,
    )


@tracer.start_as_current_span("_check_limit")
def _check_limit(mavis, transform, validate_data_from, run_live=False):
    # - Check if Distinct in the query
    # - Check for 'status', 'state' ' now()' in the query between all SELECT and FROM

    if "limit" in transform.current_query.sql.lower().split():
        return dict(passed=False, content="The query has a limit in it", query=None)
    else:
        return dict(passed=True, content=None, query=None)


@tracer.start_as_current_span("_check_decimation")
def _check_decimation(mavis: Mavis, transform: GetTransformationSimple, validate_data_from, run_live=False):
    if transform.kind != transform.kind.stream:
        return __not_for_kind(transform.kind.value)

    # get the query
    query = __get_count_of(
        mavis,
        transform,
        validate_data_from,
        ["customer", "anonymous_customer_id", "activity", "ts"],
    )
    query.set_having(
        mavis.qm.Condition(
            operator="greater_than",
            left=query.columns[-1],
            right=mavis.qm.Column(value=1),
        )
    )
    raw_data = __run_query(mavis, query, run_live)

    # data
    if raw_data.total_rows == 0:
        return dict(passed=True, content="No duplication in timestamp", query=query.to_query())
    else:
        decimated_query = __create_decimated_query(mavis, transform, validate_data_from)
        content = [
            "## Duplicate Timestamps found",
            "Example Dupes",
            raw_data.pretty(),
            "### Decimating Query",
            f"```SQL \n\n {decimated_query.to_query(comment=True)} \n\n```",
        ]
        return dict(
            passed=True,
            content="\n\n".join(content),
            query=query.to_query(),
        )


def ensure_columns(transform):
    seconds = 0
    while not transform.column_renames or (transform.column_renames[0].created_at < transform.current_query.updated_at):
        if seconds > 60 * 10:
            raise SilenceError("Could not get the columns of the transformation")

        if seconds < 10:
            t = 1
        elif seconds < 50:
            t = 3
        else:
            t = 5
        sleep(t)
        transform = graph_client.get_transformation_simple(id=transform.id).transformation
        seconds += t

    return transform


@tracer.start_as_current_span("_check_id_duplication")
def _check_id_duplication(mavis: Mavis, transform: GetTransformationSimple, validate_data_from, run_live=False):
    if transform.kind == transform.kind.stream:
        ids = ["activity", "activity_id"]

    elif transform.kind in (transform.kind.enrichment, transform.kind.spend):
        transform = ensure_columns(transform)
        ids = [utils.find_first_val([c.name for c in transform.column_renames], ENRICHED_ID_COLS)]
    elif transform.kind == transform.kind.customer_attribute:
        ids = ["customer"]
    else:
        return dict(passed=True, type="markdown", content="", query="")

    # check if there is more than a single row
    query = __get_count_of(mavis, transform, validate_data_from, ids)
    query.set_having(
        mavis.qm.Condition(
            operator="greater_than",
            left=query.columns[-1],
            right=mavis.qm.Column(value=1),
        )
    )
    query.set_limit(6)
    raw_data = __run_query(mavis, query, run_live)

    # check the id duplication
    if raw_data.total_rows > 0:
        content = "\n\n".join(["## Examples duplicates", raw_data.pretty()])
        return dict(
            passed=False,
            content=content,
            query=query.to_query(),
            data=raw_data.dict(),
            retrieved_at=raw_data.retrieved_at,
        )
    else:
        return dict(
            passed=True,
            type="markdown",
            content="No Duplications Found",
            query=query.to_query(),
            retrieved_at=None,
        )


@tracer.start_as_current_span("_check_null_columns")
def _check_null_columns(mavis, transform, validate_data_from, run_live=False):
    if transform.kind == transform.kind.stream:
        ids = ["activity", "activity_id", "ts", "unique_identifier"]

    elif transform.kind in (transform.kind.enrichment, transform.kind.spend):
        transform = ensure_columns(transform)
        ids = [utils.find_first_val([c.name for c in transform.column_renames], ENRICHED_ID_COLS)]

    elif transform.kind == transform.kind.customer_attribute:
        ids = ["customer"]
    else:
        return dict(passed=True, type="markdown", content="", query="")

    # null queries
    query = mavis.qm.Query()
    query.set_from(mavis.qm.Table(query=__get_query(mavis, transform, validate_data_from)))

    # filter and count
    for col in ids:
        if col == "unique_identifier":
            temp_col = mavis.qm.Column(
                function="nvl",
                fields=dict(
                    first_column=mavis.qm.Column(table_column="customer", casting="string"),
                    second_column=mavis.qm.Column(
                        table_column="anonymous_customer_id",
                        casting="string",
                    ),
                ),
            )
        else:
            temp_col = mavis.qm.Column(table_column=col)

        query.add_column(
            mavis.qm.Column(
                function="not_exists",
                fields=dict(column=temp_col),
                name_alias=col,
            )
        )
        query.add_filter(
            mavis.qm.Condition(operator="is_null", left=temp_col),
            "OR",
        )

    raw_data = __run_query(mavis, query, run_live)

    # check the id duplication
    if raw_data.total_rows > 0:
        content = ["### The following columns are missing rows"]
        for col, missing in raw_data.rows[0].items():
            content.append(
                " - {} : {} rows missing".format(
                    (col if col != "unique_identifier" else "customer or anonymous_customer_id"),
                    utils.human_format(missing),
                )
            )
        return dict(
            passed=False,
            content="\n".join(content),
            query=query.to_query(),
            retrieved_at=raw_data.retrieved_at,
        )
    else:
        return dict(
            passed=True,
            content="No Required columns have NULl value",
            query=query.to_query(),
        )


@tracer.start_as_current_span("_get_stream_context")
def _get_stream_context(mavis: Mavis, transform: GetTransformationSimple, validate_data_from, run_live=False):
    if transform.kind != transform.kind.stream:
        return dict(passed=True, type="markdown", content="", query="")

    # get the count of the data
    query = __get_count_of(mavis, transform, validate_data_from, [])
    count_rows = __run_query(mavis, query)
    count_rows = count_rows.rows[0]["total_rows"]

    # create the sub query of the activity stream
    activity_query = mavis.qm.Query()
    activity_query.add_column(mavis.qm.Column(all_columns=True))
    activity_query.set_from(mavis.qm.Table(schema=mavis.company.warehouse_schema, table=transform.table))

    # filte 2 months before the range and the first occurrence
    activity_query.add_filter(
        mavis.qm.Filter(
            filters=[
                mavis.qm.Condition(
                    operator="greater_than",
                    left=mavis.qm.Column(table_column="ts"),
                    right=mavis.qm.Column(
                        value=utils.date_add(validate_data_from, "month", -2),
                        casting="timestamp",
                    ),
                ),
                "AND",
                mavis.qm.Condition(
                    operator="equal",
                    left=mavis.qm.Column(table_column="activity_occurrence"),
                    right=mavis.qm.Column(value=1),
                ),
            ]
        )
    )

    # get the first row in this query
    query = mavis.qm.Query()
    query.add_column(mavis.qm.Column(table_column="activity", table_alias="s"))
    query.add_column(
        mavis.qm.Column(
            function="sum",
            fields=dict(
                column=mavis.qm.Column(
                    function="condition_flag",
                    fields=dict(
                        condition=mavis.qm.Condition(
                            operator="less_than",
                            left=mavis.qm.Column(table_column="ts", table_alias="s"),
                            right=mavis.qm.Column(table_column="ts", table_alias="c"),
                        )
                    ),
                )
            ),
            name_alias="rows_first_before",
        )
    )
    query.add_column(
        mavis.qm.Column(
            function="sum",
            fields=dict(
                column=mavis.qm.Column(
                    function="condition_flag",
                    fields=dict(
                        condition=mavis.qm.Condition(
                            operator="greater_than",
                            left=mavis.qm.Column(table_column="ts", table_alias="s"),
                            right=mavis.qm.Column(table_column="ts", table_alias="c"),
                        )
                    ),
                )
            ),
            name_alias="rows_first_after",
        )
    )
    query.set_from(mavis.qm.Table(query=__get_query(mavis, transform, validate_data_from), alias="c"))
    query.add_join(
        mavis.qm.Join(
            table=mavis.qm.Table(query=activity_query, alias="s"),
            kind="INNER",
            condition=mavis.qm.Condition(
                operator="equal",
                left=__get_person_column(mavis, alias="s"),
                right=__get_person_column(mavis, alias="c"),
            ),
        )
    )
    query.add_group_by(1)

    # add the columns
    raw_data = __run_query(mavis, query, run_live)
    raw_data.columns.extend(
        [
            TableColumn(
                id="first_before",
                field="first_before",
                raw_type="float",
                type="number",
                context=TableColumnContext(format="percent"),
                header_name="% first Before",
            ),
            TableColumn(
                id="first_after",
                field="first_after",
                raw_type="float",
                type="number",
                context=TableColumnContext(format="percent"),
                header_name="% first After",
            ),
            TableColumn(
                id="missing",
                field="missing",
                raw_type="float",
                type="number",
                context=TableColumnContext(format="percent"),
                header_name="% Missing",
            ),
        ]
    )
    for r in raw_data.rows:
        r["first_before"] = r["rows_first_before"] * 1.0 / count_rows
        r["first_after"] = r["rows_first_after"] * 1.0 / count_rows
        r["missing"] = 1.0 - ((r["rows_first_after"] + r["rows_first_before"]) * 1.0 / count_rows)

    return dict(
        passed=True,
        content=raw_data.pretty(),
        query=query.to_query(),
    )


def _check_identity_resolution(mavis: Mavis, transform: GetTransformationSimple, validate_data_from, run_live=False):
    """
        Runs a check to make sure the query is efficient. Test for the following
    - 1 anonymous_customer_id mapped to a lot of customers
    - 1 anonymous_customer_id mapped many many times -
    - 1 customer mapped to a lot of anonymous_customer_id (to do later)

            SELECT
                anonymous_customer_id, count(1) as total_rows, count(distinct customer) as total_customrs
            from table
            where anonymous_customer_id is not null and customer is not null
            order by decimated(total_customers) desc, total_rows desc

            if total_customers > 10 for more than 5 anonymous_cusotmer_ids:
        - It seems weird that > 10 anonymous_customer_id are mapped to as much as X number (ex. _____, ____, ___)

            if avg(total_rows / total_customers) > 20
        - It seems that we are also adding the same mapping many times (avg X times per mapping). We recommend you split it and create a separate activity. learn how and why
    """
    issues_found = []

    # null queries
    query = mavis.qm.Query()
    query.set_from(mavis.qm.Table(query=__get_query(mavis, transform, validate_data_from)))
    query.add_column(
        [
            mavis.qm.Column(
                table_column="anonymous_customer_id",
            ),
            mavis.qm.Column(function="count_all", fields=dict(), name_alias="total_rows"),
        ]
    )

    if mavis.company.warehouse_language == "mssql_odbc":
        query.add_column(
            mavis.qm.Column(
                components=[
                    mavis.qm.Column(
                        function="count_distinct",
                        fields=dict(
                            column=mavis.qm.Column(
                                function="nvl",
                                fields=dict(
                                    first_column=mavis.qm.Column(table_column="customer"),
                                    second_column=mavis.qm.Column(value=""),
                                ),
                            )
                        ),
                    ),
                    "-",
                    mavis.qm.Column(value=1),
                ],
                name_alias="total_customers",
            )
        )

    else:
        query.add_column(
            mavis.qm.Column(
                function="count_distinct",
                fields=dict(column=mavis.qm.Column(table_column="customer")),
                name_alias="total_customers",
            ),
        )

    # add null checks
    query.add_filter(
        mavis.qm.Condition(
            operator="not_is_null",
            left=mavis.qm.Column(
                table_column="anonymous_customer_id",
            ),
        )
    )
    query.add_filter(
        mavis.qm.Condition(
            operator="not_is_null",
            left=mavis.qm.Column(
                table_column="customer",
            ),
        )
    )

    query.add_group_by(1)
    query.add_order_by([3, 2], asc=False)

    # get the data
    raw_data = __run_query(mavis, query, run_live)

    # check if an anonymous_id is mapped to too many values
    high_anonymous_ids = [
        f"`{r['anonymous_customer_id']}` ({utils.hf(r['total_customers'], 'number')} customers)"
        for r in raw_data.rows
        if r["total_customers"] > 10
    ]
    if len(high_anonymous_ids) > 10:
        issues_found.append(
            f"**Some anonymous_customer_ids are associated with a LARGE number of customers.** For example, {high_anonymous_ids[0]} is associated with {utils.hf(raw_data.rows[0]['total_customers'], 'number')} distinct customer values. This association will impact identity resolution for the entire activity stream. Please confirm that this is expected before you push to production (or ask support@narrator.ai if you have questions)."
        )

    # check if an anonymous_id is mapped to too many values
    avg_total = (
        utils.apply_function(
            "average",
            [r["total_rows"] * 1.0 / max(1, r["total_customers"]) for r in raw_data.rows],
        )
        or 0
    )
    if avg_total > 20:
        issues_found.append(
            f" - **TIP: Improve processing time by adding a dedicated transformation for ID resolution**. This transformation includes duplicative identity resolution logic (avg {utils.hf(avg_total, 'number')} duplicates). While this has no impact on data integrity, it can slow down processing in your warehouse for each activity stream update. Consider setting the customer value to NULL in this transformation and adding a dedicated transformation for identity resolution. [Learn more: Dedicated Activities for ID Resolution](https://docs.narrator.ai/docs/identity-resolution-1%5C)"
        )

    # check the data

    return dict(
        passed=True,
        content="\n".join(issues_found),
        query=query.to_query(),
    )


def __run_query(mavis, query, run_live=False) -> TableData:
    if query.limit is None:
        query.set_limit(100)

    try:
        return mavis.run_query(query.to_query(), within_minutes=0 if run_live else CACHE_TIME)
    except WarehouseRandomError:
        sleep(2)
        return mavis.run_query(query.to_query(), within_minutes=0)


def __get_person_column(mavis, alias=None):
    person_column = mavis.qm.Column(
        function="nvl",
        fields=dict(
            first_column=mavis.qm.Column(table_column="customer", table_alias=alias),
            second_column=mavis.qm.Column(table_column="anonymous_customer_id", table_alias=alias),
        ),
        name_alias="person",
    )
    return person_column


def __get_count_of(mavis, transform, validate_data_from, columns, count_distinct=None):
    count_distinct = count_distinct or []

    query = mavis.qm.Query()
    query.set_from(mavis.qm.Table(query=__get_query(mavis, transform, validate_data_from), alias="s"))
    for c in columns:
        if c == "customer":
            col = mavis.qm.Column(
                function="lower",
                fields=dict(column=mavis.qm.Column(table_column=c, casting="string")),
                name_alias=c,
            )
        else:
            col = mavis.qm.Column(table_column=c)

        # add the columns
        query.add_column(col)
        query.add_group_by(col)

    query.add_column(mavis.qm.Column(function="count_all", fields=dict(), name_alias="total_rows"))

    for c in count_distinct:
        if mavis.company.warehouse_language == "mssql_odbc":
            query.add_column(
                mavis.qm.Column(
                    components=[
                        mavis.qm.Column(
                            function="count_distinct",
                            fields=dict(
                                column=mavis.qm.Column(
                                    function="nvl",
                                    fields=dict(
                                        first_column=mavis.qm.Column(table_column=c),
                                        second_column=mavis.qm.Column(value=""),
                                    ),
                                )
                            ),
                        ),
                        "-",
                        mavis.qm.Column(value=1),
                    ],
                    name_alias=f"total_distinct_{c}",
                )
            )
        else:
            query.add_column(
                mavis.qm.Column(
                    function="count_distinct",
                    fields=dict(column=mavis.qm.Column(table_column=c)),
                    name_alias=f"total_distinct_{c}",
                )
            )
    return query


def __create_decimated_query(mavis: Mavis, transform: GetTransformationSimple, validate_data_from, run_live=False):
    group = [
        mavis.qm.Column(table_column="customer"),
        mavis.qm.Column(table_column="activity"),
    ]

    decimated_query = __get_query(mavis, transform, validate_data_from)
    decimated_query.add_column(
        mavis.qm.Column(
            function="lag",
            fields=dict(
                column=mavis.qm.Column(table_column="ts"),
                group=group,
                order=[mavis.qm.Column(table_column="ts")],
            ),
            name_alias="last_ts",
        )
    )
    decimated_query.set_where(
        mavis.qm.Condition(
            operator="greater_than",
            right=mavis.qm.Column(table_column="ts"),
            left=mavis.qm.Column(
                function="date_add",
                fields=dict(
                    datepart="day",
                    number=-2,
                    column=mavis.qm.Column(value="{from_sync_time}", casting="timestamp"),
                ),
            ),
        )
    )
    decimated_query.add_filter(
        mavis.qm.Condition(
            operator="less_than",
            right=mavis.qm.Column(table_column="ts"),
            left=mavis.qm.Column(value="{to_sync_time}", casting="timestamp"),
        )
    )
    decimated_query.add_comment(
        "from_sync_time and to_sync_time will enable the update to be much faster since it filters before the window function"
    )

    wrapped_query = mavis.qm.Query()
    wrapped_query.add_column(mavis.qm.Column(all_columns=True))
    wrapped_query.set_from(mavis.qm.Table(query=decimated_query))
    wrapped_query.set_where(
        mavis.qm.Condition(
            operator="greater_than",
            left=mavis.qm.Column(
                function="time_diff",
                fields=dict(
                    datepart="second",
                    from_column=mavis.qm.Column(table_column="last_ts"),
                    to_column=mavis.qm.Column(table_column="ts"),
                ),
            ),
            right=mavis.qm.Column(value=5),
        )
    )
    wrapped_query.add_fields(from_sync_time="{from_sync_time}", to_sync_time="{to_sync_time}")
    return wrapped_query


def __get_query(mavis, transform, validate_data_from, run_live=False, use_prod=False):
    query = mavis.qm.Query()
    query.add_column(mavis.qm.Column(all_columns=True))
    if use_prod:
        raw_sql = transform.production_queries[0].sql
    else:
        raw_sql = transform.current_query.sql

    query.set_from(mavis.qm.Table(sql=raw_sql, alias="s"))

    query.add_fields(**mavis.qm.get_default_fields(from_sync_time=validate_data_from))

    if transform.kind == transform.kind.stream:
        ts_column = "ts"

        # if we still use source_id then add it
        if "anonymous_customer_id" not in raw_sql.lower():
            # don't add the source id
            if "source_id" not in raw_sql.lower():
                raise ValueError("Missing `anonymous_customer_id` column from your query")

            # also add the alternate customer id
            query.add_column(
                mavis.qm.Column(
                    function="concat",
                    fields=dict(
                        first_column=mavis.qm.Column(table_column="source", table_alias="s"),
                        second_column=mavis.qm.Column(table_column="source_id", table_alias="s"),
                    ),
                    column_type="string",
                    name_alias="anonymous_customer_id",
                )
            )

    elif transform.kind == transform.kind.enrichment:
        ts_column = utils.find_first_val([c.name for c in transform.column_renames], ENRICHED_TS_COLS)

    else:
        ts_column = None

    if ts_column and validate_data_from:
        query.set_where(
            mavis.qm.Filter(
                filters=[
                    mavis.qm.Condition(
                        operator="greater_than",
                        left=mavis.qm.Column(table_column=ts_column),
                        right=mavis.qm.Column(value=validate_data_from, casting="timestamp"),
                    ),
                    "OR",
                    mavis.qm.Condition(
                        operator="is_null",
                        left=mavis.qm.Column(table_column=ts_column),
                    ),
                ]
            )
        )
    return query


def __not_for_kind(kind):
    return dict(passed=True, content=f"Test does not run on *{kind}* transformations")
