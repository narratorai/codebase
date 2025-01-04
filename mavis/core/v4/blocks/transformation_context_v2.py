import json
from time import sleep

from dramatiq_abort import abort

from batch_jobs.data_management.run_transformations import (
    _create_activities,
    _get_transformation_join_key,
    _get_ts_column,
    delete_transformation_process,
    is_resync,
    run_transformations,
)
from core import utils
from core.api.customer_facing.tasks.utils import TaskManager
from core.api.customer_facing.transformations.models import NewTask, ProcessingConfiguration, test_enum
from core.api.customer_facing.transformations.utils import TransformationManager
from core.constants import (
    DEFAULT_DAYS,
    MV_TRANSFORMATION_PROCESS,
    NORMAL_TRANSFORMATION_PROCESS,
    RECONCILE_TRANSFORMATION_PROCESS,
    RUN_TRANSFORMATION_PATH,
)
from core.decorators.task import task
from core.errors import SilenceError
from core.graph import graph_client
from core.graph.sync_client.enums import (
    company_task_category_enum,
    transformation_test_status_enum,
    transformation_update_types_enum,
)
from core.graph.sync_client.get_transformation_tests import GetTransformationTestsTests
from core.logger import get_logger
from core.models.ids import get_uuid, is_valid_uuid
from core.models.internal_link import PORTAL_URL, InternalLink
from core.models.table import TableData
from core.util.opentelemetry import set_current_span_attributes, tracer
from core.util.tracking import fivetran_track
from core.v4.blocks.shared_ui_elements import (
    _checkbox,
    _date_picker,
    _drop_down,
    _hide_properties,
    _input,
    _make_array,
    _make_steps,
    _make_ui,
    _number,
    _object,
    _space,
    _who_when,
)
from core.v4.blocks.transformation_tests import ALL_TESTS, DISPLAY_CONTENT_STARTSWITH_KEY
from core.v4.datasetPlotter import AntVPlot
from core.v4.documentation import get_doc
from core.v4.mavis import Mavis, initialize_mavis

logger = get_logger()


TITLE = "Transformation"
DESCRIPTION = "A way to create/edit a Transformation"
VERSION = 1

FIVETRAN_TRACKING_URL = "https://webhooks.fivetran.com/webhooks/21cfe8ff-a50b-460d-bac1-33a22b8a0943"
VALIDATION_FAILURE_BEACON_ID = "ea264a5b-d14e-4841-a412-7c3f03f8d6d9"
AUTO_GENERATE_STRING = "auto-generate"

KINDS = [
    dict(slug="stream", name="Activity"),
    dict(slug="enrichment", name="Feature Dimension"),
    dict(slug="customer_attribute", name="Customer Dimension"),
    dict(slug="spend", name="Aggregate Dimension"),
]

UPDATE_TYPES = dict(
    customer_attribute=["materialized_view", "view"],
    stream=["regular", "materialized_view", "mutable", "single_run"],
    enrichment=["materialized_view", "regular", "mutable", "single_run", "view"],
    spend=["materialized_view", "mutable", "regular", "single_run"],
)

TYPE_RENAMES = {
    "view": "View",
    "materialized_view": "Full Update",
    "mutable": "Insert Missing Rows only",
    "regular": "Incremental Update",
    "single_run": "Single Update",
}


ASYNC_TYPES = (
    transformation_update_types_enum.materialized_view,
    transformation_update_types_enum.mutable,
)


# Tests that if they fail then don't worry about failing all of validation
AUTO_FAIL_TEST_IGNORE_LIST = ["check_activities", "check_sources", "check_limit"]

FAILED_STATUS = "Failed ❌"
PASSED_STATUS = "Passed 👍"
RUNNING_STATUS = "Running ⏳"

ALL_TEST_STATUS = dict(
    failed=dict(detail_key="failure_name", icon="❌"),
    running=dict(detail_key="pending_name", icon="🏃‍♀️"),
    passed=dict(detail_key="success_name", icon="✓"),
)


def track(mavis, action, transformation_id, **kwargs):
    fivetran_track(
        mavis.user,
        FIVETRAN_TRACKING_URL,
        dict(action=action, transformation_id=transformation_id, **kwargs),
    )


