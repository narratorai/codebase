from collections import defaultdict
from copy import deepcopy

from batch_jobs.data_management.run_transformations import is_resync
from core import utils
from core.api.customer_facing.tables.utils import TableManager
from core.errors import ForbiddenError, SilenceError
from core.graph import graph_client
from core.models.internal_link import InternalLink
from core.util.opentelemetry import tracer
from core.v4.blocks.shared_ui_elements import (
    _add_dependency,
    _checkbox,
    _drop_down,
    _hide_properties,
    _input,
    _make_array,
    _make_ui,
    _object,
    _space,
)
from core.v4.mavis import Mavis

TITLE = "Dimension Details"
DESCRIPTION = "Record details about an Dimension and control how it appears in the Portal"
VERSION = 1

CATEGORIES = []


@tracer.start_as_current_span("get_schema")
def get_schema(mavis: Mavis, internal_cache: dict):
    dim_table_id = internal_cache["dim_table_id"]
    all_trans = graph_client.transformation_index_w_dependency(company_id=mavis.company.id).all_transformations

    all_activities = [
        dict(id=a.id, name=a.name, slug=a.slug)
        for a in graph_client.activity_index(company_id=mavis.company.id).all_activities
    ]

    # create the tree for activities
    tree = []
    all_activities_dropdown = []
    added_activities = []
    for t in all_trans:
        # only include ones with activities
        if len(t.activities) > 0:
            tree.append(
                dict(
                    value=_activity_key(t, t.activities),
                    title=f"{t.name} (All {mavis.human_format(len(t.activities))} activities)",
                    selectable=True,
                    children=[
                        dict(
                            value=_activity_key(t, a),
                            title=a.activity.name,
                        )
                        for a in t.activities
                    ],
                )
            )
            all_activities_dropdown.extend(tree[-1]["children"])
            added_activities.extend(a.activity.id for a in t.activities)

    remaining_activities = []
    for a in all_activities:
        if a["id"] not in added_activities:
            remaining_activities.append(a)

    if remaining_activities:
        tree.append(
            dict(
                value="Other",
                title="Activities",
                selectable=False,
                children=[
                    dict(
                        value="other." + a["id"],
                        title=a["name"],
                    )
                    for a in remaining_activities
                ],
            )
        )
        all_activities_dropdown.extend(tree[-1]["children"])

    dim = graph_client.get_dim(id=dim_table_id).dim_table_by_pk

    MAINTENANCE_ACTIVITY_SUBSCRIPTION = """
    subscription GetActiveMaintenance($dim_table_id: uuid!, $last_updated_at: timestamptz!) {
        activity_maintenance(where: {dim_table_id: {_eq: $dim_table_id}, _or: [{ended_at: {_is_null: true}}, {ended_at: {_gte: $last_updated_at}}]}) {
            id
        }
    }
    """
    MAINTENANCE_ACTIVITY_SUBSCRIPTION_INPUTS = dict(
        dim_table_id=dim_table_id,
        last_updated_at=utils.date_add(utils.utcnow(), "minute", -30),
    )

    # define the full schema
    schema = _object(
        dict(
            dim_banner=_input(),
            context=_input(),
            used_for=_drop_down(
                # TODO: Add company dimension
                [
                    "activity_dimensions",
                    "aggregation_dimensions",
                    "customer_dimension",
                    "slowly_changing_customer_dimension",
                ],
                title="Used For",
            ),
            reset_columns=_checkbox("Reprocess Columns"),
            all_columns=_make_array(
                dict(
                    name=_input("SQL Column"),
                    label=_input("Product Label"),
                ),
                title="Rename Columns",
            ),
            save=_checkbox("Save"),
        )
    )

    # hide properties
    _add_dependency(
        schema,
        "used_for",
        "aggregation_dimensions",
        dict(
            aggregation_dimensions=_drop_down(
                [c.activity_stream for c in mavis.company.tables],
                is_multi=True,
                title="Aggregation For",
            ),
        ),
    )

    # hide properties
    _add_dependency(
        schema,
        "used_for",
        "activity_dimensions",
        dict(
            activity_dimensions=_make_array(
                dict(
                    activity_id=_drop_down(
                        all_activities_dropdown,
                        "value",
                        "title",
                        is_multi=True,
                        title="Activity",
                    ),
                    activity_join_column=_drop_down(
                        [],
                        "name",
                        "label",
                        title="Activity Join Column",
                    ),
                    slowly_changing_ts_column=_drop_down(
                        dim.dict()["columns"],
                        "name",
                        "label",
                        title="Slowly Changing Timestamp",
                    ),
                ),
                title="Activity Dimension For",
            ),
        ),
    )

    # hide properties
    _add_dependency(
        schema,
        "used_for",
        "customer_dimension",
        dict(
            customer_dimension=_drop_down(
                [c.activity_stream for c in mavis.company.tables],
                is_multi=True,
                title="Customer Dimension For",
            ),
        ),
    )

    # hide properties
    _add_dependency(
        schema,
        "used_for",
        "slowly_changing_customer_dimension",
        dict(
            scd_customer_dims=_make_array(
                dict(
                    table_id=_drop_down(
                        [t.dict() for t in mavis.company.tables],
                        "id",
                        "activity_stream",
                        title="Activity Stream",
                    ),
                    slowly_changing_ts_column=_drop_down(
                        dim.dict()["columns"],
                        "name",
                        "label",
                        title="Slowly Changing Timestamp",
                    ),
                ),
                title="Slowly Changing Customer Dimensions For",
            ),
        ),
    )
    _hide_properties(schema, ["all_columns", "reset_columns"], "rename_columns")

    # define if user is company admin
    is_admin = mavis.user.is_admin

    schema_ui = dict(
        **_make_ui(
            options=dict(
                hide_submit=True,
                hide_output=True,
                title=False,
                flex_direction="row",
                flex_wrap="wrap",
                graph_subscription=MAINTENANCE_ACTIVITY_SUBSCRIPTION,
                graph_subscription_inputs=MAINTENANCE_ACTIVITY_SUBSCRIPTION_INPUTS,
            ),
            order=[
                "dim_banner",
                "context",
                "save",
                "used_for",
                "activity_dimensions",
                "aggregation_dimensions",
                "customer_dimension",
                "scd_customer_dims",
                "rename_columns",
                "all_columns",
                "reset_columns",
            ],
        ),
        id=_make_ui(hidden=True, options=dict(process_data=True)),
        dim_banner=_make_ui(widget="MarkdownRenderWidget", options=dict(data_public=True)),
        context=_make_ui(widget="MarkdownRenderWidget", options=dict(**_space(70), data_public=True)),
        activity_dimensions=dict(
            **_make_ui(
                disabled=not is_admin,
                order=[
                    "activity_id",
                    "activity_join_column",
                    "slowly_changing_ts_column",
                ],
                options=dict(orderable=False, addable=True, removable=True, **_space(100)),
            ),
            items=dict(
                activity_id=_make_ui(
                    widget="TreeSelectWidget",
                    options=dict(**_space(100), tree=tree),
                ),
                activity_join_column=_make_ui(options=dict(load_values=True, **_space(50))),
                slowly_changing_ts_column=_make_ui(options=dict(load_values=True, **_space(50))),
            ),
        ),
        scd_customer_dims=dict(
            **_make_ui(
                disabled=not is_admin,
                order=["table_id", "slowly_changing_ts_column"],
                options=dict(orderable=False, addable=True, removable=True, **_space(80)),
            ),
            items=dict(
                table_id=_make_ui(options=_space(50)),
                slowly_changing_ts_column=_make_ui(options=dict(**_space(50))),
            ),
        ),
        reset_columns=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(**_space(60, mb=16), process_data=True),
        ),
        rename_columns=_make_ui(
            widget="BooleanToggleWidget",
            options=_space(60, mb=16),
        ),
        all_columns=dict(
            **_make_ui(options=dict(orderable=False, removable=False, addable=False, **_space(70))),
            items=dict(
                name=_make_ui(disabled=True, options=_space(50)),
                label=_make_ui(options=_space(50)),
            ),
        ),
        save=_make_ui(
            disabled=not is_admin,
            help_text=None if is_admin else "Only Company Admins can edit an Dimension",
            widget="BooleanButtonWidget",
            options=dict(
                **_space(30, align_right=True),
                process_data=True,
                button_type="primary",
            ),
        ),
    )
    return (schema, schema_ui)


