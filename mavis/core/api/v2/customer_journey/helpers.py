import json

from core import utils
from core.graph import graph_client
from core.logger import get_logger
from core.models.table import ColumnTypeEnum
from core.v4.dataset_comp.query.model import ActivityColumns
from core.v4.mavis import Mavis

from .models import (
    JourneyAttribute,
    JourneyFound,
    JourneyFoundForActivity,
    JourneyOutput,
)

logger = get_logger()

LIMIT_ROWS = 1000


# process to get the customer journey
def find_customers_for_activity(
    mavis: Mavis, table_id: str, activity: str, from_time: str, run_live=False
) -> list[JourneyFoundForActivity]:
    qm = mavis.qm
    # get the table
    table = mavis.company.table(table_id)

    # create the query
    query = qm.Query()
    query.add_column(qm.Column(table_alias="a", table_column=ActivityColumns.customer))
    query.add_column(qm.Column(table_alias="a", table_column=ActivityColumns.ts))

    query.add_column(
        qm.Column(
            table_alias="a",
            table_column=ActivityColumns.ts,
            column_type="timestamp",
            timezone=mavis.company.timezone,
        )
    )

    # add the activity filter
    if table.manually_partition_activity:
        query.set_from(mavis.qm.stream_table(table, activity=activity, alias="a"))
    else:
        query.set_from(mavis.qm.stream_table(table, alias="a"))
        query.add_filter(
            qm.Condition(
                operator="equal",
                left=qm.Column(table_alias="a", table_column=ActivityColumns.activity),
                right=qm.Column(value=activity),
            )
        )

    if table.customer_dim_table_id:
        dim = graph_client.get_dim(table.customer_dim_table_id).dim_table_by_pk
        if any(c.name == ActivityColumns.customer_display_name for c in dim.columns):
            query.add_column(qm.Column(table_alias="c", table_column=ActivityColumns.customer_display_name))
            query.add_join(
                qm.Join(
                    table=qm.Table(
                        schema=dim.schema_,
                        table=dim.table,
                        alias="c",
                    ),
                    condition=qm.Condition(
                        operator="equal",
                        left=qm.Column(table_alias="c", table_column=ActivityColumns.customer),
                        right=qm.Column(table_alias="a", table_column=ActivityColumns.customer),
                    ),
                    kind="LEFT",
                )
            )

    # add the timestamp filter
    query.add_filter(
        qm.Condition(
            operator="greater_than_equal",
            left=qm.Column(
                table_alias="a",
                table_column=ActivityColumns.ts,
                column_type="timestamp",
            ),
            right=qm.Column(
                value=from_time[:19],
            ),
        )
    )
    query.add_column(
        qm.Column(
            function="count_window",
            fields=dict(
                column=qm.Column(table_alias="a", table_column=ActivityColumns.ts),
                group=[qm.Column(table_alias="a", table_column=ActivityColumns.customer)],
            ),
            name_alias="occurrence",
        )
    )

    query.add_filter(
        qm.Condition(
            operator="not_is_null",
            left=qm.Column(table_alias="a", table_column=ActivityColumns.customer),
        )
    )
    # a limit
    query.set_limit(100)

    # run the data
    data = mavis.run_query(query.to_query(), within_minutes=0 if run_live else 60 * 24)

    found_journies = []
    added = set()
    for r in data.rows:
        if r[ActivityColumns.customer] in added:
            continue
        added.add(r[ActivityColumns.customer])
        found_journies.append(
            JourneyFoundForActivity(
                customer_display_name=r.get(ActivityColumns.customer_display_name),
                customer=r[ActivityColumns.customer],
                occurrence=r["occurrence"],
                ts=r[ActivityColumns.ts],
            )
        )
        if len(found_journies) > 20:
            break

    return found_journies