@tracer.start_as_current_span("get_schema")
def get_schema(mavis: Mavis, internal_cache: dict):
    # cached datasets
    is_loaded = internal_cache["loaded_id"] or False
    name = internal_cache["name"] or "New Transformation"
    slug = internal_cache["slug"] or ""
    in_production = internal_cache["in_production"] or False
    all_transformations = internal_cache["all_transformations"] or []
    activities = internal_cache["activity_slugs"]

    update_type = internal_cache["update_type"]
    kind = internal_cache["kind"] or "stream"

    table_default = _get_table_default(mavis, kind)
    current_table = internal_cache["current_table"] or table_default
    sql_fields = internal_cache["sql_fields"]

    DAY_AGO_SQL = mavis.qm.Column(
        function="date_add",
        fields=dict(
            datepart="day",
            number=-1,
            column=mavis.qm.Column(function="now", fields=dict()),
        ),
    ).to_query()

    if not activities:
        activities = ["CREATED_ACTIVITY"]

    activity_condition = mavis.qm.Condition(
        operator="is_in",
        left=mavis.qm.Column(table_column="activity", table_alias="s"),
        right=[mavis.qm.Column(value=a) for a in activities],
    ).to_query()

    activity_occurrence_condition = mavis.qm.Condition(
        operator="equal",
        left=mavis.qm.Column(table_column="activity_occurrence", table_alias="s"),
        right=mavis.qm.Column(value=1),
    ).to_query()

    activity_source_condition = mavis.qm.Condition(
        operator="equal",
        left=mavis.qm.Column(
            table_column=("_activity_source" if kind == "activity" else "_enrichment_source"),
            table_alias="s",
        ),
        right=mavis.qm.Column(value=slug),
    ).to_query()

    DEFAULT_VALIDATION_QUERY = "\n".join(
        [
            "-- Example: Check if the query had rows in the last day",
            "SELECT",
            "  * ",
            "FROM {production_query} s",
            f"where s.ts > {DAY_AGO_SQL}",
        ]
    )

    TEST_SUBSCRIPTIONS = """
    subscription GetTransformationTests($transformation_id: uuid!) {
        transformation_test(
            order_by: [{ created_at: desc }]
            limit: 30
            where: {
                transformation_id: { _eq: $transformation_id }
                status: { _in: [Passed, Failed]}
            }
        ) {
            updated_at
        }
    }
    """
    TEST_SUBSCRIPTIONS_INPUTS = dict(transformation_id=internal_cache["loaded_id"])
    # create the helper text
    helpers = __add_helper_text()

    descriptions = dict(
        from_sync_time="the FROM time of the incremental update of this transformation. Useful for inner query optimization",
        to_sync_time="the TO time of the incremental update of this transformation. Useful for inner query optimization",
        min_date="The minimum data to allow updates.  Set via company config or 1900-01-01",
        max_date="Tomorrow.  Narrator doesn't allow future update unless specified in processing config",
        count_comment="Puts a `--` in here when trying to count how many rows are there in the data.  Useful for removing window functions or expensive aggregations to better decimate the data to insert it",
        count_ignore="Puts a ` and 1<>1` in here when trying to count how many rows are there in the data.  Useful for removing window functions or expensive aggregations to better decimate the data to insert it",
    )

    all_tables = [dict(id=t, name=t) for t in list(set([t["table"] for t in all_transformations if t["kind"] == kind]))]

    # is first
    is_first = len(all_transformations) == 0

    # set the current table as the first one
    if current_table is None and not is_first:
        current_table = all_transformations[0]["table"]

    same_kind_transformations = [
        t for t in all_transformations if t.get("kind") == kind and t.get("table") == current_table
    ]

    hide_copy = is_loaded or len(same_kind_transformations) == 0

    # define the schema
    schema = _object(
        dict(
            current_script=_object(
                dict(
                    banner=_input(),
                    id=_drop_down(all_transformations, "id", "name", title="Load a Transformation"),
                    kind=_drop_down(KINDS, "slug", "name", default="stream", title="Create a ..."),
                    name=_input("Transformation Name", default="New Transformation"),
                    save_header=_checkbox("Save"),
                    table_name=_drop_down(all_tables, "id", "name", title="Table", default=table_default),
                    copy_from=_drop_down(
                        same_kind_transformations,
                        "id",
                        "name",
                        title="Copy a query form another transformation",
                    ),
                    step_flow=_make_steps(name="validation_steps", default=create_steps_data()["steps"]),
                    user_feedback=_input(),
                    current_query_scratchpad=_object(
                        dict(
                            field_slug=_input(default="query_with_scratchpad"),
                            current_query=_object(
                                dict(
                                    sql=_input(default=__load_default_query(mavis, kind)),
                                )
                            ),
                            scratchpad=_object(
                                dict(notes=_input(default=__load_default_scratchpad(kind))),
                            ),
                        )
                    ),
                    resync_data=_checkbox(
                        "Skip Resyncing Data",
                        default=False,
                    ),
                ),
                title="Current Script",
            ),
            validations=_object(
                dict(
                    helper_feedback=_input(default=helpers["validations"]),
                    validations=_make_array(
                        dict(
                            sql=_input("SQL Query", default=DEFAULT_VALIDATION_QUERY),
                            notes=_input("Notes"),
                            who_when=_input(),
                            name=_input(
                                "Alert Name",
                                default=f"{name} {get_uuid()[:4]}",
                            ),
                            email=_input("Email on Failure", default=mavis.user.email or ""),
                            cron=_input("Cron Schedule", default="0 7 * * *"),
                            kind=_drop_down(
                                graph_enum="company_query_alert_kinds",
                                title="Alert On",
                                default="returns_rows",
                            ),
                        ),
                    ),
                    save=_checkbox("Save"),
                    # user_feedback=_input(),
                ),
                title="User Defined SQL Test",
            ),
            production_versions=_object(
                dict(production_query=_input()),
                title="Production Versions",
            ),
            updates=_object(
                dict(
                    start_date=_date_picker(
                        "Show data Starting",
                        default=utils.date_add(utils.utcnow(), "day", -14)[:10],
                    ),
                    refresh=_checkbox("Refresh"),
                    details=_input(),
                    update_plot=_input(),
                ),
                title="Transformation Updates",
            ),
            process_configuration=_object(
                dict(
                    update_type=_drop_down(
                        [dict(slug=t, label=TYPE_RENAMES[t]) for t in UPDATE_TYPES[kind]],
                        "slug",
                        "label",
                        default=UPDATE_TYPES[kind][0],
                        title="Update Type (CAUTION)",
                    ),
                    columns=_input("Columns Generated"),
                    every_update=_object(
                        dict(
                            has_source=_checkbox("Requires Identity Resolution"),
                            is_aliasing=_checkbox("Process as an Aliasing Activity"),
                            remove_customers=_checkbox("Is a Removelist Activity (CAUTION)"),
                            delete_window=_number("Days to Delete"),
                            allow_future_data=_checkbox("Allow future Data"),
                            notify_row_count_percent_change=_number("Percent Diff", default=0.20),
                            do_not_update_on_percent_change=_checkbox("Do not update if anomaly detected (CAUTION)"),
                        ),
                        title="Processing",
                    ),
                    dependency=_object(
                        dict(
                            depends_on=_drop_down(
                                all_transformations,
                                "id",
                                "name",
                                is_multi=True,
                                title="Resynced if any of the following resync:",
                            ),
                            run_after=_drop_down(
                                [t for t in all_transformations if t["task_id"] == internal_cache["task_id"]],
                                "id",
                                "name",
                                is_multi=True,
                                title="Run After",
                            ),
                        ),
                        title="Dependency",
                    ),
                    resync=_object(
                        dict(
                            do_not_delete_on_resync=_checkbox("Do NOT Delete Old Data When Resyncing (CAUTION)"),
                            resync_data_after=_date_picker("Override Start Data After"),
                            max_days_to_insert=_number("Increment in Days (CAUTION)"),
                            mutable_day_window=_number(
                                "Override time window for reconcile stream processing (in Days)",
                            ),
                        ),
                        title="Resyncing",
                    ),
                    task_id=_drop_down(
                        [
                            dict(id=t.id, label=t.label)
                            for t in graph_client.get_company_tasks_by_path(
                                mavis.company.id, path=RUN_TRANSFORMATION_PATH
                            ).company_task
                            if t.task_slug != RECONCILE_TRANSFORMATION_PROCESS
                        ],
                        "id",
                        "label",
                        title="Processing Task Schedule",
                    ),
                    save=_checkbox("Save"),
                    cancel_next_resync=_checkbox("Cancel Next Resync"),
                    trigger_resync=_checkbox("Trigger a Resync ♺"),
                    undeploy=_checkbox("Remove from Production"),
                ),
                title="Processing Configuration",
            ),
        ),
        title=f"{TITLE}: {name}",
        description=DESCRIPTION,
    )

    # Put things behind flags to make it easier
    current_script = schema["properties"]["current_script"]
    _hide_properties(current_script, ["user_feedback"], "hide_query", ["current_query_scratchpad"])
    _hide_properties(current_script, ["resync_data"], "is_validated")

    # hide and and show some updates
    config = schema["properties"]["process_configuration"]
    _hide_properties(config, ["columns"], "show_default_columns")
    _hide_properties(config, ["new_activities"], "create_new_activity")

    _hide_properties(config["properties"]["every_update"], ["delete_window"], "delete_recent_days")
    _hide_properties(
        config["properties"]["every_update"],
        ["notify_row_count_percent_change", "do_not_update_on_percent_change"],
        "enable_anomaly_detection",
    )
    _hide_properties(
        config["properties"]["resync"],
        ["max_days_to_insert"],
        "skip_count",
        override_name="Skip Row Counts (Data too large)",
    )
    _hide_properties(config, ["cancel_next_resync"], "scheduled_resync", ["trigger_resync"])

    # create the tabs
    tabs = [
        utils.create_tab(
            "Define",
            "current_script",
            tab_id="current_script",
            info_modal=get_doc(mavis.company, "transformations_v2/define"),
        )
    ]
    if is_loaded:
        tabs.append(
            utils.create_tab(
                "Alerts",
                "validations",
                tab_id="validations",
                info_modal=get_doc(
                    mavis.company,
                    "transformations_v2/alerts",
                    activity_occurrence_condition=activity_occurrence_condition,
                    activity_condition=activity_condition,
                    activity_source_condition=activity_source_condition,
                    table=current_table,
                    day_ago_sql=DAY_AGO_SQL,
                    production_query=internal_cache["production_query"] or "NO QUERY YET",
                    exact_query=DEFAULT_VALIDATION_QUERY.format(
                        production_query=f'(\n {internal_cache["production_query"] or "NO QUERY YET"} \n)'
                    ),
                    default_validation_query=DEFAULT_VALIDATION_QUERY,
                ),
            )
        )

    if in_production:
        tabs.append(
            utils.create_tab(
                "Change Log",
                "production_versions",
                tab_id="production_versions",
                info_modal=get_doc(mavis.company, "transformations_v2/change_log"),
            )
        )
        tabs.append(utils.create_tab("Updates", "updates", tab_id="updates"))

    if is_loaded:
        tabs.append(
            utils.create_tab(
                "Advanced Config",
                "process_configuration",
                tab_id="process_configuration",
                info_modal=get_doc(mavis.company, "transformations_v2/processing_configuration"),
            )
        )

    if kind == "stream":
        customer_table = None
        if len(mavis.company.tables) > 0:
            if mavis.company.tables[-1].customer_dim_table_id:
                customer_table = graph_client.get_dim(
                    id=mavis.company.tables[-1].customer_dim_table_id
                ).dim_table_by_pk.table

            table_documentation = get_doc(
                mavis.company,
                "transformations_v2/define/table_multiple_context",
                activity_stream=mavis.company.tables[-1].activity_stream,
                identifier=mavis.company.tables[-1].identifier or "Not Customer Identifier set yet",
                customer_table=customer_table or "Not Customer Table Added",
            )
        else:
            table_documentation = get_doc(mavis.company, "transformations_v2/define/table_first_time_context")

    elif kind == "customer_attribute":
        table_documentation = get_doc(mavis.company, "transformations_v2/define/customer_attribute_table_name")
    elif kind == "enrichment":
        table_documentation = get_doc(mavis.company, "transformations_v2/define/enrichment_table_name")
    elif kind == "spend":
        table_documentation = get_doc(mavis.company, "transformations_v2/define/spend_table_name")

    else:
        table_documentation = ""

    schema_ui = dict(
        **_make_ui(
            options=dict(
                hide_submit=True,
                hide_output=True,
                title=False,
                flex_direction="row",
                flex_wrap="wrap",
                graph_subscription=(TEST_SUBSCRIPTIONS if internal_cache["loaded_id"] else None),
                graph_subscription_inputs=(TEST_SUBSCRIPTIONS_INPUTS if internal_cache["loaded_id"] else None),
            ),
            tabs=dict(tabs=tabs),
        ),
        current_script=dict(
            **_make_ui(
                options=dict(
                    flex_direction="row",
                    flex_wrap="wrap",
                    title=False,
                ),
                order=[
                    "banner",
                    "refresh",
                    "id",
                    "kind",
                    "table_name",
                    "copy_from",
                    "load_default",
                    "save_header",
                    "name",
                    "step_flow",
                    "validate_query",
                    "push_to_prod",
                    "user_feedback",
                    "current_query_scratchpad",
                    "context",
                    # "current_query",
                    # "scratchpad",
                    # "save",
                    "*",
                    "resync_data",
                ],
            ),
            resync_data=_make_ui(info_modal=get_doc(mavis.company, "transformations_v2/define/skip_resync_data")),
            banner=_make_ui(widget="MarkdownRenderWidget", options=dict(data_public=True)),
            refresh=_make_ui(
                widget="BooleanButtonWidget",
                options=dict(process_data=True, **_space(100, inline_button=True)),
            ),
            # hide as soon as you have a name
            id=_make_ui(hidden=True, options=dict(process_data=True, update_schema=True)),
            kind=_make_ui(
                disabled=is_loaded or is_first,
                info_modal=get_doc(mavis.company, "transformations_v2/define/transformation_types"),
                options=dict(
                    **_space(20),
                    update_schema=True,
                    process_data=True,
                    data_public=True,
                ),
            ),
            table_name=_make_ui(
                disabled=in_production,
                info_modal=table_documentation,
                options=dict(
                    **_space(
                        60 if (hide_copy and kind == "stream") else 30,
                        inner_width=50 if (hide_copy and kind == "stream") else None,
                    ),
                    allows_new_items=True,
                    data_public=True,
                    update_schema=True,
                ),
            ),
            copy_from=_make_ui(
                hidden=hide_copy,
                options=dict(process_data=True, **_space(30), data_public=True),
                help_text="Copy the SQL from another transformation",
            ),
            save_header=_make_ui(
                widget="BooleanButtonWidget",
                options=dict(
                    **_space(20, align_right=True),
                    process_data=True,
                    update_schema=not is_loaded,
                    button_type="primary",
                ),
            ),
            name=_make_ui(
                options=dict(**_space(100, pr=0), data_public=True, size="large"),
                help_text=("Transformation slug: " + slug) if slug else None,
                info_modal=(
                    get_doc(mavis.company, "transformations_v2/define/transformation_name") if not slug else None
                ),
            ),
            load_default=_make_ui(
                widget="BooleanButtonWidget",
                hidden=is_loaded,
                options=dict(process_data=True, **_space(40, inline_button=True)),
            ),
            step_flow=_make_ui(
                field="step",
                options=dict(**_space(100, is_steps=True), process_data=True),
            ),
            current_query_scratchpad=_make_ui(
                field="QueryWithScratchpadField",
                options=dict(
                    process_data=True,
                    fields_autocomplete=[
                        dict(
                            name=k,
                            display_name=k,
                            kind="field_variable",
                            description=dict(value=v),
                            sql=k,
                        )
                        for k, v in descriptions.items()
                    ],
                ),
            ),
            save=_make_ui(
                widget="BooleanButtonWidget",
                options=dict(
                    **_space(20, inline_button=True),
                    process_data=True,
                    update_schema=not is_loaded,
                    button_type="primary",
                ),
            ),
            # context
            context=_make_ui(
                widget="MarkdownRenderWidget",
                options=dict(**_space(30)),
            ),
            # validate button
            validate_query=_make_ui(
                widget="BooleanButtonWidget",
                options=dict(
                    **_space(30, inline_button=True),
                    process_data=True,
                ),
            ),
            # only show after validation
            push_to_prod=_make_ui(
                widget="BooleanButtonWidget",
                # help_text="Validation is required before pushing to production",
                options=dict(
                    **_space(30, inline_button=True),
                    process_data=True,
                    update_schema=not in_production,
                ),
            ),
            user_feedback=_make_ui(
                widget="MarkdownRenderWidget",
                options=_space(
                    outer_box_props=dict(width="100%", p="1", bg="gray100"),
                    inner_box_props=dict(p="1", bg="white"),
                ),
            ),
            # flags for state management
            is_validated=_make_ui(hidden=True),
            not_dirty=_make_ui(hidden=True),
            hide_query=_make_ui(hidden=True),
        ),
        validations=dict(
            **_make_ui(
                options=dict(title=False),
                order=["helper_feedback", "save", "validations", "user_feedback"],
            ),
            helper_feedback=_make_ui(
                widget="MarkdownRenderWidget",
                options=dict(**_space(80), data_public=True),
            ),
            validations=dict(
                **_make_ui(options=dict(title=False)),
                items=dict(
                    # query area
                    sql=_make_ui(
                        widget="SqlWithTableWidget",
                        options=dict(
                            default_height=300,
                            fields=sql_fields,
                            fields_autocomplete=[
                                dict(
                                    name="production_query",
                                    display_name="production_query",
                                    kind="field_variable",
                                    description=dict(
                                        value="The SQL of current query in production \n ```sql \n{} \n ```".format(
                                            sql_fields.get("production_query")
                                        ),
                                    ),
                                    sql="production_query",
                                )
                            ],
                        ),
                    ),
                    # query area
                    notes=_make_ui(
                        widget="MarkdownWidget",
                        options=dict(default_height=50),
                    ),
                    who_when=_make_ui(widget="MarkdownRenderWidget"),
                    name=_make_ui(options=_space(30)),
                    email=_make_ui(options=_space(30)),
                    cron=_make_ui(
                        # widget="CronSelectFormItemWidget",
                        options=dict(**_space(20), data_public=True),
                        help_text="Schedule is in Local Timezone! If custom, then just add the cron '0 4 * * *'",
                    ),
                    kind=_make_ui(options=dict(**_space(20), data_public=True)),
                ),
            ),
            save=_make_ui(
                widget="BooleanButtonWidget",
                options=dict(
                    **_space(20, align_right=True),
                    process_data=True,
                    button_type="primary",
                ),
            ),
            user_feedback=_make_ui(widget="MarkdownRenderWidget"),
        ),
        production_versions=dict(
            **_make_ui(options=dict(title=False)),
            production_query=_make_ui(widget="MarkdownRenderWidget"),
        ),
        updates=dict(
            **_make_ui(
                hidden=not in_production,
                order=["start_date", "refresh", "details", "update_plot"],
                options=dict(title=False),
            ),
            start_date=_make_ui(options=dict(process_data=True, **_space(30))),
            refresh=_make_ui(
                widget="BooleanButtonWidget",
                options=dict(process_data=True, **_space(40, inline_button=True)),
            ),
            details=_make_ui(widget="MarkdownRenderWidget"),
            update_plot=_make_ui(widget="PlotRenderWidget"),
        ),
        process_configuration=dict(
            **_make_ui(
                options=dict(title=False),
                order=[
                    "update_type",
                    "task_id",
                    "table_name",
                    "identifier",
                    "activities",
                    "save",
                    "create_new_activity",
                    "new_activities",
                    "show_default_columns",
                    # "columns_context",
                    "columns",
                    "advanced_configuration",
                    "every_update",
                    "dependency",
                    "resync",
                    "nightly_diff",
                    "user_feedback",
                    "resyncing",
                    "trigger_resync",
                    "cancel_next_resync",
                    "undeploy",
                    "*",
                ],
            ),
            update_type=_make_ui(
                options=dict(
                    **_space(30, mb=32),
                    update_schema=True,
                    process_data=True,
                    data_public=True,
                ),
                info_modal=get_doc(
                    mavis.company,
                    "transformations_v2/processing_configuration/update_type",
                    table=current_table,
                ),
            ),
            create_new_activity=_make_ui(
                hidden=not mavis.user.is_internal_admin or not in_production or kind != "stream",
                widget="BooleanToggleWidget",
                help_text="SUPERADMIN ONLY",
            ),
            new_activities=_make_ui(
                hidden=not mavis.user.is_internal_admin or not in_production or kind != "stream",
                options=dict(allows_new_items=True),
                help_text="SUPERADMIN ONLY",
            ),
            show_default_columns=_make_ui(
                hidden=not mavis.user.is_internal_admin,
                widget="BooleanToggleWidget",
                help_text="SUPERADMIN ONLY",
            ),
            columns=dict(
                **_make_ui(
                    hidden=not mavis.user.is_internal_admin,
                    widget="MarkdownRenderWidget",
                    options=dict(**_space(80)),
                ),
            ),
            # advanced_configuration=_make_ui(widget="BooleanToggleWidget"),
            every_update=dict(
                **_make_ui(
                    options=_space(_choose_space(kind, update_type, "every_update")),
                    order=[
                        "has_source",
                        "is_aliasing",
                        "remove_customers",
                        "delete_recent_days",
                        "delete_window",
                        "allow_future_data",
                        "enable_anomaly_detection",
                        "notify_row_count_percent_change",
                        "do_not_update_on_percent_change",
                    ],
                ),
                has_source=_make_ui(
                    hidden=kind != "stream",
                    info_modal=get_doc(
                        mavis.company,
                        "transformations_v2/processing_configuration/requires_identity_resolution",
                        table=current_table,
                    ),
                ),
                is_aliasing=_make_ui(
                    hidden=kind != "stream",
                    info_modal=get_doc(
                        mavis.company,
                        "transformations_v2/processing_configuration/alias_activity",
                        table=current_table,
                    ),
                ),
                remove_customers=_make_ui(
                    hidden=kind != "stream",
                    info_modal=get_doc(
                        mavis.company,
                        "transformations_v2/processing_configuration/removelist_activity",
                        table=current_table,
                    ),
                ),
                delete_recent_days=_make_ui(
                    hidden=update_type == "materialized_view",
                    info_modal=get_doc(
                        mavis.company,
                        "transformations_v2/processing_configuration/delete_recent_days",
                        table=current_table,
                    ),
                ),
                delete_window=_make_ui(
                    hidden=update_type == "materialized_view",
                    help_text="Enter the days you want to delete",
                ),
                allow_future_data=_make_ui(
                    hidden=update_type == "materialized_view",
                    info_modal=get_doc(
                        mavis.company,
                        "transformations_v2/processing_configuration/allow_future_data",
                        table=current_table,
                    ),
                ),
                enable_anomaly_detection=_make_ui(
                    info_modal=get_doc(
                        mavis.company,
                        "transformations_v2/processing_configuration/enable_anomly_detection",
                        table=current_table,
                    )
                ),
                notify_row_count_percent_change=_make_ui(
                    widget="PercentWidget",
                    help_text="Email me if the avg of rows/time update in the last 10 rows has changed more than this percent",
                ),
                do_not_update_on_percent_change=_make_ui(
                    help_text="If the percent change above has been breached, then don't run the update/insert",
                ),
            ),
            dependency=dict(
                **_make_ui(
                    hidden=kind != "stream",
                    options=_space(30),
                    order=["depends_on", "run_after"],
                ),
                depends_on=_make_ui(
                    options=_space(90),
                    info_modal=get_doc(
                        mavis.company,
                        "transformations_v2/processing_configuration/depends_on",
                        table=current_table,
                    ),
                ),
                run_after=_make_ui(
                    options=_space(90),
                    info_modal=get_doc(
                        mavis.company,
                        "transformations_v2/processing_configuration/run_after",
                        table=current_table,
                    ),
                ),
            ),
            resync=dict(
                **_make_ui(
                    hidden=update_type == "materialized_view",
                    options=_space(30),
                    order=[
                        "do_not_delete_on_resync",
                        "resync_data_after",
                        "skip_count",
                        "max_days_to_insert",
                        "mutable_day_window",
                    ],
                ),
                resync_data_after=_make_ui(
                    info_modal=get_doc(
                        mavis.company,
                        "transformations_v2/processing_configuration/only_process_data_after",
                        table=current_table,
                    ),
                ),
                do_not_delete_on_resync=_make_ui(
                    hidden=kind not in ("stream", "enrichment"),
                    info_modal=get_doc(
                        mavis.company,
                        "transformations_v2/processing_configuration/do_not_delete_history",
                        table=current_table,
                    ),
                ),
                skip_count=_make_ui(
                    info_modal=get_doc(
                        mavis.company,
                        "transformations_v2/processing_configuration/max_days_to_insert",
                        table=current_table,
                    )
                ),
                mutable_day_window=_make_ui(
                    info_modal=get_doc(
                        mavis.company,
                        "transformations_v2/processing_configuration/mutable_window",
                        table=current_table,
                    )
                ),
            ),
            task_id=_make_ui(
                options=dict(
                    **_space(30),
                    allows_new_items=True,
                    help_text="Create a new processing schedule with this task.  Name it here and update the schedule from the processing page",
                ),
            ),
            save=_make_ui(
                widget="BooleanButtonWidget",
                options=dict(
                    process_data=True,
                    button_type="primary",
                    **_space(_choose_space(kind, update_type, "save"), align_right=True),
                ),
            ),
            scheduled_resync=_make_ui(hidden=True),
            cancel_next_resync=_make_ui(
                widget="BooleanButtonWidget",
                options=dict(process_data=True, danger=True, update_schema=True, **_space(50)),
            ),
            trigger_resync=_make_ui(
                widget="BooleanButtonWidget",
                options=dict(process_data=True, update_schema=True, **_space(50)),
            ),
            undeploy=_make_ui(
                widget="BooleanButtonWidget",
                hidden=not in_production,
                options=dict(
                    process_data=True,
                    danger=True,
                    popconfirm=True,
                    popconfirm_text="Are you sure you want to remove this script from production?  This will keep the script but remove all the activities associated with this script in the activity stream.",
                    loading_bar=[
                        dict(
                            percent=5,
                            text="Figuring out a plan",
                            duration=3,
                        ),
                        dict(
                            percent=20,
                            text="Deleting the data from the activity stream",
                            duration=10,
                        ),
                        dict(
                            percent=70,
                            text="Applying any special logic to UNDO the impact of this activity (Undoing Removelist or Identity Resolution).",
                            duration=46,
                        ),
                    ],
                    **_space(50, align_right=True),
                ),
                info_modal=get_doc(
                    mavis.company,
                    "transformations_v2/processing_configuration/remove_from_production",
                    table=current_table,
                ),
            ),
        ),
    )
    return schema, schema_ui


