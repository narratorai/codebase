from collections import defaultdict

from batch_jobs.data_management.run_transformations import (
    create_single_row_table,
    get_query,
)
from core import utils
from core.decorators import mutex_task, with_mavis
from core.graph import graph_client
from core.v4.mavis import Mavis


@mutex_task()
@with_mavis
def quick_checks(mavis: Mavis, **kwargs):
    """
    Validate the assumptions of the activity stream
    """
    qm = mavis.qm
    results = []

    # get all the transformations
    transformations = [
        t
        for t in graph_client.transformation_index_w_dependency(company_id=mavis.company.id).all_transformations
        if t.production_queries_aggregate.aggregate.count > 0
    ]

    # create the remove customers
    remove_customers = defaultdict(list)
    for t in transformations:
        if t.remove_customers:
            remove_customers[t.table].append(t)

    # get all the activities
    all_activities = graph_client.get_all_activities_full(company_id=mavis.company.id).all_activities

    # start the process
    for table in mavis.company.tables:
        results.append(f"# {table.activity_stream}")

        check_table = qm.Table(schema=mavis.company.warehouse_schema, table=table.activity_stream)

        remove_anonymous_slugs = [t.slug for t in remove_customers[table.activity_stream] if t.has_source]
        remove_customer_slugs = [t.slug for t in remove_customers[table.activity_stream] if not t.has_source]

        if remove_anonymous_slugs:
            ra_query = create_single_row_table(mavis, check_table, "anonymous_customer_id")
            ra_query.add_filter(
                mavis.qm.Condition(
                    operator="is_in",
                    left=mavis.qm.Column(table_column="_activity_source"),
                    right=[mavis.qm.Column(value=a) for a in remove_anonymous_slugs],
                )
            )
            ra_data = mavis.run_query(ra_query.to_query())
            ignore_anonymous_customer_id = [r["anonymous_customer_id"] for r in ra_data["rows"]]

        if remove_customer_slugs:
            rc_query = create_single_row_table(mavis, check_table, "customer")
            rc_query.add_filter(
                mavis.qm.Condition(
                    operator="is_in",
                    left=mavis.qm.Column(table_column="_activity_source"),
                    right=[mavis.qm.Column(value=a) for a in remove_customer_slugs],
                )
            )

            rc_data = mavis.run_query(rc_query.to_query())
            ignore_customer_id = [r["customer"] for r in rc_data["rows"]]

        person_column = mavis.qm.Column(
            function="nvl",
            fields=dict(
                first_column=mavis.qm.Column(table_column="customer"),
                second_column=mavis.qm.Column(table_column="anonymous_customer_id"),
            ),
            name_alias="person",
        )

        # check duplicates of the activity occurrence
        missing_occurrence_query = qm.Query()
        missing_occurrence_query.add_column(person_column)
        missing_occurrence_query.add_column(qm.Column(table_column="activity"))
        missing_occurrence_query.add_column(qm.Column(table_column="activity_occurrence"))
        missing_occurrence_query.set_from(check_table)
        missing_occurrence_query.set_where(
            qm.Condition(operator="is_null", left=qm.Column(table_column="activity_occurrence"))
        )
        missing_occurrence_query.set_limit(100)

        miss_occ_data = mavis.run_query(missing_occurrence_query.to_query())

        if len(miss_occ_data["rows"]) > 0:
            results.append("## NULL Occurrence")
            results.append(utils.human_format(miss_occ_data, "table"))

        # check duplicates of the activity occurrence
        count_query = qm.Query()
        count_query.add_column(person_column)
        count_query.add_column(qm.Column(table_column="activity"))
        count_query.add_column(qm.Column(table_column="activity_occurrence"))
        count_query.set_from(check_table)
        count_query.add_group_by([1, 2, 3])
        count_query.set_where(
            qm.Condition(
                operator="not_is_null",
                left=qm.Column(table_column="activity_occurrence"),
            )
        )
        count_query.set_having(
            qm.Condition(
                operator="greater_than",
                left=qm.Column(function="count_all", fields=dict()),
                right=qm.Column(value=1),
            )
        )

        count_query.set_limit(100)

        count_data = mavis.run_query(count_query.to_query())

        if len(count_data["rows"]) > 0:
            results.append("## DUPLICATE OCCURRENCE")
            results.append(utils.human_format(count_data, "table"))

        # check duplicates of the activity occurrence
        first_occ_query = qm.Query()
        first_occ_query.add_column(person_column)
        first_occ_query.add_column(qm.Column(table_column="activity"))
        first_occ_query.set_from(check_table)
        first_occ_query.add_group_by([1, 2])
        first_occ_query.set_where(
            qm.Condition(
                operator="equal",
                left=qm.Column(table_column="activity_occurrence"),
                right=qm.Column(value=1),
            )
        )
        first_occ_query.set_having(
            qm.Condition(
                operator="greater_than",
                left=qm.Column(function="count_all", fields=dict()),
                right=qm.Column(value=1),
            )
        )
        first_occ_query.set_limit(100)

        first_occ_data = mavis.run_query(first_occ_query.to_query())

        if len(first_occ_data["rows"]) > 0:
            results.append("## DUPLICATE Customer for OCCURRENCE = 1")
            results.append(utils.human_format(first_occ_data, "table"))

        # check duplicates of the activity occurrence
        last_occ_query = qm.Query()
        last_occ_query.add_column(person_column)
        last_occ_query.add_column(qm.Column(table_column="activity"))
        last_occ_query.set_from(check_table)
        last_occ_query.add_group_by([1, 2])
        last_occ_query.set_where(
            qm.Filter(
                filters=[
                    qm.Condition(
                        operator="equal",
                        left=qm.Column(table_column="activity_repeated_at"),
                        right=qm.Column(value=None),
                    ),
                    "AND",
                    qm.Condition(
                        operator="not_is_null",
                        left=qm.Column(table_column="activity_occurrence"),
                    ),
                ]
            )
        )

        last_occ_query.set_having(
            qm.Condition(
                operator="greater_than",
                left=qm.Column(function="count_all", fields=dict()),
                right=qm.Column(value=1),
            )
        )
        last_occ_query.set_limit(100)

        last_occ_data = mavis.run_query(last_occ_query.to_query())

        if len(last_occ_data["rows"]) > 0:
            results.append("## DUPLICATE Customer for Activity REpeated at is NULL")
            results.append(utils.human_format(last_occ_data, "table"))

        for activity in all_activities:
            if activity.company_table.activity_stream != table.activity_stream:
                continue

            # get all the production queries
            activity_transforms = [
                graph_client.get_transformation_for_processing(id=p.transformation.id).transformation
                for p in activity.transformations
            ]

            min_ts = utils.date_add(utils.utcnow()[:10], "day", -1)

            activity_query = qm.Query()
            activity_query.add_column(qm.Column(table_column="activity_id", column_type="string"))
            activity_query.set_from(check_table)
            activity_query.add_filter(
                qm.Condition(
                    operator="equal",
                    left=qm.Column(table_column="activity", column_type="string"),
                    right=qm.Column(value=activity.slug, column_type="string"),
                )
            )

            # diff the raw data
            production_test = qm.Query()
            production_test.add_column(qm.Column(all_columns=True))

            transform_query = get_query(
                mavis,
                activity_transforms[0],
                include_casting=True,
                include_metadata=True,
            )
            for trans in activity_transforms[1:]:
                # union to the main object or the union
                obj = transform_query.union or transform_query
                obj.set_union(get_query(mavis, trans, include_casting=True, include_metadata=True))

            production_test.set_from(qm.Table(query=transform_query, alias="r"))

            production_test.add_filter(
                qm.Condition(
                    operator="equal",
                    left=qm.Column(table_column="activity", table_alias="r", column_type="string"),
                    right=qm.Column(value=activity.slug, table_alias="r", column_type="string"),
                )
            )
            production_test.add_filter(
                qm.Condition(
                    operator="less_than",
                    left=qm.Column(table_column="ts", table_alias="r", column_type="timestamp"),
                    right=qm.Column(value=min_ts, casting="timestamp"),
                )
            )

            production_test.add_filter(
                qm.Condition(
                    operator="not_is_in",
                    left=qm.Column(
                        table_column="activity_id",
                        table_alias="r",
                        column_type="string",
                    ),
                    right=activity_query,
                )
            )
            production_test.set_limit(1000)
            missing_activity_id = mavis.run_query(production_test.to_query())

            missing_activity_id["rows"] = [
                r
                for r in missing_activity_id["rows"]
                if (
                    r["anonymous_customer_id"] is None or r["anonymous_customer_id"] not in ignore_anonymous_customer_id
                )
                and (r["customer"] is None or r["customer"] not in ignore_customer_id)
            ]

            # let the user know that we having missing data
            if len(missing_activity_id["rows"]) > 0:
                results.append(f"## MISSING ACTIVITY_ID for {activity.slug}")
                results.append(utils.human_format(missing_activity_id, "table"))

    with open(f"/Users/ahmedelsamadisi/Desktop/debug{utils.utcnow()}.md", "w") as f:  # noqa: ASYNC101
        f.writelines("\n\n".join(results))
