import datetime as dt
import json
from random import random

from postmarker.core import PostmarkClient
from pydantic import BaseModel

from batch_jobs.data_management.run_transformations import (
    Plan,
    _get_source_column,
    _get_the_removed_customers,
    _get_transformation_join_key,
    _get_ts_column,
    get_query,
)
from core import utils
from core.errors import InternalError
from core.graph import graph_client
from core.graph.sync_client.enums import sql_query_kinds_enum, transformation_kinds_enum
from core.logger import get_logger
from core.models.internal_link import PORTAL_URL
from core.models.settings import settings
from core.util.email import send_email
from core.util.opentelemetry import tracer
from core.v4.mavis import Mavis

logger = get_logger()


class DuplicatesResults(BaseModel):
    has_duplicates: bool = False
    retry: bool = False
    notes: str | None = None


class MissingResults(BaseModel):
    has_missing: bool = False
    notes: str | None
    start_date: str | None
    end_date: str | None
    day_window: int | None
    max_days: int | None


def get_step(action, sql=None):
    return dict(action=action, sql=sql or "")


def get_template_model(script_running, debug_name):
    return dict(
        script_slug=script_running,
        debug_name=debug_name,
        steps=[],
        outcome=None,
        data=None,
        links=None,
    )


def send_error_email(mavis, error, template_model, passed):
    template_model["error"] = error
    template_model["status"] = "PASSED" if passed else "FAIL"
    template_model["subject"] = "Auto Debugger Ran"
    template_model["company_slug"] = mavis.company.slug
    template_model["header"] = "Auto Debugger Ran"
    template_model["current_time"] = str(dt.datetime.now(dt.UTC))
    # link steps
    for ii, s in enumerate(template_model["steps"]):
        s["ii"] = ii + 1

    send_email(
        mavis.company,
        settings.data_alert_recipients,
        16288501,
        template_model,
        tag="auto_debug",
    )


def _add_query_block(query):
    return f"\n```sql\n{query}\n```\n"


def _get_customer(r):
    return r.get("customer") or r.get("anonymous_customer_id")


def _create_query(mavis: Mavis, query_editor_log: list[str], summary: list[str]):
    return graph_client.insert_sql_query(
        related_to="company",
        related_id=mavis.company.id,
        related_kind=sql_query_kinds_enum.scratchpad,
        sql="{summary} \n\n------------- \n\n{log}\n\n".format(
            summary="\n".join(summary), log="\n".join(query_editor_log)
        ),
        updated_by="Narrator Automated System",
    ).inserted_query