@tracer.start_as_current_span("get_internal_cache")
def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    internal["loaded_id"] = data["current_script"]["id"]

    # update the kind
    internal["kind"] = data["current_script"]["kind"]

    # update the kind
    internal["name"] = data["current_script"]["name"]
    internal["slug"] = data["current_script"]["slug"]
    internal["activity_slugs"] = data["process_configuration"]["activity_slugs"]
    internal["current_table"] = data["current_script"]["table_name"]
    internal["update_type"] = data["process_configuration"]["update_type"]
    internal["task_id"] = data["process_configuration"]["task_id"]

    # add the all transformations
    if not internal["all_transformations"]:
        internal["all_transformations"] = [
            t.dict() for t in graph_client.transformation_index(company_id=mavis.company.id).all_transformations
        ]

    # update the kind
    internal["in_production"] = data["in_production"]
    internal["production_query"] = data["validations"]["production_query"]

    if internal["loaded_id"] and internal["in_production"]:
        # making sure she has the right values
        internal["sql_fields"] = dict(production_query="(\n {} \n)".format(internal["production_query"]))

    return internal


def _remove_from_production(mavis, transformation_id):
    actions = delete_transformation_process(mavis, transformation_id)

    # delete the data from production queries
    graph_client.delete_all_queries(
        related_to="transformation",
        related_id=transformation_id,
        related_kind="production",
    )
    # get all the transformation maintenance
    graph_client.end_transformation_maintenance(transformation_id=transformation_id)

    actions.insert(0, "Transformation removed from production and all activities are deleted")
    notification = utils.Notification(
        message="Transformation Undeployed",
        duration=5,
        description=".  \n".join(actions),
        type=utils.NotificationTypeEnum.SUCCESS,
    )

    return actions, notification


