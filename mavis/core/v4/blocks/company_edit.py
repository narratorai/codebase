from collections import defaultdict
from random import SystemRandom

import stripe
from babel import Locale

from core import utils
from core.api.customer_facing.sql.utils import WarehouseManager
from core.api.customer_facing.tasks.utils import TaskManager
from core.constants import RESERVED_TAGS
from core.errors import SilenceError
from core.graph import graph_client
from core.graph.sync_client.enums import company_task_category_enum
from core.logger import get_logger
from core.models.company import CompanyTable, query_graph_company
from core.models.settings import settings
from core.util.auth0 import get_api_client
from core.v4.blocks.shared_ui_elements import (
    _checkbox,
    _date_picker,
    _drop_down,
    _hide_properties,
    _input,
    _make_array,
    _make_ui,
    _number,
    _object,
    _space,
)
from core.v4.documentation import get_doc
from core.v4.mavis import Mavis
from core.v4.query_mapping.config import FUNCTIONS, TIMEZONES

logger = get_logger()
stripe.api_key = settings.stripe_key.get_secret_value()


TITLE = "Company Edit"
DESCRIPTION = "Edit company"
VERSION = 1

IGNORE_TZ = "DO NOT CAST TIMEZONE"
DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

fields = [
    "name",
    "website",
    "timezone",
    "cache_minutes",
    "max_inserts",
    "start_data_on",
    "materialize_schema",
    "warehouse_schema",
    "currency_used",
    "validation_days",
    "dataset_row_threshold",
    "dataset_default_filter_days",
    "mutable_update_window",
    "use_time_boundary",
    "week_day_offset",
]


def todict(obj, key):
    return [o.dict() for o in obj if getattr(o, key) is None or getattr(o, key).value == "live"]


