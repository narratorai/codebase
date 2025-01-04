from copy import deepcopy
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from core.api.customer_facing.activities.utils import ActivityManager
from core.api.customer_facing.datasets.utils import DatasetManager
from core.errors import RunDatasetError, SilenceError
from core.graph import graph_client
from core.graph.sync_client.enums import access_role_enum
from core.graph.sync_client.get_activities_w_columns import GetActivitiesWColumnsActivities
from core.logger import get_logger
from core.models.ids import UUIDStr
from core.models.table import ColumnTypeEnum, TableData
from core.utils import date_diff, get_simple_type, is_error, slugify
from core.v4.dataset import DatasetService
from core.v4.dataset_comp.query.builder import DatasetBuilder
from core.v4.dataset_comp.query.migrations import v1_to_v2
from core.v4.dataset_comp.query.model import (
    ActivityColumns,
    ActivitySourceDetails,
    AggregateFunctionEnum,
    AppendActivity,
    AppendFetchTypeEnum,
    CohortActivity,
    ColumnCollectionEnum,
    ColumnToColumnFilter,
    CustomerDetails,
    DatasetKindEnum,
    DatasetObject,
    DetailKindEnum,
    ParentColumn,
    QuickFunctionEnum,
    SQLDetails,
    Tab,
    TabKindEnum,
    _get_operands,
)
from core.v4.mavis import Mavis
from core.v4.narrative.helpers import fill_in_template, get_required_fields
from core.v4.query_mapping.components import Query

logger = get_logger()