def abort_all_tasks(data):
    """
    Cancel all the running tasks
    """
    current_script = data["current_script"]
    for task_id in current_script.get("running_tasks") or []:
        logger.debug("Aborting task", task_id=task_id)
        if task_id:
            abort(task_id)
    current_script["running_tasks"] = []


@tracer.start_as_current_span("process_data")
def process_data(mavis: Mavis, data: dict, updated_field_slug: str | None = None):
    set_current_span_attributes(updated_field_slug=updated_field_slug)

    trans_updator = TransformationManager(mavis=mavis)

    transformation_id = data["current_script"]["id"]
    tz = mavis.company.timezone
    logger.debug("Running processing", updated_field_slug=updated_field_slug)

    # current script tab
    if updated_field_slug == "root_current_script_id":
        # This loads the transformation into the form  (Graph to Form Object)
        data = __transformation_to_data(mavis, transformation_id)
        _update_all_updates(mavis, transformation_id, tz, data)
        data["current_script"]["not_dirty"] = True

    elif updated_field_slug == "root_current_script_copy_from":
        # This grabs the sql query from a different transformation and adds it to the current sql query form
        copy_from_tranform = graph_client.get_transformation_simple(
            id=data["current_script"]["copy_from"]
        ).transformation

        # save the query
        data["current_script"]["current_query_scratchpad"]["current_query"]["sql"] = (
            copy_from_tranform.current_query.sql
        )
        data["current_script"]["name"] = copy_from_tranform.name + " COPY"
        data["current_script"]["not_dirty"] = False

        track(
            mavis,
            "copied_query",
            transformation_id,
            from_transformation_id=copy_from_tranform.id,
        )

    elif updated_field_slug == "root_current_script_kind":
        all_defaults = [__load_default_query(mavis, k) for k in ["stream", "enrichment", "customer_attribute", "spend"]]

        cs = data["current_script"]
        # grab the current sql

        # recreate the values
        data["current_script"] = dict(
            kind=cs["kind"],
            name=cs["name"],
            table_name=_get_table_default(mavis, cs["kind"]),
            step_flow=cs["step_flow"],
        )

        # remove all the processing configuration
        del data["process_configuration"]

        cq = cs["current_query_scratchpad"]["current_query"]["sql"]
        # add the current scratch pad
        if cq not in all_defaults:
            data["current_script"]["current_query_scratchpad"] = cs["current_query_scratchpad"]
        else:
            data["current_script"]["current_query_scratchpad"] = dict(
                field_slug="query_with_scratchpad",
                current_query=dict(sql=__load_default_query(mavis, cs["kind"]), who_when=""),
                scratchpad=dict(id=None, notes=__load_default_scratchpad(cs["kind"])),
            )

    elif updated_field_slug in (
        None,
        "root_current_script_save",
        "root_current_script_save_header",
        "query_with_scratchpad",
    ):
        data["current_script"]["hide_query"] = False
        data["current_script"]["step_flow"]["current"] = 0
        # This takes the current form and saves or updates the data
        _save_query(trans_updator, data, transformation_id)
        transformation_id = data["current_script"]["id"]

        data["_notification"] = utils.Notification(message="Saved", type=utils.NotificationTypeEnum.SUCCESS)

        data["current_script"]["user_feedback"] = ""

    elif updated_field_slug == "validation_steps" and data["current_script"]["step_flow"]["current"] == 0:
        # on 3rd failure show failed validations
        if not data.get("has_shown_beacon") and data["current_script"]["failed_validations"]:
            data["_show_beacon_id"] = VALIDATION_FAILURE_BEACON_ID
            data["has_shown_beacon"] = True

        # move the step forward
        data["current_script"]["hide_query"] = False
        data["current_script"]["step_flow"] = create_steps_data(is_validated=False, failed_validation=False, step=0)

        abort_all_tasks(data)

    elif updated_field_slug == "validation_steps" and data["current_script"]["step_flow"]["current"] == 1:
        # validation does several things
        # 1. It checks for the word limit in your data
        # 2. It runs a couple of tests to make sure the query is good
        # 3. It update the process configuration with has_source, new_activities, ..
        # 4. It also creates the column renames

        data["current_script"]["hide_query"] = True
        data["current_script"]["activity_context"] = None

        # This takes the current form and saves or updates the data
        _save_query(trans_updator, data, transformation_id)
        transformation_id = data["current_script"]["id"]

        # refreah the page and then validate
        if not data["_redirect_url"]:
            data["current_script"]["validation_started_at"] = utils.utcnow()

            n_days = mavis.config.validation_days
            validate_data_from = utils.date_add(utils.utcnow(), "day", -n_days)[:10]

            # run the tests
            run_tests = [
                "check_missing_columns",
                "update_column_names",
                "check_limit",
                "check_null_columns",
                "check_id_duplication",
            ]

            # run the tests
            if data["current_script"]["kind"] == "stream":
                run_tests.extend(["check_activities", "check_sources"])

            data["current_script"]["user_feedback"] = (
                "## Validation Starting ... \n\n _If this doesn’t update in 30 seconds, please refresh the page and validate again_"
            )

            # move the step forward
            data["current_script"]["step_flow"] = create_steps_data(is_validated=False, failed_validation=False, step=1)

            # get the traansformton
            data["current_script"]["validation_test_ids"] = []
            data["current_script"]["running_tasks"] = []
            for t in run_tests:
                test, m_id = trans_updator.run_test(transformation_id, t, validate_data_from)
                data["current_script"]["validation_test_ids"].append(test.id)
                data["current_script"]["running_tasks"].append(m_id)

    elif updated_field_slug == "validation_steps" and data["current_script"]["step_flow"]["current"] == 2:
        data = _push_query_to_production(mavis, data, transformation_id)

        # reset the validation
        data["current_script"]["validation_test_ids"] = []
        data["_notification"] = utils.Notification(
            message="Pushed to Production", type=utils.NotificationTypeEnum.SUCCESS
        )

        data["current_script"]["step_flow"] = create_steps_data(is_validated=True, failed_validation=False, step=2)
        data["current_script"]["hide_query"] = True

        track(mavis, "pushed_transformation_to_production", transformation_id)

    elif updated_field_slug == "root":
        try:
            _update_tests(trans_updator, transformation_id, tz, data)
        except Exception as e:
            logger.error("Error updating tests", exc_info=e)

    # validations tabs
    elif updated_field_slug == "root_validations_save":
        # This saves validation queries by deleting all of them and reinserting all of them
        process_validation_queries(mavis, data["validations"], transformation_id)
        data["_notification"] = utils.Notification(
            message="Saved User Alerts",
            description="Manage alerts in processing",
            type=utils.NotificationTypeEnum.SUCCESS,
        )

    # updates tabs
    elif updated_field_slug and updated_field_slug.startswith("root_updates"):
        # This allows us to refretch the data from graph to get the most recent updates
        _update_all_updates(mavis, transformation_id, tz, data)
        data["_notification"] = utils.Notification(message="Updated Row Updates", type=utils.NotificationTypeEnum.INFO)

    # process_configuration tabs
    elif updated_field_slug == "root_process_configuration_update_type":
        data["_notification"] = utils.Notification(
            message="Changing the Update type has HUGE impact on the processing",
            description="Do not change this lightly.  Click the (i) for help and please confirm with Narrator team if this is the first time you are changing the type",
            type=utils.NotificationTypeEnum.WARNING,
            duration=7,
        )
    # process_configuration tabs
    elif updated_field_slug == "root_process_configuration_save":
        details = _save_proces_config(trans_updator, data, transformation_id)

        # add the notification
        data["_notification"] = utils.Notification(
            message="Saved Config",
            description=details,
            type=utils.NotificationTypeEnum.SUCCESS,
            duration=4,
        )
        track(mavis, "saved_process_config", transformation_id)

    elif updated_field_slug == "root_process_configuration_trigger_resync":
        # this allows us to save the process configurations
        graph_client.update_next_resync(transformation_id=transformation_id, next_resync_at=utils.utcnow())

        data["process_configuration"]["scheduled_resync"] = True
        data["_notification"] = utils.Notification(
            message="Trigger Resynced",
            duration=5,
            description="This will DELETE all the data in the stream from this transformation and reinsert it based on your Update Type!",
            type=utils.NotificationTypeEnum.SUCCESS,
        )
        track(mavis, "triggered_resync", transformation_id)

    elif updated_field_slug == "root_process_configuration_undeploy":
        _, data["_notification"] = _remove_from_production(mavis, transformation_id)

    elif updated_field_slug == "root_process_configuration_cancel_next_resync":
        # this allows us to save the process configurations
        graph_client.update_next_resync(transformation_id=transformation_id, next_resync_at=None)
        data["process_configuration"]["scheduled_resync"] = False

        data["_notification"] = utils.Notification(message="Resynced Cancelled")
        track(mavis, "cancelled_resync", transformation_id)

    # deal with hiding and showing the query
    data["current_script"]["hide_query"] = data["current_script"]["step_flow"]["current"] >= 1
    data["_dirty"] = not data["current_script"].get("not_dirty", True)

    # add the helper text
    helpers = __add_helper_text()
    data["validations"]["helper_feedback"] = helpers["validations"]
    return data


@tracer.start_as_current_span("run_data")
def run_data(mavis: Mavis, data: dict):
    return [dict(type="markdown", value=" This is just a fake button!!!!")]


def __add_helper_text():
    # global changes:
    helpers = dict()
    # add notes to the user to help them understand
    helpers["validations"] = "\n".join(
        [
            "## Custom Alerts",
            "Define custom SQL to check assumptions about the source data. (ex. Write a query to check that records are not dropped with an inner join.)",
            "Then set up an email alert if the assumption fails.",
        ]
    )
    return helpers


