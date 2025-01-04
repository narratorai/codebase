from batch_jobs.data_management.run_transformations import is_resync
from core import utils
from core.api.customer_facing.activities.utils import ActivityManager
from core.errors import ForbiddenError, SilenceError
from core.graph import graph_client
from core.models.ids import is_valid_uuid
from core.models.internal_link import InternalLink
from core.util.opentelemetry import tracer
from core.v4.blocks.shared_ui_elements import (
    _checkbox,
    _date_picker,
    _drop_down,
    _get_all_columns,
    _get_all_tables,
    _get_dim_id,
    _hide_properties,
    _input,
    _make_array,
    _make_ui,
    _object,
    _space,
    _user_drop_down,
)
from core.v4.documentation import get_doc
from core.v4.mavis import Mavis
from core.v4.query_mapping.config import ALL_TYPES

TITLE = "Activity Details"
DESCRIPTION = "Record details about an activity and control how it appears in the Portal"
VERSION = 1
FIVETRAN_TRACKING_URL = "https://webhooks.fivetran.com/webhooks/ddc9235d-2a7b-40d3-8954-66cdf9c6ada2"

CATEGORIES = []
EVENT_CONTEXT = "\n".join(
    [
        "## Log Events",
        "Use the timeline to log major company events that could influence the activity. These events can be applied to every plot using this activity to provide additional context to a specific metric.",
        "Useful for: Logging outages, bugs in data collection, major product releases.",
    ]
)


