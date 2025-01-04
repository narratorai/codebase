from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from hashlib import md5
from random import randint
from time import sleep

import backoff
import dramatiq
from backoff import on_exception
from dramatiq.middleware import TimeLimitExceeded
from dramatiq.middleware.shutdown import Shutdown
from dramatiq.results import ResultTimeout
from dramatiq_abort import abort
from dramatiq_abort.abort_manager import Abort
from google.cloud.bigquery import Dataset
from opentelemetry.trace import get_current_span
from pydantic import BaseModel, Field
from sentry_sdk import capture_exception
from sqlparse import parse
from sqlparse.tokens import Keyword

from core import utils
from core.constants import NUMBER_OF_CONNECTIONS_PER_COMPANY
from core.errors import (
    ConnectionError,
    QueryRunError,
    SilenceError,
    WarehouseRandomError,
)
from core.graph import sync_client as graph
from core.logger import get_logger
from core.models.company import Company, _get_datasource, query_graph_company
from core.models.ids import get_uuid
from core.models.mavis_config import MavisConfig, mavis_config_path
from core.models.table import Metadata, TableData, convert_type, guess_format
from core.models.user import AuthenticatedUser, UserCompany, UserTags
from core.models.warehouse_schema import TableSchema, TableSchemaColumn, WarehouseSchema
from core.util.db import (
    Connection,
    ConnectionClosed,
    ConnectionPool,
    create_cached_pool,
)
from core.util.opentelemetry import tracer

from .query_runner import BaseSQLQueryRunner, with_ssh_tunnel
from .queryMapper import QueryMapper

logger = get_logger()


class LocalStore(BaseModel):
    message_id: str | None = None
    """For logging SQL queries in batch"""

    started_at: datetime | None = None

    upload_query_at: datetime | None = None
    """Keeping track of processing config"""

    config: MavisConfig | None = None

    query_runner: dict = Field(default_factory=dict)
    """For running and overriding query runner"""


@on_exception(backoff.constant, Exception, max_tries=2, logger=logger)
def connection_factory(company_slug, **kwargs):
    datasource = _get_datasource(company_slug)
    return Connection(query_runner=datasource, **kwargs)