def _update_all_updates(mavis, transformation_id, tz, data):
    # set the start date if empty
    if not data["updates"]["start_date"]:
        data["updates"]["start_date"] = utils.date_add(utils.utcnow(), "day", -14)[:10]

    # This allows us to refretch the data from graph to get the most recent updates
    transform = graph_client.get_transformation_updates(
        id=transformation_id, started_at=data["updates"]["start_date"]
    ).transformation
    details = []
    # better situation details in updates
    if len(transform.transformation_maintenances) == 0:
        if transform.next_resync_at:
            details.append(
                "> This transformation is currently **waiting to be processed**. Data has NOT yet been inserted"
            )

    elif (
        is_resync(transform.transformation_maintenances[-1].kind)
        and transform.transformation_maintenances[-1].ended_at is None
    ):
        if (
            len(transform.query_updates)
            and transform.query_updates[-1].processed_at > transform.transformation_maintenances[-1].started_at
        ):
            details.append(
                "> This transformation has started updating the activity stream, but post-processing (identity resolution, etc) is not yet complete. Once that is complete, the data will be available in Narrator's dataset for use."
            )
        else:
            details.append(
                "> This transformation has **started** but still hasn't inserted any data.  Give it a couple of minutes and the data should be added."
            )

    plot_data = []
    for q in transform.query_updates:
        plot_data.append(
            dict(
                processed_at=q.processed_at,
                rows_inserted=q.rows_inserted,
                update_duration=q.update_duration,
                from_sync_time=q.from_sync_time[:19],
                to_sync_time=q.to_sync_time[:19],
                update_kind=q.update_kind.value,
                pretty_processed_at=utils.human_format(q.processed_at, "time", tz),
            )
        )

    max_val = utils.max_values([x["rows_inserted"] for x in plot_data]) or 0

    annotations = []
    kind_color_mapping = dict(cascade_resynced="#298dcc", query_failed="#f04e4f", resynced="#298dcc")
    for ma in transform.transformation_maintenances:
        started_at = ma.started_at
        ended_at = ma.ended_at or utils.utcnow()

        if max_val == 0:
            annotations.append(
                dict(
                    type="dataMarker",
                    position=[started_at, "max"],
                    point=dict(style=dict(opacity=0.8)),
                    text=dict(
                        content=utils.title(ma.kind.value),
                        maxLength=120,
                        autoEllipsis=True,
                        autoAdjust=True,
                        autoRotate=True,
                        background=dict(
                            style=dict(
                                fill="white",
                                fillOpacity=0.8,
                            )
                        ),
                    ),
                )
            )
        else:
            annotations.append(
                dict(
                    type="line",
                    start=[started_at, "min"],
                    end=[started_at, "max"],
                    style=dict(
                        stroke=kind_color_mapping.get(ma.kind.value) or "#808080",
                        lineDash=[4, 4],
                        lineWidth=2,
                    ),
                    top=True,
                    text=dict(
                        content=utils.title(ma.kind.value),
                        position="top",
                        offsetX=18,
                        offsetY=5,
                        style=dict(
                            textAlign="right",
                        ),
                        background=dict(
                            style=dict(
                                fill="white",
                            )
                        ),
                    ),
                )
            )

            annotations.append(
                dict(
                    type="region",
                    start=[started_at, "min"],
                    end=[ended_at, "max"],
                    style=dict(
                        fill=kind_color_mapping.get(ma.kind.value) or "#808080",
                    ),
                )
            )

    plot_config = AntVPlot(
        chart_type="scatter",
        config=dict(),  # For dataset
        plot_config=dict(
            data=plot_data,
            xField="processed_at",
            yField="rows_inserted",
            colorField="update_kind",
            meta=dict(
                processed_at=dict(alias="Updated At", narrator_format="time_local"),
                update_duration=dict(alias="Duration(s)", narrator_format="duration"),
                update_kind=dict(alias="Update Method"),
                rows_inserted=dict(alias="Rows Inserted", narrator_format="number"),
                from_sync_time=dict(alias="Data From (UTC)"),
                to_sync_time=dict(alias="Data To (UTC)"),
            ),
            shape="circle",
            title=dict(
                visible=True,
                text="Rows Inserted over Time",
            ),
            legend=dict(
                position="top",
            ),
            tooltip=dict(
                fields=[
                    "processed_at",
                    "update_kind",
                    "rows_inserted",
                    "update_kind",
                    "update_duration",
                    "from_sync_time",
                    "to_sync_time",
                ],
            ),
            colors=mavis.company.plot_colors,
            xAxis=dict(
                type="time",
                title=dict(text=f"Reporting Time({mavis.company.timezone})"),
            ),
            slider=dict(start=0, end=1),
            interactions=[
                dict(type="element-highlight-by-color"),
                dict(type="element-link"),
            ],
            annotations=annotations,
        ),
        height=400,
    ).dict()

    # Fix Enum
    plot_config["chart_type"] = plot_config["chart_type"].value

    # updates the data
    data["updates"] = dict(
        start_date=data["updates"]["start_date"],
        details="\n\n".join(details),
        update_plot=utils.compact_json_dumps(plot_config),
    )


def _update_tests(trans_updator: TransformationManager, transformation_id, tz, data):
    # update the results for validation
    if data["current_script"]["step_flow"]["current"] == 1:
        if not data["current_script"]["validation_test_ids"]:
            logger.info("Could not find validation tests")
            # get allthe recent validation ids
            simple_transfrom = graph_client.get_transformation_simple(id=transformation_id).transformation

            recent_tests = graph_client.get_recent_transformation_tests(
                transformation_id=transformation_id,
                start_at=simple_transfrom.current_query.updated_at,
            ).tests
            # handle the slug mapping
            slug_mapping = {}
            for t in recent_tests:
                slug_mapping[t.name] = t.id
            data["current_script"]["validation_test_ids"] = list(slug_mapping.values())

        # handle validation processing
        if data["current_script"]["validation_test_ids"]:
            # only get the tests that are needed
            tests = graph_client.get_transformation_tests(
                transformation_id=transformation_id,
                ids=data["current_script"]["validation_test_ids"],
            ).tests
            __make_validation_results(trans_updator, data, tests)
        else:
            raise SilenceError(
                "No tests were running, pleare refresh.  If this happens more than once, please notify support"
            )


@tracer.start_as_current_span("__transformation_to_data")
def __transformation_to_data(mavis, transformation_id):
    transform = graph_client.get_transformation_context(id=transformation_id).transformation
    tz = mavis.company.timezone

    if not transform:
        raise (
            SilenceError("Could not find the transformation!  Please contact support if this is not supposed to happen")
        )

    # create the data object
    data = dict(
        current_script=dict(
            banner=_make_banner(mavis, transform),
            id=transform.id,
            kind=transform.kind.value,
            name=transform.name,
            slug=transform.slug,
            table_name=transform.table,
            validation_test_ids=[],
            failed_validations=0,
            current_query_scratchpad=dict(
                field_slug="query_with_scratchpad",
                current_query=dict(
                    id=transform.current_query.id,
                    sql=transform.current_query.sql,
                    who_when=_who_when(
                        transform.current_query.updated_by,
                        transform.current_query.updated_at,
                        "updated",
                        tz=tz,
                    ),
                ),
                scratchpad=dict(
                    id=transform.current_query.id,
                    notes=transform.current_query.notes,
                ),
            ),
            step_flow=create_steps_data(is_validated=False, step=0),
        ),
        validations=dict(
            production_query=(transform.production_queries[0].sql if len(transform.production_queries) > 0 else None),
            validations=[
                dict(
                    id=v.id,
                    sql=v.sql,
                    notes=v.notes,
                    who_when=_who_when(v.updated_by, v.updated_at, "defined", tz=tz),
                    name=(utils.title(v.alert.company_task.task_slug) if v.alert else None),
                    cron=v.alert.company_task.schedule if v.alert else None,
                    email=v.alert.email or "" if v.alert else None,
                    kind=v.alert.alert_kind.value if v.alert else None,
                )
                for v in transform.validation_queries
            ],
        ),
        production_versions=dict(production_query=_create_production_query(transform)),
        prod_count=len(transform.production_queries),
        in_production=len(transform.production_queries) > 0,
        updates=dict(start_date=utils.date_add(utils.utcnow(), "day", -14)[:10]),
        process_configuration=dict(
            update_type=transform.update_type.value,
            activities=[a.activity.id for a in transform.activities],
            activity_slugs=[a.activity.slug for a in transform.activities],
            all_columns=[c.name for c in transform.column_renames],
            columns=utils.human_format(
                dict(
                    columns=[
                        dict(name="name", format="id"),
                        dict(name="type"),
                        dict(name="casting"),
                        dict(name="has_data"),
                    ],
                    rows=utils.sort_stream_columns(
                        [
                            dict(
                                name=c.name,
                                type=c.type,
                                casting=c.casting,
                                has_data=c.has_data,
                            )
                            for c in transform.column_renames
                        ]
                    ),
                ),
                "table",
            ),
            every_update=dict(
                old_has_source=transform.has_source,
                has_source=transform.has_source,
                is_aliasing=transform.is_aliasing,
                remove_customers=transform.remove_customers,
                delete_recent_days=transform.delete_window is not None,
                delete_window=transform.delete_window,
                allow_future_data=transform.allow_future_data,
                enable_anomaly_detection=transform.notify_row_count_percent_change is not None,
                notify_row_count_percent_change=transform.notify_row_count_percent_change or 0.2,
                do_not_update_on_percent_change=transform.do_not_update_on_percent_change,
            ),
            dependency=dict(
                depends_on=[t.depends_on_transformation_id for t in transform.depends_on_transformations],
                run_after=[t.run_after_transformation_id for t in transform.run_after_transformations],
                original_depends_on="".join(
                    [t.depends_on_transformation_id for t in transform.depends_on_transformations]
                ),
                original_run_after="".join(
                    [t.run_after_transformation_id for t in transform.run_after_transformations]
                ),
            ),
            resync=dict(
                do_not_delete_on_resync=transform.do_not_delete_on_resync,
                resync_data_after=transform.start_data_after,
                skip_count=transform.max_days_to_insert is not None,
                max_days_to_insert=transform.max_days_to_insert,
                mutable_day_window=transform.mutable_day_window,
            ),
            scheduled_resync=transform.next_resync_at is not None,
            task_id=transform.task_id
            if transform.task_id is not None
            else mavis.company.get_task_id(
                MV_TRANSFORMATION_PROCESS if transform.update_type in ASYNC_TYPES else NORMAL_TRANSFORMATION_PROCESS
            ),
        ),
    )

    return data


@tracer.start_as_current_span("__update_process_config")
def __update_process_config(trans_updator: TransformationManager, transformation_id, config):
    details = []
    trans_updator.update_config(
        transformation_id,
        ProcessingConfiguration(
            update_type=config["update_type"],
            uses_identity_resolution=config["every_update"]["has_source"] or False,
            aliasing_customer=config["every_update"]["is_aliasing"] or False,
            delete_customers=config["every_update"]["remove_customers"] or False,
            notify_row_count_percent_change=(
                (config["every_update"]["notify_row_count_percent_change"] or None)
                if config["every_update"]["enable_anomaly_detection"]
                else None
            ),
            do_not_update_on_percent_change=config["every_update"]["do_not_update_on_percent_change"] or False,
            delete_window=(
                config["every_update"]["delete_window"] or None
                if config["every_update"]["delete_recent_days"]
                else None
            ),
            mutable_day_window=config["resync"]["mutable_day_window"] or None,
            never_deletes_rows=config["resync"]["do_not_delete_on_resync"] or False,
            start_data_after=config["resync"]["resync_data_after"] or None,
            max_days_to_insert=config["resync"]["max_days_to_insert"] or None,
            run_after_transformations=(config["dependency"]["run_after"] or []),
            depends_on_transformations=(config["dependency"]["depends_on"] or []),
            task=config["task_id"]
            if is_valid_uuid(config["task_id"])
            else NewTask(
                label=config["task_id"],
                schedule="0 0 * * *",
            ),
        ),
    )
    details.append("Updated all the config")

    return ", ".join([d for d in details if d])