@tracer.start_as_current_span("get_internal_cache")
def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    # add the activity name
    internal["dim_table_id"] = data["id"]

    return internal


# get the values that are allowed
def get_values(mavis, data, updated_field_slug: str):
    if updated_field_slug.endswith("slowly_changing_ts_column"):
        columns = graph_client.get_dim(id=data["id"]).dim_table_by_pk.columns
        return dict(values=[dict(value=c.name, label=c.label) for c in columns])
    elif updated_field_slug.startswith("root_activity_dimensions_"):
        idx = int(updated_field_slug.split("_")[3])

        activities = data["activity_dimensions"][idx]["activity_id"]
        # add the actiities
        if activities:
            activity_id = activities[0].split(".")[-1]
            columns = graph_client.get_activity_w_columns(id=activity_id).activity.column_renames
            return dict(values=[dict(value=c.name, label=c.label) for c in columns])

    return dict(values=[])


@tracer.start_as_current_span("process_data")
def process_data(mavis: Mavis, data: dict, updated_field_slug: str | None = None):
    dim_id = data["id"]

    # handle the resets
    if updated_field_slug == "root_id":
        return __dim_to_data(mavis, dim_id, squash_activities=True)[0]

    # subscription for the banner
    elif updated_field_slug == "root":
        # check if there is maintenance
        activity_maintenance = graph_client.get_dim_maintenance(
            dim_table_id=dim_id,
            last_updated_at=utils.date_add(utils.utcnow(), "hour", -1),
        ).activity_maintenance

        data["dim_banner"] = _make_dim_banner(activity_maintenance, mavis.company.timezone)

    elif updated_field_slug == "root_save":
        if not mavis.user.is_admin:
            raise ForbiddenError("Only company admins can update the activity")

        # TODO: handle splitting activities based on transformations
        dim = graph_client.get_dim_with_dependencies(id=dim_id).dim_table_by_pk

        old_data = deepcopy(data)
        (current_data, dim) = __dim_to_data(mavis, dim_id)
        _open_activies(data, dim)

        # Handle the activity dimensions
        (added, removed, updated) = utils.diff_objects(
            current_data.get("activity_dimensions", []),
            data["activity_dimensions"],
        )
        for a in added + updated:
            if a["activity_join_column"] is None:
                raise SilenceError(
                    "An activity Join Column needs to be defined so the system know how to use this dimension    "
                )
            graph_client.insert_activity_dim(
                activity_id=a["activity_id"],
                dim_table_id=dim_id,
                activity_join_column=a["activity_join_column"],
                slowly_changing_ts_column=a["slowly_changing_ts_column"] or None,
            )

        # handle the removed
        for a in removed:
            graph_client.delete_activity_dim(
                id=a["id"],
            )

        # Handle the slowly changing customer dims
        (added, removed, updated) = utils.diff_objects(
            current_data.get("scd_customer_dims") or [], data["scd_customer_dims"]
        )
        for a in added + updated:
            graph_client.insert_slowly_changing_dim(
                table_id=a["table_id"],
                dim_table_id=dim_id,
                slowly_changing_ts_column=a["slowly_changing_ts_column"],
            )

        # Process the deletes
        for a in removed:
            graph_client.delete_slowly_changing_dim(id=a["id"])

        # Handle all the tables
        (add_c, remove_c, _) = utils.diff_list(
            [c.activity_stream for c in dim.customer_table], data["customer_dimension"]
        )
        (add_a, remove_a, _) = utils.diff_list(
            [c.company_table.activity_stream for c in dim.company_table_aggregations],
            data["aggregation_dimensions"],
        )

        updateds = []
        table_manager = TableManager(mavis=mavis)
        for t in mavis.company.tables:
            # Update the company object
            obj = {
                k: v
                for k, v in t.dict().items()
                if k
                in [
                    "id",
                    "identifier",
                    "index_table",
                    "default_time_between",
                    "is_imported",
                    "customer_dim_table_id",
                    "maintainer_id",
                ]
            }

            # handle updating the customer attribute
            if t.activity_stream in add_c:
                obj["customer_dim_table_id"] = dim.id
                table_manager.update(**obj)
                updateds.append(t.id)

            elif t.activity_stream in remove_c:
                obj["customer_dim_table_id"] = None
                table_manager.update(**obj)
                updateds.append(t.id)

            # handle updating aggregation table
            if t.activity_stream in add_a:
                table_manager.add_aggregation_dim(id=t.id, dim_table_id=dim.id)
                updateds.append(t.id)

            elif t.activity_stream in remove_a:
                table_manager.delete_aggregation_dim(id=t.id, dim_id=dim.id)
                updateds.append(t.id)

        # Update all the columns
        cur_columns = {c.id: c for c in dim.columns}
        for c in data["all_columns"]:
            if utils.is_different(c, cur_columns[c["id"]]):
                graph_client.update_column(id=c["id"], label=c["label"] or "", has_data=c["has_data"] or True)

        old_data["_notification"] = utils.Notification(
            message="Saved Changes",
            description="",
            type=utils.NotificationTypeEnum.SUCCESS,
            duration=2,
        )
        data = old_data

    elif updated_field_slug == "root_reset_columns":
        mavis.create_dim_table(
            mavis.qm.Table(schema=data["dim_schema"], table=data["dim_table"]),
            join_key=data["join_key"],
            columns=data["all_columns"],
        )

        (data, _) = __dim_to_data(mavis, dim_id)

    return data


