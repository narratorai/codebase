from collections import namedtuple
from copy import deepcopy

from core import utils
from core.api.customer_facing.activities.utils import ActivityManager
from core.constants import MAX_INT
from core.decorators import mutex_task, with_mavis
from core.errors import QueryRunError
from core.graph import graph_client
from core.logger import get_logger
from core.util.opentelemetry import set_current_span_attributes, tracer
from core.v4.dataset_comp.query.util import Dataset
from core.v4.mavis import Mavis

logger = get_logger()

INDEX_COUNT = 20


def _percentiles(mavis, query, total_rows, qm_column):
    format_number = "number"
    if qm_column.table_column:
        format_number = utils.guess_format(qm_column.table_column, "number")

    for p in [0.25, 0.5, 0.75]:
        query.add_column(
            mavis.qm.Column(
                function="percentile_cont_all",
                fields=dict(column=qm_column, percentile=p),
                name_alias=f"percentile_{str(p)[2:]}",
            )
        )

    # remove non values
    query.add_filter(mavis.qm.Condition(operator="not_is_null", left=qm_column))

    # only get 1 row
    query.set_limit(1)

    result = mavis.run_query(query.to_query(), within_minutes=None)
    rows = result.rows

    # check for no values
    if len(rows) == 0:
        return []
    else:
        row = rows[0]

    values = [
        dict(
            key="25th Percentile",
            value=mavis.human_format(
                row["percentile_25"],
                format_number,
            ),
        ),
        dict(
            key="Median",
            value=mavis.human_format(
                row["percentile_5"],
                format_number,
            ),
        ),
        dict(
            key="75th Percentile",
            value=mavis.human_format(
                row["percentile_75"],
                format_number,
            ),
        ),
    ]
    return values


def _count_null(mavis, query, total_rows, qm_column, include_min=False):
    # compute the columns
    query.add_column(mavis.qm.Column(function="count_all", fields=dict(), name_alias="total_rows"))

    # filter not null
    query.add_filter(mavis.qm.Condition(operator="not_is_null", left=qm_column))

    if include_min:
        query.add_column(mavis.qm.Column(function="min", fields=dict(column=qm_column), name_alias="min_col"))

    # create the data
    result = mavis.run_query(query.to_query(), within_minutes=None)
    rows = result.rows

    # check for no values
    if len(rows) == 0:
        return []
    else:
        row = rows[0]

    values = [
        dict(
            key="% NULL",
            value=mavis.human_format(1.0 - (row["total_rows"] * 1.0 / total_rows), "percent"),
        )
    ]
    if include_min:
        values.append(dict(key="Min Date", value=row["min_col"] or "NULL"))

    return values


def _distribute_values(mavis, query, total_rows, qm_col):
    # compute the columns
    query.add_column(qm_col)
    query.add_column(mavis.qm.Column(function="count_all", fields=dict(), name_alias="total_rows"))
    query.add_group_by(1)
    query.add_order_by(2, asc=False)
    query.set_limit(mavis.config.index_warehouse_count or INDEX_COUNT)

    # create the data
    data = mavis.run_query(query.to_query(), within_minutes=None)

    values = [
        dict(
            key=_format(r[qm_col.get_name()]),
            value=mavis.human_format(r["total_rows"] * 1.00 / total_rows, "percent"),
            index_weight=r["total_rows"] * 1.00 / total_rows,
        )
        for r in data.rows
    ]

    return values


def _format(c):
    return "NULL" if c is None else str(c)


def _get_count(mavis, query):
    query.columns = [mavis.qm.Column(function="count_all", fields=dict(), name_alias="total_rows")]
    data = mavis.run_query(query.to_query(), within_minutes=None)
    query.columns = []

    return data.rows[0]["total_rows"]


def _should_update(should_update_at, all_updates):
    if not isinstance(all_updates, list):
        all_updates = [all_updates]

    return any(a is None or should_update_at > a for a in all_updates)


