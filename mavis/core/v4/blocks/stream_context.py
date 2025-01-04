from batch_jobs.custom_task import CustomTask, TaskKindEnum
from core import utils
from core.api.customer_facing.tables.utils import TableManager
from core.constants import NORMAL_TRANSFORMATION_PROCESS
from core.graph import graph_client
from core.models.company import query_graph_company
from core.models.ids import is_valid_uuid
from core.v4.blocks.shared_ui_elements import (
    _checkbox,
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
from core.v4.query_mapping.config import RESOLUTIONS

TITLE = "Update Activity Stream"
DESCRIPTION = ""
VERSION = 1


def get_schema(mavis: Mavis, internal_cache: dict):
    is_imported = internal_cache["is_imported"]
    is_admin = mavis.user.is_admin

    # define the full schema
    schema = _object(
        dict(
            save=_checkbox("Save"),
            maintainer_id=_user_drop_down(mavis, "Maintained By"),
            customer_dim_table_id=_drop_down(
                _get_all_tables(mavis, show_key=True),
                "id",
                "label",
                title="Customer Dimension Table",
            ),
            customer_join_key=_drop_down([], title="Join Customer Using"),
            aggregate_dims=_drop_down(
                _get_all_tables(mavis),
                "id",
                "label",
                is_multi=True,
                title="Aggregate Dimension Tables",
            ),
            scd_customer_dims=_make_array(
                dict(
                    dim_table=_drop_down(
                        _get_all_tables(mavis, show_key=True),
                        "id",
                        "label",
                        title="Table",
                    ),
                    join_key=_drop_down([], title="Customer Column"),
                    slowly_changing_ts_column=_drop_down(
                        [],
                        default=None,
                        title="Timestamp Column",
                    ),
                ),
                title="Slowly Changing Customer Dimensions",
            ),
            identifier=_input(title="Display Name"),
            default_time_between=_drop_down(
                RESOLUTIONS,
                default="day",
                title="Default Time Between",
            ),
            # index_table=_checkbox(title="Auto-complete"),
            manually_partition_activity=_checkbox(title="Manually Partition Activities"),
            help_text=_input(),
            delete_stream=_checkbox("Delete"),
        )
    )

    # add a flag
    _hide_properties(schema, ["customer_join_key"], "show_join_key")
    # hide properties
    _hide_properties(
        schema["properties"]["scd_customer_dims"]["items"],
        [
            "join_key",
        ],
        "show_join_key",
        default=True,
    )

    _hide_properties(
        schema,
        [
            "scd_customer_dims",
        ],
        "enable_slowly_changing_customer_dims",
    )

    schema_ui = dict(
        **_make_ui(
            order=[
                "help_text",
                "save",
                "identifier",
                "maintainer_id",
                "customer_dim_table_id",
                "show_join_key",
                "customer_join_key",
                # resume
                "enable_slowly_changing_customer_dims",
                "scd_customer_dims",
                "aggregate_dims",
                "default_time_between",
                "index_table",
                "manually_partition_activity",
                "delete_stream",
            ],
            options=dict(
                hide_submit=True,
                hide_output=True,
                title=False,
                flex_direction="row",
                flex_wrap="wrap",
                process_data_on_load=True,
            ),
        ),
        maintainer_id=_make_ui(
            disabled=not is_admin,
            info_modal=get_doc(mavis.company, "company/maintainer_id"),
            options=_space(50, mb=48),
        ),
        show_join_key=_make_ui(hidden=True),
        customer_dim_table_id=_make_ui(
            disabled=not is_admin,
            options=dict(process_data=True, **_space(60, mb=48)),
        ),
        manually_partition_activity=_make_ui(
            info_modal=get_doc(mavis.company, "stream_context/manually_partitioned_activity"),
        ),
        index_table=_make_ui(
            info_modal=get_doc(mavis.company, "stream_context/index_table"),
        ),
        customer_join_key=_make_ui(
            options=dict(load_values=True, **_space(40, mb=48)),
        ),
        enable_slowly_changing_customer_dims=_make_ui(
            info_modal=get_doc(mavis.company, "activities/slowly_changing_ts_column")
        ),
        scd_customer_dims=dict(
            **_make_ui(
                options=dict(**_space(100, mb=48), orderable=False, addable=True, removable=True),
            ),
            items=dict(
                **_make_ui(
                    disabled=not is_admin,
                    order=[
                        "show_join_key",
                        "dim_table",
                        "join_key",
                        "slowly_changing_ts_column",
                    ],
                ),
                dim_table=_make_ui(options=dict(process_data=True, **_space(40))),
                show_join_key=_make_ui(hidden=True),
                join_key=_make_ui(options=dict(load_values=True, **_space(30))),
                slowly_changing_ts_column=_make_ui(
                    options=dict(load_values=True, **_space(30)),
                ),
            ),
        ),
        aggregate_dims=_make_ui(
            disabled=not is_admin,
            options=dict(**_space(100, mb=48)),
        ),
        identifier=_make_ui(disabled=not is_admin, options=_space(50, mb=48)),
        default_time_between=_make_ui(
            disabled=not is_admin,
            info_modal=get_doc(mavis.company, "company/default_time_between"),
            options=_space(50, mb=48),
        ),
        help_text=_make_ui(widget="MarkdownRenderWidget", options=_space(70)),
        save=_make_ui(
            disabled=not is_admin,
            widget="BooleanButtonWidget",
            options=dict(**_space(30, align_right=True), process_data=True, button_type="primary"),
        ),
        delete_stream=_make_ui(
            disabled=not is_admin,
            hidden=not is_imported,
            widget="BooleanButtonWidget",
            options=dict(
                process_data=True,
                button_type="secondary",
                danger=True,
                tiny=True,
                popconfirm=True,
                popconfirm_text="Are you sure you want to delete your imported stream?",
            ),
        ),
    )

    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    internal["is_imported"] = data["is_imported"]
    return internal


def get_values(mavis: Mavis, data, updated_field_slug: str):
    """
    Get the values that are allowed
    """
    if updated_field_slug == "root_customer_join_key":
        all_cols = _get_all_columns(mavis, data["customer_dim_table_id"])
        return dict(values=all_cols)

    if updated_field_slug.startswith("root_scd_customer_dims_"):
        idx = int(updated_field_slug.split("_")[4])
        all_cols = _get_all_columns(mavis, data["scd_customer_dims"][idx]["dim_table"] or None)
        return dict(values=all_cols)

    return None


def process_data(mavis: Mavis, data, updated_field_slug=None):
    ct = mavis.company.table(data["id"] or mavis.company.tables[0].id)

    if updated_field_slug in (None, "stream_context", "root_id"):
        # create the data object
        data = dict(
            **__make_table(ct.dict()),
            aggregate_dims=[
                dt.dim_table_id
                for dt in graph_client.get_company_table_aggregation(table_id=ct.id).company_table_aggregation_dim
            ],
            scd_customer_dims=[
                dict(
                    dim_table=cd.dim_table_id,
                    slowly_changing_ts_column=cd.slowly_changing_ts_column,
                    show_join_key=False,
                )
                for cd in graph_client.get_slowly_changing_customer_dim(table_id=ct.id).slowly_changing_customer_dims
            ],
        )
        data["enable_slowly_changing_customer_dims"] = len(data["scd_customer_dims"]) > 0
    elif updated_field_slug == "root_delete_stream":
        # HACK (should update to graph to cascade)
        all_activities = graph_client.activity_index(company_id=mavis.company.id).all_activities
        for a in all_activities:
            if a.table_id == data["id"]:
                graph_client.delete_activity(id=a.id)

        graph_client.delete_company_table(id=data["id"])
        data["_redirect_url"] = "/activities"

    elif updated_field_slug.startswith("root_customer_dim_table_id"):
        # show the JSON key
        data["show_join_key"] = not is_valid_uuid(data["customer_dim_table_id"])

    elif updated_field_slug.startswith("root_scd_customer_dims_"):
        idx = int(updated_field_slug.split("_")[4])
        # show the JSON key
        data["scd_customer_dims"][idx]["show_join_key"] = not is_valid_uuid(data["scd_customer_dims"][idx]["dim_table"])

    elif updated_field_slug == "root_save":
        # update company tables
        data["_notification"] = __update_company_table(mavis, data, ct)
    return data


def run_data(mavis: Mavis, data: dict):
    return []


def __update_company_table(mavis, data, activity_stream):
    notification = None
    trigger_run = False
    manually_partition_activity = data["manually_partition_activity"]
    customer_dim_table_id = data["customer_dim_table_id"]
    customer_join_key = data["customer_join_key"]

    table_manager = TableManager(mavis.user)

    dim_id = _get_dim_id(mavis, customer_dim_table_id, customer_join_key, True)

    # define the table object
    obj = dict(
        identifier=data["identifier"] or None,
        customer_dim_table_id=dim_id,
        default_time_between=data["default_time_between"] or "day",
        maintainer_id=data["maintainer_id"],
    )

    if utils.is_different(obj, activity_stream):
        table_manager.update(
            activity_stream.id,
            is_imported=activity_stream.is_imported,
            **obj,
        )

    # update all the aggs if needed
    all_aggs = [
        dt.dim_table_id
        for dt in graph_client.get_company_table_aggregation(table_id=activity_stream.id).company_table_aggregation_dim
    ]

    if ",".join(data["aggregate_dims"] or []) != ",".join(all_aggs):
        # Delete the aggregation
        for dim_id in all_aggs:
            table_manager.delete_aggregation_dim(activity_stream.id, dim_id)

        # Insert Aggregations
        for ta_dim in data["aggregate_dims"]:
            table_manager.add_aggregation_dim(activity_stream.id, _get_dim_id(mavis, ta_dim, None))

    all_dims = graph_client.get_slowly_changing_customer_dim(table_id=activity_stream.id).slowly_changing_customer_dims
    scd_customer = [c.dict() for c in all_dims]
    (added, removed, updated) = utils.diff_objects(scd_customer, data["scd_customer_dims"])

    for cd in added + updated:
        dim_id = _get_dim_id(mavis, cd["dim_table"], cd["join_key"], True)
        table_manager.insert_slowly_changing_dim(activity_stream.id, dim_id, cd["slowly_changing_ts_column"])

    # handle the removed
    for cd in removed:
        table_manager.delete_slowly_changing_dim(activity_stream.id, cd["id"])

    if (manually_partition_activity != activity_stream.manually_partition_activity) and not activity_stream.is_imported:
        if activity_stream.is_imported:
            # update the graph
            table_manager.update_partition(activity_stream.id, manually_partition_activity)
            notification = utils.Notification(
                message="Manually Partitioned is Updated",
                type=utils.NotificationTypeEnum.SUCCESS,
                duration=5,
            )
        else:
            # schedule the splitting
            todo_tasks = CustomTask(mavis.company.s3, kind=TaskKindEnum.run_transformation)
            current_task = next(
                (
                    t
                    for t in todo_tasks.tasks
                    if t.task == "manually_partition" and t.details.get("table") == activity_stream.activity_stream
                ),
                None,
            )
            if current_task is None:
                trigger_run = True
                todo_tasks.add_task(
                    "manually_partition",
                    table=activity_stream.activity_stream,
                    manual_partition=manually_partition_activity,
                )

            todo_tasks.update()

            notification = utils.Notification(
                message="Manually Partitioned is scheduled",
                description="This will not update here until it is processed in the next Run Transformation",
                type=utils.NotificationTypeEnum.SUCCESS,
                duration=5,
            )

    if trigger_run:
        from batch_jobs.data_management.run_transformations import run_transformations

        run_transformations.send(
            company_slug=mavis.company.slug,
            task_id=mavis.company.get_task_id(NORMAL_TRANSFORMATION_PROCESS),
        )

    # bust the cache
    query_graph_company(mavis.company.slug, refresh_cache=True)
    return notification


def __make_table(t):
    context = [
        f'# Table: {t["activity_stream"]}',
        f"**Rows**: {utils.human_format(t['row_count'], 'number')}",
    ]

    # handle imported stream
    if t.get("is_imported"):
        context.append("*This is an imported stream and not build by Narrator*")

    t["help_text"] = "\n\n".join(context)
    return t