def get_schema(mavis: Mavis, internal_cache: dict):
    current_schemas = internal_cache["schemas"] or []
    stream_tables = internal_cache["stream_tables"] or []

    all_datasets = graph_client.dataset_index(company_id=mavis.company.id).dataset
    all_narratives = graph_client.narrative_index(company_id=mavis.company.id).narrative
    all_activities = graph_client.activity_index(company_id=mavis.company.id).dict()["all_activities"]

    current_locale = Locale(mavis.company.locale)

    functions = []
    for f in FUNCTIONS:
        if f["kind"] != "agg_functions":
            ii = 1
            temp_input = []
            for c in f["input_fields"]:
                if c["kind"] == "column":
                    temp_input.append("$%i" % ii)
                    ii += 1
                else:
                    temp_input.append(c["name"])

            functions.append(
                dict(
                    label=f["name"],
                    insertText="{}({})".format(f["name"], ", ".join(temp_input)),
                    documentation=dict(value=f["description"]),
                )
            )

    # compile the input
    autocomplete = [
        dict(
            onlyCompleteBetween=[" ", " "],
            triggerCharacters=[" ", "(", ",", "["],
            completionItems=functions,
        )
    ]

    raw_data = process_data(mavis, None)

    # define the full schema
    schema = _object(
        dict(
            name=_input("Brand Name"),
            website=_input("Website"),
            timezone=_drop_down(
                [IGNORE_TZ] + (TIMEZONES),
                title="Timezone",
            ),
            cache_minutes=_number("Keep Cache for ___ minutes"),
            max_inserts=_number("Maximum Rows to Insert"),
            mutable_update_window=_number("Days to Reconcile", default=15),
            validation_days=_number("Validation Days", default=6 * 30),
            start_data_on=_date_picker("Only insert data after"),
            materialize_schema=_input("Materialization Schema"),
            warehouse_schema=_input("Warehouse Schema"),
            dataset_row_threshold=_number("Apply filter to activities with over __ rows(in millions)", default=50),
            dataset_default_filter_days=_number("Autofilter to the last __ days", default=30),
            warehouse_default_schemas=_drop_down(
                current_schemas,
                is_multi=True,
                title="Visible Schemas",
                default=raw_data["warehouse_default_schemas"],
            ),
            currency_used=_drop_down(list(current_locale.currencies.keys()), title="Currency"),
            use_time_boundary=_checkbox(title="Use Time Boundary"),
            start_week_on=_drop_down(DAYS, title="Start Week on"),
            save=_checkbox("Save"),
            archive=_checkbox("DELETE COMPANY"),
            imported_details=_input(),
            imported_table=_object(
                dict(
                    activity_stream=_drop_down(
                        [dict(id=s, name=s.replace(":", " (Partitioned)")) for s in stream_tables],
                        "id",
                        "name",
                        title="Activity Stream",
                    ),
                    run_import=_checkbox(title="Run Link"),
                ),
                title="Link Activity Stream",
            ),
            tags=_make_array(
                dict(
                    id=_input(),
                    tag=_input(title="Tag"),
                    color=_input(default="#dc3912"),
                    description=_input("Tag description"),
                    datasets=_drop_down(
                        todict(all_datasets, "status"),
                        "id",
                        "name",
                        is_multi=True,
                        title="Datasets",
                    ),
                    narratives=_drop_down(
                        todict(all_narratives, "state"),
                        "id",
                        "name",
                        is_multi=True,
                        title="Narratives",
                    ),
                ),
                title="Tags",
            ),
            categories=_make_array(
                dict(
                    category=_input(title="Category"),
                    color=_input(title="Color", default="#dc3912"),
                    activity_ids=_drop_down(all_activities, "id", "name", is_multi=True),
                )
            ),
            custom_feedback=_input(),
            custom_functions=_make_array(
                dict(
                    name=_input(title="Name"),
                    text_to_replace=_input(title="function", default="iff($1, 'true_val', 'false_val)"),
                    description=_input(title="Description"),
                )
            ),
            helper_feedback=_input(),
            events=_make_array(
                dict(
                    name=_input("Name"),
                    happened_at=_date_picker("Happened At"),
                    description=_input("Description"),
                )
            ),
        ),
        default=raw_data,
    )

    _hide_properties(
        schema,
        ["dataset_row_threshold", "dataset_default_filter_days"],
        "auto_filter_large_datasets",
    )

    # hide properties
    _hide_properties(
        schema,
        [
            "cache_minutes",
            "max_inserts",
            "mutable_update_window",
            # "reconcile_hours",
            "use_time_boundary",
            "start_data_on",
            "materialize_schema",
            "warehouse_schema",
            "warehouse_default_schemas",
            "spend_table",
            "currency_used",
            "week_day_offset",
            "start_week_on",
            "validation_days",
            "dataset_row_threshold",
            "dataset_default_filter_days",
            "auto_filter_large_datasets",
        ],
        "processing_configuration",
    )

    # hide properties
    _hide_properties(
        schema,
        [
            "imported_details",
            "imported_table",
        ],
        "link_activity_streams",
    )

    # hide properties
    _hide_properties(
        schema,
        [
            "categories",
        ],
        "edit_categories",
    )

    # hide properties
    _hide_properties(
        schema,
        [
            "tags",
        ],
        "manage_tags",
    )

    # hide properties
    _hide_properties(
        schema,
        [
            "custom_feedback",
            "custom_functions",
        ],
        "edit_custom_functions",
    )

    schema_ui = dict(
        **_make_ui(
            options=dict(
                hide_submit=True,
                hide_output=True,
                title=False,
                flex_direction="row",
                flex_wrap="wrap",
            ),
            order=[
                "name",
                "website",
                "timezone",
                "processing_configuration",
                "cache_minutes",
                "mutable_update_window",
                "max_inserts",
                "validation_days",
                "start_data_on",
                # "reconcile_hours",
                "auto_filter_large_datasets",
                "dataset_row_threshold",
                "dataset_default_filter_days",
                # "use_temporary_tables",
                "use_time_boundary",
                "warehouse_schema",
                "materialize_schema",
                "warehouse_default_schemas",
                "spend_table",
                "currency_used",
                "week_day_offset",
                "start_week_on",
                "default_time_between",
                "link_activity_streams",
                "imported_details",
                "imported_table",
                "manage_tags",
                "tags",
                "edit_categories",
                "categories",
                "edit_custom_functions",
                "custom_feedback",
                "custom_functions",
                "helper_feedback",
                "events",
                "save",
                "archive",
            ],
        ),
        name=_make_ui(options=_space(40)),
        website=_make_ui(options=_space(30)),
        timezone=_make_ui(options=_space(30)),
        processing_configuration=_make_ui(widget="BooleanToggleWidget", options=_space(100, my=20)),
        cache_minutes=_make_ui(
            options=dict(**_space(18), data_public=True),
            info_modal=get_doc(mavis.company, "company/cache_minutes"),
        ),
        max_inserts=_make_ui(
            options=dict(**_space(24), data_public=True),
            info_modal=get_doc(mavis.company, "company/max_inserts"),
        ),
        mutable_update_window=_make_ui(
            options=dict(**_space(18), data_public=True),
            info_modal=get_doc(mavis.company, "company/mutable_update_window"),
        ),
        validation_days=_make_ui(
            help_text="How many days will we use to validate the data when pushing a transformation to production",
            options=dict(**_space(20), data_public=True),
        ),
        start_data_on=_make_ui(
            options=dict(**_space(20), data_public=True),
            info_modal=get_doc(mavis.company, "company/start_data_on"),
        ),
        use_time_boundary=_make_ui(
            options=dict(**_space(100, mb=16), data_public=True),
            info_modal=get_doc(mavis.company, "company/use_time_boundary"),
        ),
        materialize_schema=_make_ui(options=dict(**_space(30), data_public=True)),
        warehouse_schema=_make_ui(options=dict(**_space(30), data_public=True)),
        warehouse_default_schemas=_make_ui(options=dict(**_space(100), data_public=True)),
        auto_filter_large_datasets=_make_ui(),
        dataset_row_threshold=_make_ui(
            options=dict(**_space(50), data_public=True),
        ),
        dataset_default_filter_days=_make_ui(
            options=dict(**_space(50), data_public=True),
        ),
        currency_used=_make_ui(options=dict(**_space(30), data_public=True)),
        week_day_offset=_make_ui(options=dict(**_space(30), data_public=True)),
        start_week_on=_make_ui(options=dict(**_space(30), data_public=True)),
        save=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(**_space(30), process_data=True, button_type="primary"),
        ),
        archive=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(
                **_space(60, align_right=True),
                process_data=True,
                button_type="secondary",
                danger=True,
                tiny=True,
                popconfirm=True,
                popconfirm_text="Are you sure you want to delete your company? \n\nThis is only recoverable within 30 days with an email to support@narrator.ai!",
            ),
        ),
        helper_feedback=_make_ui(widget="MarkdownRenderWidget", options=dict(**_space(50), data_public=True)),
        link_activity_streams=_make_ui(widget="BooleanToggleWidget", options=_space(100, my=20)),
        imported_details=_make_ui(widget="MarkdownRenderWidget", options=_space(70)),
        imported_table=dict(
            **_make_ui(
                order=[
                    "activity_stream",
                    "run_import",
                ],
                options=_space(50),
            ),
            activity_stream=_make_ui(),
            run_import=_make_ui(
                widget="BooleanButtonWidget",
                options=dict(
                    process_data=True,
                    button_type="primary",
                    **_space(100, align_right=True),
                ),
            ),
        ),
        manage_tags=_make_ui(widget="BooleanToggleWidget", options=_space(100, my=20)),
        tags=dict(
            **_make_ui(
                flex_direction="row",
                flex_wrap="wrap",
                order=["category", "color", "description"],
                options=dict(orderable=False, addable=True, removable=True),
            ),
            items=dict(
                id=_make_ui(hidden=True),
                tag=_make_ui(options=dict(**_space(25))),
                color=_make_ui(widget="color", options=dict(**_space(25))),
                description=_make_ui(widget="textarea", options=dict(rows=1)),
            ),
        ),
        edit_categories=_make_ui(widget="BooleanToggleWidget", options=_space(100, my=20)),
        categories=dict(
            **_make_ui(
                flex_direction="row",
                flex_wrap="wrap",
                order=["category", "color"],
                options=dict(orderable=False, addable=True, removable=True),
            ),
            items=dict(
                category=_make_ui(options=dict(**_space(20))),
                color=_make_ui(widget="color", options=dict(**_space(15))),
                activity_ids=_make_ui(options=dict(**_space(65))),
            ),
        ),
        edit_custom_functions=_make_ui(widget="BooleanToggleWidget", options=_space(100, my=20)),
        custom_feedback=_make_ui(widget="MarkdownRenderWidget", options=dict(data_public=True, **_space(70))),
        custom_functions=dict(
            **_make_ui(
                flex_direction="row",
                flex_wrap="wrap",
                order=["name", "text_to_replace", "description"],
                options=dict(
                    title=False,
                    orderable=True,
                    addable=True,
                    removable=True,
                    **_space(80),
                ),
            ),
            items=dict(
                name=_make_ui(options=dict(**_space(25))),
                text_to_replace=_make_ui(
                    widget="MarkdownWidget",
                    help_text="This will be the input that is replaces in the freehand function.  use $1, $2 .. to define inputs.",
                    options=dict(**_space(75), autocomplete=autocomplete, default_height=50),
                ),
                description=_make_ui(
                    widget="textarea",
                    options=dict(rows=3),
                ),
            ),
        ),
        events=dict(
            **_make_ui(
                order=["name", "happened_at", "description"],
                options=dict(title=False, orderable=False, **_space(80)),
            ),
            items=dict(
                name=_make_ui(options=_space(70)),
                happened_at=_make_ui(options=_space(30), help_text="Date when the event happened"),
                description=_make_ui(widget="MarkdownWidget", options=dict(default_height=70)),
            ),
        ),
    )
    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    # spend table options

    stream_tables = []
    schemas = []

    try:
        tables = WarehouseManager(mavis=mavis).get_schema()
        for t in tables["schema"]:
            (schema, table) = utils.split_schema_table_name(t["name"])
            schemas.append(schema)
            schema = schema.lower()
            table = table.lower()

            if schema == mavis.company.warehouse_schema.lower():
                # remove any stream
                if any(table.startswith(ct.activity_stream) for ct in mavis.company.tables):
                    continue

                all_cols = [tc.lower() for tc in t["columns"]]

                if all(c in all_cols for c in ("activity_id", "activity", "customer", "ts")):
                    stream_tables.append(table)
    except Exception as e:
        logger.error(e)
    internal["stream_tables"] = _squash_stream_tables(stream_tables)[0]
    internal["schemas"] = list(set(schemas))

    return internal


