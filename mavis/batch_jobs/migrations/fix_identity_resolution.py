from batch_jobs.data_management.run_transformations import (
    _dedupe_identity_query,
    create_single_row_table,
)
from core.decorators import with_mavis
from core.graph import graph_client
from core.logger import get_logger
from core.v4.mavis import Mavis

logger = get_logger()


@with_mavis
def fix_identity_resolution(mavis: Mavis, **kwargs):
    """
    Gets the path of the company
    """
    qm = mavis.qm

    for tb in mavis.company.tables:  # create a manually partitioned activity from all the tables
        # Create filter of current anonymous_customer_ids
        filt = qm.Condition(
            operator="not_is_in",
            left=qm.Column(table_column="anonymous_customer_id"),
            right=create_single_row_table(
                mavis,
                mavis.qm.stream_table(tb.activity_stream, is_identity=True),
                qm.Column(table_column="anonymous_customer_id"),
                make_distinct=True,
            ),
        )

        # insert the queries
        if tb.manually_partition_activity:
            activities = graph_client.activity_index(mavis.company.id).all_activities
            for a in activities:
                if a.table_id != tb.id:
                    continue

                query = _dedupe_identity_query(
                    mavis,
                    mavis.qm.stream_table(tb.activity_stream, activity=a.slug).table,
                    is_prod=True,
                    add_filt=filt,
                )

                count_query = mavis.qm.get_count_query(query).to_query()
                total_rows = mavis.run_query(count_query)
                total_rows = total_rows["rows"][0]["total_rows"]
                logger.debug("Rows missing", total_rows=total_rows)

                if total_rows > 0:
                    # get the query
                    stream_table = mavis.qm.stream_table(tb.activity_stream, is_identity=True)
                    insert_query = qm.get_insert_query(stream_table)
                    mavis.run_query(insert_query, query)
        else:
            query = _dedupe_identity_query(
                mavis,
                mavis.qm.stream_table(tb.activity_stream).table,
                is_prod=True,
                add_filt=filt,
            )

            count_query = mavis.qm.get_count_query(query).to_query()
            total_rows = mavis.run_query(count_query)
            total_rows = total_rows["rows"][0]["total_rows"]
            logger.debug("Rows missing", total_rows=total_rows)

            if total_rows > 0:
                # get the query
                stream_table = mavis.qm.stream_table(tb.activity_stream, is_identity=True)
                insert_query = qm.get_insert_query(stream_table)
                mavis.run_query(insert_query, query)