def run_data(mavis: Mavis, data: dict):
    return []


def _make_dim_banner(dim_maintenance, tz):
    # look for the recent maintenance
    if len(dim_maintenance) == 0:
        return ""

    # grab the object
    last_change = dim_maintenance[0]

    if last_change.ended_at is None:
        return "> {icon} {description} which started {diff_time} \n>\n>{notes}".format(
            # kind=last_change].kind.value.upper(),
            icon="⏳" if is_resync(last_change.kind) else "⚠️",
            description=last_change.maintenance_kind.description,
            diff_time=utils.pretty_diff(last_change.started_at, utils.utcnow(), kind="past"),
            notes=last_change.notes.replace("\n", "\n>\n> "),
        )
    else:
        return "> ✅ Dimension is up to date ({kind} ended {diff_time})".format(
            kind=last_change.kind.value.upper(),
            diff_time=utils.pretty_diff(last_change.started_at, utils.utcnow(), kind="past"),
        )


def __dim_to_data(mavis, dim_id, squash_activities=False):
    dim = graph_client.get_dim_with_dependencies(id=dim_id).dim_table_by_pk
    if not dim:
        raise SilenceError("Dimension no longer exists. If this is unexpected then please contact support@narrator.ai")

    if dim.schema_ == mavis.company.warehouse_schema:
        all_enrichment = graph_client.get_enrichment_tables(company_id=mavis.company.id).all_transformations

        # get all the transformations
        transformations = [t for t in all_enrichment if t.table == dim.table]
    else:
        transformations = []

    context = [
        "<br>",
        f"**Schema:** {dim.schema_}",
        f"**Table:** {dim.table}",
        f"**Primary Key/ Join Key:** {dim.join_key}" "<br>",
        ("This is an imported dimension" if not transformations else "\n**Powered By:** "),
    ]

    # get all the transformations
    for t in transformations:
        if len(t.production_queries) > 0:
            context.append(
                utils.create_toggle(
                    f"{t.name} (<a href='{InternalLink(mavis.company.slug).transformation(t.id)}'>link</a>)",
                    f"\n\n```sql\n{t.production_queries[0].sql}\n```\n\n",
                )
            )
    context.append("<br>")

    # add the data
    data = dict(
        id=dim.id,
        dim_schema=dim.schema_,
        dim_table=dim.table,
        join_key=dim.join_key,
        context="\n\n".join(context),
        all_columns=[c.dict() for c in dim.columns],
    )

    # add the proper mappings
    if dim.customer_table:
        data["used_for"] = "customer_dimension"
        data["customer_dimension"] = [c.activity_stream for c in dim.customer_table]

    if dim.company_table_aggregations:
        data["used_for"] = "aggregation_dimensions"
        data["aggregation_dimensions"] = [c.company_table.activity_stream for c in dim.company_table_aggregations]

    if dim.slowly_changing_customer_dims:
        data["used_for"] = "slowly_changing_customer_dimension"
        data["scd_customer_dims"] = [c.dict() for c in dim.slowly_changing_customer_dims]

    if dim.activities:
        data["used_for"] = "activity_dimensions"
        data["activity_dimensions"] = []
        if squash_activities:
            all_activities = {a.activity_id: a for a in dim.activities}

            # Handle if all the activities are connected
            all_trans = graph_client.transformation_index_w_dependency(company_id=mavis.company.id).all_transformations

            # if all the activities are selected and they are part of 1 transformation then auto replace it with the transformation.
            for t in all_trans:
                # only look at the things that matter
                if not t.activities:
                    continue

                activities_used = [a for a in t.activities if a.activity.id in all_activities]

                # check if the transformation is used for everything
                if len(activities_used) == len(t.activities):
                    for a in t.activities:
                        val = all_activities.pop(a.activity.id)

                    # add the activities
                    all_activities[_activity_key(t, t.activities)] = val

                elif len(activities_used) > 0:
                    for a in activities_used:
                        val = all_activities.pop(a.activity.id)

                    # add the activities
                    all_activities[_activity_key(t, a)] = val

            # squash the activities that are not part of transformations
            temp = defaultdict(list)
            for k, a in all_activities.items():
                temp[(a.activity_join_column, a.slowly_changing_ts_column)].append(k if "." in k else f"other.{k}")

            data["activity_dimensions"].extend(
                [
                    dict(
                        activity_id=v,
                        activity_join_column=k[0],
                        slowly_changing_ts_column=k[1],
                    )
                    for k, v in temp.items()
                ]
            )

        else:
            data["activity_dimensions"] = [a.dict() for a in dim.activities]

    return (data, dim)


def _activity_key(t, a):
    if isinstance(a, list):
        return f"TRANS{t.id}.{'.'.join(ta.activity.id for ta in a)}"
    else:
        return f"{t.id}.{a.activity.id}"


def _open_activies(data, dim):
    id_mappig = {(a.activity_id, a.activity_join_column): a.id for a in dim.activities}
    activity_dims = []

    for a in data["activity_dimensions"]:
        for ac in a["activity_id"]:
            for ls in ac.split(".")[1:]:
                if ls:
                    activity_dims.append(
                        dict(
                            id=id_mappig.get((ls, a["activity_join_column"])),
                            activity_id=ls,
                            activity_join_column=a["activity_join_column"],
                            slowly_changing_ts_column=a["slowly_changing_ts_column"],
                        )
                    )

    data["activity_dimensions"] = activity_dims