@tracer.start_as_current_span("__update_queries")
def __update_queries(kind, queries, transformation_id, user_email, prefix, tz):
    logger.debug("Updating the query")
    for q in queries:
        if q.get("id"):
            # update
            return_q = graph_client.update_sql_query(
                id=q["id"],
                sql=q["sql"],
                notes=q.get("notes") or "",
                updated_by=user_email,
            ).updated_query
        else:
            return_q = graph_client.insert_sql_query(
                related_to="transformation",
                related_id=transformation_id,
                related_kind=kind,
                sql=q["sql"],
                notes=q.get("notes") or "",
                updated_by=user_email,
            ).inserted_query
            q["id"] = return_q.id

        q["who_when"] = (_who_when(return_q.updated_by, return_q.updated_at, prefix, tz=tz),)


def _make_banner(mavis, transform):
    if len(transform.production_queries) == 0:
        return "> **PENDING** The transformation has yet to be deployed to production"

    elif transform.production_queries[0].sql != transform.current_query.sql:
        return "> **SQL EDITED** The transformation is in production but the current SQL has edits that are not in production."

    else:
        last_change = graph_client.get_active_transformation_maintenance(
            id=transform.id,
            last_updated_at=utils.date_add(utils.utcnow(), "hour", -1),
        ).transformation_maintenance

        # look for the recent maintenance
        if len(last_change) == 0:
            return ""

        # grab the object
        last_change = last_change[0]

        if last_change.ended_at is None:
            if is_resync(last_change.kind):
                return "> 🔃 Transformation is currently resyncing the data (started {diff_time}) \n>\n>{notes}".format(
                    diff_time=utils.pretty_diff(last_change.started_at, utils.utcnow(), kind="past"),
                    notes=last_change.notes.replace("\n", "\n>\n> "),
                )

            else:
                return "> ⚠️ Error found in transformation which started {diff_time} \n>\n>{notes}".format(
                    diff_time=utils.pretty_diff(last_change.started_at, utils.utcnow(), kind="past"),
                    notes=last_change.notes.replace("\n", "\n>\n> "),
                )
        else:
            return "> ✅ Transformation is up to date (As of {diff_time})".format(
                diff_time=utils.pretty_diff(last_change.started_at, utils.utcnow(), kind="past"),
            )


def __process_source_test(trans_updator: TransformationManager, test, transformation_results, data):
    source_data = TableData(**json.loads(test.data))
    total_source_rows = source_data.rows[0]["total_rows"]

    is_running = False

    if total_source_rows == 0:
        transformation_results.append("No Identity Resolution Required")
    elif not data["current_script"]["ran_identitiy_check"]:
        transformation_results.append(
            f"Found Anonymous_customer_id for {trans_updator.mavis.human_format(total_source_rows, 'number')} Rows"
        )
        transformation_results.append("... Rerunning some sanity tests on the query to avoid common mistakes")

        # use the validation months that has been configured
        day_diff = -1 * (trans_updator.mavis.config.validation_days or DEFAULT_DAYS)

        # add the test for the updating column names
        validate_data_from = utils.date_add(utils.utcnow(), "days", day_diff)[:10]

        # do a bunch of sanity checks on it
        for extra_test in (test_enum.check_identity_resolution, test_enum.check_unnecessary_mapping):
            test, message_id = trans_updator.run_test(data["current_script"]["id"], extra_test, validate_data_from)
            data["current_script"]["validation_test_ids"].append(test.id)
            data["current_script"]["running_tasks"].append(message_id)

        data["current_script"]["ran_identitiy_check"] = True
        is_running = True

    data["process_configuration"]["every_update"]["has_source"] = total_source_rows > 0

    return is_running


def __process_activity_test(
    trans_updator: TransformationManager,
    test: GetTransformationTestsTests,
    transformation_results,
    data,
    valid_tests,
    is_running,
    failed_test,
):
    activity_data = TableData(**json.loads(test.data))
    generated_count = activity_data.total_rows
    is_full_run = str(test.ran_data_from).startswith("1900-01-01")

    # added a check to rerun the data if it is not a full run and has multiple activities
    if generated_count == 1 or (is_full_run and generated_count > 0):
        formatted_table = activity_data.pretty()
        activity_res = [
            f"Activities Generated ({generated_count})",
            f"\n{formatted_table}\n",
            "<br>",
        ]

        if test.content:
            activity_res.extend(["\n⚠️ Found some non-blocking issues ⚠️ \n", test.content])

        # insert the data in the front
        transformation_results[0:0] = activity_res

        # add the activities
        data["process_configuration"]["new_activities"] = [row["activity"] for row in activity_data.rows]
    elif is_full_run:
        transformation_results.extend(
            [
                "# ⚠️ Could not find any activities!",
                "You can still push this transformation to production but you need to be very careful since we cannot run any of the tests on it to ensure that there is no duplication or it is valid.",
            ]
        )
        failed_test = False
    else:
        if generated_count == 0:
            ran_data_from = trans_updator.mavis.human_format(test.ran_data_from, "date")
            transformation_results.append(
                f"⚠️ Could not find any activities since {ran_data_from}, we will rerun the test with all your data"
            )

            # Rerun for all of time cause no activities were founds
            rerun_test = [test_enum.check_id_duplication, test_enum.check_activities]
        else:
            transformation_results.append(
                "⚠️ Found multiple activities so will rerun with all the data to make sure we don't miss anything"
            )

            # Do not rerun for all of data
            rerun_test = [test_enum.check_activities]

        # find the tests that we will rerun
        remove_tests = [test.id for test in valid_tests if test.name in rerun_test]
        # remove the tests that are not in the data
        data["current_script"]["validation_test_ids"] = [
            test_id for test_id in data["current_script"]["validation_test_ids"] if test_id not in remove_tests
        ]

        for temp_t in rerun_test:
            test, message_id = trans_updator.run_test(data["current_script"]["id"], temp_t, "1900-01-01")

            data["current_script"]["validation_test_ids"].append(test.id)
            data["current_script"]["running_tasks"].append(message_id)

        # failed a tests
        is_running = True

    return is_running, failed_test


def __make_test_results(tr: GetTransformationTestsTests):
    test_details = next((t for t in ALL_TESTS if t["slug"] == tr.name), utils.title(tr.name))

    # stave the status
    status = tr.status.value.lower()

    # get the name based on the results
    if isinstance(test_details, str):
        name = test_details
    elif (tr.content or "").startswith("Error"):
        name = "Could not run " + test_details["title"]
    elif ALL_TEST_STATUS.get(status):
        name = test_details[ALL_TEST_STATUS[status]["detail_key"]]
    else:
        name = test_details["title"]

    # create the header
    s = [f" {ALL_TEST_STATUS[status]['icon']} {name}"]

    # When the content says BUT then we know that its something for us to know about
    if tr.content and tr.content.startswith(DISPLAY_CONTENT_STARTSWITH_KEY):
        s.append(f"\n ⚠️ Found some non-blocking issues⚠️ \n\n{tr.content[len(DISPLAY_CONTENT_STARTSWITH_KEY) :]}")

    # IF the test fails then add the details on the test
    if tr.status.value == "Failed":
        s.extend(
            [
                tr.content or "",
                "<br>",
                "<details><summary>SQL Query Ran</summary>",
                f"```sql\n\n{tr.query}\n\n```",
                "</details>",
                "<br>",
            ]
        )

    return s


def __add_duplicates_to_scratchpad(mavis, data, tr):
    dup_data = json.loads(tr.data)

    trans = graph_client.get_transformation_simple(id=data["current_script"]["id"]).transformation

    col_key = _get_transformation_join_key(trans.column_renames)
    ts_key = _get_ts_column(trans.kind, trans.column_renames)

    # add a condition
    cond = mavis.qm.Condition(
        operator="is_in",
        left=mavis.qm.Column(table_column=col_key, table_alias="s", casting="string"),
        right=[mavis.qm.Column(value=r.get(col_key), casting="string") for r in dup_data["rows"][:10]],
    )

    # create the content
    query_scratchpad = data["current_script"]["current_query_scratchpad"]
    header = "## Debugging duplicate id"

    # Updating the scratch pad with duplicate id check
    query_scratchpad["scratchpad"]["notes"] = "\n".join(
        [
            query_scratchpad["scratchpad"].get("notes", "").split(header)[0],
            header,
            "\nlet's look at a couple of examples",
            "\n",
            "```sql",
            "SELECT",
            "   *",
            "FROM {current_script} as s",
            f"where {cond.to_query()}",
            "order by",
            f"   s.{col_key}",
            f"  , s.{ts_key}" if ts_key else "",
            "```",
        ]
    )