@dataclass(init=False)
class Mavis:
    company: Company
    qm: QueryMapper
    connection_pool: ConnectionPool

    def __init__(self, *, company: Company):
        # create the initial model
        self.company: Company = company

        # a mavis instance carries some extras for convenience
        self.qm: QueryMapper = QueryMapper(
            language=self.company.warehouse_language,
            copy_role=self.company.resources.company_role,
            start_data_on=self.company.start_data_on,
            warehouse_schema=self.company.warehouse_schema,
            timezone=self.company.timezone,
            week_day_offset=self.company.week_day_offset,
        )
        self.store: LocalStore = LocalStore()

        self.connection_pool = create_cached_pool(
            self.company.slug,
            max_size=NUMBER_OF_CONNECTIONS_PER_COMPANY,
            timeout=1_800.0,
            connection_factory=connection_factory,
        )

    @property
    def user(self):
        return self.company.user

    @property
    def config(self) -> MavisConfig:
        if config := self.store.config:
            return config

        t_config = self.company.s3.get_file(mavis_config_path)
        if t_config:
            config = MavisConfig(**{k: v for k, v in t_config.items() if v != {}})
        else:
            config = MavisConfig()
        self.store.config = config
        return config

    def set_message_id(self, task_execution_id: str, started_at: datetime | None = None):
        if task_execution_id:
            self.store.message_id = task_execution_id
            self.store.started_at = started_at or datetime.now(UTC)

    def _override_datasource(self, options, use_admin):
        qr = self.store.query_runner[use_admin] = self.qm.config["query_runner"](options)
        if options.get("ssh_tunnel") is not None:
            self.store[use_admin] = (with_ssh_tunnel(qr, options.get("ssh_tunnel")),)

    def get_datasource(self, use_admin=False, options=None) -> BaseSQLQueryRunner:
        if use_admin and self.qm.language != "redshift":
            use_admin = False

        qr = self.store.query_runner

        if cur_qr := qr.get(use_admin):
            return cur_qr

        key = f'{self.company.warehouse_language}{"_admin" if use_admin else ""}'
        # Initialize the query runner
        options = self.company.load_secret(key)

        if options is None:
            if use_admin:
                options = self.company.load_secret(self.company.warehouse_language)
            else:
                raise SilenceError("No connection")

        qr[use_admin] = self.qm.config["query_runner"](options)

        if options.get("ssh_tunnel") is not None:
            qr[use_admin] = with_ssh_tunnel(qr[use_admin], options.get("ssh_tunnel"))

        return qr[use_admin]

    def _should_sync_query(self) -> bool:
        if self.store.message_id and self.store.started_at:
            fifteen_minutes_ago = datetime.now(UTC) - timedelta(minutes=15)
            five_minutes_ago = datetime.now(UTC) - timedelta(minutes=5)

            # If we started the query within the last 15 minutes,
            # and we haven't uploaded data in the last 5 minutes, we should sync the query.
            if self.store.started_at < fifteen_minutes_ago and (
                self.store.upload_query_at is None or self.upload_query_at < five_minutes_ago
            ):
                self.upload_query_at = datetime.now(UTC)
                return True

        return False

    def _add_limit(self, query: str, *, skip_limit_check: bool = False, limit: int = 1_000) -> str:
        has_no_limit = "limit" not in query.lower().split() and "top" not in query.lower().split()

        is_select = query.lower().strip().split()[0] not in (
            "insert",
            "delete",
            "update",
        )

        if not skip_limit_check and has_no_limit:
            # Handle adding a LIMIT to the query if SELECT
            statements = parse(query)
            for statement in statements:
                statement_type = statement.get_type()
                is_select = statement_type == "SELECT"
                if statement_type == "SELECT" and not any(
                    token.ttype is Keyword and token.value.upper() in ("LIMIT", "TOP") for token in statement.tokens
                ):
                    wrapped_query = self.qm.wrap_query(query)
                    wrapped_query.set_limit(limit)
                    return (wrapped_query.to_query(), is_select)

        return (query, is_select)

    def _cancel_query(self, query: str, *, use_admin: bool):
        with self.connection_pool.connection() as connection:
            try:
                did_cancel = connection.cancel_query(query)
            except Exception as e:
                did_cancel = False
                logger.error("Cancel query errored out", error=e)

        if did_cancel:
            logger.debug("Cancelled query", query=query)
        else:
            logger.warn("Query was not running", query=query)

    def _record_query(self, query: str):
        if self._should_sync_query():
            try:
                details = dict(running_query=query, ran_at=utils.utcnow())
                self.update_task_details(details)
            except Exception:
                self.store.message_id = None
                logger.exception("Could not update query")

    def update_task_details(self, details):
        affected_rows = graph.record_task_query(
            message_id=self.store.message_id, details=details
        ).update_task_execution.affected_rows

        # do not bother if no orchestration can be found: most likely locally
        if affected_rows == 0:
            logger.info("Orchestration cannot be found")
            self.store.message_id = None

    @on_exception(backoff.constant, ConnectionClosed, max_tries=2, logger=logger)
    def _run_query_raw(
        self,
        query: str,
        use_admin: bool = False,
        skip_limit_check: bool = False,
    ) -> TableData | None:
        logger.debug("Running query", query=query, use_admin=use_admin)

        query, is_select = self._add_limit(query, skip_limit_check=skip_limit_check or use_admin)
        # Log the query after the connection has been made available
        self._record_query(query)

        if use_admin or self.store.query_runner.get(use_admin) is not None:
            datasource = self.get_datasource(use_admin=use_admin)
            try:
                results, error = datasource.run_query(query)
            except Exception as e:
                error = str(e)
                results = None
        else:
            # handle potential warehouse connection changes
            seconds_since_update = utils.date_diff(self.company.updated_at, utils.utcnow(), "seconds")
            if seconds_since_update < 1_800:
                self.connection_pool.reset_old(seconds_since_update)

            with self.connection_pool.connection() as connection:
                try:
                    results, error = connection.run_query(query)
                except (Shutdown, Abort):
                    connection.cancel_query(query)
                    raise
                except Exception as e:
                    error = str(e)
                    results = None

                # Close the connection
                if error and any(
                    ce in error.lower()
                    for ce in (
                        "connection already closed",
                        "redshift_connector_statement",
                    )
                ):
                    connection.expire()
                    raise ConnectionClosed()

        if results is None and error is None:
            raise SilenceError("Query failed to run")

        if results is not None:
            # We do this to clean up the structure
            for c in results["columns"]:
                c["id"] = c["name"]
                c["field"] = c["name"]
                c["header_name"] = c.get("friendly_name") or c["name"]
                c["raw_type"] = c.get("type") or "string"
                c["type"] = convert_type(c["raw_type"])
                c["context"] = dict(format=guess_format(c["header_name"], c["type"]))
            # create the table
            results = TableData(
                **results,
                context=Metadata(
                    timezone=self.company.timezone,
                    locale=self.company.locale,
                    currency=self.company.currency_used,
                    data_scanned=results.get("metadata", {}).get("data_scanned"),
                    snapshot_time=results.get("retrieved_at"),
                ),
            )

        if error:
            self._handle_query_error(error, query=query)
            return None
        elif is_select and not use_admin and self.company.cache_minutes:
            try:
                # cache the data if mavis maintains a cache
                self.save_query_cache(query, results)
            except Exception as e:
                logger.exception("Failed to cache", query=query)
                get_current_span().record_exception(e)

        return results

    @tracer.start_as_current_span("cancel_query")
    def cancel_query(self, query: str, skip_limit_check: bool = False, use_admin: bool = False):
        (query, _) = self._add_limit(query, skip_limit_check=skip_limit_check)
        return self._cancel_query(query, use_admin=use_admin)

    @tracer.start_as_current_span("run_query")
    def run_query(
        self,
        query: str | list[str],
        within_minutes: int | None = 0,
        as_admin: bool = False,
        skip_limit_check: bool = False,
    ) -> TableData | None:
        # handl ana array of queries
        if isinstance(query, list):
            return [self.run_query(q, within_minutes, as_admin, skip_limit_check) for q in query]

        """Run a query."""
        if within_minutes is None:
            within_minutes = self.company.cache_minutes

        logger.debug(
            "Running query START",
            within_minutes=within_minutes,
            as_admin=as_admin,
            skip_limit_check=skip_limit_check,
        )
        span = get_current_span()
        span.set_attributes({"query": query, "within_minutes": within_minutes})

        # if we show server then use s3 for our cache
        if within_minutes > 0 and not as_admin:
            logger.debug("checking cache", query=query, within_minutes=within_minutes)
            # check if the hash exists
            results = self.get_query_cache(query, within_minutes)
            if results:
                logger.debug("cache hit", query=query, within_minutes=within_minutes)
                return results

        try:
            results = self._run_query_raw(
                query,
                use_admin=as_admin,
                skip_limit_check=skip_limit_check,
            )
        except WarehouseRandomError:
            self.connection_pool.expire_all()
            if "INSERT" not in query:
                span.add_event("retrying_query")
                logger.info("Retrying query due to random error", query=query)

                sleep(2)
                results = self._run_query_raw(
                    query,
                    use_admin=as_admin,
                    skip_limit_check=skip_limit_check,
                )
            else:
                raise

        return results

    @tracer.start_as_current_span("_run_and_save_query")
    def _run_and_save_query(self, query, within_minutes, query_queue, retry_count=0):
        is_insert = "INSERT" in query
        try:
            results = self.run_query(query, within_minutes=within_minutes)
            if not is_insert and results is None:
                results = self.run_query(query, within_minutes=within_minutes)
            if results is None:
                raise QueryRunError("Query returned no results", query=query)
            query_queue[query] = results
        except WarehouseRandomError as e:
            if retry_count < 3 and "INSERT" not in query:
                delay = randint(1, 10)  # noqa: S311
                logger.info("Retrying query", query=query, delay=delay)

                sleep(delay)
                self._run_and_save_query(query, within_minutes, query_queue, retry_count + 1)
            else:
                query_queue[query] = dict(error=utils.get_error_message(e))
        except Exception as e:
            query_queue[query] = dict(error=utils.get_error_message(e))

    @tracer.start_as_current_span("batch_run_query")
    def batch_run_query(
        self,
        all_queries: list[str],
        raise_on_error: bool = True,
        within_minutes: int = 0,
    ):
        query_queue = {}
        GROUP_RUN = 200  # TURN of batch and see if things get stuck
        MAX_PARALLELL = 8

        if len(all_queries) < GROUP_RUN:
            for ii, q in enumerate(all_queries):
                try:
                    self._run_and_save_query(q, within_minutes, query_queue)
                    if ii % 10 == 0:
                        logger.debug("Running queries", idx=ii, total=len(all_queries))
                except QueryRunError as exc:
                    if raise_on_error:
                        raise SilenceError("QueryRunError: " + str(exc))  # Consider customizing the error message
                    # save the queue
                    query_queue[q] = {
                        "error": exc,
                        "idx": all_queries.index(q),
                        "query": q,
                    }
        else:
            s3_keys = []
            all_paths = []

            # the goal is to split the work to be a maximum of MAX_PARALLELL threads
            group_by = (
                len(all_queries) // MAX_PARALLELL + 1 if len(all_queries) / GROUP_RUN > MAX_PARALLELL else GROUP_RUN
            )

            for ii in range(0, len(all_queries), group_by):
                s3_key = get_uuid()
                path = ["async", "queries", f"{s3_key}.json"]
                self.company.s3.upload_object(
                    dict(
                        queries=all_queries[ii : ii + group_by],
                        raise_on_error=raise_on_error,
                        within_minutes=within_minutes,
                    ),
                    path,
                    expire_in_days=1,
                )
                s3_keys.append(s3_key)
                all_paths.append(path)

            from batch_jobs.data_management.run_query import async_batch_run

            # group all the keys
            group = dramatiq.group(
                [
                    async_batch_run.message(
                        self.company.slug,
                        s3_key,
                        self.store.message_id,
                        (self.store.started_at.isoformat() if self.store.started_at else None),
                    )
                    for s3_key in s3_keys
                ]
            )
            group.run()

            try:
                logger.debug("Waiting for queries to finish", group_count=len(group.children))
                three_hours_ms = 3 * 60 * 60 * 1000
                group.wait(timeout=three_hours_ms)

                for path in all_paths:
                    res = self.company.s3.get_file(path)
                    if res.get("done"):
                        # handle full errors
                        if res.get("full_error") and raise_on_error:
                            raise SilenceError(res["full_error"])

                        for k, v in res["results"].items():
                            query_queue[k] = v
                            if v.get("error"):
                                if raise_on_error:
                                    raise SilenceError(v["error"])
                                else:
                                    logger.debug("Error was found", error=v["error"])
                            else:
                                query_queue[k] = TableData(**v)

            except ResultTimeout as e:
                logger.exception("Batch running queries timed out")
                capture_exception(e)

                raise SilenceError(
                    f"Batch running queries timed out. {group.completed_count} out of {len(group.children)} completed."
                ) from e
            except (Shutdown, Abort, TimeLimitExceeded):
                for message in group.children:
                    logger.info("Aborting message", message_id=message.message_id)
                    abort(message.message_id)
                raise

        return (
            [
                dict(v, idx=all_queries.index(k), query=k)
                for k, v in query_queue.items()
                if v and not isinstance(v, TableData)
            ],
            {k: v for k, v in query_queue.items() if v and isinstance(v, TableData)},
        )

    @tracer.start_as_current_span("_handle_query_error")
    def _handle_query_error(self, error_message: str, query: str = None):
        span = get_current_span()
        span.set_attribute("query_error", error_message)

        lower_message = error_message.lower()
        logger.info("Query error", error=error_message)

        # handle all the errors
        if (
            error_message
            in (
                "Query completed but it returned no data.",
                "No data was returned.",
            )
            and not query.startswith("SELECT")
            and not query.startswith("WITH")
        ):
            logger.info("Query succeeded")
            return None
        elif error_message == "'schema'" and not query.startswith("SELECT") and not query.startswith("WITH"):
            # bigquery: this error is thrown when the table doesn't exist
            # for queries that don't return rows (like drop table)
            logger.info("Ran query that returned no rows", query=query)
            return None
        elif self.company.warehouse_language == "mssql_odbc" and "incorrect syntax near ')'" in lower_message:
            raise SilenceError("MS SQL SERVER requires every subquery be aliased and you seem to be missing an alais")
        elif "ambiguous column name" in lower_message:
            span.set_attribute("query_status", "bad_value")
            raise QueryRunError(
                "Duplicate columns found and thus cannot be created as a table or view",
                company=self.company.slug,
            )
        elif "permission" in error_message:
            span.set_attribute("query_status", "permission_error")
            raise QueryRunError(error_message, company=self.company.slug)
        elif (
            "update/merge must" in lower_message
            or "cannot perform merge as multiple source rows matched" in lower_message
        ) and "activity_id" in query:
            span.set_attribute("query_status", "duplication_error")
            raise QueryRunError(
                "Duplicate activity_id was found in your activity stream and this breaks BiqQuery during our Identity Resolution update"
            )
        elif "user temporarily locked" in lower_message:
            span.set_attribute("query_status", "locked_user")
            raise ConnectionError(error_message)
        elif "not open relation with oid" in lower_message:
            raise WarehouseRandomError("Could not find a table, probably due to a session cache issue")
        elif "ran out of wlm queues for restart" in lower_message:
            raise WarehouseRandomError("Query failed due to WLM queues")
        elif "serializable isolation violation" in lower_message:
            raise WarehouseRandomError("Updating table that is used by other session")
        elif "ssl" in lower_message.split() or "eof " in lower_message:
            span.set_attribute("query_status", "maintenance_mode")
            raise WarehouseRandomError("Query failed because of SSL Error. Please try again.")
        elif "conflict with concurrent transaction" in lower_message:
            span.set_attribute("query_status", "concurrent")
            raise WarehouseRandomError("Query failed because of a concurrent query")
        elif "is the server running on ho" in lower_message:
            span.set_attribute("query_status", "maintenance_mode")
            raise WarehouseRandomError("Query failed because warehouse is in maintenance mode")
        elif "retrying may solve the problem" in lower_message:
            span.set_attribute("query_status", "maintenance_mode")
            raise WarehouseRandomError("Query failed because of a random termination")
        elif "terminated abnormally" in lower_message:
            span.set_attribute("query_status", "maintenance_mode")
            raise WarehouseRandomError("Query failed because of a random termination")
        elif "server closed the connection unexpectedly" in lower_message:
            span.set_attribute("query_status", "ssh_error")
            raise WarehouseRandomError("Query failed because of SSH connection dropping. Please try again.")
        elif "re-execute after other vacuum finished" in lower_message:
            span.set_attribute("query_status", "vacuum_collided")
            raise WarehouseRandomError("Vacuum is running at the same time")
        elif (
            "internal error occurred and the request could not be completed" in lower_message
            or "retrying the job may solve the problem" in lower_message
        ):
            span.set_attribute("query_status", "warehouse")
            raise WarehouseRandomError("Warehouse had an internal error")
        elif "maximum concurrency" in lower_message:
            span.set_attribute("query_status", "warehouse_concurrency")
            raise WarehouseRandomError("Warehouse had a concurrency error")
        else:
            # query errored out
            raise QueryRunError(
                error_message,
                query=query,
                company=self.company.slug,
            )

    # added the code format with currency
    def date_trunc(self, desired_date, datepart):
        return utils.date_trunc(
            desired_date,
            datepart,
            warehouse=self.company.warehouse_language,
            offset=self.company.week_day_offset,
        )

    def date_add(self, desired_date, datepart, number):
        return utils.date_add(desired_date, datepart, number, warehouse=self.company.warehouse_language)

    def human_format(self, num, kind=None):
        return utils.human_format(
            num,
            kind,
            timezone=self.company.timezone,
            currency_used=self.company.currency_used,
            locale=self.company.locale,
        )

    @tracer.start_as_current_span("create_biquery_schema")
    def _create_bigquery_schema(self, schema):
        query_runner = self.get_datasource()
        client = query_runner._get_bigquery_service()

        # Construct a full Dataset object to send to the API.
        dataset = Dataset(f"{query_runner._get_project_id()}.{schema}")
        dataset.location = query_runner._get_location()

        # Send the dataset to the API for creation, with an explicit timeout.
        # Raises google.api_core.exceptions.Conflict if the Dataset already
        # exists within the project.
        try:
            dataset = client.create_dataset(
                dataset,
                timeout=30,
            )  # Make an API request.
        except Exception as e:
            if "already exists" not in str(e).lower():
                raise
        return schema

    @tracer.start_as_current_span("create_schema")
    def create_schema(self, schema=None, language=None):
        schema = schema or self.company.warehouse_schema
        all_schemas = self.get_warehouse_schema()

        if schema not in all_schemas.schemas:
            try:
                if (language or self.company.warehouse_language) == "bigquery":
                    self._create_bigquery_schema(schema)
                elif (language or self.company.warehouse_language) == "mssql_odbc":
                    self.run_query(
                        f"IF NOT EXISTS ( SELECT * FROM sys.schemas WHERE name = N'{schema}') EXEC('CREATE SCHEMA [{schema}]');",  # noqa: S608
                    )

                elif (language or self.company.warehouse_language) == "snowflake":
                    # TODO: Figure out how to make sure the schema is owned by SYSADMIN
                    self.run_query(f"CREATE SCHEMA IF NOT EXISTS {schema} ")
                else:
                    self.run_query(f"CREATE SCHEMA IF NOT EXISTS {schema} ")
            except QueryRunError:
                # check if the schema exists and you can create the table
                test_table = self.qm.Table(schema=schema, table="test_table")
                create_query = self.qm.get_create_table_query(
                    test_table,
                    column_dicts=[dict(name="test_col", type="string")],
                )

                self.run_query(create_query)
                self.run_query(self.qm.get_drop_table_query(test_table))

    @tracer.start_as_current_span("get_warehouse_schema")
    def get_warehouse_schema(self) -> WarehouseSchema:
        """
        Get the warehouse schema from internal query_runner or custom
        """
        datasource = self.get_datasource()

        try:
            schema = datasource.get_schema()
        except Exception as e:
            raise SilenceError(f"Could not fetch Schema with error {utils.get_error_message(e)}") from e

        ga_tables_added = set()
        tables = []
        for table in schema:
            (schema, table_name) = utils.split_schema_table_name(table["name"])

            # simplify GA data
            keys = ["events", "pseudonymous_users", "users"]
            if (
                self.company.warehouse_language == "bigquery"
                and schema.startswith("analytics_")
                and any(table_name.startswith(key) for key in keys)
            ):
                # prase the year and add it to be year*
                # parse the anything in the last 3 months and add it
                # example: events_20240620 -> events_2024* OR events_20240620 if it's from last 3 months
                year_name = table_name[:-4] + "*"
                full_name = table_name[:-8] + "*"
                if (schema, year_name) not in ga_tables_added:
                    table_name = year_name
                elif (schema, full_name) not in ga_tables_added:
                    table_name = full_name
                elif datetime.strptime(table_name[-8:], "%Y%m%d").date() < datetime.now().date() - timedelta(days=10):
                    continue

                ga_tables_added.add((schema, table_name))
            elif schema.startswith("dbt_cloud_pr") or schema.startswith("rudderstack_"):
                continue

            tables.append(
                TableSchema(
                    schema_name=schema,
                    table_name=table_name,
                    columns=[
                        TableSchemaColumn(
                            name=c,
                            type=(table["types"][ii] if table.get("types") else None),
                        )
                        for ii, c in enumerate(table["columns"])
                    ],
                )
            )

        # Convert schema to our object
        warehouse_schema = WarehouseSchema(language=self.company.warehouse_language, tables=tables)
        return warehouse_schema

    def save_processing_config(self, config_raw=None):
        config = self.config if config_raw is None else MavisConfig(**config_raw)

        # remove all the completed flags
        return self.company.s3.upload_object(config.json(), ["run_transformation", "config.json"])

    def _hash_query(self, query: str):
        """
        Removes the query comments and spaces
        """
        clean_query = self.qm.clean_query(query).split()
        encoded_query = "".join(clean_query).encode("utf-8")

        return md5(encoded_query, usedforsecurity=False).hexdigest()

    @tracer.start_as_current_span("get_query_cache")
    def get_query_cache(self, query: str, within_minutes: int) -> TableData | None:
        query_hash = self._hash_query(query)
        s3_path = ["caches", "queries", "v2", f"{query_hash}.json"]
        if file := self.company.s3.get_file(s3_path, within_minutes=within_minutes):
            res = TableData(**file)
            res.context.is_cache = True

            # reset these in case they change
            res.context.timezone = self.company.timezone
            res.context.locale = self.company.locale
            res.context.currency = self.company.currency_used
            return res

    @tracer.start_as_current_span("save_query_cache")
    def save_query_cache(self, query: str, results: TableData):
        # Don't recache cached queries
        if results and (results.context.is_cache or results.total_rows > 10_000):
            return None

        query_hash = self._hash_query(query)

        return self.company.s3.upload_object(
            results.dict(),
            ["caches", "queries", "v2", f"{query_hash}.json"],
            expire_in_days=7,
        )