def _find_overlap(t1, t2):
    ov = []
    for ii, k in enumerate(t1):
        if ii < len(t2) and k == t2[ii]:
            ov.append(k)
        else:
            break

    return "".join(ov)


def _squash_stream_tables(tbls):
    ouptput_tables = defaultdict(int)

    # processed the overlap of functions
    for ii, t in enumerate(tbls):
        for t2 in tbls[ii + 1 :]:
            ov = _find_overlap(t, t2)
            if ov:
                if ov.endswith("_"):
                    ov = ov[:-1]
                ouptput_tables[ov] += 1

    partitioned_tables = [k for k, v in ouptput_tables.items() if v > 1]

    all_tables = []
    all_tables.extend([f"{pt}:" for pt in partitioned_tables])

    # then remove all the tables
    for t in tbls:
        if not any(t.startswith(pt) for pt in partitioned_tables):
            all_tables.append(t)

    return (all_tables, partitioned_tables)


# get the values that are allowed
def get_values(mavis: Mavis, data: dict, updated_field_slug: str | None = None):
    return None


def process_data(mavis: Mavis, data: dict, updated_field_slug: str | None = None):
    if updated_field_slug in (None, "company_edit"):
        events = graph_client.get_company_events(company_id=mavis.company.id).company_timeline

        all_functions = graph_client.get_all_custom_functions(company_id=mavis.company.id).custom_function

        # get THE CATEGORIES
        categories = _get_categories(mavis)

        all_tags = [
            t for t in graph_client.get_all_tags(company_id=mavis.company.id).company_tags if t.tag not in RESERVED_TAGS
        ]
        all_datasets = graph_client.dataset_index(company_id=mavis.company.id).dataset

        all_narratives = graph_client.narrative_index(company_id=mavis.company.id).narrative

        tags_data_default = []
        for tag in all_tags:
            tags_data_default.append(
                dict(
                    id=tag.id,
                    tag=tag.tag,
                    color=tag.color,
                    description=tag.description,
                    datasets=[d.id for d in all_datasets if tag.id in (tt.tag_id for tt in d.tags)],
                    narratives=[d.id for d in all_narratives if tag.id in (tt.tag_id for tt in d.tags)],
                )
            )

        # Create the data
        data = dict(
            **{
                f: (getattr(mavis.config, f) if hasattr(mavis.config, f) else getattr(mavis.company, f)) for f in fields
            },
            auto_filter_large_datasets=mavis.company.dataset_row_threshold is not None,
            categories=categories,
            imported_details="\n\n".join(
                [
                    "## Link your Activity Stream from dbt, Airflow or any other tool",
                    f"*Narrator allows you to bring your own Activity Stream based on the [Activity Schema Spec](https://www.activityschema.com/).  We only search the schema that you specified in Processing Configuration ({mavis.company.warehouse_schema})*",
                    ">You are responsible for maintaining these Activity Streams, if you want Narrator to maintain it, please wrap around it in Transformations or contact support for more help",
                    "<details>",
                    "<summary>Why can I not select my Activity Stream </summary>",
                    "The following columns are required for the Activity Stream and customer attributes:",
                    "- **Activity Stream:** Requires activity_id, activity, ts, customer columns",
                    "- **Customer Attribute:** Requires customer column",
                    "</details>",
                    "<br>",
                ]
            ),
            warehouse_default_schemas=(
                mavis.company.warehouse_default_schemas.split(",") if mavis.company.warehouse_default_schemas else []
            ),
            helper_feedback="\n\n".join(
                [
                    "## Log Events",
                    "Use the timeline to log major company events that could influence every activity. These events can be applied to every plot",
                    "Useful for: Company launches, Data Outage, Major changes",
                ]
            ),
            custom_feedback="\n\n".join(
                [
                    "## Custom Functions",
                    "Use this to create custom functions to be used in freehand",
                    "This words a bit like a text replace where you will be able to use a function like `_custom_name( Column_1, Column2)`.  This will be replaced with the text you have in 'definition' where `$1` will be replaced by `Column_1` and `$2` will be replaced by `Column_2`",
                    "Useful for: Creating grouping that are consistent, applying business specific equation logic, etc..",
                ]
            ),
            events=[e for e in events],
            custom_functions=[c.dict() for c in all_functions],
            all_function_ids=[c.id for c in all_functions],
            tags=tags_data_default,
        )

        # add the start of the week
        data["start_week_on"] = DAYS[mavis.qm.config["week_offset"] + (mavis.company.week_day_offset or 0)]

        if not data["validation_days"]:
            data["validation_days"] = 6 * 30

    elif updated_field_slug == "root_imported_table_run_import":
        if not data["imported_table"]["activity_stream"]:
            raise ValueError("Please select a proper table")
        # deal with the partitioned
        if data["imported_table"]["activity_stream"].endswith(":"):
            data["imported_table"]["activity_stream"] = data["imported_table"]["activity_stream"][:-1]
            data["imported_table"]["manually_partition_activity"] = True

        __import_tables(mavis, [data["imported_table"]])

        # open the imported tables
        data["link_activity_streams"] = False

        data["_notification"] = utils.Notification(message="Completed Import", type=utils.NotificationTypeEnum.SUCCESS)

    elif updated_field_slug == "root_save":
        # handle loading the data
        raw_data = process_data(mavis, None)
        for k, v in raw_data.items():
            if k not in data:
                data[k] = v

        # load the data
        actual_offset = mavis.qm.config["week_offset"]
        desired_offset = DAYS.index(data["start_week_on"])
        data["week_day_offset"] = desired_offset - actual_offset

        if any(
            f
            for f in fields
            if data[f] != (getattr(mavis.config, f) if hasattr(mavis.config, f) else getattr(mavis.company, f))
            and f != "tables"
        ) or ",".join(data["warehouse_default_schemas"]) != (mavis.company.warehouse_default_schemas or ""):
            # update the company configs
            graph_client.update_company(
                id=mavis.company.id,
                name=data["name"],
                cache_minutes=data["cache_minutes"] or 0,
                materialize_schema=utils.slugify(data["materialize_schema"]),
                warehouse_schema=data["warehouse_schema"].lower(),
                timezone=data["timezone"] if data["timezone"] != IGNORE_TZ else "UTC",
                currency_used=data["currency_used"] or None,
                use_time_boundary=data["use_time_boundary"] or False,
                website=data["website"] or None,
                start_data_on=data["start_data_on"] or None,
                dataset_row_threshold=(data["dataset_row_threshold"] if data["auto_filter_large_datasets"] else None),
                dataset_default_filter_days=(
                    data["dataset_default_filter_days"] if data["auto_filter_large_datasets"] else None
                ),
                warehouse_default_schemas=",".join(data["warehouse_default_schemas"]) or None,
                week_day_offset=data["week_day_offset"] or 0,
            )
            # save the config
            mavis.config.max_inserts = data["max_inserts"]
            mavis.config.mutable_update_window = data["mutable_update_window"]
            mavis.config.validation_days = data["validation_days"] or 12 * 30
            # mavis.config.reconcile_hours = data["reconcile_hours"]

            mavis.save_processing_config(mavis.config.dict())

        # update the timeline
        __update_timeline(mavis, data["events"])

        # update the tags
        __update_tags(mavis, data["tags"])

        # update company tables
        __update_categories(mavis, data["categories"])

        # update the custom functions
        __update_custom_functions(mavis, data["custom_functions"], data["all_function_ids"])

        # bust the cache
        query_graph_company(mavis.company.slug, refresh_cache=True)

        data["_notification"] = utils.Notification(message="Changes Saved", type=utils.NotificationTypeEnum.SUCCESS)
        data["_redirect_url"] = "/manage/company"

    elif updated_field_slug == "root_archive":
        message = ["Deleted Company"]
        message.extend(archive_company(mavis.company.id))

        data["_redirect_url"] = "/manage/company"
        data["_notification"] = utils.Notification(
            message=" and ".join(message), type=utils.NotificationTypeEnum.SUCCESS
        )

    return data