@tracer.start_as_current_span("make_validation_results")
def __make_validation_results(
    trans_updator: TransformationManager, data: dict, tests: list[GetTransformationTestsTests]
):
    current_script = data["current_script"]
    validation_test_ids = current_script["validation_test_ids"]

    set_current_span_attributes(validation_tests=",".join(validation_test_ids))

    # limit to only the valid tests
    valid_tests = [test for test in tests if test.id in validation_test_ids or []]

    if not valid_tests:
        return None

    is_running = any(t.status == transformation_test_status_enum.Running for t in valid_tests)
    passed = False
    failed_test = len(
        [
            t
            for t in valid_tests
            if t.name not in AUTO_FAIL_TEST_IGNORE_LIST and t.status == transformation_test_status_enum.Failed
        ]
    )

    # force the update type
    process_configuration = data["process_configuration"]
    process_configuration["update_type"] = (
        process_configuration["update_type"] or UPDATE_TYPES[current_script["kind"]][0]
    )

    if not isinstance(data["current_script"]["running_tasks"], list):
        data["current_script"]["running_tasks"] = []

    transformation_results = []
    for test in valid_tests:
        if test.name == test_enum.check_activities:
            if test.status != transformation_test_status_enum.Running and test.data:
                is_running, failed_test = __process_activity_test(
                    trans_updator,
                    test,
                    transformation_results,
                    data,
                    valid_tests,
                    is_running,
                    failed_test,
                )
            else:
                transformation_results.append("⏳ Getting Activities ...")

        elif test.name == test_enum.check_sources:
            if test.status != transformation_test_status_enum.Running and test.data:
                is_running = is_running or __process_source_test(trans_updator, test, transformation_results, data)
            else:
                transformation_results.append("⏳ Checking for Identity Resolution ...")

    # get the results of the run
    if is_running:
        status = RUNNING_STATUS
    elif failed_test:
        status = FAILED_STATUS
        current_script["step_flow"] = create_steps_data(is_validated=True, failed_validation=True, step=1)
        track(trans_updator.mavis, "failed_validation", current_script["id"], failed_test=failed_test)

        # update the validation count
        current_script["failed_validations"] = (current_script["failed_validations"] or 0) + 1

        abort_all_tasks(data)
    else:
        current_script["failed_validations"] = 0
        current_script["step_flow"] = create_steps_data(is_validated=True, failed_validation=False, step=1)
        status = PASSED_STATUS
        passed = True

    # add the transformation details
    if transformation_results:
        transformation_results.insert(0, "## Transformation Details")

    validation_days = trans_updator.mavis.config.validation_days or DEFAULT_DAYS
    val_content = [
        "# Validation Status: {}{}".format(
            status,
            (
                "\n\n[Troubleshooting Tips for Validation](https://docs.narrator.ai/page/validation-failed-now-what)"
                if status == FAILED_STATUS
                else ""
            ),
        ),
        f"_based on last {validation_days} days of data_\n\n<br>\n",
    ]
    for tr in valid_tests:
        if tr.name not in ("check_activities", "check_sources"):
            last_ii = len(val_content)
            val_content.extend(__make_test_results(tr))

            # auto retry SIGALARM tasks
            if "SIGALRM" in "".join(val_content[last_ii:]):
                if tr.id in current_script["validation_test_ids"]:
                    current_script["validation_test_ids"].remove(tr.id)
                test, message_id = trans_updator.run_test(data["current_script"]["id"], tr.name, tr.ran_data_from)
                current_script["validation_test_ids"].append(test.id)
                current_script["running_tasks"].append(message_id)

                # Let the user know
                val_content = val_content[:last_ii]
                val_content.append(f"{ALL_TEST_STATUS['running']['icon']} **re-running** {tr.name}")

            # Update scratch pad to help with debugging
            if tr.name == "check_id_duplication" and tr.status.value.lower() == "failed" and tr.data:
                __add_duplicates_to_scratchpad(trans_updator.mavis, data, tr)
                val_content.insert(
                    last_ii + 1,
                    "**💡 We added a query to the scratchpad to debug these dups**",
                )

    # create some space
    val_content.append("<br>")

    validation_results = "\n\n".join(val_content + transformation_results)

    # create a clean output
    if data["current_script"]["kind"] == "stream":
        if not data["current_script"]["activity_context"]:
            activity_context = __get_dependency_context(
                trans_updator.mavis,
                data["current_script"]["table_name"],
                data["process_configuration"]["activities"],
                data["current_script"]["id"],
            )
            data["current_script"]["activity_context"] = activity_context

        data["current_script"]["user_feedback"] = utils.markdown_columns(
            validation_results + "\n" + "." * 115,
            data["current_script"]["activity_context"] or "",
        )

    else:
        data["current_script"]["user_feedback"] = validation_results

    data["current_script"]["is_validated"] = passed

    return validation_results, passed


def __get_dependency_context(mavis: Mavis, table, activity_ids, tranformation_id):
    if not activity_ids:
        return None
    internal_link = InternalLink(mavis.company.slug)
    days_ago = 30
    recent_tag_ids = [t.id for t in graph_client.get_view_tag(company_id=mavis.company.id).company_tags]

    # get all the activities
    all_activities = graph_client.get_activity_dependency(
        company_id=mavis.company.id,
        recent_tag_ids=recent_tag_ids,
        activity_ids=activity_ids,
        from_time=utils.date_add(utils.utcnow(), "day", -1 * days_ago),
    ).all_activities

    Integrations = []
    datasets = []
    narratives = []
    transforms = []

    # Activities
    for a in all_activities:
        transforms.extend(
            f"[{t.transformation.name}]({internal_link.transformation(t.transformation.id)})"
            for t in a.transformations
            if len(t.transformation.production_queries) > 0 and t.transformation.id != tranformation_id
        )

        # get all the datasets
        for d in a.datasets:
            da = d.dataset
            Integrations.extend(
                f"{n.label}({n.type.value}) using [{da.name}]({internal_link.dataset(da.slug)})"
                for n in da.materializations
            )

            narratives.extend(
                f"[{n.narrative.name}]({internal_link.narrative(n.narrative.slug)}) powered by [{da.name}]({internal_link.dataset(da.slug)})"
                for n in da.dependent_narratives
            )

            if da.tags_aggregate.aggregate.count > 0:
                datasets.append(f"[{da.name}]({internal_link.dataset(da.slug)})")

    ac_context = [
        "# Understanding Dependency",
        f"Stream: `{table}`",
        f"Transformations Shared: {', '.join(transforms)}",
        "<br>",
        f"### Integrations ({mavis.human_format(len(Integrations))})",
        "*These will all be rerun once pushed to production*",
        (" - " + "\n - ".join(set(Integrations))) if len(Integrations) > 0 else "",
        "<br>",
        f"### Narratives ({mavis.human_format(len(narratives))})",
        "*These will all be rerun once pushed to production*",
        (" - " + "\n - ".join(set(narratives))) if len(narratives) > 0 else "",
        "<br>",
        f"### Active Datasets ({mavis.human_format(len(Integrations))})",
        "*Active is defined as a dataset that has been viewed in the last 30 days*",
        (" - " + "\n - ".join(set(datasets))) if len(datasets) > 0 else "",
    ]
    return "\n\n".join(ac_context)


@tracer.start_as_current_span("process_validation_queries")
def process_validation_queries(mavis: Mavis, validations, transformation_id):
    # TODO: Deprecate in favor for alerts in Dataset
    has_production_query = any("production_query" in mavis.qm.clean_query(v["sql"]) for v in validations["validations"])

    has_sync = any(
        k in (validations.get("production_query") or "") for k in ("from_sync_time", "to_sync_time", "count_comment")
    )

    # warn th user about variables in their query
    if has_production_query and has_sync:
        raise SilenceError(
            "You are using a variable inside your production query that is being referenced in the alert.  This is not supported. Click the (i) in the tab to learn more"
        )

    # reset all the queries
    graph_client.delete_all_alerts_with_tasks(
        related_to="transformation",
        related_id=transformation_id,
        related_kind="validation",
    )

    for v in validations["validations"]:
        return_q = graph_client.insert_sql_query(
            related_to="transformation",
            related_id=transformation_id,
            related_kind="validation",
            sql=v["sql"],
            notes=v.get("notes") or "",
            updated_by=mavis.user.email,
        ).inserted_query
        v["id"] = return_q.id

        v["who_when"] = (
            _who_when(
                return_q.updated_by,
                return_q.updated_at,
                "defined",
                tz=mavis.company.timezone,
            ),
        )

        # create the alert
        alert_id = graph_client.insert_query_alert(
            email=v["email"] if "@" in v["email"] else mavis.user.email,
            updated_by=mavis.user.id,
            query_id=v["id"],
            alert_kind=v["kind"],
        ).insert_company_query_alert_one.id

        from batch_jobs.data_management.run_sql_query_alert import run_sql_query_alert

        TaskManager(mavis=mavis).create(
            run_sql_query_alert,
            v["cron"] if utils.croniter.is_valid(v["cron"]) else "0 0 * * *",
            utils.slugify(v["name"]),
            category=company_task_category_enum.alerts.value,
            update_db_table="company_query_alert",
            update_db_id=alert_id,
            task_fields=dict(
                alert_id=alert_id,
            ),
        )


@tracer.start_as_current_span("_save_query")
def _save_query(trans_updator: TransformationManager, data, transformation_id):
    data["_redirect_url"] = None

    if not transformation_id:
        # handle empty names
        if not data["current_script"]["name"]:
            raise (SilenceError("Please enter a Transformation Name!"))

        # create a better auto-generated name for enrichment
        if data["current_script"]["table_name"] == AUTO_GENERATE_STRING:
            data["current_script"]["table_name"] = data["current_script"]["name"]

        # don't let the activity be used
        if data["current_script"]["kind"] != "stream" and utils.slugify(data["current_script"]["table_name"]) in (
            [t.activity_stream for t in trans_updator.mavis.company.tables]
        ):
            raise SilenceError(
                f'The table name {data["current_script"]["table_name"]} is already used as an Activity Stream'
            )

        # try and insert the data
        transform_create = trans_updator.create(
            name=data["current_script"]["name"],
            table_name=data["current_script"]["table_name"],
            kind=data["current_script"]["kind"],
            sql=data["current_script"]["current_query_scratchpad"]["current_query"]["sql"],
            notes=data["current_script"]["current_query_scratchpad"]["scratchpad"]["notes"],
        )
        # reset the type
        transformation_id = str(transform_create.id)
        data["process_configuration"]["update_type"] = transform_create.update_type
        data["_redirect_url"] = f"/transformations/edit/{transformation_id}"

    else:
        trans_updator.update(
            transformation_id,
            name=data["current_script"]["name"],
            table_name=data["current_script"]["table_name"],
            sql=data["current_script"]["current_query_scratchpad"]["current_query"]["sql"],
            notes=data["current_script"]["current_query_scratchpad"]["scratchpad"]["notes"],
            query_id=data["current_script"]["current_query_scratchpad"]["current_query"]["id"],
        )

    # update the transformation
    data["current_script"]["id"] = transformation_id

    data["current_script"]["not_dirty"] = True
    data["current_script"]["is_validated"] = False