@tracer.start_as_current_span("debug_update_merge")
def debug_update_merge(
    mavis: Mavis,
    table,
    activity_slug,
    activity_transforms,
    start_at=None,
    debug_mode=False,
    is_enrichment=False,
):
    """
    Tries to reason about the update/merge bug
    3 Things can be happening
        DATA IS CHANGING -> Query Editor - part of the error
        1. Data has been delete from production
            - duplicate rows do not exist in production

        DATA IS CHANGING -> Query Editor - part of the error
        2. 1 activity id has 1 value in production but 2 in the activity stream and the 2 values have different ts

        DATA IS CHANGING -> Query Editor - part of the error
        2. 1 activity id has multiple values in production and the stream
        - QUERY IS TRASH

        DATA IS CORRECT -> Query Editor - WE DON'T DEAL WITH THIS
        4. multiple transformations each unique activity id but both are shared.
        UNION IS WRONG but individually it is right

        ------

        3. 1 actiivty_id has 1 value in production but multiple values in the activity stream but the ts are the same
            - if _run_at is the same
                - Data may have changed
                (they duplicated the data in their table and then fixed it)

            # SOMEHOW WE FUCKED UP
            - If _run_at is different
                - some how we picked up the same row again
            * EMAIL AHMED ASAP WTF?

            - delete the duplicates and set the customer activity occurrence to be NULL



    """
    qm = mavis.qm

    query_editor_log = [
        "# Queries Used to Debug",
        "Below are the queries used to diagnose the issues",
    ]

    if is_enrichment:
        col_id = "enriched_activity_id"
        col_ts = "enriched_ts"

        summary = [
            "# Failed Enrichment Assumptions: Debugger Summary",
            f"- Table: {table}",
        ]
        activity_stream = None
    else:
        col_id = "activity_id"
        col_ts = "ts"
        summary = [
            "# Failed Stream Assumptions: Debugger Summary",
            f"- Activity: {activity_slug}",
        ]
        activity_stream = mavis.company.table(table)

    is_partitioned = activity_stream and activity_stream.manually_partition_activity

    query = qm.Query()
    # choose the key columns
    query.add_column(qm.Column(table_column=col_id))
    # add the count
    query.add_column(qm.Column(function="count_all", fields=dict(), name_alias="total_rows"))
    query.add_column(
        qm.Column(
            function="count_distinct",
            fields=dict(column=qm.Column(table_column=col_ts)),
            name_alias="unique_ts",
        )
    )

    # add the filters
    if is_partitioned:
        qm_table = mavis.qm.stream_table(table, activity=activity_slug)
    else:
        qm_table = qm.Table(schema=mavis.company.warehouse_schema, table=table)

    query.set_from(qm_table)

    if not is_enrichment and not is_partitioned:
        query.add_filter(
            qm.Condition(
                operator="equal",
                left=qm.Column(table_column="activity", column_type="string"),
                right=qm.Column(value=activity_slug),
            )
        )

    if start_at:
        query.add_filter(
            qm.Condition(
                operator="greater_than",
                left=qm.Column(table_column=col_ts, column_type="timestamp"),
                right=qm.Column(value=start_at, casting="timestamp"),
            )
        )

    query.add_group_by(1)

    query.add_order_by(3 if not is_enrichment else 2, asc=False)
    query.set_having(
        qm.Condition(
            operator="greater_than",
            left=qm.Column(function="count_all", fields=dict()),
            right=qm.Column(value=1),
        )
    )
    query.set_limit(1000)

    # check for duplicates
    data = mavis.run_query(query.to_query(), within_minutes=0)

    # DEAL with insane but of 10k duplicates
    if data.total_rows == 1_000:
        if debug_mode:
            logger.warning(
                f"{'Activity' +  activity_slug if not is_enrichment else table} has more than 1k duplicate ids. Something is wrong."
            )
        else:
            # TODO: check if it is from the 1 or 2 bad runs- If yes then delete them
            return dict(
                has_duplicates=True,
                retry=False,
                notes=f"{'Activity' +  activity_slug if not is_enrichment else table} has more than 1k duplicate ids. Something is wrong in the query that is causing these duplications. Reach out to support for help debugging.",
            )

    # add to the summary
    summary.append(f"- {mavis.human_format(data.total_rows, 'number')} duplicates found")

    # save off all the duplicate ids
    all_duplicated_ids = [r[col_id] for r in data.rows]

    # if NO rows then return nothing
    if data.total_rows == 0:
        return dict(has_duplicates=False, retry=False, notes=None)

    if None in all_duplicated_ids:
        # communicate the debugging
        query_editor_log.extend(
            [
                "\n<br>\n",
                f"## Run the query below to the see an example of the duplicated data where we see `NULL` value in the {col_id}",
                f"Found NULL in {col_id}(s)",
                _add_query_block(query.to_query()),
            ]
        )
        # dive into one issue (may do this multiple times)
        debug_id = None
    else:
        # communicate the debugging
        query_editor_log.extend(
            [
                "\n<br>\n",
                "## Run the query below to the see an example of the duplicated data",
                f"Found {col_id}(s) that are duplicated",
                _add_query_block(query.to_query()),
            ]
        )
        # dive into one issue (may do this multiple times)
        debug_id = data.rows[0][col_id]

    # handle the imported streams
    if len(activity_transforms) == 0:
        summary.append(" - Activity is imported and thus we cannot help fix it or identify the issue")
        # create the query
        query_obj = _create_query(mavis, query_editor_log, summary)
        return dict(
            has_duplicates=True,
            retry=False,
            notes=f"The imported activity has duplication. Please fix this to ensure accurate data. Debugging details can be found here: {PORTAL_URL}/{mavis.company.slug}/query_editor?query_id={query_obj.id}",
        )

    production_test = qm.Query()
    production_test.add_column(qm.Column(all_columns=True))

    transform_query = get_query(mavis, activity_transforms[0], include_casting=True, include_metadata=True)
    for trans in activity_transforms[1:]:
        # union to the main object or the union
        obj = transform_query.union or transform_query
        obj.set_union(get_query(mavis, trans, include_casting=True, include_metadata=True))

    production_test.set_from(qm.Table(query=transform_query))

    prod_filt = qm.Filter(
        filters=[
            qm.Condition(
                operator="equal",
                left=qm.Column(table_column=col_id, column_type="string"),
                right=qm.Column(value=str(debug_id), column_type="string"),
            )
        ]
    )

    if not is_enrichment:
        prod_filt.add_filter(
            qm.Condition(
                operator="equal",
                left=qm.Column(table_column="activity", column_type="string"),
                right=qm.Column(value=activity_slug, column_type="string"),
            )
        )

    production_test.set_where(prod_filt)
    # check for examples in the production query
    prod_data = mavis.run_query(production_test.to_query())

    # get the data from the activity stream
    stream_test = qm.Query()
    stream_test.add_column(qm.Column(all_columns=True))

    stream_test.set_from(qm_table)

    if not is_enrichment and not is_partitioned:
        stream_test.add_filter(
            qm.Condition(
                operator="equal",
                left=qm.Column(table_column="activity", column_type="string"),
                right=qm.Column(value=activity_slug, column_type="string"),
            )
        )

    stream_test.add_filter(
        qm.Condition(
            operator="equal",
            left=qm.Column(table_column=col_id, column_type="string"),
            right=qm.Column(value=str(debug_id), column_type="string"),
        )
    )

    query_editor_log.extend(
        [
            "\n<br>\n",
            "## Examine an example of one of the duplicated ids",
            f"let us look at `{debug_id}`",
            _add_query_block(production_test.to_query()),
        ]
    )

    # 1. Sample COL_ID returned 0 rows in the SQL Transformation
    if len(prod_data.rows) == 0:
        # showign the row in the code
        query_editor_log.extend(
            [
                "**The example activity id is not found in the SQL transformation, which means the underlying source data is changing.",
                "\n<br>\n",
                f"## Finding the exact row in the {table}",
                _add_query_block(stream_test.to_query()),
            ]
        )

        summary.extend(
            [
                "**Problem: Underlying Data is missing records**",
                f"The source data used by the transformation SQL is changing. Some records are deleted and re-added to the source data under the same {col_id} as time goes on. This is causing duplication in the {table if is_enrichment else 'Activity Stream'}. The rows that are duplicated are using an {col_id} that has been deleted from the SQL Transformation.",
                "\n\n",
                "**Recommended Solution: Fix and Resync**",
                "Figure out why the underlying data is changing, fix that, then resync the SQL transformation - or just delete the duplicated records from the Activity Stream (SQL do the delete is included below)",
            ]
        )

        query_obj = _create_query(mavis, query_editor_log, summary)
        return dict(
            has_duplicates=True,
            retry=False,
            notes=f"The underlying data in the SQL transformation is changing, and some records no longer exist. Debugging details can be found here: {PORTAL_URL}/{mavis.company.slug}/query_editor?query_id={query_obj.id}",
        )

    # DUPLICATIONS EXISTS IN PROD
    elif len(prod_data.rows) > 1:
        # 2. Sample COL_ID returned multiple rows from different sources in the SQL transformation
        if len(set(r["_enrichment_source" if is_enrichment else "_activity_source"] for r in prod_data.rows)) > 1:
            summary.extend(
                [
                    "**Problem: Multiple transformations causing the duplicates**",
                    f"Multiple transformations use the same {col_id} when adding data to the Activity Stream.",
                    "\n\n",
                    "**Recommended Solution: Update the SQL**",
                    f"Concatenate the transformation name with the {col_id} in the SQL to force uniqueness across the multiple transformations that update this activity.",
                ]
            )

            notes = "col_id} was duplicated because multiple transformations are using the same {col_id} for this activity.  Debugging details can be found here {portal}/{company_slug}/query_editor?query_id={query_id}&view=true"

        # 3. Sample COL_ID returned multiple rows in the SQL transformation
        else:
            summary.extend(
                [
                    "**Problem: SQL Transformation is creating duplicates**",
                    "The SQL Transformation has duplication.",
                    "\n\n",
                    "**Recommended Solution: Fix the SQL Transformation**",
                    "Fix the SQL transformation so that it doesn't create duplication.",
                ]
            )

            notes = "{col_id} is duplicated in the SQL transformation.  Debugging details can be seen here {portal}/{company_slug}/query_editor?query_id={query_id}&view=true"

        # create the query
        query_obj = _create_query(mavis, query_editor_log, summary)
        return dict(
            has_duplicates=True,
            retry=False,
            notes=notes.format(
                portal=PORTAL_URL,
                query_id=query_obj.id,
                company_slug=mavis.company.slug,
                col_id=col_id,
            ),
        )

    # PRODUCTION data is not duplicated so it must have duplicated in the stream

    # addign the query for future deletes
    production_test.where.filters[0] = qm.Condition(
        operator="is_in",
        left=qm.Column(table_column=col_id, column_type="string"),
        right=[qm.Column(value=t_id, column_type="string") for t_id in all_duplicated_ids],
    )
    # check for examples in the production query
    stream_data = mavis.run_query(stream_test.to_query())

    query_editor_log.extend(
        [
            "",
            f"## Checking the same row in the {table} table",
            "By looking at the data, we can see what is causing the duplicates.",
            _add_query_block(stream_test.to_query()),
        ]
    )

    # SAME COL_ID different TS
    if len(set(r[col_ts] for r in stream_data.rows)) > 1:
        # 4. SQL Transformation is unique for COL_ID but the activity id has different ts in the stream for the same customer
        if is_enrichment or len(set(_get_customer(r) for r in stream_data.rows)) == 1:
            summary.extend(
                [
                    "**Problem: Timestamps are changing in the underlying data**",
                    "The timestamps in the underlying data are being updated. Activity transformations use incremental processing by default, so the data is getting re-inserted every time the timestamp updates with a new value.",
                    "\n\n",
                    "**Recommended Solution: Fix changing timestamps and resync**",
                    "Figure out why the timestamps are changing, fix that, then resync the SQL transformation - or just delete the duplicated records from the Activity Stream (SQL to remove those duplicates included below)",
                ]
            )

            notes = "{col_id} is duplicated because timestamps are changing as the data is incrementally updating.  Debugging details can be seen here: {portal}/{company_slug}/query_editor?query_id={query_id}&view=true"

        else:
            bad_customer = next(
                (_get_customer(r) for r in stream_data.rows if _get_customer(r) != _get_customer(prod_data.rows[0])),
                None,
            )

            # notify support that something went wrong because there are 2 different customers and 1 row in prod
            if bad_customer is None:
                query_obj = _create_query(mavis, query_editor_log, summary)
                raise InternalError(
                    f"How did the debugger get the same customer. Look at {PORTAL_URL}/{mavis.company.slug}/query_editor?query_id={query_obj.id}"
                )

            # 5. SQL Transformation is unique for COL_ID but the activity id has different values
            summary.extend(
                [
                    "**Problem: Underlying data has changed**",
                    f"The underlying historical data used by the SQL transformation has changed. The duplicates in the activity stream show that the {col_id} has been updated with a different record.  This can be cause by UPSERTS in your ETL process."
                    "\n\n",
                    "**Recommended Solution: Fix changing timestamps and delete existing duplicates from stream**",
                    "Figure out why the timestamps are changing, fix that, then resync the SQL transformation - or just delete the duplicated records from the Activity Stream (SQL to remove those duplicates included below)",
                ]
            )

            notes = "{col_id} is duplicated because {col_id} is being reused.  Debugging details can be seen here {portal}/{company_slug}/query_editor?query_id={query_id}&view=true"

        # consider writing query to fix it
        query_editor_log.extend(
            [
                "",
                "# How to Manually Delete Duplicates from the Activity Stream",
                "Go into `Admin User Mode` and run the query below:",
                "",
                "Run the query below to delete the duplicated rows from the Activity Stream",
                _add_query_block(mavis.qm.get_delete_query(query.from_table, production_test.where)),
                "THEN run this query to reinsert the data from the (non-duplicated) SQL transformation data",
                _add_query_block(mavis.qm.get_insert_query(query.from_table, production_test)),
                "",
                "Rerun the `Run Data Diagnostics` task from the processing page to remove the duplicate error message",
                "",
            ]
        )

        # create the query
        query_obj = _create_query(mavis, query_editor_log, summary)
        return dict(
            has_duplicates=True,
            retry=False,
            notes=notes.format(
                portal=PORTAL_URL,
                query_id=query_obj.id,
                company_slug=mavis.company.slug,
                col_id=col_id,
            ),
        )

    # SAME COL_ID SAME TS
    else:
        # debugging info for Ahmed
        query_editor_log.extend(
            [
                "",
                json.dumps(stream_data.dict()),
                "",
                "**Automatically ran this**",
                _add_query_block(mavis.qm.get_delete_query(query.from_table, production_test.where)),
                "THEN ran this",
                _add_query_block(mavis.qm.get_insert_query(query.from_table, production_test)),
            ]
        )
        mavis.run_query(mavis.qm.get_delete_query(query.from_table, production_test.where))

        # insert the data from prod
        mavis.run_query(mavis.qm.get_insert_query(query.from_table, production_test))

        # TODO: REMOVE THIS LATER - just emailing me to know what is happening
        query_obj = _create_query(mavis, query_editor_log, summary)
        postmark = PostmarkClient(server_token=settings.postmark_api_key.get_secret_value())
        postmark.emails.send(
            From="support@narrator.ai",
            To="ahmed@narrator.ai",
            Subject=f"DELETING Duplicates {mavis.company.slug} - {activity_slug}",
            TextBody=f"{PORTAL_URL}/{mavis.company.slug}/query_editor?query_id={query_obj.id}",
        )

    return dict(
        has_duplicates=True,
        retry=True,
        notes=None,
    )