def archive_company(company_id):
    message = []
    auth_client = get_api_client()
    auth_org = graph_client.get_auth_org(company_id=company_id).auth

    # delete the org
    if auth_org:
        auth_client.organizations.delete_organization(auth_org[0].org_id)

    stripe.api_key = settings.stripe_key.get_secret_value()
    customers = stripe.Customer.search(
        query=f"metadata['company_id']:'{company_id}'",
    ).to_dict()["data"]
    if customers:
        subscriptions = stripe.Subscription.list(customer=customers[0]["id"]).to_dict()["data"]

        # delete all subscriptions
        for sub in subscriptions:
            stripe.Subscription.delete(sub["id"])

        message.append("cancelled all subscriptions")

    # archive the company
    graph_client.archive_company(company_id=company_id)

    return message


def run_data(mavis: Mavis, data: dict):
    return []


def __import_tables(mavis, tables):
    notification = None
    trigger_run = False

    # loop through the tables and see what you need to updates
    for t in tables:
        new_table = graph_client.insert_company_table(
            company_id=mavis.company.id,
            activity_stream=t["activity_stream"],
            identifier=t["identifier"] or "Imported Customer",
            is_imported=True,
        ).insert_company_table_one

        # manually support partitioned
        if t.get("manually_partition_activity"):
            graph_client.update_company_table_partition(id=new_table.id, manually_partition_activity=True)

        mavis.company.tables.append(CompanyTable(**new_table.dict()))

        task_slug = "check_new_activities"
        from batch_jobs.data_management.check_for_new_activities import (
            check_for_new_activities,
        )

        task_id = mavis.company.get_task_id(task_slug)
        if not task_id:
            task_id = _create_activity_task(mavis, task_slug)

        if not mavis.company.batch_halt and trigger_run:
            check_for_new_activities.send(company_slug=mavis.company.slug, task_id=task_id)

    return notification