@tracer.start_as_current_span("index_column")
def index_column(mavis, query, column, total_rows, dim_id=None):
    column_details = dict(
        name=column.name,
        label=column.label,
        type=column.type,
        searchable=False,
        enrichment_table=dim_id,
    )
    set_current_span_attributes(column_name=column.name, column_label=column.label, column_type=column.type)

    qm = mavis.qm
    query = deepcopy(query)

    if column.name.startswith("feature_") and dim_id is None:
        col_type = column.type

        qm_column = mavis.qm.Column(
            json_column="feature_json",
            json_key=column.name[8:],
            name_alias=column.name,
            column_type=col_type,
        )

    else:
        col_type = utils.get_activity_stream_type(column.name)

        qm_column = mavis.qm.Column(
            table_column=column.name,
            name_alias=column.name,
            column_type=col_type if dim_id is None else None,
            # don't cast enrichment
            casting=None if dim_id else utils.get_simple_type(column.type),
        )

    if (
        column.name
        in (
            "activity",
            "customer",
            "enriched_activity_id",
            "enriched_ts",
        )
        or total_rows == 0
    ):
        column_details["values"] = []
    elif column.name.endswith("_id"):
        # % NULLS
        column_details["values"] = _count_null(mavis, query, total_rows, qm_column)

    elif utils.get_simple_type(column.type) == "timestamp":
        # % Null and min (column)
        column_details["values"] = _count_null(mavis, query, total_rows, qm_column, include_min=True)

    elif column.name == "activity_occurrence":
        # first and recurring
        qm_col = mavis.qm.Column(
            case=dict(
                cases=[
                    dict(
                        when=qm.Condition(operator="equal", left=qm_column, right=qm.Column(value=1)),
                        then=qm.Column(value="First (1)"),
                    )
                ],
                else_value=qm.Column(value="Recurring (2+)"),
            ),
            name_alias="kind_of_col",
        )
        column_details["values"] = _distribute_values(mavis, query, total_rows, qm_col)

    elif utils.get_simple_type(column.type) == "number":
        # % NULL, 25 percentile, 50th percenitle, 75%
        column_details["values"] = _percentiles(mavis, query, total_rows, qm_column)

    elif utils.get_simple_type(column.type) == "boolean":
        # get all the boolean values
        column_details["values"] = _distribute_values(mavis, query, total_rows, qm_column)
    else:
        # get all the column values
        column_details["values"] = _distribute_values(mavis, query, total_rows, qm_column)
        column_details["searchable"] = True

    if (
        column.id
        and column.name not in ("customer", "ts", "activity_id", "activity_occurrence")
        and not column.name.startswith("feature_")
        and len([v for v in column_details["values"] if not (v["key"] == "% NULL" and v["value"] == "100%")]) == 0
    ):
        # update the graph data to show the data has no values
        logger.debug(f"Updating column {column.name} to have no data")
        graph_client.update_column(id=column.id, label=column.label or utils.title(column.name), has_data=False)

    elif not column.has_data:
        logger.debug(f"Updating column {column.name} to have  data")
        graph_client.update_column(id=column.id, label=column.label or utils.title(column.name), has_data=True)
        column_details["has_data_reset"] = True

    return column_details