def should_debug_pkey(qm, pkey, prod_query):
    ## DUPLICATION PROD QUERY
    query = qm.Query()
    # choose the key columns
    query.add_column(qm.Column(table_column=pkey))
    # add the count
    query.add_column(qm.Column(function="count_all", fields=dict(), name_alias="total_rows"))
    query.set_from(qm.Table(query=prod_query))
    query.add_group_by(1)
    query.add_order_by(2, asc=False)
    query.set_having(
        qm.Condition(
            operator="greater_than",
            left=qm.Column(function="count_all", fields=dict()),
            right=qm.Column(value=1),
        )
    )
    query.set_limit(10000)

    # check for duplicates
    return query.to_query()


@tracer.start_as_current_span("debug_duplication_pkey")
def debug_duplication_pkey(mavis, prod_query, pkey, transformation_query=None) -> DuplicatesResults:
    """
    Tries to reason about the update/merge bug
    3 Things can be happening
        DATA IS CHANGING -> Query Editor - part of the error
        1. Data has been delete from production
            - duplicate rows do not exist in production

        DATA IS CHANGING -> Query Editor - part of the error
        2. 1 activity id has 1 value in production but 2 in the activity stream and the 2 values have different ts

        DATA IS CHANGING -> Query Editor - part of the error
        2. 1 activity id has multiple values in production and the stream
        - QUERY IS TRASH

        DATA IS CORRECT -> Query Editor - WE DON'T DEAL WITH THIS
        4. multiple transformations each unique activity id but both are shared.
        UNION IS WRONG but individually it is right

        ------

        3. 1 actiivty_id has 1 value in production but multiple values in the activity stream but the ts are the same
            - if _run_at is the same
                - Data may have changed
                (they duplicated the data in their table and then fixed it)

            # SOMEHOW WE FUCKED UP
            - If _run_at is different
                - some how we picked up the same row again
            * EMAIL AHMED ASAP WTF?

            - delete the duplicates and set the customer activity occurrence to be NULL



    """
    qm = mavis.qm

    query_editor_log = [
        "# Queries Used to Debug",
        "Below are the queries used to diagnose the issues",
    ]

    summary = [
        "# Failed Duplication Assumptions: Debugger Summary",
    ]

    ## DUPLICATION PROD QUERY
    query = qm.Query()
    # choose the key columns
    query.add_column(qm.Column(table_column=pkey))
    # add the count
    query.add_column(qm.Column(function="count_all", fields=dict(), name_alias="total_rows"))
    query.set_from(qm.Table(query=prod_query))
    query.add_group_by(1)
    query.add_order_by(2, asc=False)
    query.set_having(
        qm.Condition(
            operator="greater_than",
            left=qm.Column(function="count_all", fields=dict()),
            right=qm.Column(value=1),
        )
    )
    query.set_limit(10000)

    # check for duplicates
    data = mavis.run_query(query.to_query(), within_minutes=10)

    # DEAL with insane but of 10k duplicates
    if data.total_rows == 10000:
        return DuplicatesResults(
            has_duplicates=True,
            retry=False,
            notes=f"{pkey} has more than 10k duplicate ids.  Something is wrong in the query that is causing these duplications. Reach out to support for help debugging.",
        )

    # add to the summary
    summary.append(f"- {mavis.human_format(data.total_rows, 'number')} duplicates found")

    # save off all the duplicate ids
    all_duplicated_ids = [r[pkey] for r in data.rows]

    # if NO rows then return nothing
    if data.total_rows == 0:
        return DuplicatesResults()

    if None in all_duplicated_ids:
        # communicate the debugging
        query_editor_log.extend(
            [
                "\n<br>\n",
                f"## Run the query below to the see an example of the duplicated data where we see `NULL` value in the {pkey}",
                f"Found NULL in {pkey}(s)",
                _add_query_block(query.to_query()),
            ]
        )

        query_obj = _create_query(mavis, query_editor_log, summary)
        return DuplicatesResults(
            has_duplicates=True,
            retry=False,
            notes=f"Duplicate NULL {pkey} were found. Debugging details can be found here: {PORTAL_URL}/{mavis.company.slug}/query_editor?query_id={query_obj.id}",
        )

    else:
        # communicate the debugging
        query_editor_log.extend(
            [
                "\n<br>\n",
                "## Run the query below to the see an example of the duplicated data",
                f"Found {pkey}(s) that are duplicated",
                _add_query_block(query.to_query()),
            ]
        )
        # dive into one issue (may do this multiple times)
        debug_id = data.rows[0][pkey]

    # Check if the pkey is reused or is the row full duplicate
    # get the data from the processed data
    stream_test = qm.Query()
    stream_test.add_column(qm.Column(all_columns=True))
    stream_test.set_from(qm.Table(query=prod_query))
    stream_test.add_filter(
        qm.Condition(
            operator="equal",
            left=qm.Column(table_column=pkey, column_type="string"),
            right=qm.Column(value=debug_id, column_type="string"),
        )
    )

    # check for examples in the production query
    stream_data = mavis.run_query(stream_test.to_query())

    # SAME COL_ID different TS
    is_identical = True
    row = stream_data.rows[0]
    for r in stream_data.rows[1:]:
        if any(
            v != row[k]
            for k, v in r.items()
            if not k.startswith("_") and k not in ("activity_repeated_at", "activity_occurrence")
        ):
            is_identical = False
            break

    # handle the imported DATA
    if not transformation_query:
        # help the user with better context
        if is_identical:
            # Check if the row is the same
            summary.extend(
                [
                    "**Problem: Likely a bad JOIN**",
                    "The duplicate rows are identical so it is probably caused by a bad JOIN but Narrator cannot debug any further since it doesn't have the SQL",
                    "\n\n",
                    "**Recommended Solution: Fix the data then rerun Validate Data Assumptions**",
                ]
            )
        else:
            summary.append(" - Narrator cannot debug any further because it has no control over the SQL definition")
        # create the query
        query_obj = _create_query(mavis, query_editor_log, summary)
        return DuplicatesResults(
            has_duplicates=True,
            retry=False,
            notes=f"The imported activity has duplication. Please fix this to ensure accurate data. Debugging details can be found here: {PORTAL_URL}/{mavis.company.slug}/query_editor?query_id={query_obj.id}",
        )

    production_test = qm.Query()
    production_test.add_column(qm.Column(all_columns=True))
    production_test.set_from(qm.Table(query=transformation_query))

    prod_filt = qm.Filter(
        filters=[
            qm.Condition(
                operator="equal",
                left=qm.Column(table_column=pkey, column_type="string"),
                right=qm.Column(value=debug_id, column_type="string"),
            )
        ]
    )
    production_test.set_where(prod_filt)

    # create the delete
    delete_table = query.from_table.query.from_table
    delete_filter = qm.Filter(
        filters=[
            qm.Condition(
                operator="is_in",
                left=qm.Column(table_column=pkey, column_type="string"),
                right=[qm.Column(value=r[pkey], column_type="string") for r in data.rows],
            )
        ]
    )
    if query.from_table.query:
        delete_filter.add_filter(query.from_table.query.where)

    # check for examples in the production query
    prod_data = mavis.run_query(production_test.to_query())

    query_editor_log.extend(
        [
            "\n<br>\n",
            "## Examine an example of one of the duplicated ids",
            f"let us look at `{debug_id}`",
            _add_query_block(production_test.to_query()),
        ]
    )

    # 1. Sample COL_ID returned 0 rows in the SQL Transformation
    if len(prod_data.rows) == 0:
        # showign the row in the code
        query_editor_log.extend(
            [
                f"**The example {pkey} is not found in the SQL transformation, which means the underlying source data is changing.",
                "\n<br>\n",
                "## Finding the exact row",
                _add_query_block(stream_test.to_query()),
            ]
        )

        summary.extend(
            [
                "**Problem: Underlying Data is missing records**",
                f"The source data used by the transformation SQL is changing. Some records are deleted and re-added to the source data under the same {pkey} as time goes on. This is causing duplication. The rows that are duplicated are using an {pkey} that has been deleted from the SQL Transformation.",
                "\n\n",
                "**Recommended Solution: Fix and Resync**",
                "Figure out why the underlying data is changing, fix that, then resync the SQL transformation - or just delete the duplicated records from the Activity Stream (SQL do the delete is included below)",
            ]
        )

        query_obj = _create_query(mavis, query_editor_log, summary)
        return DuplicatesResults(
            has_duplicates=True,
            retry=False,
            notes=f"The underlying data in the SQL transformation is changing, and some records no longer exist. Debugging details can be found here: {PORTAL_URL}/{mavis.company.slug}/query_editor?query_id={query_obj.id}",
        )

    # DUPLICATIONS EXISTS IN PROD
    elif prod_data.total_rows > 1:
        # 2. Sample COL_ID returned multiple rows from different sources in the SQL transformation
        source_column = next(
            (
                c["name"]
                for c in prod_data["columns"]
                if c["name"] in ("_activity_source", "_enrichment_source", "_transformation_source")
            ),
            None,
        )
        if source_column and (len(set(r[source_column] for r in prod_data.rows)) > 1):
            summary.extend(
                [
                    "**Problem: Multiple transformations causing the duplicates**",
                    f"Multiple transformations use the same {pkey}.",
                    "\n\n",
                    "**Recommended Solution: Update the SQL**",
                    f"Concatenate the transformation name with the {pkey} in the SQL to force uniqueness across the multiple transformations.",
                ]
            )

            notes = "{pkey} was duplicated because multiple transformations are using the same {pkey} for this activity.  Debugging details can be found here {portal}/{company_slug}/query_editor?query_id={query_id}&view=true"

        # 3. Sample COL_ID returned multiple rows in the SQL transformation
        else:
            summary.extend(
                [
                    "**Problem: SQL Transformation is creating duplicates**",
                    "The SQL Transformation has duplication.",
                    "\n\n",
                    "**Recommended Solution: Fix the SQL Transformation**",
                    "Fix the SQL transformation so that it doesn't create duplication.",
                ]
            )

            notes = "{pkey} is duplicated in the SQL transformation.  Debugging details can be seen here {portal}/{company_slug}/query_editor?query_id={query_id}&view=true"

        # create the query
        query_obj = _create_query(mavis, query_editor_log, summary)
        return DuplicatesResults(
            has_duplicates=True,
            retry=False,
            notes=notes.format(
                portal=PORTAL_URL,
                query_id=query_obj.id,
                company_slug=mavis.company.slug,
                pkey=pkey,
            ),
        )

    # PRODUCTION data is not duplicated so it must have duplicated in the stream
    # addign the query for future deletes
    production_test.where.filters[0] = qm.Condition(
        operator="is_in",
        left=qm.Column(table_column=pkey, column_type="string"),
        right=[qm.Column(value=t_id, column_type="string") for t_id in all_duplicated_ids],
    )

    query_editor_log.extend(
        [
            "",
            "## Checking the same row",
            "By looking at the data, we can see what is causing the duplicates.",
            _add_query_block(stream_test.to_query()),
        ]
    )

    # fix the table issue
    delete_filter.remove_alias()
    delete_table.alias = None

    if not is_identical:
        # 4. SQL Transformation is unique for COL_ID but the activity id has different ts in the stream for the same customer
        summary.extend(
            [
                "**Problem: Data is changing in the underlying data**",
                "The the underlying data are being updated.  This might be caused because of incremental updates.  So if a timestamp is changing, then the new timestamp will be reinserted into the stream thus causing duplicate pkey.",
                "\n\n",
                f"**Recommended Solution: Create immutable {pkey} or use Materialized Views**",
                "Figure out why the data are changing, fix that, then resync the SQL transformation - or use the most recent data by deleting all the data and reinserting on every update",
            ]
        )

        notes = "{pkey} is duplicated because timestamps are changing as the data is incrementally updating.  Debugging details can be seen here: {portal}/{company_slug}/query_editor?query_id={query_id}&view=true"

        # consider writing query to fix it
        query_editor_log.extend(
            [
                "",
                "# How Manually Delete Duplicates",
                "Go into `Admin User Mode` and run the query below:",
                "",
                "Run the query below to delete the duplicated rows from the Activity Stream",
                _add_query_block(mavis.qm.get_delete_query(delete_table, delete_filter)),
                "THEN run this query to reinsert the data from the (non-duplicated) SQL transformation data",
                _add_query_block(mavis.qm.get_insert_query(delete_table, production_test)),
                "",
                "Rerun the `Run Data Diagnostics` task from the processing page to remove the duplicate error message",
                "",
            ]
        )

        # create the query
        query_obj = _create_query(mavis, query_editor_log, summary)
        return DuplicatesResults(
            has_duplicates=True,
            retry=False,
            notes=notes.format(
                portal=PORTAL_URL,
                query_id=query_obj.id,
                company_slug=mavis.company.slug,
                pkey=pkey,
            ),
        )

    # SAME COL_ID SAME TS
    else:
        # debugging info for Ahmed
        query_editor_log.extend(
            [
                "",
                json.dumps(stream_data.dict()),
                "",
                "**Automatically ran this**",
                _add_query_block(mavis.qm.get_delete_query(delete_table, delete_filter)),
                "THEN ran this",
                _add_query_block(mavis.qm.get_insert_query(delete_table, production_test)),
            ]
        )

        # if not debug_mode:
        # delete all the duplicates from production
        mavis.run_query(mavis.qm.get_delete_query(delete_table, delete_filter))

        # insert the data from prod
        mavis.run_query(mavis.qm.get_insert_query(delete_table, production_test))

        # TODO: REMOVE THIS LATER - just emailing me to know what is happening
        query_obj = _create_query(mavis, query_editor_log, summary)
        postmark = PostmarkClient(server_token=settings.postmark_api_key.get_secret_value())
        postmark.emails.send(
            From="support@narrator.ai",
            To="ahmed@narrator.ai",
            Subject=f"DELETING Duplicates {mavis.company.slug}",
            TextBody=f"{PORTAL_URL}/{mavis.company.slug}/query_editor?query_id={query_obj.id}",
        )

    return DuplicatesResults(
        has_duplicates=True,
        retry=True,
        notes=None,
    )