def _create_activity_task(mavis, task_slug):
    from batch_jobs.data_management.check_for_new_activities import (
        check_for_new_activities,
    )

    cryptogen = SystemRandom()
    rand_n = cryptogen.randrange

    return TaskManager(mavis=mavis).create(
        check_for_new_activities,
        slug=task_slug,
        category=company_task_category_enum.processing.value,
        schedule=f"{rand_n(59)} 5 * * 0",
        internal_only=False,
        description="Scans the imported Activity Streams for a new activities to create",
    )


def _get_categories(mavis):
    data = graph_client.execute(
        """
        query GetCategories($company_id: uuid!) {
            company_categories(where: {company_id: {_eq: $company_id}}) {
                id
                color
                category
                activities { id }
            }
        }
        """,
        dict(company_id=mavis.company.id),
    ).json()

    temp_cats = data["data"]["company_categories"]
    for c in temp_cats:
        c["activity_ids"] = [a["id"] for a in c["activities"]]

    return temp_cats


def __update_categories(mavis, categories):
    temp_cats = _get_categories(mavis)
    # add all the cates
    tc = {t["category"]: t for t in temp_cats}
    for q in categories:
        if tc.get(q["category"]) is None or tc[q["category"]] != q["color"]:
            cat_id = graph_client.insert_category(
                company_id=mavis.company.id,
                category=q["category"],
                color=q["color"] or "#000000",
            ).inserted_category.id
            tc_activities = []
        else:
            cat_id = tc[q["category"]]["id"]
            tc_activities = tc[q["category"]]["activity_ids"]

        # update all the categories
        (added, removed, _) = utils.diff_list(tc_activities, q["activity_ids"])

        # add the categorization
        for a in added:
            graph_client.update_activity_category(id=a, category_id=cat_id)

        # remove the categorization
        for a in removed:
            graph_client.update_activity_category(id=a, category_id=None)

    # delete the unnecessary categories
    current_cats = [q["category"] for q in categories]
    for k, c in tc.items():
        if k not in current_cats:
            graph_client.delete_category(id=c["id"])


