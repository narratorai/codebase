import json
from typing import Literal

from core import flags, utils
from core.api.customer_facing.activities.models import GetActivitiesOutput
from core.api.customer_facing.activities.utils import ActivitiesQueryBuilder
from core.graph import graph_client
from core.logger import get_logger
from core.models.table import ColumnTypeEnum
from core.v4.dataset_comp.query.model import ActivityColumns
from core.v4.mavis import Mavis

from .models import (
    JourneyAttribute,
    JourneyEventsOutput,
    JourneyFound,
    JourneyFoundForActivity,
)

logger = get_logger()

LIMIT_ROWS = 1000


# process to get the customer journey
def find_customers_for_activity(
    mavis: Mavis, table_id: str, activity: str, run_live=False
) -> list[JourneyFoundForActivity]:
    qm = mavis.qm
    # get the table
    table = mavis.company.table(table_id)

    # create the query
    query = qm.Query()
    query.add_column(qm.Column(table_alias="a", table_column=ActivityColumns.customer))

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
        query.set_from(mavis.qm.stream_table(table.activity_stream, activity=activity, alias="a"))
    else:
        query.set_from(mavis.qm.stream_table(table.activity_stream, alias="a"))
        query.add_filter(
            qm.Condition(
                operator="equal",
                left=qm.Column(table_alias="a", table_column=ActivityColumns.activity),
                right=qm.Column(value=activity),
            )
        )
    query.add_filter(
        qm.Condition(
            operator="not_is_null",
            left=qm.Column(table_alias="a", table_column=ActivityColumns.customer),
        )
    )

    if table.customer_dim_table_id:
        dim = graph_client.get_dim(table.customer_dim_table_id).dim_table_by_pk
        if any(c.name == "customer_display_name" for c in dim.columns):
            query = qm.wrap_query(query, alias="a")
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
    query.add_order_by(qm.Column(table_column=ActivityColumns.ts), asc=False)
    # a limit
    query.set_limit(200)

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
                ts=r["ts"],
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
    query.set_limit(100)

    # deal with the data
    data = mavis.run_query(query.to_query(), within_minutes=None)

    found_customers = []

    for j in data.rows:
        found_customers.append(
            JourneyFound(
                customer_display_name=j.get("customer_display_name"),
                customer=j["customer"],
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
    activity_action: Literal["include", "exclude"] = "exclude",
    use_anonymous_id: bool = False,
    limit: int = 200,
    offset: int = 0,
    is_asc: bool = False,
    run_live: bool = False,
) -> JourneyEventsOutput:
    qm = mavis.qm
    table = mavis.company.table(table_id)

    query = qm.Query()
    if use_anonymous_id:
        customer_col = qm.Column(
            function="nvl",
            fields=dict(
                first_column=qm.Column(table_alias="a", table_column=ActivityColumns.customer),
                second_column=qm.Column(table_alias="a", table_column="anonymous_customer_id"),
            ),
            name_alias="customer",
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
            name_alias="ts",
        )
    )
    activity_col = qm.Column(table_alias="a", table_column=ActivityColumns.activity)
    query.add_column(qm.Column(table_alias="a", table_column=ActivityColumns.activity_id))
    query.add_column(activity_col)
    query.add_column(qm.Column(table_alias="a", table_column=ActivityColumns.link))
    query.add_column(qm.Column(table_alias="a", table_column=ActivityColumns.revenue_impact))
    query.add_column(qm.Column(table_alias="a", table_column=ActivityColumns.feature_json))

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

    activities = GetActivitiesOutput(
        **ActivitiesQueryBuilder(mavis=mavis, table_id=table.id, per_page=1000).get_results()
    )
    activities = {a.slug: a for a in activities.data}

    use_activities = list(activities.keys())

    if activity_action == "include" and limit_activities:
        use_activities = [a for a in use_activities if a in limit_activities]
    elif activity_action == "exclude" and limit_activities:
        use_activities = [a for a in use_activities if a not in limit_activities]

    if mavis.qm.language == "bigquery" or not table.manually_partition_activity:
        query.add_filter(
            qm.Condition(
                operator="is_in" if activity_action == "include" else "not_is_in",
                left=qm.Column(table_alias="a", table_column=ActivityColumns.activity),
                right=[qm.Column(value=a) for a in use_activities],
            )
        )

    # create a union with all the filters
    if table.manually_partition_activity:
        query.set_from(
            mavis.qm.get_activity_table(
                table.activity_stream,
                use_activities,
                alias="a",
                filters=query.where,
            ),
            alias="a",
        )

        if not flags.should_show_flag("dataset-no-occurrence", mavis.user):
            query.add_order_by(qm.Column(table_column=ActivityColumns.activity_occurrence), asc=is_asc)

    if flags.should_show_flag("dataset-no-occurrence", mavis.user):
        query.add_column(
            qm.Column(
                function="row_number_w_group",
                fields=dict(
                    group=[qm.Column(table_alias="a", table_column=ActivityColumns.activity), customer_col],
                    order=qm.Column(
                        table_column=ActivityColumns.ts,
                        table_alias="a",
                        column_type=ColumnTypeEnum.timestamp,
                    ),
                ),
                name_alias=ActivityColumns.activity_occurrence,
            )
        )

    query.set_limit(LIMIT_ROWS)
    offset_actual = offset // LIMIT_ROWS * LIMIT_ROWS
    if offset > LIMIT_ROWS:
        query.set_offset(offset_actual)

    # Run the queries
    data = mavis.run_query(
        query.to_query(),
        within_minutes=0 if run_live else None,
    )

    output_events = []

    for _ii, r in enumerate(data.rows):
        if (offset_actual + _ii) < offset:
            continue
        if (offset_actual + _ii) > (offset + limit):
            break

        # ignore a bunch of bad data
        if not r.get("ts") or not r.get(ActivityColumns.activity) or not activities.get(r[ActivityColumns.activity]):
            continue

        cols = {_map_to_key(c.name): c.label for c in activities[r[ActivityColumns.activity]].columns}

        if isinstance(r[ActivityColumns.feature_json], str):
            feature_json = json.loads(r[ActivityColumns.feature_json])
        else:
            feature_json = r[ActivityColumns.feature_json]

        output_events.append(
            dict(
                id=hash(str(r)),
                activity_id=r[ActivityColumns.activity_id],
                ts=r["ts"],
                link=r["link"],
                activity=activities[r[ActivityColumns.activity]].name,
                occurrence=r[ActivityColumns.activity_occurrence],
                revenue=r[ActivityColumns.revenue_impact],
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
    total_count = offset_actual + (data.total_rows if data.total_rows < LIMIT_ROWS else LIMIT_ROWS * 2)

    return JourneyEventsOutput(
        data=output_events,
        total_count=total_count,
        page=total_count // limit,
        per_page=limit,
        is_done=len(output_events) < limit,
    )


def _map_to_key(s: str):
    return utils.fix_key(s[8:]) if s.startswith("feature_") else s