@tracer.start_as_current_span("debug_incremental_old_data")
def debug_incremental_old_data(mavis, transform, remove_list_transforms):
    """
    # RANDOMLY SAMPLE 15 days in the past and diff the stream and see if that any of that data is missing FOR INCREMNTAL
    # GO PAST The configured days to reconcile in company / transformation

    """
    qm = mavis.qm

    query_editor_log = [
        "# Queries Used to Debug",
        "Below are the queries used to diagnose the issues",
    ]

    col_id = _get_transformation_join_key(transform.column_renames)
    col_ts = _get_ts_column(transform.kind, transform.column_renames)
    col_slug = _get_source_column(transform.kind)
    activity_stream = mavis.company.table(transform.table)

    day_window = 15
    max_days = transform.mutable_day_window or mavis.config.mutable_update_window or 15

    end_date = utils.date_add(
        utils.date_add(utils.utcnow(), "day", -max_days),
        "day",
        -365 * 2 * random(),  # noqa: S311
    )

    start_date = utils.date_add(end_date, "day", -day_window)

    # define the query
    valid_ids_query = qm.Query()
    valid_ids_query.add_column(qm.Column(table_column=col_id))
    extra_queries = []

    # add the filters
    if activity_stream and activity_stream.manually_partition_activity:
        if len(transform.activities) == 1:
            qm_table = mavis.qm.stream_table(transform.table, activity=transform.activities[0].activity.slug)
        else:
            qm_table = qm.Table(
                query=qm.wrap_query(
                    mavis.qm.get_activity_table(
                        activity_stream.activity_stream,
                        [a.slug for a in transform.activities],
                        alias="a",
                    ),
                )
            )

    else:
        qm_table = mavis.qm.stream_table(table=transform.table)

    valid_ids_query.set_from(qm_table)
    valid_ids_query.add_filter(
        qm.Condition(
            operator="equal",
            left=qm.Column(table_column=col_slug),
            right=qm.Column(value=transform.slug),
        )
    )

    production_test = qm.Query()
    production_test.add_column(qm.Column(all_columns=True))

    transform_query = get_query(mavis, transform, include_casting=True, include_metadata=True)
    transform_query.add_fields(from_sync_time=start_date, to_sync_time=end_date)

    production_test.set_from(qm.Table(query=transform_query))
    # add the queries
    for q in [production_test, valid_ids_query] + extra_queries:
        q.add_filter(
            qm.Condition(
                operator="greater_than",
                left=qm.Column(table_column=col_ts),
                right=qm.Column(value=start_date, casting="timestamp"),
            )
        )
        q.add_filter(
            qm.Condition(
                operator="less_than",
                left=qm.Column(table_column=col_ts),
                right=qm.Column(value=end_date, casting="timestamp"),
            )
        )

    # find the missing data
    production_test.add_filter(
        qm.Condition(
            operator="not_is_in",
            left=qm.Column(table_column=col_id, column_type="string"),
            right=valid_ids_query,
        )
    )
    production_test.set_limit(1000)
    prod_data = mavis.run_query(production_test.to_query())

    # implement the Remove list on them
    if len(prod_data.rows) > 0 and activity_stream and remove_list_transforms:
        plan = Plan(
            mavis,
            remove_list_transforms,
            activity_stream.activity_stream,
            kind=transformation_kinds_enum.stream,
            manually_partition=activity_stream.manually_partition_activity,
        )

        # ensure no data is beign alerted on
        for process in plan.processes:
            for use_annon in (True, False):
                col = "anonymous_customer_id" if use_annon else "customer"

                values = utils.unique_values(utils.get_column_values(prod_data, col, skip_null=True))

                if values and (use_annon is False or process.has_source):
                    # get the query
                    remove_query = _get_the_removed_customers(plan, process, use_annon=use_annon)
                    remove_query.add_filter(
                        qm.Condition(
                            operator="is_in",
                            left=qm.Column(table_column=col, column_type="string"),
                            right=[qm.Column(value=c) for c in values],
                        )
                    )

                    # check if they are in the remove list
                    removed_response = mavis.run_query(remove_query.to_query())
                    found_data = utils.get_column_values(removed_response, col)

                    prod_data.rows = [r for r in prod_data.rows if not r[col] or r[col] not in found_data]

    if len(prod_data.rows) > 0:
        query_editor_log.extend(
            [
                "\n<br>\n",
                "## Looking for old missing data",
                "Narrtor is incremental, and reconciles the last window of days, so for data to be missing it must mean that you have data changing in the past",
                _add_query_block(production_test.to_query()),
            ]
        )
        summary = [
            "**Data is being added with older ts**",
            "It appears that some data in production is not being updated in the table",
            "\n\n",
            "**Recommended Solution:  Change Update Type or Resync**",
            "If this is common, then you may want to change your update type in the transformation to `Insert Missing Rows Only`.  If this was due to a one time update of the data, then resync the tables.  ",
        ]
        query_obj = _create_query(mavis, query_editor_log, summary)

        return MissingResults(
            has_missing=True,
            notes=f"The underlying data in the SQL transformation has data that is inserted in the past. Debugging details can be found here: {PORTAL_URL}/{mavis.company.slug}/query_editor?query_id={query_obj.id}",
            end_date=end_date,
            start_date=start_date,
            day_window=day_window,
            max_days=max_days,
        )

    else:
        return MissingResults()