@dataclass
class Dataset:
    mavis: Mavis
    id: UUIDStr | None = None
    version_id: UUIDStr | None = None
    # if version 1
    obj: dict | None = None
    ds: DatasetService | None = None
    # if version 2s
    model: DatasetObject | None = None
    limit: int | None = 1_000
    # Internal ussage
    version: int = 1
    maintenance_started_at: str | None = None
    maintenance_ended_at: str | None = None
    within_minutes: int | None = None

    checked_for_maintenance: bool = False
    data: dict | None = None

    def __post_init__(self):
        logger.debug("Initialized the dataset")
        self.updator = DatasetManager(mavis=self.mavis)

        if self.model:
            self.version = 2
        else:
            if self.obj is None:
                (self.obj, version) = self.updator.get_config(self.id, self.version_id, with_version=True)
                self.version_id = version.id
            if self.obj is None:
                raise SilenceError("Dataset not found")

            if self.obj is not None and self.obj.get("version") == 2:
                self.model = DatasetObject(**self.obj)
                self.version = 2

        # create the old dataset obj
        if self.version == 1:
            self.ds: DatasetService = DatasetService(mavis=self.mavis)

            # Add the object
            if self.obj is not None:
                logger.debug("Converting dataset_model")
                query_obj = deepcopy(self.query)
                self._clean_dataset_so_it_compiles(query_obj)
                self.model = v1_to_v2(self.mavis, self.ds, dict(query=query_obj)).convert()
                logger.debug("done converting dataset_model")

        self.version = 2
        if self.model:
            self.model.id = self.id
            self.model.version_id = self.version_id

        self.data = dict()
        # keep the updator
        self.activity_updator = ActivityManager(mavis=self.mavis)

    def update(self):
        self.updator.update_dataset_config(self.id, self.obj)

    def update_fields(self):
        query_obj = deepcopy(self.query)
        self._clean_dataset_so_it_compiles(query_obj)
        self.model = v1_to_v2(self.mavis, self.ds, dict(query=query_obj)).convert()

    @property
    def query(self) -> dict:
        # This is used by createDataset and analyze button
        # use fields for dataset
        if self.obj.get("fields"):
            return fill_in_template(
                self.obj["query"],
                {
                    f: v.replace("%", "%%") if isinstance(v, str) else v
                    for f, v in self.obj["fields"].items()
                    if not is_error(v)
                },
                ignore_conditions=True,
                replace_error=False,
                mavis=self.mavis,
            )
        else:
            return self.obj["query"]

    def qm_query(
        self,
        tab_slug: str | None = None,
        offset: int | None = None,
        remove_unessary_columns: bool = True,
        remove_limit: bool = False,
    ) -> Query:
        if self.version == 1:
            query_obj = deepcopy(self.query)
            self._clean_dataset_so_it_compiles(query_obj)

            # get the query
            query = self.ds.generate_query(
                query_obj, group_slug=tab_slug, limit=self.limit if not remove_limit else None, offset=offset
            )

            return query
        elif self.version == 2:
            if remove_unessary_columns:
                model = self.remove_unessary_columns(tab_slug)
            else:
                model = deepcopy(self.model)

            # we would require custom functions here
            if model.require_custom_functions:
                custom_functions = {
                    c.name: c
                    for c in graph_client.get_all_custom_functions(company_id=self.mavis.company.id).custom_function
                }
            else:
                custom_functions = {}

            if model.require_timeline_dates:
                timeline_dates = {
                    slugify(ct.name): ct.happened_at
                    for ct in graph_client.get_timeline(
                        timeline_ids=model.activity_ids + self.mavis.company.id
                    ).company_timeline
                }
            else:
                timeline_dates = {}
            return DatasetBuilder(
                model,
                self.mavis.company.table(self.model.table_id),
                self.mavis.qm,
                timeline_dates=timeline_dates,
                custom_functions=custom_functions,
            ).generate_query(tab_slug, limit=self.limit if not remove_limit else None, offset=offset)

    def sql(self, tab_slug: str | None = None, offset: int | None = None, remove_unessary_columns: bool = True) -> str:
        query = self.qm_query(tab_slug, offset, remove_unessary_columns=remove_unessary_columns)
        # only nest the queries for
        # PG - cause it creates materialized views when you use CTEs
        # SQL Server - It is faster somehow
        if self.mavis.company.warehouse_language in ("pg", "mssql_odbc"):
            run_q = query.to_query(nest_ctes=True)

            # TODO: Remove this hack for postgres!
            if tab_slug and self.mavis.company.warehouse_language == "pg":
                run_q = "set local enable_nestloop=off; \n" + run_q

        else:
            run_q = query.to_query()
        return run_q

    def reset(self):
        self.data = dict()
        self.update_fields()

    def run(
        self,
        tab_slug: str | None = None,
        run_live: bool = False,
        offset: int | None = None,
        use_last_available: bool = False,
    ) -> TableData:
        # require the role for sql
        if self.model.kind == DatasetKindEnum.sql:
            self.mavis.user.require_role(access_role_enum.can_use_sql)

        if table_data := self.data.get(f"{tab_slug}_{offset}"):
            if isinstance(table_data, Exception):
                raise table_data
            return table_data

        self.__check_maintenance()
        query = self.sql(tab_slug, offset=offset)
        if run_live:
            within_minutes = 0
        elif use_last_available:
            within_minutes = 1000_0000_000
        else:
            within_minutes = self.within_minutes

        try:
            table_data = self.mavis.run_query(
                query,
                within_minutes=within_minutes,
                skip_limit_check=True,
            )
            if table_data is not None:
                table_data.context.is_all = table_data.total_rows < (self.limit or 1_000)

        except Exception as e:
            self.data[tab_slug] = e
            raise RunDatasetError(
                e,
                company=self.mavis.company.slug,
                dataset_slug=self.id,
                group_slug=tab_slug,
            ) from e

        # ensure the table is there
        if not table_data:
            raise ValueError("Couldn't run the dataset for some reason")

        tab = self.model.tab(tab_slug) if tab_slug else None
        if tab:
            table_data.context.name = f" {tab.label}"
        else:
            table_data.context.name = ""

        table_data.context.dataset_id = self.id
        table_data.context.tab_slug = tab_slug
        table_data.context.version_id = self.version_id
        table_data.context.dataset_name = self.model.name
        table_data.context.group_name = tab.label if tab else None
        table_data.context.table_id = self.model.table_id
        table_data.context.can_drill_into = tab and tab.kind == TabKindEnum.group

        # update the column orderign and pinning
        self.update_columns(tab_slug, table_data)
        self.data[f"{tab_slug}_{offset}"] = table_data
        return table_data

    def metrics(self, column_id: UUIDStr) -> TableData:
        tab = self.model.add_group(self, column_ids=[column_id], label="ColumnMetrics")
        self.within_minutes = 10000000
        return self.run(tab_slug=tab.slug)

    def cancel(self, tab_slug: str | None = None):
        self.mavis.cancel_query(self.sql(tab_slug))

    def _get_count_query(self, tab_slug: str | None = None) -> str:
        if self.version == 1:
            temp_query = self.qm_query(tab_slug)
            if tab_slug is None and self.ds._can_use_subquery(self.query):
                temp_query = self.qm_query(tab_slug)
                cohort_query = temp_query.ctes["cohort"]
                ctes_to_add = [t.cte for t in cohort_query.get_all_tables(recursive=True) if t.cte]

                # make sure the cohort stream in first always
                ctes_to_add = sorted(ctes_to_add, key=lambda x: 0 if x == "cohort_stream" else 2)

                for ct in ctes_to_add:
                    cohort_query.add_cte(ct, temp_query.ctes[ct])

                # flip the reference
                temp_query = cohort_query

            # reset the order by
            temp_query.remove_order()
            temp_query.limit = None

            return self.mavis.qm.get_count_query(temp_query).to_query()
        else:
            query = self.qm_query(tab_slug, remove_limit=True)
            if self.can_use_subquery(tab_slug):
                temp_query = query.ctes["cohort_stream"]
                query = query.ctes["cohort"]
                query.add_cte("cohort_stream", temp_query)
            return self.mavis.qm.get_count_query(query).to_query()

    def count_rows(self, tab_slug: str | None = None, run_live: bool = False) -> int:
        # if you are counting a parent with no prefilters
        if tab_slug:
            tab = self.model.tab(tab_slug)
            if tab.kind == TabKindEnum.parent and not tab.parent_filters:
                tab_slug = None

        count_query = self._get_count_query(tab_slug)
        count_data = self.mavis.run_query(count_query, within_minutes=0 if run_live else None)
        return count_data.rows[0]["total_rows"]

    def cancel_count_rows(self, tab_slug: str | None = None):
        self.mavis.cancel_query(self._get_count_query(tab_slug))

    def __check_maintenance(self):
        if self.checked_for_maintenance:
            return None

        self.checked_for_maintenance = True
        # check the dims
        maintenances = graph_client.get_dataset_maintenance(
            activity_ids=self.model.activity_ids,
            tables=self.model.dim_tables,
            company_id=self.mavis.company.id,
            # get anything passed the cache time
            last_updated_at=datetime.now(UTC) - timedelta(minutes=self.mavis.company.cache_minutes + 30),
        ).activity_maintenance

        # add tables filters because I couldn't do it in graphQL
        maintenances = [
            am for am in maintenances if am.dim_table is None or am.dim_table.table in self.model.dim_tables
        ]

        # if nothing is in or out of maintenance then complete
        if len(maintenances) == 0:
            return None

        am = next((m for m in maintenances if m.ended_at is None), None)

        if am:
            self.maintenance_started_at = am.started_at
            self.maintenance_ended_at = None
        else:
            self.maintenance_started_at = None
            self.maintenance_ended_at = max(m.ended_at for m in maintenances if m.ended_at)

        if self.within_minutes is None:
            self.within_minutes = self.mavis.company.cache_minutes
        # auto handle the maintenance
        if self.maintenance_ended_at:
            mins_since_maintance = date_diff(self.maintenance_ended_at, datetime.now(UTC), "minutes")
            if mins_since_maintance < self.within_minutes:  # noqa: PLR1730
                self.within_minutes = mins_since_maintance

    def _clean_dataset_so_it_compiles(self, d_obj):
        broken_columns = []
        current_len = -1
        while current_len != len(broken_columns):
            current_len = len(broken_columns)
            for c in d_obj["columns"]:
                # has not been added yet
                if c["id"] not in broken_columns and (
                    not (
                        len(get_required_fields(c)) == 0
                        and ("None" not in str(c["source_details"].get("raw_string", "")))
                    )
                    or any(
                        # is not dependent on a broken field
                        t_id in broken_columns
                        for t_id in self.ds._get_all_column_ids(c)
                    )
                ):
                    broken_columns.append(c["id"])

        # remove any column that has a field in it
        d_obj["columns"] = [c for c in d_obj["columns"] if c["id"] not in broken_columns]

    def update_columns(self, tab_slug: str | None, table_data: TableData):
        # Postgres has a 64 character limit so we need to deal with that when we process that data
        name_chr_limit = 63 if self.mavis.company.warehouse_language == "pg" else 10000
        cols = self.model.get_all_columns(tab_slug, True)

        ui_cols = self.model.get_ui(tab_slug)

        if ui_cols is not None:
            ui_dict = {c.id: c for c in ui_cols.columns}
        else:
            ui_dict = {}

        for c in cols:
            if tb_col := table_data.column(field=c.clean_label[:name_chr_limit], raise_error=False):
                tb_col.id = c.id
                tb_col.header_name = c.label
                tb_col.context = ui_dict.get(c.id) or tb_col.context
                if display_format := c.display_format:
                    tb_col.context.format = display_format
                tb_col.type = c.type

        # keep track of the order of columns
        if ui_cols is not None:
            # reorder th columns
            table_data.columns = sorted(table_data.columns, key=lambda c: c.context.order if c.context else 10000)

    def get_available_columns(
        self, collection: ColumnCollectionEnum = ColumnCollectionEnum.common
    ) -> list[ParentColumn]:
        return self._get_available_columns(collection)

    def _get_available_columns(
        self, collection: ColumnCollectionEnum = ColumnCollectionEnum.common
    ) -> list[ParentColumn]:
        # First thing we need to get the columns
        # Then we check if the columns are already there
        # Then based on the collection, we will return or not

        output_columns = []

        if self.model.kind in (DatasetKindEnum.sql, DatasetKindEnum.table):
            qm = self.mavis.qm

            # Added the different tables
            if self.model.kind == DatasetKindEnum.sql:
                query = qm.wrap_query(self.model.sql_query)
            else:
                query = qm.wrap_query(qm.Table(table=self.model.table_name, schema=self.model.scheam_name))

            # run the query and get the data
            query.set_limit(1000)
            data = self.mavis.run_query(query.to_query(), within_minutes=None)

            for c in data.columns:
                output_columns.append(ParentColumn(label=c.header_name, type=c.type, details=SQLDetails(field=c.field)))

            return output_columns

        # cohort columns
        activities = {a.id: a for a in graph_client.get_activities_w_columns(ids=self.model.activity_ids).activities}
        m = self.model
        cohort_idx = 0
        # for activity datasets
        if self.model.kind == DatasetKindEnum.activity:
            for ii, c in enumerate(m.cohort_activity.activity_ids):
                new_columns = self.get_activity_columns(c, activities[c], include_customer=ii == 0, is_cohort=True)
                output_columns.extend([c for c in new_columns if c not in output_columns])

            cohort_idx = len(output_columns)
            # add the append activities columns
            for a in m.append_activities:
                for a_id in a.activity_ids:
                    new_columns = self.get_activity_columns(a.id, activities[a_id])

                    # Now we apply the metric
                    if a.fetch_type == AppendFetchTypeEnum.metric:
                        metric_columns = []
                        for f in AggregateFunctionEnum:
                            for c in new_columns:
                                nc = ParentColumn(
                                    label=c,
                                    type=c.type,
                                    details=c.details,
                                )
                                nc.details.applied_function = f
                                metric_columns.append(nc)

                        # rest the columns
                        new_columns = metric_columns

                    # Add all the columns
                    output_columns.extend([c for c in new_columns if c not in output_columns])

        # ADd the short cut columns
        insert_columns = []
        for ii, c in enumerate(output_columns):
            if isinstance(c.details, ActivitySourceDetails) and c.details.name == ActivityColumns.ts:
                activity = self.model.activity(c.details.activity_id)

                for f in QuickFunctionEnum:
                    if activity.is_cohort and f == QuickFunctionEnum.exists:
                        continue

                    col = ParentColumn(
                        label=apply_function_name(activity, f, c),
                        apply_quick_function=f,
                        **{k: v for k, v in c.dict().items() if k not in ("id", "label", "apply_quick_function")},
                    )
                    insert_columns.append((ii, col))

        # this allows us to order the columns correctly
        for ii, c in enumerate(insert_columns):
            output_columns.insert(ii + c[0], c[1])

        # TODO: Add the days between from the cohort activity
        # TODO: Add did_with_order from the cohort activity
        # remove anything that is not needed based on the conditions
        if collection == ColumnCollectionEnum.missing:
            output_columns = [c for c in output_columns if c not in m.columns]
        elif collection == ColumnCollectionEnum.min:
            output_columns = [
                c
                for ii, c in enumerate(output_columns)
                if (
                    (
                        ii < cohort_idx
                        and (
                            c.details.name in {ActivityColumns.customer, ActivityColumns.ts}
                            and c.apply_quick_function is None
                        )
                    )
                    or (
                        ii >= cohort_idx
                        and c.details.name == ActivityColumns.ts
                        and c.apply_quick_function in {None, QuickFunctionEnum.exists}
                    )
                )
            ]
        elif collection == ColumnCollectionEnum.default:
            output_columns = [
                c
                for c in output_columns
                if isinstance(c.details, ActivitySourceDetails)
                and c.details.dim_id is None
                and (c.details.activity_id == m.cohort_activity.id or c.details.name == ActivityColumns.ts)
            ]
        elif collection == ColumnCollectionEnum.common:
            output_columns = [
                c
                for c in output_columns
                if c.details.name not in (ActivityColumns.activity_repeated_at, ActivityColumns.anonymous_customer_id)
            ]

        # Add the default label
        for c in output_columns:
            c.label = m.default_label(c)
        return output_columns

    def can_use_subquery(self, tab_slug: str | None = None):
        if self.model.kind == DatasetKindEnum.time:
            return False

        for c in self.model.columns:
            if c.details.kind == DetailKindEnum.activity and c.details.activity_id == self.model.cohort_activity_id:
                continue
            if c.filters is not None:
                return False

        if tab_slug is not None:
            tab = self.model.tab(tab_slug)
            if tab.kind == TabKindEnum.group:
                return False
            elif tab.parent_filters is not None:
                return False
        return True

    def remove_unessary_columns(self, tab_slug: str | None):
        """Removes allt he columns that are not needed.
        Returns a deep copy of the model
        Args:
            tab_slug (str | None, optional): The slug to use, if None, then we will remove anything NOT used by any tab. Defaults to None.
        """
        # ignore this model
        if tab_slug is None:
            return deepcopy(self.model)

        logger.debug("Removing unessary columns for tab %s", tab_slug)

        d_obj = deepcopy(self.model)

        tab = d_obj.tab(tab_slug)

        # Remove all other tabs
        d_obj.all_tabs = [tab]
        used_columns = _get_tab_columns(tab)
        logger.debug("Used columns", used_columns=used_columns)

        # go through the columns and
        for c in d_obj.columns:
            if c.details.kind == DetailKindEnum.time:
                used_columns.append(c.id)
            elif (
                c.details.kind == DetailKindEnum.activity
                and c.details.activity_id == d_obj.cohort_activity_id
                and c.details.name == ActivityColumns.ts
            ):
                used_columns.append(c.id)

            if c.filters is not None or c.id in used_columns:
                used_columns.extend(get_depended_columns(d_obj.columns, c))

        for o in d_obj.order:
            used_columns.extend(get_depended_columns(d_obj.columns, d_obj.column(o.column_id)))

        # if we have the activity make sure we include its timestamp since it is used as the base column
        all_activity_ids = set(
            c.details.activity_id
            for c in d_obj.columns
            if c.details.kind == DetailKindEnum.activity and c.id in used_columns
        )
        for c in d_obj.columns:
            if (
                c.details.kind == DetailKindEnum.activity
                and c.details.activity_id in all_activity_ids
                and c.details.name == ActivityColumns.ts
            ):
                used_columns.append(c.id)

        logger.debug("Used columns with DEPENDENCIES", used_columns=used_columns)
        d_obj.columns = [c for c in d_obj.columns if c.id in used_columns]
        _remove_unused_activities_and_dims(d_obj)
        return d_obj

    def get_activity_columns(
        self,
        activity_id: str,
        activity: GetActivitiesWColumnsActivities,
        include_activity: bool = False,
        include_super_admin: bool = False,
        include_customer: bool = False,
        is_cohort: bool = False,
        include_examples: bool = False,
    ):
        if include_examples:
            cv = self.activity_updator.get_column_values(activity_id)
        else:
            cv = {}
        current_columns = []
        for c in activity.column_renames:
            if c.has_data:
                current_columns.append(
                    ParentColumn(
                        label=c.label or c.name,
                        type=get_simple_type(c.type),
                        details=ActivitySourceDetails(
                            name=c.name,
                            activity_id=activity_id,
                        ),
                        examples=cv.get(c.name, []),
                    )
                )

        for dim in activity.activity_dims:
            dv = self.activity_updator.get_column_values(dim.dim_table.id)
            for c in dim.dim_table.columns:
                if not any(col.details.name == c.name for col in current_columns):
                    current_columns.append(
                        ParentColumn(
                            label=c.label or c.name,
                            type=get_simple_type(c.type),
                            details=ActivitySourceDetails(
                                name=c.name,
                                activity_id=activity_id,
                                dim_id=dim.dim_table.id,
                            ),
                            examples=dv.get(c.name, []),
                        )
                    )

        # Add slowly changing dims
        if include_customer and getattr(activity.company_table, "slowly_changing_customer_dims", None):
            for dim in activity.company_table.slowly_changing_customer_dims:
                dv = self.activity_updator.get_column_values(dim.dim_table.id)
                for c in dim.dim_table.columns:
                    if not any(col.details.name == c.name for col in current_columns):
                        current_columns.append(
                            ParentColumn(
                                label=c.label or c.name,
                                type=get_simple_type(c.type),
                                details=CustomerDetails(
                                    name=c.name,
                                    customer_dim_id=dim.dim_table.id,
                                ),
                                examples=dv.get(c.name, []),
                            )
                        )

        # Add activity column if needed
        if include_activity and is_cohort:
            current_columns.append(
                ParentColumn(
                    label="Activity",
                    type=ColumnTypeEnum.string,
                    details=ActivitySourceDetails(
                        name="activity",
                        activity_id=activity_id,
                    ),
                    examples=[activity.slug],
                )
            )

        # Add super admin columns if needed
        if include_super_admin and is_cohort:
            current_columns.extend(
                [
                    ParentColumn(
                        label="activity_source",
                        type=ColumnTypeEnum.string,
                        details=ActivitySourceDetails(
                            name="_activity_source",
                            activity_id=activity_id,
                        ),
                    ),
                    ParentColumn(
                        label="run_at",
                        type=ColumnTypeEnum.timestamp,
                        details=ActivitySourceDetails(
                            name="_run_at",
                            activity_id=activity_id,
                        ),
                    ),
                ]
            )

        # Add join_customer column if needed
        has_source = any(c.name == ActivityColumns.anonymous_customer_id for c in activity.column_renames if c.has_data)
        if has_source and is_cohort:
            current_columns.append(
                ParentColumn(
                    label="Unique Identifier",
                    type=ColumnTypeEnum.string,
                    details=ActivitySourceDetails(
                        name=ActivityColumns.join_customer,
                        activity_id=activity_id,
                    ),
                )
            )

        return current_columns