@tracer.start_as_current_span("get_schema")
def get_schema(mavis: Mavis, internal_cache: dict):
    # cached datasets
    activity_slug = internal_cache["activity_slug"] or ""
    activity_id = internal_cache["activity_id"]
    add_type = mavis.user.is_internal_admin or internal_cache["is_imported"]
    activity_join_columns = internal_cache["activity_join_columns"] or []
    all_categories = [
        c.dict() for c in graph_client.get_all_categories(company_id=mavis.company.id).company_categories
    ] or CATEGORIES

    MAINTENANCE_ACTIVITY_SUBSCRIPTION = """
    subscription GetActiveMaintenance($activity_id: uuid!, $last_updated_at: timestamptz!) {
        activity_maintenance(where: {activity_id: {_eq: $activity_id}, _or: [{ended_at: {_is_null: true}}, {ended_at: {_gte: $last_updated_at}}]}) {
            id
        }
    }
    """
    MAINTENANCE_ACTIVITY_SUBSCRIPTION_INPUTS = {
        "activity_id": activity_id,
        "last_updated_at": utils.date_add(utils.utcnow(), "minute", -30),
    }

    # define the full schema
    schema = _object(
        {
            "activity_banner": _input(),
            "name": _input("Display Name"),
            "category": _drop_down(all_categories, "id", "category", title="Category"),
            "maintainer_id": _user_drop_down(mavis, "Maintained By"),
            "description": _input("Description"),
            "context": _input(),
            "dims": _make_array(
                {
                    "dim_table": _drop_down(
                        _get_all_tables(mavis, show_key=True),
                        "id",
                        "label",
                        title="Table",
                    ),
                    "join_key": _drop_down([], title="Join Column"),
                    "activity_join_column": _drop_down(
                        activity_join_columns,
                        "name",
                        "label",
                        title="Activity Join Column",
                    ),
                    "slowly_changing_ts_column": _drop_down(
                        [],
                        default=None,
                        title="Slowly Changing Timestamp",
                    ),
                },
                title="Feature Dimensions",
            ),
            "all_columns": _make_array(
                {
                    "name": _input("SQL Column"),
                    "label": _input("Product Label"),
                    "type": _drop_down(ALL_TYPES, title="Type"),
                },
                title="Rename Columns",
            ),
            "reset_column_types": _checkbox("Reset Column Types"),
            "event_context": _input(default=EVENT_CONTEXT),
            "events": _make_array(
                {
                    "name": _input("Name"),
                    "happened_at": _date_picker("Happened At"),
                    "description": _input("Description"),
                }
            ),
            "save": _checkbox("Save"),
        }
    )

    # hide properties
    _hide_properties(
        schema["properties"]["dims"]["items"],
        [
            "join_key",
        ],
        "show_json_key",
        default=True,
    )

    _hide_properties(
        schema["properties"]["dims"]["items"],
        [
            "slowly_changing_ts_column",
        ],
        "make_a_slowly_changing_dimension",
    )
    _hide_properties(schema, ["all_columns", "reset_column_types"], "rename_columns")

    _hide_properties(schema, ["event_context", "events"], "log_events")

    # define if user is company admin
    is_admin = mavis.user.is_admin

    schema_ui = dict(
        **_make_ui(
            options={
                "hide_submit": True,
                "hide_output": True,
                "title": False,
                "flex_direction": "row",
                "flex_wrap": "wrap",
                "graph_subscription": MAINTENANCE_ACTIVITY_SUBSCRIPTION,
                "graph_subscription_inputs": MAINTENANCE_ACTIVITY_SUBSCRIPTION_INPUTS,
            },
            order=[
                "activity_banner",
                "name",
                "save",
                "category",
                "maintainer_id",
                "description",
                "context",
                "dims",
                "rename_columns",
                "all_columns",
                "reset_column_types",
                "log_events",
                "event_context",
                "events",
            ],
        ),
        id=_make_ui(hidden=True, options={"process_data": True}),
        activity_banner=_make_ui(widget="MarkdownRenderWidget", options={"data_public": True}),
        name=_make_ui(
            disabled=not is_admin,
            options=dict(**_space(70), data_public=True),
            help_text=f"Activity Slug: `{activity_slug}`",
        ),
        category=_make_ui(
            disabled=not is_admin,
            options=dict(**_space(50), allows_new_items=True, data_public=True),
            help_text="Helps group activities to make them easier to find",
        ),
        maintainer_id=_make_ui(
            options=dict(**_space(50), data_public=True),
            help_text="User will be notified with any issues related to this activity",
        ),
        description=_make_ui(
            disabled=not is_admin,
            widget="MarkdownWidget",
            options=dict(default_height=60, **_space(100)),
        ),
        context=_make_ui(widget="MarkdownRenderWidget", options={"data_public": True}),
        dims=dict(
            **_make_ui(
                disabled=not is_admin,
                options={"orderable": False, "addable": True, "removable": True},
                info_modal=get_doc(mavis.company, "activities/dims"),
            ),
            items=dict(
                **_make_ui(
                    disabled=not is_admin,
                    order=[
                        "activity_join_column",
                        "show_json_key",
                        "dim_table",
                        "join_key",
                        "make_a_slowly_changing_dimension",
                        "slowly_changing_ts_column",
                    ],
                ),
                dim_table=_make_ui(options=dict(process_data=True, **_space(40))),
                show_json_key=_make_ui(hidden=True),
                join_key=_make_ui(options=dict(load_values=True, **_space(20))),
                make_a_slowly_changing_dimension=_make_ui(
                    info_modal=get_doc(mavis.company, "activities/slowly_changing_ts_column"),
                ),
                slowly_changing_ts_column=_make_ui(
                    options=dict(load_values=True, **_space(100)),
                    info_modal=get_doc(mavis.company, "activities/slowly_changing_ts_column"),
                ),
                activity_join_column=_make_ui(options=_space(30)),
            ),
        ),
        rename_columns=_make_ui(
            widget="BooleanToggleWidget",
            options=_space(60, mb=16),
        ),
        all_columns=dict(
            **_make_ui(options={"orderable": False, "removable": False, "addable": False}),
            items={
                "name": _make_ui(disabled=True, options=_space(30)),
                "label": _make_ui(options=_space(40)),
                "type": _make_ui(hidden=not add_type, options=_space(30)),
            },
        ),
        reset_column_types=_make_ui(
            hidden=not mavis.user.is_internal_admin,
            widget="BooleanButtonWidget",
            options={
                "process_data": True,
                "button_type": "secondary",
            },
        ),
        log_events=_make_ui(
            widget="BooleanToggleWidget",
            options=_space(60, mb=16),
        ),
        event_context=_make_ui(
            widget="MarkdownRenderWidget",
            options=dict(**_space(80), data_public=True),
        ),
        events={
            "items": dict(
                **_make_ui(
                    order=["name", "happened_at", "description"],
                    options={"title": False, "orderable": False},
                ),
                name=_make_ui(options=_space(70)),
                happened_at=_make_ui(options=dict(**_space(30), data_public=True)),
                description=_make_ui(widget="MarkdownWidget", options={"default_height": 70}),
            ),
        },
        save=_make_ui(
            disabled=not is_admin,
            help_text=None if is_admin else "Only Company Admins can edit an activity",
            widget="BooleanButtonWidget",
            options=dict(
                **_space(30, align_right=True),
                process_data=True,
                button_type="primary",
            ),
        ),
    )
    return schema, schema_ui