@tracer.start_as_current_span("debug_casting_issue")
def debug_casting_issue(mavis, transform):
    """
    checks to see if the casting is their for the columns.  If no, then add it.  If yes then email us
    """
    # check all the feature columns:
    proper_column_types = [
        ("revenue_impact", "float"),
        ("link", "string"),
        ("feature_1", "string"),
        ("feature_2", "string"),
        ("feature_3", "string"),
        ("source_id", "string"),
        ("enriched_activity_id", "string"),
        ("activity_id", "string"),
        ("activity", "string"),
        ("source", "string"),
        ("customer", "string"),
        ("anonymous_customer_id", "string"),
    ]

    # create a reference to all the columns
    transform_types = {c.name: c for c in transform.column_renames}
    # keep going
    for col_name, proper_type in proper_column_types:
        # ignore feature columns for the json
        if col_name.startswith("feature_"):
            continue

        c = transform_types.get(col_name)
        if c:
            # if the column is not the right type as the expected data then fix it
            if (c.casting or c.type) != proper_type:
                graph_client.update_transformation_column_casting(id=c.id, casting=proper_type)
                return True

            # if the column is a string and it should be a string, then try casting it as a string (this will handle the case where the column is too long)
            elif c.casting != "string" and proper_type == "string":
                graph_client.update_transformation_column_casting(id=c.id, casting="string")
                logger.info("Updated Column", column=c.name, casting="string")
                return True

    return False


@tracer.start_as_current_span("debug_bytes_issue")
def debug_bytes_issue(mavis: Mavis, transform, error: str) -> bool:
    """
    If you see a byte column then fix it
    """
    # find the column in the transformation and fix it
    for c in transform.column_renames:
        if c.name in error:
            graph_client.update_transformation_column_casting(id=c.id, casting="string")
            return True
    return False


@tracer.start_as_current_span("debug_single_activity_flag")
def debug_single_activity_flag(mavis: Mavis, transform) -> bool:
    """
    Checks if there is a flag for this issue, if no, changes it to yes, if yes errors out with email
    """
    if not transform.single_activity:
        graph_client.update_transformation_single_activity(transformation_id=transform.id, single_activity=True)
        return True


@tracer.start_as_current_span("cast_timestamp")
def cast_timestamp(mavis: Mavis, transform) -> bool:
    """
    checks to see if the casting is there for the columns.  If no, then add it.  If yes, then email us.
    """
    # a query is having a bad timestamp so we are casting it
    for c in transform.column_renames:
        if c.casting != "timestamp" and c.name in (
            "ts",
            "enriched_ts",
        ):
            graph_client.update_transformation_column_casting(id=c.id, casting="timestamp")
            return True
    return False