def search_customer_table(mavis: Mavis, table_id: str, search_term: str) -> list[JourneyFound]:
    table = mavis.company.table(table_id)
    if not table.customer_dim_table_id:
        return None

    dim = graph_client.get_dim(table.customer_dim_table_id).dim_table_by_pk

    query = mavis.qm.Query()
    query.add_column(mavis.qm.Column(table_alias="c", table_column=ActivityColumns.customer))
    query.set_from(
        mavis.qm.Table(
            schema=dim.schema_,
            table=dim.table,
            alias="c",
        )
    )
    query.add_filter(
        mavis.qm.Condition(
            operator="contains",
            left=mavis.qm.Column(table_alias="c", table_column=ActivityColumns.customer),
            right=mavis.qm.Column(value=search_term.lower()),
        )
    )
    has_display = any(c.name == ActivityColumns.customer_display_name for c in dim.columns)

    if has_display:
        query.add_column(mavis.qm.Column(table_alias="c", table_column=ActivityColumns.customer_display_name))
        query.add_filter(
            mavis.qm.Condition(
                operator="contains",
                left=mavis.qm.Column(table_alias="c", table_column=ActivityColumns.customer_display_name),
                right=mavis.qm.Column(value=search_term.lower()),
            ),
            kind="OR",
        )

    # TODO: SORT it by if it exists in both

    query.set_limit(50)

    # deal with the data
    data = mavis.run_query(query.to_query(), within_minutes=None)

    found_customers = []

    for j in data.rows:
        found_customers.append(
            JourneyFound(
                customer_display_name=j.get(ActivityColumns.customer_display_name),
                customer=j[ActivityColumns.customer],
            )
        )
    else:
        found_customers.append(
            JourneyFound(
                customer_display_name=None,
                customer=search_term,
            )
        )

    return found_customers


def get_attributes(mavis: Mavis, table_id: str, customer: str, run_live: bool = False) -> JourneyAttribute:
    qm = mavis.qm
    table = mavis.company.table(table_id)

    if not table or not table.customer_dim_table_id:
        return None

    dim = graph_client.get_dim(table.customer_dim_table_id).dim_table_by_pk

    query = qm.Query()
    query.add_column(qm.Column(table_alias="c", all_columns=True))
    query.set_from(qm.Table(schema=dim.schema_, table=dim.table, alias="c"))
    query.set_where(
        qm.Condition(
            operator="equal",
            left=qm.Column(table_alias="c", table_column=ActivityColumns.customer),
            right=qm.Column(value=customer),
        )
    )
    data = mavis.run_query(query.to_query(), within_minutes=0 if run_live else None)
    cm = {c.name: c.label for c in dim.columns}
    attributes = []
    null_attributes = []

    for c in data.columns:
        if c.field.startswith("_") or cm.get(c.field) is None:
            continue
        if data.total_rows == 0:
            val = None
        else:
            val = data.rows[0][c.field]
        if val is not None:
            attributes.append(dict(name=cm[c.field], value=val))
        else:
            null_attributes.append(cm[c.field])

    return JourneyAttribute(
        attributes=attributes,
        null_attributes=null_attributes,
    )


