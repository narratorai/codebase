from copy import deepcopy

from batch_jobs.data_management.run_transformations import _create_activity_stream
from core.decorators import with_mavis
from core.graph import graph_client
from core.logger import get_logger
from core.v4.mavis import Mavis

logger = get_logger()


def _apply_to_table(mavis, table, is_manual=False):
    try:
        if mavis.company.warehouse_language == "redshift":
            if is_manual:
                mavis.run_query(f'ALTER TABLE {table.to_query()} ALTER SORTKEY ("ts")')
            else:
                mavis.run_query(f'ALTER TABLE {table.to_query()} ALTER SORTKEY ("activity", "ts")')

        elif mavis.company.warehouse_language == "snowflake":
            if is_manual:
                mavis.run_query(f"ALTER TABLE {table.to_query()} ALTER CLUSTER BY customer")
            else:
                mavis.run_query(f"ALTER TABLE {table.to_query()} ALTER CLUSTER BY (activity, customer)")

        elif mavis.company.warehouse_language == "pg":
            for index in ["ac", "ac_null", "ac_1", "ar"]:
                mavis.run_query(f"Drop index if exists {table.table}_{index}_idx")
        elif mavis.company.warehouse_language == "bigquery":
            temp_table = deepcopy(table)
            temp_table.table = temp_table.table + "_temp"
            try:
                data = mavis.run_query(f"SELECT * FROM {temp_table.to_query()} LIMIT 10")  # noqa: S608
            except Exception:
                data = None
            if data is None:
                mavis.run_query(
                    _create_activity_stream(
                        mavis, temp_table.table, manually_partitioned=is_manual, no_add_onds=False, do_not_run=True
                    )
                )

            if data is None or data.total_rows == 0:
                mavis.run_query(f"INSERT INTO {temp_table.to_query()} (SELECT * FROM {table.to_query()})")  # noqa: S608
            mavis.run_query(f"DROP TABLE {table.to_query()}")
            mavis.run_query(f"ALTER TABLE {temp_table.to_query()} RENAME TO {table.table}")
    except Exception as e:
        logger.debug(f"Failed to update sort key for {table.to_query()}: {str(e)}")


def _remove_occurrence(mavis: Mavis):
    tables = None
    if mavis.company.warehouse_language == "bigquery":
        data = mavis.run_query("""
            SELECT
                DISTINCT table_name
            FROM
            `narrator.INFORMATION_SCHEMA.COLUMNS`
            WHERE clustering_ordinal_position IS NOT NULL
            and column_name = 'activity'
            """)
        tables = [r["table_name"] for r in data.rows]

    for ct in mavis.company.tables:
        if ct.manually_partition_activity:
            all_activity = graph_client.activity_index(mavis.company.id).all_activities
            tables_to_process = [
                mavis.qm.stream_table(ct.activity_stream, activity=a.slug) for a in all_activity if a.table_id == ct.id
            ]
            tables_to_process = [t for t in tables_to_process if tables is None or t.table in tables]
            for table in tables_to_process:
                _apply_to_table(mavis, table, True)
        else:
            table = mavis.qm.stream_table(ct.activity_stream)
            if tables is None or table.table in tables:
                _apply_to_table(mavis, table, False)


@with_mavis
def fix_activity_stream(mavis: Mavis, **kwargs):
    """
    Gets the path of the company
    """
    # tables_updator = TableUpdator(mavis=mavis)
    # for t in mavis.company.tables:
    #     tables_updator.update_permissions(t.id, [TeamPermission(id=mavis.company.everyone_team_id)])

    # all_objs = graph_client.get_company_users(mavis.company.id).company_user
    # updator = UserUpdator(mavis=mavis)
    # for u in all_objs:
    #     user = graph_client.get_user(u.user_id).user_by_pk
    #     if user.role == "admin" and mavis.company.admin_team_id != [t.team_id for t in u.team_users]:
    #         print(f'adding TEAM {u.user.email} to "ADMIN"')
    #         updator.add_team(u.user_id, mavis.company.admin_team_id)

    #     if mavis.company.everyone_team_id not in [t.team_id for t in u.team_users]:
    #         print(f'adding TEAM {u.user.email} to "EVERYONE"')
    #         updator.add_team(u.user_id, mavis.company.everyone_team_id)

    #     # ensure it is updated in redis
    #     logger.info(f"resetting user {u.user_id}")
    #     updator.reset(u.user_id)

    _remove_occurrence(mavis)