@tracer.start_as_current_span("get_internal_cache")
def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    # add the activity name
    internal["activity_slug"] = data["slug"]
    internal["activity_id"] = data["id"]
    internal["is_imported"] = data["is_imported"]
    internal["activity_join_columns"] = data["all_activity_columns"]

    return internal


# get the values that are allowed
def get_values(mavis: Mavis, data: dict, updated_field_slug: str | None = None):
    if updated_field_slug.startswith("root_dims_"):
        idx = int(updated_field_slug.split("_")[2])

        # catch missing data
        if not data["dims"][idx]["dim_table"]:
            raise ValueError("Please select a dim table")

        all_cols = _get_all_columns(mavis, data["dims"][idx]["dim_table"])

        return {"values": all_cols}


def _clean_event(t):
    return {
        "happened_at": t.get("happened_at") or utils.utcnow(),
        "name": t["name"],
        "description": t.get("description") or "",
    }


@tracer.start_as_current_span("process_data")
def process_data(mavis: Mavis, data: dict, updated_field_slug: str | None = None):
    activity_id = data["id"]

    # handle the resets
    if updated_field_slug == "root_id":
        data = __activity_to_data(mavis, activity_id)

    # subscription for the banner
    elif updated_field_slug == "root":
        # check if there is maintenance
        activity_maintenance = graph_client.get_active_maintenance(
            ids=[activity_id],
            last_updated_at=utils.date_add(utils.utcnow(), "hour", -1),
        ).activity_maintenance

        data["activity_banner"] = _make_activity_banner(activity_maintenance, mavis.company.timezone)

    elif updated_field_slug == "root_reset_column_types":
        ActivityManager(mavis=mavis).update_activity_columns(activity_id)

        # notify the user
        data["_notification"] = utils.Notification(
            message="Updated Types",
            type=utils.NotificationTypeEnum.SUCCESS,
            duration=2,
        )

    elif updated_field_slug.startswith("root_dims_"):
        idx = int(updated_field_slug.split("_")[2])

        # show the JSON key
        data["dims"][idx]["show_json_key"] = not is_valid_uuid(data["dims"][idx]["dim_table"])

    elif updated_field_slug == "root_save":
        if not mavis.user.is_admin:
            raise ForbiddenError("Only company admins can update the activity")

        # get the activity
        updates = []
        activity = graph_client.get_activity(id=activity_id).activity_by_pk

        if not activity:
            raise ValueError("The activity no longer exists")

        # Update metadata
        temp_obj = {k: v or None for k, v in data.items() if k in ("name", "description", "maintainer_id")}
        if utils.is_different(temp_obj, activity):
            updates.append("Updated metadata")
            graph_client.update_activity(id=activity_id, updated_by=mavis.user.email, **temp_obj)
            ActivityManager(mavis=mavis).update_search_data(activity_id, temp_obj, vectorize=True)

        # Update Categories
        if data["category"] != (activity.company_category.id if activity.company_category else None):
            # update the category
            if not is_valid_uuid(data["category"]):
                category_id = graph_client.insert_category(
                    category=utils.slugify(data["category"]) or None,
                    color=utils.new_color(),
                    company_id=mavis.company.id,
                ).inserted_category.id
            else:
                category_id = data["category"] or None

            # update the category
            graph_client.update_activity_category(
                id=activity_id,
                category_id=category_id,
            )
            updates.append("Updated the category")

        (added, removed, updated) = utils.diff_objects(activity.dict()["activity_dims"], data["dims"])

        # maybe add a updating
        for d in added + updated:
            graph_client.insert_activity_dim(
                activity_id=activity.id,
                dim_table_id=_get_dim_id(mavis, d["dim_table"], d["join_key"], require_join_key=True),
                activity_join_column=d["activity_join_column"],
                slowly_changing_ts_column=(
                    d["slowly_changing_ts_column"] if d["make_a_slowly_changing_dimension"] else None
                ),
            )

        # remove the dim
        for r in removed:
            graph_client.delete_activity_dim(id=r["id"])

        # Deal with Timeline
        (added, removed, updated) = utils.diff_objects(activity.dict()["timeline"], data["events"])

        for t in added:
            t["id"] = graph_client.insert_company_timeline(
                related_to="activity", related_id=activity_id, **_clean_event(t)
            ).insert_company_timeline.id
        for t in updated:
            graph_client.update_company_timeline(id=t["id"], **_clean_event(t))

        for r in removed:
            graph_client.delete_timeline(id=r["id"])

        if added or updated or removed:
            updates.append("Updated Events")

        # Update all the columns
        cur_columns = {c["id"]: c for c in utils.get_activity_columns(activity)}
        for c in data["all_columns"]:
            if utils.diff_dicts(c, cur_columns[c["id"]]):
                # Update the column
                graph_client.create_new_column(
                    related_to="activity",
                    related_to_id=activity.id,
                    name=c["name"],
                    label=c["label"],
                    type=c["type"],
                    has_data=c["has_data"],
                )

        # update the activity index
        data["_notification"] = utils.Notification(
            message="Saved Changes",
            description=", ".join(updates),
            type=utils.NotificationTypeEnum.SUCCESS,
            duration=2,
        )
    # add the context
    data["event_context"] = EVENT_CONTEXT
    return data