def __update_custom_functions(mavis, custom_functions, past_ids):
    for c_id in past_ids:
        # Remove the ids that you don't see anymore
        if "id" not in (c["id"] for c in custom_functions):
            graph_client.execute(
                """
                mutation DeleteFunction($id: uuid!) {
                    delete_custom_function_by_pk(id: $id) { id }
                }
                """,
                dict(id=c_id),
            )

    for c in custom_functions:
        if "$0" in c["text_to_replace"]:
            raise ValueError("Cannot use $0 as an input")

        # make sure the name is a slug
        c["name"] = utils.slugify(c["name"])

        # find all the inputs
        input_count = next(ii for ii in range(1, 100) if ("$%i" % ii) not in c["text_to_replace"])

        graph_client.insert_custom_function(
            company_id=mavis.company.id,
            name=c["name"],
            input_count=input_count - 1,
            text_to_replace=c["text_to_replace"],
            description=c["description"],
        )


def _clean_event(t):
    return dict(
        happened_at=t.get("happened_at") or utils.utcnow(),
        name=t["name"],
        description=t.get("description") or "",
    )


def __update_timeline(mavis, events):
    orginal_events = graph_client.get_company_events(company_id=mavis.company.id)

    (added, removed, updated) = utils.diff_objects(orginal_events.dict()["company_timeline"], events)
    for t in added:
        t["id"] = graph_client.insert_company_timeline(
            related_to="company", related_id=mavis.company.id, **_clean_event(t)
        ).insert_company_timeline.id

    for t in updated:
        graph_client.update_company_timeline(id=t["id"], **_clean_event(t))

    for r in removed:
        graph_client.delete_timeline(id=r["id"])


