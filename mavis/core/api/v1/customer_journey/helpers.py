import json
from collections import defaultdict
from copy import deepcopy

from core import utils
from core.graph import graph_client
from core.logger import get_logger
from core.models.table import ColumnTypeEnum
from core.v4.dataset import DatasetService
from core.v4.dataset_comp.query.model import ActivityColumns
from core.v4.mavis import Mavis

from .models import DEFAULT_CUSTOMER_KIND, CustomerJourneyResults, CustomerStreamInput

logger = get_logger()


def should_bust_cache(mavis: Mavis, all_activities, retrieved_at):
    m = graph_client.get_active_maintenance(
        last_updated_at=retrieved_at, ids=[a.id for a in all_activities.values()]
    ).activity_maintenance

    # only keep stuff that has recently entereted maintenance
    m = [r for r in m if r.ended_at or r.started_at > retrieved_at]

    # return true if there is anything in maintenance
    return True if m else False


def get_visual_customer_journey(mavis: Mavis, input):
    qm = mavis.qm
    input.customer = None
    (base_query, person_col, all_activities) = get_customer_journey(mavis, input, just_query=True)

    # add the data
    base_query.add_column(
        qm.Column(
            function="lead",
            fields=dict(
                column=qm.Column(table_column="activity", table_alias="a"),
                group=person_col,
                order=qm.Column(table_column="ts", table_alias="a"),
            ),
            name_alias="next_activity",
        )
    )

    base_query.add_column(
        qm.Column(
            function="lead",
            fields=dict(
                column=qm.Column(table_column="ts", table_alias="a"),
                group=person_col,
                order=qm.Column(table_column="ts", table_alias="a"),
            ),
            name_alias="next_ts",
        )
    )

    query = qm.wrap_query(base_query, alias="a")
    query.columns = []

    query.add_filter(
        qm.Filter(
            filters=[
                qm.Condition(
                    operator="is_null",
                    left=qm.Column(table_column="next_activity"),
                ),
                "OR",
                qm.Condition(
                    operator="not_equal",
                    left=qm.Column(table_column="activity"),
                    right=qm.Column(table_column="next_activity"),
                ),
            ]
        )
    )

    query.add_filter(
        qm.Filter(
            filters=[
                qm.Condition(
                    operator="is_null",
                    left=qm.Column(table_column="next_ts"),
                ),
                "OR",
                qm.Condition(
                    operator="greater_than",
                    left=qm.Column(
                        function="time_diff",
                        fields=dict(
                            from_column=qm.Column(table_column="ts"),
                            to_column=qm.Column(table_column="next_ts"),
                            datepart=input.time_between_resolution,
                        ),
                    ),
                    right=qm.Column(value=input.time_between),
                ),
            ]
        )
    )

    query.add_column(qm.Column(table_column="activity", table_alias="a"))

    for ii in range(input.depth):
        query.add_column(
            qm.Column(
                function="lead_offset",
                fields=dict(
                    column=qm.Column(table_column="activity", table_alias="a"),
                    offset=ii + 1,
                    group=person_col,
                    order=qm.Column(table_column="ts", table_alias="a"),
                ),
                name_alias=f"activity_{ii + 1}",
            )
        )

    # wrap the query
    query = qm.wrap_query(query, alias="a")

    if input.start_activity:
        query.add_filter(
            qm.Condition(
                operator="equal",
                left=qm.Column(table_alias="a", table_column="activity"),
                right=qm.Column(value=input.start_activity),
            )
        )

    if input.end_activity:
        activity_stream = mavis.company.table(input.table)
        activity_table = mavis.qm.stream_table(input.table, activity=input.end_activity, alias="e")
        end_activity_query = mavis.qm.wrap_query(activity_table, alias="e")

        # get a unique row for each customer
        end_activity_query.add_filter(
            qm.Condition(
                operator="equal",
                left=qm.Column(table_alias="e", table_column="activity_occurrence"),
                right=qm.Column(value=1),
            )
        )

        # add the activity filter
        if not activity_stream.manually_partition_activity:
            end_activity_query.add_filter(
                qm.Condition(
                    operator="equal",
                    left=qm.Column(table_alias="e", table_column="activity"),
                    right=qm.Column(value=input.end_activity),
                )
            )

        end_person_col = qm.Column(
            function="nvl",
            fields=dict(
                first_column=qm.Column(table_alias="e", table_column="customer"),
                second_column=qm.Column(table_alias="e", table_column="anonymous_customer_id"),
            ),
            name_alias="customer",
        )

        base_query.add_join(
            qm.Join(
                table=end_activity_query,
                condition=qm.Condition(operator="equal", left=person_col, right=end_person_col),
            )
        )

    query.add_column(qm.Column(function="count_all", fields=dict(), name_alias="total_rows"))
    query.add_group_by(qm.Column(table_column="activity"))
    query.add_group_by([qm.Column(table_column=f"activity_{ii + 1}") for ii in range(input.depth)])

    # Now limit to the top N rows
    query = qm.wrap_query(query, alias="a")
    query.add_order_by(qm.Column(table_column="total_rows"), asc=False)
    query.set_limit(input.depth * 10)

    # run the data
    count_data = mavis.run_query(query.to_query(), within_minutes=0 if input.run_live else 60 * 24 * 7)

    if should_bust_cache(mavis, all_activities, count_data["retrieved_at"]):
        count_data = mavis.run_query(
            query.to_query(local_timezone=mavis.company.timezone),
            within_minutes=0,
        )

    new_rows = []

    for r in count_data.rows:
        r["source"] = "1 - " + r["activity"]

        if input.end_activity:
            found = False
            for ii in range(input.depth):
                if found:
                    r[f"activity_{ii+1}"] = None
                elif r[f"activity_{ii+1}"] == input.end_activity:
                    found = True
            # skip if not found
            if not found:
                continue

        # go through and create all the variations of source and target
        for ii in range(input.depth):
            if r[f"activity_{ii+1}"] is None:
                r["target"] = " " * (ii + 2)
                r["total_rows"] = None
            else:
                r["target"] = f"{ii+2} - " + r[f"activity_{ii+1}"]

            # r["target"] = f"{ii+2} - " + r[f"activity_{ii+1}"]

            # handle cascading the total rows
            for nr in new_rows:
                if nr["source"] == r["source"] and nr["target"] == r["target"]:
                    if r["total_rows"] is not None:
                        nr["total_rows"] += r["total_rows"]
                    break
            else:
                new_rows.append(deepcopy(r))

            r["source"] = r["target"]

    new_rows = sorted(new_rows, key=lambda x: x["total_rows"] or 0, reverse=True)

    plot_data = dict(
        chart_type="sankey",
        plot_config=dict(
            data=new_rows,
            sourceField="source",
            targetField="target",
            weightField="total_rows",
            # nodeWidthRatio=0.008,
            # nodePaddingRatio=0.03,
            nodeDraggable=True,
            label=dict(position="middle"),
            tooltip=dict(narrator_format="number"),
            conversionTag=dict(),
        ),
        use_antv=True,
    )
    return dict(plot=plot_data, retrieved_at=count_data.get("retrieved_at"))