def run_data(mavis: Mavis, data: dict):
    return []


def _make_activity_banner(activity_maintenance, tz):
    # look for the recent maintenance
    if len(activity_maintenance) == 0:
        return ""

    # grab the object
    last_change = activity_maintenance[0]

    if last_change.ended_at is None:
        return "> {icon} {description} which started {diff_time} \n>\n>{notes}".format(
            # kind=last_change].kind.value.upper(),
            icon="⏳" if is_resync(last_change.kind) else "⚠️",
            description=last_change.maintenance_kind.description,
            diff_time=utils.pretty_diff(last_change.started_at, utils.utcnow(), kind="past"),
            notes=last_change.notes.replace("\n", "\n>\n> "),
        )
    else:
        return "> ✅ Activity is up to date."


def __activity_to_data(mavis: Mavis, activity_id):
    activity = graph_client.get_activity(id=activity_id).activity_by_pk

    # handle the None case
    if not activity:
        raise SilenceError("Activity no longer exists. If this is unexpected then please contact support@narrator.ai")

    company_table = mavis.company.table(activity.table_id)
    # add the data
    data = {
        "id": activity.id,
        "name": activity.name,
        "slug": activity.slug,
        "table": company_table.activity_stream,
        "is_imported": company_table.is_imported,
        "category": activity.company_category.id if activity.company_category else None,
        "maintainer_id": activity.maintainer_id,
        "description": activity.description,
        "all_columns": [c for c in utils.get_activity_columns(activity) if c["name"].startswith("feature_")],
        # only include activity columns
        "all_activity_columns": [c for c in utils.get_activity_columns(activity) if c.get("enrichment_table") is None],
        "event_context": EVENT_CONTEXT,
        "events": [t.dict() for t in activity.timeline],
        "dims": [
            {
                "id": d.id,
                "dim_table": d.dim_table.id,
                "activity_join_column": d.activity_join_column,
                "show_json_key": False,
                "slowly_changing_ts_column": d.slowly_changing_ts_column,
                "make_a_slowly_changing_dimension": d.slowly_changing_ts_column is not None,
            }
            for d in activity.activity_dims
        ],
    }

    last_updated_at = activity.created_at
    last_updated_by = activity.updated_by
    # update last updated at with the maximum created at for the production queries in transformations
    for t in activity.transformations:
        for q in t.transformation.production_queries:
            if q.updated_at > last_updated_at:
                last_updated_at = q.updated_at
                last_updated_by = q.updated_by

    context = [
        "<br>",
        f'**Total Row:** {mavis.human_format(activity.row_count, "number")}',
        f"**Data Last Updated by:** {last_updated_by} {utils.pretty_diff(last_updated_at)}",
        "<br>",
        ("This is an imported activity" if company_table.is_imported else "\n**Powered By:** "),
    ]

    # get all the transformations
    context.extend(
        utils.create_toggle(
            f"{t.transformation.name} (<a href='{InternalLink(mavis.company.slug).transformation(t.transformation.id)}'>link</a>)",
            f"\n\n```sql\n{t.transformation.production_queries[0].sql}\n```\n\n",
        )
        for t in activity.transformations
        if t.transformation.production_queries
    )
    context.append("<br>")
    data["context"] = "\n\n".join(context)

    return data