def __update_tags(mavis, tags):
    if any(t["tag"] in RESERVED_TAGS for t in tags):
        raise SilenceError(f'You cannot used any of the reserved tag names ({", ".join(RESERVED_TAGS)}) ')

    current_tags = [t for t in graph_client.get_all_tags(company_id=mavis.company.id).company_tags]

    # delete the tags that we don't see
    for c in current_tags:
        if c.id not in (t["id"] for t in tags) and c.tag not in RESERVED_TAGS:
            graph_client.execute(
                """
                mutation DeleteTag($id: uuid!) {
                    delete_company_tags_by_pk(id: $id) {
                        id
                    }
                }
                """,
                dict(id=c.id),
            )

    # create a dict
    tag_dict = {c.id: c for c in current_tags}

    tagged_items = graph_client.get_tagged_items(company_id=mavis.company.id).tag

    # add all the tag details
    for t in tags:
        # Update the tags if they are needed
        if t["id"]:
            if tag_dict[t["id"]].tag != t["tag"] or tag_dict[t["id"]].color != t["color"]:
                try:
                    graph_client.update_tag(
                        id=t["id"],
                        tag=t["tag"],
                        color=t["color"],
                        description=t["description"] or "",
                    )
                except Exception as e:
                    if "company_tags_tag_company_id_key_unique" in utils.get_error_message(e):
                        raise ValueError(f'The tag ({t["tag"]}) is already created, please choose another name')
                    else:
                        raise e
        else:
            try:
                t["id"] = graph_client.insert_tag(
                    company_id=mavis.company.id,
                    tag=t["tag"],
                    color=t["color"],
                    description=t["description"] or "",
                ).inserted_tag.id
            except Exception as e:
                if "company_tags_tag_company_id_key_unique" in utils.get_error_message(e):
                    raise SilenceError(
                        f'The tag ({t["tag"]}) seems to have already been created.  Please rename or refresh the page.'
                    )
                else:
                    raise e
        # Add all the tags Items
        for k in ("datasets", "narratives"):
            # get all the current tags
            curr_tagged_items = {
                tc.related_id: tc.id for tc in tagged_items if tc.related_to.value == k[:-1] and tc.tag_id == t["id"]
            }

            for d in t[k]:
                # if we don't see the tag then add it
                if curr_tagged_items.get(d) is None:
                    # insert it
                    graph_client.insert_tag_item_one(related_id=d, related_to=k[:-1], tag_id=t["id"])

            # remove all the tag items
            for ct, t_id in curr_tagged_items.items():
                if ct not in t[k]:
                    graph_client.delete_tagged_item(id=t_id)