@tracer.start_as_current_span("_push_query_to_production")
def _push_query_to_production(mavis: Mavis, data, transformation_id):
    # update the configuration
    notification = None
    trans_updator = TransformationManager(mavis=mavis)
    # update the transformation
    __update_process_config(trans_updator, transformation_id, data["process_configuration"])

    # load the query
    query_scratchpad = data["current_script"]["current_query_scratchpad"]

    # update the sql and push it to production
    new_q = query_scratchpad["current_query"]
    trans_updator.push_to_production(transformation_id, new_q["sql"])

    details = []
    # only create activities if it is a stream update
    if data["current_script"]["kind"] == "stream":
        transform = graph_client.get_transformation_context(id=transformation_id).transformation

        if data["process_configuration"]["new_activities"]:
            # Create the activities
            (activity_objs, details) = _create_activities(
                mavis, transform, data["process_configuration"]["new_activities"]
            )
            data["process_configuration"]["activities"].extend([a.id for a in activity_objs])
            data["process_configuration"]["new_activities"] = []

    else:
        # use the validation months that has been configured
        day_diff = -1 * (mavis.config.validation_days or DEFAULT_DAYS)

        # add the test for the updating column names
        validate_data_from = utils.date_add(utils.utcnow(), "days", day_diff)[:10]
        trans_updator.run_test(transformation_id, test_enum.update_column_names, validate_data_from)

    skip_resync_data = data["current_script"].get("resync_data")

    # resync the transformation
    if not skip_resync_data:
        trans_updator.trigger_resync(transformation_id, data["process_configuration"]["task_id"])

    # reset the data
    data = __transformation_to_data(mavis, data["current_script"]["id"])

    data["_confetti"] = True

    if data["current_script"]["kind"] == "stream":
        results = [
            "# 🎉 Congrats on your deployment 🎉",
            "\n<br>\n",
            " ### Actions taken",
            "\n".join(details),
            f" - Triggering the data to be processed [Run Transformations]({PORTAL_URL}/{mavis.company.slug}/manage/tasks)",
            "\n<br>\n",
            "> Activities are the building blocks for your business, this one activity can be used to:",
            "> - Answer many questions",
            "> - Instantly generate Narratives",
            "> - create any table to power your BI",
            "\n<br>\n",
            "## Try and answer some simple questions",
            " - How many times did customers do this activity?",
            " - How many first/repeat customers have done this activity?",
            " - Does doing this activity more times make you more likely to do it again?",
            " - How has the repeat rate changed over time?",
            " - Combine this with other activities to build funnels, segmentations and way more",
            "\n<br>\n",
            "**Don't want to answer them yourself, reach out to our support team to get access to Narrtive templates all these can be *Auto-Generated* for you.**",
        ]

    elif data["current_script"]["kind"] == "customer_attribute":
        results = [
            "# 🎉 Congrats on your Customer Dimension",
            "\n<br>\n",
            " ### Actions taken",
            f" - Triggering the data to be processed [Run Transformations]({PORTAL_URL}/{mavis.company.slug}/manage/tasks)",
            " - Once created, we will tie this Dim Table to your Activity Stream",
            "\n<br>\n",
            "You will be able to see these attributes in *Customer Journey* and as *Columns in Dataset*.",
            "\n<br>\n",
            "\n<br>\n",
            f"By default we name the customer `customer` but this can be changed in the [company settings]({PORTAL_URL}/{mavis.company.slug}/manage/company) to make this easier for others to read",
        ]

    elif data["current_script"]["kind"] == "enrichment":
        results = [
            "# 🎉 Congrats on your Dimension Table",
            "<br>",
            "\n<br>\n",
            " ### Actions taken",
            f" - Triggering the data to be processed [Run Transformations]({PORTAL_URL}/{mavis.company.slug}/manage/tasks)",
            "\n<br>\n",
            "All of these Dimensions can be joined into any Activity. You can set that in the Activiy UI as soon as the table is created.",
        ]

    elif data["current_script"]["kind"] == "spend":
        results = [
            "# 🎉 Congrats on your Spend table",
            "\n<br>\n",
            " ### Actions taken",
            f" - Triggering the data to be processed [Run Transformations]({PORTAL_URL}/{mavis.company.slug}/manage/tasks)",
            " - Once created, we will add this ad an Aggregate table to your Activity Stream",
            "\n<br>\n",
            "Now, once you open dataset you will see a Aggregate Join button in the group UI that will enable you to join on this data.",
            "## What happens when you add the columns",
            " - If the group is time based, we will aggregate the data based on the same resolution then add the columns",
            " - If the group is using a column that is also in the spend table, it will be able to join using that column",
            " - If the group has a column that is not in spend, the spend data will be distributed using the count of the records in the group tab",
        ]

    data["current_script"]["user_feedback"] = "\n".join(results)
    data["_notification"] = notification

    return data


@tracer.start_as_current_span("_save_proces_config")
def _save_proces_config(trans_updator: TransformationManager, data, transformation_id):
    details = __update_process_config(trans_updator, transformation_id, data["process_configuration"])

    # deal with new activities
    if data["process_configuration"]["new_activities"] and trans_updator.mavis.user.is_internal_admin:
        activity_slugs = data["process_configuration"]["new_activities"]

        if len(activity_slugs) > 0:
            transform = graph_client.get_transformation_context(id=transformation_id).transformation

            # create the activities
            (activity_objs, _) = _create_activities(trans_updator.mavis, transform, activity_slugs, do_not_remove=True)
        else:
            activity_objs = []

        details = (
            details + ("and created " + ", ".join(a.name for a in activity_objs)) if len(activity_objs) > 0 else ""
        )

    # if it is resyning and we change the process then trigger a run
    if data["process_configuration"]["scheduled_resync"]:
        run_transformations.send(
            company_slug=trans_updator.mavis.company.slug,
            task_id=data["process_configuration"]["task_id"],
        )

    return details


@task()
def async_push_to_production(company_slug, transformation_id, user_id):
    mavis = initialize_mavis(company_slug, user_id)
    data = __transformation_to_data(mavis, transformation_id)
    data["current_script"]["step_flow"]["current"] = 1
    data = process_data(mavis, data, updated_field_slug="validation_steps")
    trans_updator = TransformationManager(mavis, transformation_id)

    while data["current_script"]["step_flow"]["current"] == 1:
        sleep(2)
        _update_tests(trans_updator, transformation_id, mavis.company.timezone, data)

        if data["current_script"]["is_validated"]:
            break

    # push to production if all the validation completed
    if data["current_script"]["is_validated"]:
        data["current_script"]["step_flow"]["current"] = 2
        data = process_data(mavis, data, updated_field_slug="validation_steps")


def __load_default_query(mavis, kind):
    query_template = ["SELECT"]

    # load the template
    if kind == "stream":
        query_template.extend(
            [
                "    NULL AS activity_id,",
                "    NULL AS ts,",
                "\n",
                "    NULL AS anonymous_customer_id, -- used in identity resolution",
                "    NULL AS customer,",
                "\n",
                "   'activity_name' AS activity, -- ex. 'viewed_page'",
                "\n",
                "    -- Add as many feature columns by naming it `feature_COLUMN_NAME`",
                "    -- ex. p.id as feature_product_id",
                "\n",
                "    NULL AS revenue_impact,",
                "    NULL AS link ",
            ]
        )
    elif kind == "enrichment":
        query_template.extend(
            [
                "    NULL AS id,",
                "    NULL AS ts -- remove if processing is not Incremental",
            ]
        )

    elif kind == "spend":
        query_template.extend(
            [
                "    NULL AS id,",
                "    NULL AS ts -- remove if processing is not Incremental",
            ]
        )
    elif kind == "customer_attribute":
        query_template.extend(
            [
                "    NULL AS customer,",
                "    NULL AS customer_display_name, -- OPTIONAL: can be used for customer journey search",
            ]
        )

    query_template[-1] = query_template[-1][:-1]
    query_template.append("FROM ")

    return "\n".join(query_template)


def __load_default_scratchpad(kind):
    query_template = [
        "## This is your scratchpad",
        "You can write any query here to explore, test or take notes on your query.\n",
        "write / and select SQL and create a new sql block\n",
        "run using CMD + Enter or press run (cursor must be in the SQL block)",
        "",
        "<br>",
        "",
        "### Try Exploring the data in the table you are using",
        "```sql",
        "SELECT",
        "   *",
        "FROM ",
        "```",
        "",
        "<br>",
        "",
        "**OR Explore the data in the actual query on the left**",
        "",
        "```sql",
        "SELECT",
        "   *",
        "FROM {current_script} c ",
        "```",
        "<br>",
        "",
    ]

    # load the template
    if kind == "stream":
        query_template.extend(
            [
                "### Duplication Check ",
                "Activities cannot have duplication on the activity_id",
                "",
                "```sql",
                "SELECT",
                "   activity,",
                "   activity_id,",
                "   COUNT(1) as total_dups",
                "FROM {current_script} c ",
                "Group by c.activity, c.activity_id",
                "HAVING COUNT(1) > 1",
                "```",
                "",
                "<br>",
                "",
                "### Check for Missing Customer",
                "Activities need to be tied to a customer",
                "*NOTE: `anonymous_customer_id` should only be used if you actually want the data to be stitched*",
                "```sql",
                "SELECT",
                "   *",
                "FROM {current_script} c ",
                "WHERE COALESCE(c.customer, c.anonymous_customer_id) is NULL",
                "```",
                "",
            ]
        )
    elif kind == "customer_attribute":
        query_template.extend(
            [
                "### Duplication Check ",
                "Customer attributes can only have 1 row per customer",
                "```sql",
                "SELECT",
                "   c.customer,",
                "   COUNT(1) as total_dups",
                "FROM {current_script} c ",
                "Group by c.customer",
                "HAVING COUNT(1) > 1" "```",
                "",
                "<br>",
                "",
                "### Check for Missing Customer",
                "Customer column in customer attribute cannot be NULL",
                "```sql",
                "SELECT",
                "   *",
                "FROM {current_script} c ",
                "WHERE c.customer is NULL",
                "```",
                "",
            ]
        )

    return "\n".join(query_template)


def _get_table_default(mavis, kind):
    if kind == "stream":
        if len(mavis.company.tables) > 0:
            return mavis.company.tables[0].activity_stream
        else:
            return "activity_stream"

    elif kind == "enrichment":
        return AUTO_GENERATE_STRING

    elif kind == "customer_attribute":
        if mavis.company.tables and mavis.company.tables[0].customer_dim_table_id is None:
            return "customer"
        else:
            return AUTO_GENERATE_STRING
    elif kind == "spend":
        return AUTO_GENERATE_STRING


def create_steps_data(is_validated=False, failed_validation=False, step=0):
    logger.debug("creating the steps")
    push_status = "wait"
    if step == 1:
        next_name = "Push to Production"
        previous_name = "Back to SQL"

        if is_validated:
            if failed_validation:
                valid_step = dict(title="Failed Validation", status="error")
            else:
                push_status = "progress"
                valid_step = dict(title="Successful Validation", status="finish")
        else:
            valid_step = dict(title="Running Validation", status="progress")
    elif step == 2:
        push_status = "finish"
        valid_step = dict(title="Validate", status="finish")
        next_name = "Done"
        previous_name = "Validate Again"

    elif step == 0:
        valid_step = dict(title="Validate", status="progress")
        next_name = "Validate"
        previous_name = "Back"

    data = dict(
        field_slug="validation_steps",
        current=step,
        status="progress",
        type="default",
        size="small",
        clickable=True,
        show_buttons=True,
        button_labels=dict(next=next_name, previous=previous_name),
        steps=[
            dict(title="Write SQL Query", status="progress" if step > 0 else "finish"),
            valid_step,
            dict(
                title="Push to Production",
                disabled=not is_validated or failed_validation,
                status=push_status,
            ),
        ],
    )

    return data


def _create_production_query(transform):
    mk = []
    # write the log of the data in a nice way
    for ii, q in enumerate(transform.production_queries):
        if ii == 0:
            mk.extend(
                [
                    "# Current production query",
                    f"**Script Slug** `{transform.slug}`",
                    f"**Published by:** {q.updated_by}",
                    f"**Published at:** {utils.pretty_diff(q.created_at)} ({q.created_at[:19]} UTC)",
                    f"```sql\n\n{q.sql}\n\n```",
                ]
            )

        else:
            if ii == 1:
                mk.extend(
                    [
                        "------",
                        "**History Logs**",
                    ]
                )

            mk.extend(
                [
                    f"### {q.updated_by} - {utils.pretty_diff(q.created_at)} ({q.created_at[:19]} UTC) ",
                    "<details> <summary>SQL Query</summary>",
                    f"```sql\n\n{q.sql}\n\n```",
                    "</details>",
                    "<br>",
                ]
            )

    return "\n\n".join(mk)


def _choose_space(kind, update_type, section):
    if section == "every_update":
        if kind != "customer_attribute" and update_type != "materialized_view":
            return 30
        else:
            return 100

    elif section == "save":
        if kind == "stream":
            return 30
        elif kind == "customer_attribute":
            return 40
        else:
            return 30