def _remove_unused_activities_and_dims(d_obj: DatasetObject):
    used_dims = []
    used_activities = set(c.details.activity_id for c in d_obj.columns if c.details.kind == DetailKindEnum.activity)

    # TODO: handle relative_activity
    d_obj.append_activities = [a for a in d_obj.append_activities if a.id in used_activities]

    cohort_dims = []
    for c in d_obj.get_columns(DetailKindEnum.customer):
        cohort_dims.append(c.details.customer_dim_id)

    for att in d_obj.activities[::-1]:
        used_dims = [] if not att.is_cohort else cohort_dims
        for p in att.prefilter_columns:
            if p.dim_id is not None:
                used_dims.append(p.dim_id)

        # For append activity check the operands
        if not att.is_cohort:
            for j in _get_operands(att.joins):
                if j.column.dim_id is not None:
                    used_dims.append(j.column.dim_id)
                if j.cohort_column.dim_id is not None:
                    cohort_dims.append(j.cohort_column.dim_id)

        # get all the columns
        for c in d_obj.activity_columns(att.id):
            if c.dim_id is not None:
                used_dims.append(c.dim_id)

        att.dims = [dim for dim in att.dims if dim.id in used_dims]
    return None


def get_depended_columns(columns: list[ParentColumn], computed_column: ParentColumn):
    dependend_cols = [computed_column.id]
    if computed_column.details.kind != DetailKindEnum.computed:
        return dependend_cols

    for c in columns:
        if c.id in computed_column.details.raw_str:
            # get the dependent columns
            dependend_cols.extend(get_depended_columns([tc for tc in columns if tc.id != c.id], c))

    return dependend_cols