# process to get the customer journey
def get_customer_journey(
    mavis: Mavis,
    input: CustomerStreamInput,
    color_dict=None,
    just_query=False,
) -> CustomerJourneyResults:
    # define the components
    BEFORE_ROWS = 50
    qm = mavis.qm
    company = mavis.company

    # add a default table
    if not input.table:
        input.table = company.tables[0].activity_stream

    activity_stream = mavis.company.table(input.table)
    show_customer = False

    query = qm.Query()
    query.set_from(qm.Table(schema=company.warehouse_schema, table=input.table, alias="a"))
    customer_type = "string"
    if input.customer_kind in ("anonymous_customer_id", "customer"):
        customer_col = qm.Column(
            table_alias="a",
            table_column=input.customer_kind,
            name_alias="customer",
        )
    elif input.customer_kind == "join_customer":
        customer_col = qm.Column(
            function="nvl",
            fields=dict(
                first_column=qm.Column(table_alias="a", table_column="customer"),
                second_column=qm.Column(table_alias="a", table_column="anonymous_customer_id"),
            ),
            name_alias="customer",
        )
    else:
        activity_stream = mavis.company.table(input.table)

        if not activity_stream.customer_dim_table_id:
            raise ValueError("No customer dim table to be used for dynamic customer selector")

        customer_dim = graph_client.get_dim(id=activity_stream.customer_dim_table_id).dim_table_by_pk

        dim_col = next((c for c in customer_dim.columns if c.name == input.customer_kind), None)

        if dim_col is None:
            raise ValueError(f"Column {input.customer_kind} not found in {customer_dim.table}")

        customer_type = utils.get_simple_type(dim_col.type)

        query.add_join(
            qm.Join(
                table=qm.Table(
                    schema=customer_dim.schema_ or company.warehouse_schema,
                    table=customer_dim.table,
                    alias="c",
                ),
                condition=qm.Condition(
                    operator="equal",
                    left=qm.Column(table_alias="a", table_column="customer"),
                    right=qm.Column(table_alias="c", table_column=customer_dim.join_key),
                ),
            )
        )

        customer_col = qm.Column(
            table_alias="c",
            table_column=input.customer_kind,
            name_alias="raw_customer",
        )

    # add the customer column
    query.add_column(customer_col)

    all_activities = {
        a.slug: a
        for a in graph_client.activity_index(company_id=mavis.company.id).all_activities
        if a.table_id == activity_stream.id
    }

    if input.activities:
        # add the start and end activity if they exist
        if input.start_activity and input.start_activity not in input.activities:
            input.activities.append(input.start_activity)
        if input.end_activity and input.end_activity not in input.activities:
            input.activities.append(input.end_activity)

        # if the activities are hidden then remove them from the list
        if activity_stream.manually_partition_activity and input.hide_activities:
            activities = list(set(all_activities.keys()) - set(input.activities))
        else:
            activities = list(set(input.activities))
    else:
        input.hide_activities = False
        activities = list(all_activities.keys())

    a_obj = graph_client.get_activities_w_columns(ids=[all_activities[activities[0]].id]).activities[0]

    cols = [c.name for c in a_obj.column_renames]
    person_col = customer_col

    if input.customer:
        query.add_filter(
            qm.Condition(
                operator="equal",
                left=person_col,
                right=qm.Column(
                    value=(input.customer.lower() if input.customer_kind == "customer" else input.customer),
                    column_type=customer_type,
                ),
            )
        )
    else:
        query.add_filter(qm.Condition(operator="not_is_null", left=person_col))
        show_customer = True

    colors = defaultdict(utils.new_color)
    # add the colors form the color dict
    if color_dict:
        for k, val in color_dict.items():
            colors[k] = val

    if input.activities and (mavis.qm.language == "bigquery" or not activity_stream.manually_partition_activity):
        query.add_filter(
            qm.Condition(
                operator="not_is_in" if input.hide_activities else "is_in",
                left=qm.Column(table_alias="a", table_column="activity"),
                right=[qm.Column(value=a) for a in input.activities],
            )
        )

    # deal with around, before and after
    if input.timestamp:
        local_ts = utils.make_local(input.timestamp, company.timezone)
        if input.asc:
            ts_filt = qm.Condition(
                operator="greater_than_equal",
                left=qm.Column(table_alias="a", table_column="ts", column_type="timestamp"),
                right=qm.Column(
                    value=input.timestamp[:19],
                ),
            )
        else:
            ts_filt = qm.Condition(
                operator="less_than_equal",
                left=qm.Column(table_alias="a", table_column="ts", column_type="timestamp"),
                right=qm.Column(value=input.timestamp[:19]),
            )
        query.add_filter(ts_filt)

    elif input.time_filter:
        ts_filt = DatasetService(mavis).ds.internal_create_filter(
            input.time_filter,
            qm.Column(
                table_alias="a",
                table_column="ts",
                column_type="timestamp",
                timezone=mavis.company.timezone,
            ),
        )
        query.add_filter(ts_filt)

    # if manually partitioned, then UNION all the tables
    if activity_stream.manually_partition_activity:
        query = qm.wrap_query(
            mavis.qm.get_activity_table(
                activity_stream.activity_stream,
                activities,
                alias="a",
                filters=query.where,
            ),
            alias="a",
        )

    # add all the columns back
    query.columns = []
    query.add_column(person_col)

    # Add the normal customer column since we will show it
    if input.customer_kind not in DEFAULT_CUSTOMER_KIND and input.customer:
        query.add_column(qm.Column(table_alias="a", table_column="customer"))
        show_customer = True

    query.add_column(
        qm.Column(
            table_alias="a",
            table_column="ts",
            timezone=company.timezone,
            name_alias="ts",
        )
    )
    if not just_query:
        query.add_order_by(qm.Column(table_column="ts"), asc=input.asc)

    query.add_column(qm.Column(table_alias="a", table_column="activity_id"))
    query.add_column(qm.Column(table_alias="a", table_column="activity"))
    query.add_column(qm.Column(table_alias="a", table_column="feature_json"))

    for cc in [
        "anonymous_customer_id",
        "activity_occurrence",
        "revenue_impact",
        "link",
        "_activity_source",
    ]:
        if cc in cols:
            if cc == "activity_occurrence":
                query.add_column(
                    qm.Column(
                        function="row_number_w_group",
                        fields=dict(
                            group=[qm.Column(table_alias="a", table_column="activity")],
                            order=qm.Column(
                                table_column=ActivityColumns.ts,
                                table_alias=query.from_table.alias,
                                column_type=ColumnTypeEnum.timestamp,
                            ),
                        ),
                        name_alias=ActivityColumns.activity_occurrence,
                    )
                )
            else:
                query.add_column(qm.Column(table_alias="a", table_column=cc))

    if just_query:
        return query, person_col, all_activities

    # add the limit
    query.set_limit(5000)

    # run the data
    data = mavis.run_query(
        query.to_query(local_timezone=company.timezone),
        within_minutes=0 if input.run_live else None,
    )

    if should_bust_cache(mavis, all_activities, data.retrieved_at):
        data = mavis.run_query(
            query.to_query(local_timezone=company.timezone),
            within_minutes=0,
        )

    # deep copy the data since we will be saving the cache
    data = deepcopy(data)

    # get a couple of rows before to make sense of the data
    if input.timestamp:
        if input.offset == 0:
            ts_filt.operator = "less_than" if input.asc else "greater_than"
            query.order_by = []
            query.add_order_by(qm.Column(table_column="ts"), asc=False)
            query.set_limit(BEFORE_ROWS)
            before_data = mavis.run_query(
                query.to_query(local_timezone=company.timezone),
                within_minutes=0 if input.run_live else None,
            )

            # union the before data and the data and reorder it if it is supposed to be asecing
            if input.asc:
                data.rows = before_data.rows[::-1] + data.rows
            else:
                data.rows = before_data.rows + data.rows

    # grab the datta you need
    data.rows = data.rows[input.offset : input.offset + input.limit]

    activities = graph_client.get_activity_features(table_id=activity_stream.id).all_activities
    activities = {a.slug: a for a in activities}

    # run the query
    go_to_row_id = None
    for _ii, r in enumerate(data.rows):
        r["_id"] = hash(str(r))

        # save the go to id
        if (
            input.timestamp
            and input.offset == 0
            and go_to_row_id is None
            and ((r["ts"] >= local_ts and input.asc) or (r["ts"] <= local_ts and not input.asc))
        ):
            go_to_row_id = r["_id"]

        r["features"] = []
        # add the dot color
        r["dot_color"] = colors[r["activity"]]

        if r["activity"] not in activities.keys():
            r["activity_name"] = utils.title(r["activity"])
            logger.info("Activity not found", activity=r["activity"])

        else:
            curr_a = activities[r["activity"]]
            r["activity_name"] = curr_a.name

            mappings = {_map_to_key(c.name): c for c in curr_a.column_renames}

            # do it one at a time so you can have the right order
            for name in (
                "feature_json",
                "feature_1",
                "feature_2",
                "feature_3",
                "anonymous_customer_id",
                "activity_id",
                "link",
                "_activity_source",
            ):
                if name not in cols and name != "feature_json":
                    continue

                # Add the features
                if name == "feature_json":
                    r["features"].extend(
                        [
                            dict(
                                label=mappings[k].label if mappings.get(k) else k,
                                value=mavis.human_format(
                                    v,
                                    utils.guess_format(mappings[k].label, type=mappings[k].type),
                                ),
                                for_copy=k.endswith("_id"),
                            )
                            for k, v in json.loads(r[name]).items()
                            if mappings.get(k) is not None
                        ]
                    )
                    r.pop(name, None)
                elif not name.startswith("feature"):
                    c = mappings.get(name)
                    if c and c.has_data:
                        r["features"].append(
                            dict(
                                label=c.label,
                                value=r[c.name],
                                for_copy=c.name.endswith("_id"),
                                for_link=c.name == "link",
                            )
                        )
                    r.pop(name, None)

    return dict(
        data=data.to_old(),
        go_to_row_id=go_to_row_id,
        table=input.table,
        customer=input.customer,
        customer_kind=input.customer_kind,
        asc=input.asc,
        retrieved_at=data.retrieved_at,
        show_customer=show_customer,
    )


def _map_to_key(s: str):
    return utils.fix_key(s[8:]) if s.startswith("feature_") else s
