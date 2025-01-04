import json
from datetime import datetime

from core import utils
from core.api.customer_facing.sql.utils import WarehouseManager
from core.api.customer_facing.tables.utils import TableManager
from core.constants import MAX_INT, STRING_CHAR
from core.decorators import mutex_task, with_mavis
from core.graph import graph_client
from core.logger import get_logger
from core.models.company import CompanyTable
from core.models.warehouse_schema import WarehouseSchema
from core.v4.mavis import Mavis

logger = get_logger()


def run_check(
    mavis: Mavis,
    company_table: CompanyTable,
    current_activities,
    schema: WarehouseSchema,
):
    if company_table.manually_partition_activity:
        new_activities = {}
        all_tables = schema.tables_for(mavis.company.warehouse_schema)

        for table in all_tables:
            if table.lower_name.startswith(company_table.activity_stream):
                activity = table.lower_name[len(company_table.activity_stream) + 1 :]
                if activity not in [a.slug for a in current_activities]:
                    new_activities[activity] = None
    else:
        # check for missing activities
        query = mavis.qm.Query()
        query.add_column(mavis.qm.Column(table_column="activity"))
        query.add_column(mavis.qm.Column(function="count_all", fields=dict(), name_alias="total_rows"))
        query.set_from(
            mavis.qm.Table(
                table=company_table.activity_stream,
                schema=mavis.company.warehouse_schema,
            )
        )
        query.add_group_by(1)

        if current_activities:
            query.set_where(
                mavis.qm.Condition(
                    operator="not_is_in",
                    left=mavis.qm.Column(table_column="activity"),
                    right=[mavis.qm.Column(value=a.slug) for a in current_activities],
                )
            )

        data = mavis.run_query(query.to_query())
        new_activities = {r["activity"]: r["total_rows"] for r in data.rows}

    for activity_slug, rows in new_activities.items():
        # Create the new activity
        a_id = (
            graph_client.create_new_activity(
                company_id=mavis.company.id,
                slug=activity_slug,
                name=utils.title(activity_slug),
                table_id=company_table.id,
                description=None,
                updated_by=None,
                maintainer_id=None,
            )
            .insert_activity.returning[0]
            .id
        )

        # Update the activity rows
        if rows:
            graph_client.update_activity_rows(
                id=a_id,
                row_count=min(
                    MAX_INT,
                    rows,
                ),
            )

    # TODO: Maybe think about splitting it out
    all_activities = graph_client.activity_index(company_id=mavis.company.id).all_activities
    total_rows = 0
    for a in all_activities:
        if a.company_table.activity_stream == company_table.activity_stream:
            total_rows += a.row_count

            # create all the columns
            _reset_all_activity_columns(
                mavis,
                mavis.company.table(a.company_table.activity_stream),
                a.slug,
                a.id,
            )

    # update the rows
    TableManager(mavis).update_rows(company_table.id, total_rows)


def _reset_all_activity_columns(mavis: Mavis, company_table: CompanyTable, activity_slug, activity_id):
    # remove all the activity columns
    graph_client.delete_activity_columns(activity_id=activity_id)

    if company_table.manually_partition_activity:
        table = mavis.qm.stream_table(company_table, activity=activity_slug)
    else:
        table = mavis.qm.stream_tables(company_table)

    try:
        query = mavis.qm.wrap_query(table)
        query.set_limit(1000)
        data = mavis.run_query(query.to_query())
    except Exception:
        logger.exception(f"Could not find the table {table.table}")
        return None

    # add all the columns
    for c in data.columns:
        if c.lower_name == "feature_json":
            all_feature_cols = _get_all_feature_columns(mavis, company_table, activity_slug)
            for feature_col in all_feature_cols:
                graph_client.create_new_column(
                    related_to_id=activity_id,
                    related_to="activity",
                    has_data=True,
                    name=f'feature_{feature_col["name"].lower()}',
                    type=feature_col["type"],
                    label=utils.title(feature_col["name"]),
                )

        else:
            graph_client.create_new_column(
                related_to_id=activity_id,
                related_to="activity",
                has_data=True,
                name=c.lower_name,
                type=c.type,
                label=utils.title(c.header_name if c.lower_name != "ts" else "Timestamp"),
            )

    return None


def _get_type(values):
    if isinstance(values[0], str):
        try:
            # try and cast the 10 values and see if we can guess the type
            for ii in range(10):
                datetime.fromisoformat(values[ii][:19])
            return "timestamp"
        except Exception:
            # then it is a string
            return "text" if max(len(str(v)) for v in values) > STRING_CHAR else "string"
    elif isinstance(values[0], int):
        return "integer"


def _get_all_feature_columns(mavis: Mavis, company_table: CompanyTable, activity_slug):
    cols = []

    # decide on the approach
    qm = mavis.qm

    query = qm.Query()
    query.add_column(qm.Column(table_column="feature_json", column_type="json"))

    if company_table.manually_partition_activity:
        query.set_from(mavis.qm.stream_table(company_table, activity=activity_slug))
    else:
        query.set_from(mavis.qm.stream_table(company_table))
        query.set_where(
            qm.Condition(
                operator="equal",
                left=qm.Column(table_column="activity"),
                right=qm.Column(value=activity_slug),
            )
        )

    feature_len = qm.Column(
        function="regexp_count",
        fields=dict(
            column=qm.Column(table_column="feature_json", column_type="json", casting="text"),
            expression=":",
        ),
    )
    max_query = qm.Query()
    max_query.add_column(qm.Column(function="max", fields=dict(column=feature_len)))
    max_query.set_from(query.from_table)
    # add the filter
    if query.where:
        max_query.add_filter(query.where)

    query.add_filter(
        qm.Condition(
            operator="equal",
            left=feature_len,
            right=max_query,
        )
    )

    query.set_limit(100)
    data = mavis.run_query(query.to_query())

    # get all the keys
    try:
        all_keys = json.loads(data.rows[0]["feature_json"]).keys()
    except Exception:
        logger.debug("No columns")

        # email the USER
        return []

    # get the columns
    cols = []

    # get all the json columns
    for k in all_keys:
        current_type = _get_type([json.loads(r["feature_json"]).get(k) for r in data.rows])
        cols.append(dict(name=k, type=current_type or "String"))
    return cols


@mutex_task()
@with_mavis
def check_for_new_activities(mavis: Mavis, **kwargs):
    """
    Looks for any new activities of imported tables
    """
    all_activities = graph_client.activity_index(company_id=mavis.company.id).all_activities

    schema = WarehouseManager(mavis=mavis).get_schema()

    # start the process
    for table in mavis.company.tables:
        if table.is_imported:
            # # for debugging
            # for a in all_activities:
            #     _reset_all_activity_columns(mavis, table, a.slug, a.id)

            activities = [a for a in all_activities if a.table_id == table.id]
            run_check(mavis, table, activities, schema)