# process to get the customer journey
def get_customer_journey(
    mavis: Mavis,
    table_id: str,
    customer: str,
    from_time: str | None = None,
    to_time: str | None = None,
    limit_activities: list[str] | None = None,
    use_anonymous_id: bool = False,
    limit: int = 200,
    offset: int = 0,
    is_asc: bool = False,
    run_live: bool = False,
) -> JourneyOutput:
    qm = mavis.qm
    table = mavis.company.table(table_id)

    query = qm.Query()
    if table.manually_partition_activity:
        all_activities = graph_client.activity_index(company_id=mavis.company.id).all_activities
        activities = [a.slug for a in all_activities if a.table_id == table.id]
    else:
        activities = None

    query.set_from(mavis.qm.get_activity_table(table, activities, alias="a"))

    if use_anonymous_id:
        customer_col = qm.Column(
            function="nvl",
            fields=dict(
                first_column=qm.Column(table_alias="a", table_column=ActivityColumns.customer),
                second_column=qm.Column(table_alias="a", table_column="anonymous_customer_id"),
            ),
            name_alias=ActivityColumns.customer,
        )
    else:
        customer_col = qm.Column(table_alias="a", table_column=ActivityColumns.customer)

    # filter out the customer
    query.add_filter(
        qm.Condition(
            operator="equal",
            left=customer_col,
            right=qm.Column(value=customer),
        )
    )
    # add the customer column
    query.add_column(customer_col)

    # deal with around, before and after
    if from_time:
        query.add_filter(
            qm.Condition(
                operator="greater_than_equal",
                left=qm.Column(
                    table_alias="a",
                    table_column=ActivityColumns.ts,
                    column_type="timestamp",
                ),
                right=qm.Column(
                    value=from_time[:19],
                ),
            )
        )

    if to_time:
        query.add_filter(
            qm.Condition(
                operator="less_than_equal",
                left=qm.Column(
                    table_alias="a",
                    table_column=ActivityColumns.ts,
                    column_type="timestamp",
                ),
                right=qm.Column(
                    value=to_time[:19],
                ),
            )
        )

    # add all the columns back
    query.columns = []
    query.add_column(customer_col)

    query.add_column(
        qm.Column(
            table_alias="a",
            table_column=ActivityColumns.ts,
            timezone=mavis.company.timezone,
            name_alias=ActivityColumns.ts,
        )
    )
    activity_col = qm.Column(table_alias="a", table_column="activity")
    query.add_column(qm.Column(table_alias="a", table_column="activity_id"))
    query.add_column(activity_col)
    query.add_column(qm.Column(table_alias="a", table_column="link"))
    query.add_column(qm.Column(table_alias="a", table_column="revenue_impact"))
    query.add_column(qm.Column(table_alias="a", table_column="feature_json"))

    query.add_column(
        qm.Column(
            function="row_number_w_group",
            fields=dict(
                group=[activity_col],
                order=qm.Column(
                    table_column=ActivityColumns.ts,
                    table_alias=query.from_table.alias,
                    column_type=ColumnTypeEnum.timestamp,
                ),
            ),
            name_alias=ActivityColumns.activity_occurrence,
        )
    )
    query.add_order_by(qm.Column(table_column=ActivityColumns.ts), asc=is_asc)
    # add the limit
    query.set_limit(LIMIT_ROWS)

    activities = graph_client.get_activity_features(table.id).all_activities
    activities = {a.slug: a for a in activities}

    if limit_activities:
        if mavis.qm.language == "bigquery" or not table.manually_partition_activity:
            query.add_filter(
                qm.Condition(
                    operator="is_in",
                    left=qm.Column(table_alias="a", table_column="activity"),
                    right=[qm.Column(value=a) for a in limit_activities],
                )
            )

    # create a union with all the filters
    if table.manually_partition_activity:
        subquery = qm.wrap_query(
            mavis.qm.get_activity_table(
                table,
                limit_activities or list(activities.keys()),
                alias="a",
                filters=query.where,
            ),
            alias="a",
        )
        # set it as the from
        query.set_from(qm.Table(query=subquery, alias="a"))
    query.set_limit(LIMIT_ROWS)

    # Run the queries
    data = mavis.run_query(
        query.to_query(),
        within_minutes=0 if run_live else None,
    )

    output_events = []

    for _ii, r in enumerate(data.rows):
        if _ii < offset:
            continue
        if _ii > (offset + limit):
            break

        # ignore a bunch of bad data
        if not r.get(ActivityColumns.ts) or not r.get("activity") or not activities.get(r["activity"]):
            continue

        cols = {_map_to_key(c.name): c.label for c in activities[r["activity"]].column_renames if c.has_data}

        if isinstance(r["feature_json"], str):
            feature_json = json.loads(r["feature_json"])
        else:
            feature_json = r["feature_json"]

        output_events.append(
            dict(
                id=hash(str(r)),
                activity_id=r["activity_id"],
                ts=r[ActivityColumns.ts],
                link=r["link"],
                activity=activities[r["activity"]].name,
                occurrence=r[ActivityColumns.activity_occurrence],
                revenue=r["revenue_impact"],
                attributes=[
                    dict(
                        name=cols[k],
                        value=v,
                    )
                    for k, v in feature_json.items()
                    if cols.get(k)
                ],
            )
        )
    return JourneyOutput(
        events=output_events,
        is_done=len(output_events) < limit,
    )


def _map_to_key(s: str):
    return utils.fix_key(s[8:]) if s.startswith("feature_") else s