def initialize_mavis(company_slug, user_id: str = None):
    company_data = query_graph_company(company_slug)
    auth_org_id = graph.get_auth_org(company_data.id).auth[0].org_id

    if user_id:
        # create the user
        current_user = AuthenticatedUser.create(user_id, auth_org_id, None)

        # create the company
        company = Company(**company_data.dict(), current_user=current_user)
    else:
        # Batch processing should use Ahmed as the user since it will make everything easier
        # In the past we had to handle this NULL by using a constant of my user_id every where
        ahmed_user = AuthenticatedUser(
            id="5d8fd6f3-b5d9-42fd-a04a-7ecaa8883aa1",
            email="ahmed@narrator.ai",
            tags=UserTags(favorite=None, recently_viewed=None),
            is_internal_admin=True,
            is_admin=True,
            company=UserCompany(
                id=company_data.id,
                slug=company_data.slug,
                name=company_data.name,
                everyone_team_id=next((t.id for t in company_data.teams if t.name == "Everyone"), None),
                auth0_org_id=auth_org_id,
            ),
        )
        company = Company(**company_data.dict(), current_user=ahmed_user)

    return Mavis(company=company)


# class DataSourceOptionCache:
#     @classmethod
#     @cached(cache=datasource_cache)
#     def get(
#         cls,
#         company_slug: str,
#         *,
#         use_admin=False,
#         mask_secrets=False,
#         warehouse_language=None,
#     ):
#         company = initialize_company(company_slug)
#         key = f'{warehouse_language or company.warehouse_language}{"_admin" if use_admin else ""}'

#         try:
#             options = company.load_secret(key)
#         except (FileNotFoundError, TypeError, JSONDecodeError):
#             return None

#         if options and mask_secrets:
#             # hide the masked fields
#             for k in MASKED_FIELDS:
#                 if options.get(k):
#                     options[k] = MASKED_STR

#             # Remove wrong format fields
#             for k in REMOVE_FIELDS:
#                 if options.get(k):
#                     del options[k]

#         options["cached_at"] = utils.utcnow()
#         return options

#     @classmethod
#     def remove(cls, company_slug: str, **kwargs):
#         key = keys.hashkey(cls, company_slug, **kwargs)
#         with contextlib.suppress(KeyError):
#             datasource_cache.pop(key)
