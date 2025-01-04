from time import sleep

from dramatiq import Retry
from opentelemetry.trace import get_current_span

from batch_jobs.custom_task import CustomTask
from core.api.customer_facing.sql.utils import WarehouseManager
from core.errors import QueryRunError, SilenceError, WarehouseRandomError
from core.logger import get_logger
from core.models.table import ColumnTypeEnum
from core.models.warehouse_schema import TableSchema
from core.util.opentelemetry import tracer
from core.utils import date_add, get_error_message, make_utc, slugify, utcnow
from core.v4.dataset_comp.integrations.model import MaterializedViewDetails
from core.v4.dataset_comp.integrations.util import Integration
from core.v4.dataset_comp.query.model import (
    AggregateFunctionEnum,
    BooleanExpression,
    Column,
    GroupColumn,
    LogicalOperatorEnum,
    MetricsDetails,
    TimeFilter,
    TimeOperatorEnum,
)
from core.v4.query_mapping.components import Table

logger = get_logger()


class NoDataFound(SilenceError):
    pass


class MaterializeView(Integration):
    @property
    def details(self) -> MaterializedViewDetails:
        return self.mat.details

    def run(self):
        if self.mat.id:
            task = self.custom_task()
            resync = task.get("resync") is not None

        else:
            resync = False

        try:
            if self.details.column_id:
                self.incremental_materialize_table(resync, task)
            else:
                self.materialize_table()

        except NoDataFound:
            if self.mat.id and not task.tasks:
                task.add_task("resync")

            raise Retry("No data found", delay=60_000)
        except QueryRunError as e:
            if resync:
                e.add_note(
                    "Please re-sync the materialized view by saving the dataset or reaching out to support for help."
                )
                raise
        finally:
            if self.mat.id:
                task.update()

        # reset the tasks
        if id and not task.tasks:
            task.clear()
            task.update()

    def get_table(self):
        # create the table
        return self.mavis.qm.Table(
            schema=self.mavis.company.materialize_schema,
            table=f"mv_{slugify(self.mat.label)}",
        )

    def get_dataset_query(self):
        dataset_query = self.dataset.qm_query(self.mat.tab_slug)
        dataset_query.remove_order()

        dataset_query.add_column(
            self.mavis.qm.Column(
                function="now",
                fields=dict(),
                name_alias="_run_at",
                column_type="timestamp",
            )
        )
        return dataset_query

    @tracer.start_as_current_span("materialize_table")
    def materialize_table(self):
        qm = self.mavis.qm

        self.dataset.limit = None
        dataset_query = self.get_dataset_query()
        table = self.get_table()

        try:
            # try and update i
            query = qm.get_update_materialize_view_query(table, dataset_query)
            if query:
                self.mavis.run_query(query)

        except QueryRunError:
            logger.exception("Error trying to update the MV")

            # check if it is missing the schema then create it otherwise fail
            wh = WarehouseManager(mavis=self.mavis).get_schema(False)
            if self.mavis.company.materialize_schema not in wh.schemas:
                self.mavis.create_schema(schema=self.mavis.company.materialize_schema)

            # create it
            query = [
                qm.get_drop_materialize_view_query(table),
                qm.get_create_materialize_view_query(table, dataset_query),
            ]
            if query:
                self.mavis.run_query(query)

            tb = TableSchema(
                schema_name=table.schema,
                table_name=table.table,
                columns=[
                    dict(name=c.clean_label, type=c.type, examples=c.examples)
                    for c in self.dataset.model.get_all_columns(self.mat.tab_slug, output=True)
                ]
                + [dict(name="_run_at", type="timestamp")],
            )
            # Add the table to the warehouse
            WarehouseManager(mavis=self.mavis).create(tb)

    def drop_and_create(self, ts_col: Column, column_dicts: list[dict], table: Table):
        # check if it is missing the schema then create it otherwise fail
        wh = WarehouseManager(mavis=self.mavis).get_schema(False)
        if self.mavis.company.materialize_schema not in wh.schemas:
            self.mavis.create_schema(schema=self.mavis.company.materialize_schema)

        # addeded some more indexes
        add_ons = dict(
            diststyle="EVEN",
            sortkey=ts_col.clean_label,
            partition_column=f"TIMESTAMP_TRUNC({ts_col.clean_label}, MONTH)",
            partitioned_by=f"DATE({ts_col.clean_label}) DATE",
            cluster_column=f"(to_date({ts_col.clean_label}))",
        )

        # create the table
        self.mavis.run_query(self.mavis.qm.get_drop_table_query(table))
        self.mavis.run_query(self.mavis.qm.get_create_table_query(table, add_ons=add_ons, column_dicts=column_dicts))

        tb = TableSchema(
            schema_name=table.schema,
            table_name=table.table,
            columns=column_dicts,
        )
        # Add the table to the warehouse
        WarehouseManager(mavis=self.mavis).create(tb)

    @tracer.start_as_current_span("incremental_materialize_table")
    def incremental_materialize_table(self, resync: bool = False, task: CustomTask | None = None):
        qm = self.mavis.qm

        table = self.get_table()
        dataset_query = self.get_dataset_query()

        # create the original query in case you need it
        ts_col = self.model.column(self.details.column_id)

        # get th emim date
        min_query = qm.Query()
        min_query.add_column(
            qm.Column(
                function="min" if resync else "max",
                fields=dict(column=qm.Column(table_column=ts_col.clean_label)),
                name_alias="min_ts",
            )
        )

        all_cols = self.dataset.ds.get_all_columns(
            self.dataset.obj["query"], group_slug=self.mat.tab_slug, only_output=True
        )
        # update the config to insert the new data
        for col in all_cols:
            if col["id"] == self.details.column_id:
                column_filters = col["filters"]
                break

        m_cols = self.dataset.model.get_all_columns(self.mat.tab_slug, output=True)
        for c in m_cols:
            if c.id == self.details.column_id:
                if c.filters is None:
                    c.filters = BooleanExpression(logical_operator=LogicalOperatorEnum.AND, operands=[])

                # if there is an OR then we wrap it in an AND
                if c.filters.logical_operator == LogicalOperatorEnum.OR:
                    c.filters = BooleanExpression(logical_operator=LogicalOperatorEnum.AND, operands=[c.filters])

                filter_operands = c.filters.operands
                break

        else:
            raise SilenceError(f"Invalid Column Id for {self.details.column_id}")

        # if you are resyncing, drop it and create the new table
        if resync:
            column_dicts = [
                dict(
                    name=c.clean_label,
                    type=c.type,
                )
                for c in self.model.output_columns
            ]
            column_dicts.append(
                dict(
                    name="_run_at",
                    type="timestamp",
                )
            )

            self.drop_and_create(ts_col, column_dicts, table)

            sleep(2)
            if self.mat.tab_slug:
                min_query = qm.Query()
                min_query.add_column(
                    qm.Column(
                        function="min",
                        fields=dict(column=qm.Column(table_column=ts_col.clean_label)),
                        name_alias="min_ts",
                    )
                )
                min_query.set_from(qm.Table(query=self.dataset.qm_query(self.mat.tab_slug)))
            else:
                new_tab = self.dataset.model.add_group()
                new_tab.columns.append(
                    GroupColumn(
                        label="min_ts",
                        type=ColumnTypeEnum.timestamp,
                        details=MetricsDetails(
                            agg_function=AggregateFunctionEnum.min, column_id=self.details.column_id
                        ),
                    )
                )
                min_query = self.dataset.qm_query(new_tab.slug)
        else:
            min_query.set_from(table)

        # figure out the new tadets
        try:
            min_data = self.mavis.run_query(min_query.to_query())
        except QueryRunError:
            if resync:
                raise
            logger.exception("Error trying to get the min date")
            return self.incremental_materialize_table(resync=True, task=task)

        # get the actual min date
        actual_min_date = min_data.rows[0]["min_ts"]

        # no min date so resync
        if actual_min_date is None:
            raise NoDataFound("No data found")
        else:
            # min date is given in LOCAL -> Convert it to UTC
            actual_min_date = make_utc(actual_min_date, self.mavis.company.timezone)

        days_to_remove = self.details.days_to_resync
        # override the days to resync
        new_days = task.get("override_days_to_resync")
        if new_days is not None:
            days_to_remove = new_days.details.get("days_to_resync")
            new_days.complete()

        # get the minimum days to user
        min_date = date_add(utcnow(), "day", -days_to_remove)
        get_current_span().set_attributes(
            {
                "min_date": min_date,
                "actual_min_date": actual_min_date,
                "table": table.table,
            }
        )

        # decide to delete or not
        delete_data = actual_min_date > min_date

        if delete_data:
            # delete the recent data
            where_filter = qm.Condition(
                operator="greater_than",
                left=qm.Column(table_column=ts_col.clean_label),
                right=qm.Column(
                    value=min_date,
                    casting="timestamp",
                    timezone=self.mavis.company.timezone,
                ),
            )

            # figure out if it is first time
            delete_query = qm.get_delete_query(table, where_filter)

            column_filters.append(
                dict(
                    operator="greater_than",
                    value=min_date,
                    kind="value",
                    or_null=False,
                )
            )
            filter_operands.append(
                TimeFilter(
                    operator=TimeOperatorEnum.greater_than,
                    time_value=min_date,
                )
            )
            dataset_query = self.get_dataset_query()
            insert_query = qm.get_insert_query(table, dataset_query)

            try:
                self.mavis.run_query([delete_query, insert_query])
            except (QueryRunError, WarehouseRandomError) as e:
                raise SilenceError(
                    f"Error trying to update the MV. If it is a type issue a resync can be helpful (Open integration and hit save).\nThe exact error was {get_error_message(e)}"
                )

            # Update all the tasks
            if task is not None:
                task.clear()
                task.update()
                task = None

        else:
            column_filters.extend(
                [
                    dict(
                        operator="greater_than",
                        value=actual_min_date,
                        kind="value",
                        or_null=False,
                    ),
                    dict(
                        operator="less_than_equal",
                        value=date_add(actual_min_date, "day", self.details.days_to_resync),
                        kind="value",
                        or_null=False,
                    ),
                ]
            )
            filter_operands.extend(
                [
                    TimeFilter(
                        operator=TimeOperatorEnum.greater_than,
                        time_value=actual_min_date,
                    ),
                    TimeFilter(
                        operator=TimeOperatorEnum.less_than_equal,
                        time_value=date_add(actual_min_date, "day", self.details.days_to_resync),
                    ),
                ]
            )

            # loop through all the data and filter it
            while actual_min_date < utcnow():
                dataset_query = self.get_dataset_query()
                insert_query = qm.get_insert_query(table, dataset_query)
                # make sure we save the key
                self.mavis.run_query(insert_query)

                # update the data and then insert
                actual_min_date = column_filters[-1]["value"]

                column_filters[-2]["value"] = actual_min_date
                filter_operands[-2].time_value = actual_min_date

                # HACK: TO deal with really old data
                if actual_min_date < "2010-01-01":
                    column_filters[-1]["value"] = "2010-01-01"
                    filter_operands[-1].time_value = "2010-01-01"
                elif actual_min_date < date_add(utcnow(), "month", -3):
                    sync_days = max(self.details.days_to_resync, 180)
                    column_filters[-1]["value"] = date_add(actual_min_date, "day", sync_days)
                    filter_operands[-1].time_value = date_add(actual_min_date, "day", sync_days)
                else:
                    column_filters[-1]["value"] = date_add(actual_min_date, "day", self.details.days_to_resync)
                    filter_operands[-1].time_value = date_add(actual_min_date, "day", self.details.days_to_resync)
                if task is not None:
                    task.clear()
                    task.update()
                    task = None

                # if this is getting close to the time that is missing, then exit
                self.timeout_checkin()