@tracer.start_as_current_span(name="index_activity")
def index_activity(mavis: Mavis, activity_id):
    set_current_span_attributes(activity_id=activity_id)

    activity = graph_client.get_activity_w_columns(id=activity_id).activity

    query = mavis.qm.get_activity_query(mavis.company.table(activity.table_id), activity.slug)
    total_rows = _get_count(mavis, query)

    # update the graph rows with the total row count
    graph_client.update_activity_rows(id=activity.id, row_count=min(MAX_INT, total_rows))

    # if no rows and the indexer just got trigger then live to fight another day and try again later
    if total_rows == 0:
        return None

    column_values = []

    # show all the columns available
    for c in activity.column_renames:
        if c.name in ("source", "source_id", "activity_occurrence", "activity_repeated_at", "activity_id", "activity"):
            continue

        try:
            column_details = index_column(mavis, query, c, total_rows)
        except QueryRunError as e:
            if "PERCENTILE_CONT" in utils.get_error_message(e):
                c.type = "string"
                column_details = index_column(mavis, query, c, total_rows)
            else:
                continue

        # If we now see data then resync all the data
        if c.name == "anonymous_customer_id" and column_details.get("has_data_reset"):
            activity_depend = graph_client.get_activity_dependencies(id=activity.id).activity_by_pk

            for d in activity_depend.datasets:
                d_obj = Dataset(mavis, d.dataset.id)

                updated = d_obj.ds._swich_activity_with_source(d_obj.obj, activity.id)
                # update the dataset
                if updated:
                    d_obj.update()
        column_values.append(column_details)

    # add the enrichment join
    for ad in activity.activity_dims:
        # add join
        query.joins = [
            mavis.qm.Join(
                table=mavis.qm.Table(
                    schema=ad.dim_table.schema_ or mavis.company.warehouse_schema,
                    table=ad.dim_table.table,
                    alias="e",
                ),
                condition=mavis.qm.Condition(
                    operator="equal",
                    left=mavis.qm.Column(table_column=ad.activity_join_column, table_alias="s"),
                    right=mavis.qm.Column(table_column=ad.dim_table.join_key, table_alias="e"),
                ),
            )
        ]

    # create the index object
    index_object = dict(
        slug=activity.slug,
        name=activity.name,
        description=activity.description,
        table=mavis.company.table(activity.table_id).activity_stream,
        dims=[d.dim_table.id for d in activity.activity_dims or []],
        columns=column_values,
        column_renames=utils.filter_dict(column_values, ["name", "label"]),
    )
    ActivityManager(mavis=mavis).update_index_data(activity.id, index_object)


@tracer.start_as_current_span(name="index_table")
def index_table(mavis, dim_id):
    dim = graph_client.get_dim_with_dependencies(id=dim_id).dim_table_by_pk
    if dim is None:
        return None

    set_current_span_attributes(dim_id=dim_id, table=dim.table)

    query = mavis.qm.Query()
    query.add_column(mavis.qm.Column(all_columns=True))
    query.set_from(mavis.qm.Table(table=dim.table, schema=dim.schema_ or mavis.company.warehouse_schema))
    query.set_limit(1000)

    # get all the rows
    data = mavis.run_query(query.to_query(), within_minutes=None)
    query.set_limit(None)

    # get the total rows
    total_rows = _get_count(mavis, query)
    Column = namedtuple("Column", "id name label type casting has_data")

    column_values = []
    # go through the columns
    for c in data.columns:
        try:
            column = Column(
                id=None,
                name=c.field,
                label=c.header_name,
                type=c.type,
                casting=None,
                has_data=True,
            )
            value = index_column(mavis, query, column, total_rows, dim_id=dim.id)
            column_values.append(value)
        except Exception:
            logger.exception(f"Could not process column {c.header_name}")

    # index_object = dict(
    #     schema=dim.schema_,
    #     table=dim.table,
    #     column_renames=utils.filter_dict(column_values, ["name", "label"]),
    #     columns=column_values,
    # )

    # handle depenendices
    for activity in dim.activities:
        a_id = activity.activity_id
        activity_obj = ActivityManager(mavis=mavis).get_index_data(activity.id)

        if not activity_obj:
            continue

        # add the data from the dims
        activity_obj["columns"] = [c for c in activity_obj["columns"] if c.get("enrichment_table") != dim_id]
        activity_obj["columns"].extend(column_values)
        # update the renames
        activity_obj["column_renames"] = utils.filter_dict(activity_obj["columns"], ["name", "label"])

        # update the activity index
        activity_obj = ActivityManager(mavis=mavis).update_index_data(a_id, activity_obj)

    # mavis.upload_index_file(dim.id, index_object, kind="dim_tables")


@mutex_task(time_limit=36_000_000, queue_name="activities")
@with_mavis
def index_activity_dims(mavis: Mavis, **kwargs):
    """
    UPDATE_ACTIVITY_STREAM: updates the data for the activity stream
    """

    if kwargs.get("activity_id"):
        index_activity(mavis, kwargs["activity_id"])

    if kwargs.get("dim_id"):
        index_table(mavis, kwargs["dim_id"])

    if kwargs.get("activity_id") is None and kwargs.get("dim_id") is None:
        for activity in graph_client.activity_index(company_id=mavis.company.id).all_activities:
            index_activity(mavis, activity.id)
