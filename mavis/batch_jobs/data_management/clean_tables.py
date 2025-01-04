import datetime as dt

from core.decorators import mutex_task, with_mavis
from core.graph import graph_client
from core.logger import get_logger
from core.v4.mavis import Mavis
from core.v4.query_mapping.components import Table

logger = get_logger()


def get_narrator_tables(mavis: Mavis):
    company_id = mavis.company.id

    all_dims = graph_client.get_company_dims(company_id=company_id).dim_tables
    all_tables: list[Table] = []

    # go through all the different tables
    for dim in all_dims:
        table = mavis.qm.Table(schema=dim.schema_, table=dim.table)
        all_tables.append(table)

    # get all the activities
    all_activities = graph_client.activity_index(company_id=company_id).all_activities

    for ct in mavis.company.tables:
        if ct.manually_partition_activity:
            for a in all_activities:
                if a.table_id == ct.id:
                    all_tables.append(mavis.qm.stream_table(ct, activity=a.slug))

        # process the other tables
        else:
            all_tables.append(mavis.qm.stream_table(ct))

        # add the staging and identity tables
        all_tables.append(mavis.qm.stream_table(ct, is_staging=True))
        all_tables.append(mavis.qm.stream_table(ct, is_identity=True))

    return all_tables


def _check_continue(mavis: Mavis, utc_tic, table_progress):
    if (dt.datetime.now(dt.UTC) - utc_tic).seconds > 32_000_000:
        # log all the work
        mavis.company.s3.upload_file(table_progress, ["clean_progress", "all_tables.json"])

        # trigger another run
        clean_tables.send_with_options(
            kwargs=dict(
                company_slug=mavis.company.slug,
                task_id=mavis.company.get_task_id("vacuum_full_warehouse"),
            ),
            delay=60_000,
        )
        return True
    return False


def run_clean(mavis: Mavis, all_tables: list[Table]):
    table_progress = mavis.company.s3.get_file(["clean_progress", "all_tables.json"]) or dict(tables=[])

    utc_tic = dt.datetime.now(dt.UTC)

    # run the query and don't rerun it if is already running
    for t in set(all_tables):
        if t.to_query() in table_progress["tables"]:
            continue

        # keep ensuring that you are not taking up too much time and should restart the task
        if _check_continue(mavis, utc_tic, table_progress):
            return None

        # run the cleaning
        clean_query = mavis.qm.get_clean_up_query(t)

        if clean_query:
            try:
                mavis.run_query(clean_query, as_admin=True)
            except Exception:
                logger.info("Skipping table")

        # keep the query
        table_progress["tables"].append(t.to_query())

    # once it is done, then delete the tables
    mavis.company.s3.delete_object(["clean_progress", "all_tables.json"])
    return None


def clean_internal_warehouse(mavis: Mavis, **kwargs):
    """
    Run clean on internal warehouse tables.
    """
    # Run all the vacuum needed
    vacuum_impact = mavis.qm.get_vacuum_impact_query()
    if vacuum_impact:
        vacuum_impact_data = mavis.run_query(vacuum_impact, as_admin=True, within_minutes=1000)
        for row in vacuum_impact_data.rows:
            table = mavis.qm.Table(schema=row["table_schema"], table=row["table_name"])
            clean_query = mavis.qm.get_clean_up_query(table)
            if clean_query:
                mavis.run_query(clean_query, as_admin=True)

    encoding_recommendation = mavis.qm.get_encoding_recommendation()
    if encoding_recommendation:
        encoding_recommendation_data = mavis.run_query(encoding_recommendation, as_admin=True, within_minutes=1_000)
        for row in encoding_recommendation_data.rows:
            mavis.run_query(row["ddl"], as_admin=True)


@mutex_task()
@with_mavis
def clean_tables(mavis: Mavis, **kwargs):
    """
    Run clean on narrator tables.
    """
    tables = get_narrator_tables(mavis)
    run_clean(mavis, tables)

    # run this for us
    if mavis.company.slug == "narrator":
        clean_internal_warehouse(mavis)