def _get_tab_columns(tab: Tab):
    used_columns = []
    for o in _get_operands(tab.parent_filters):
        used_columns.append(o.column_id)
        if isinstance(o.filter, ColumnToColumnFilter):
            used_columns.append(o.filter.column_id)

    for o in tab.order:
        used_columns.append(o.column_id)

    if tab.kind == TabKindEnum.parent:
        for c in tab.output_columns:
            used_columns.append(c.id)
    else:
        for c in tab.columns:
            if c.details.kind == DetailKindEnum.group:
                used_columns.append(c.details.column_id)
            elif c.details.kind == DetailKindEnum.metric:
                if c.details.column_id:
                    used_columns.append(c.details.column_id)
                if c.details.conditioned_on_columns:
                    used_columns.extend(c.details.conditioned_on_columns)

        for d in tab.aggregate_dims:
            if d.distribute_using_column_id:
                used_columns.append(d.distribute_using_column_id)
            for j in d.joins:
                used_columns.append(j.column_id)

    return used_columns


def apply_function_name(activity: CohortActivity | AppendActivity, function: QuickFunctionEnum, column: ParentColumn):
    if function == QuickFunctionEnum.exists:
        return f"Did {activity.display_name}"
    elif activity.is_cohort:
        return function.value
    else:
        return f"{function.value} of {activity.display_name} timestamp"
