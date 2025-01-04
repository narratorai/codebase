import ast
import re

# from collections import defaultdict
from copy import deepcopy

from core import utils
from core.constants import DATASET_LIMIT
from core.errors import DatasetCompileError, SilenceError
from core.logger import get_logger
from core.models.company import CompanyTable
from core.util.opentelemetry import set_current_span_attributes, tracer
from core.v4.dataset_comp.query import model as dsm
from core.v4.narrative.helpers import fill_in_template
from core.v4.query_mapping.components import Column, Query
from core.v4.query_mapping.config import (
    AGG_TO_WINDOW_FUNC,
    CASTING,
    CONFIG,
    DATE_SECONDS,
    FUNCTIONS,
    RESOLUTIONS,
)
from core.v4.queryMapper import QueryMapper

logger = get_logger()


def is_col_id(s):
    # ignore if not a string
    if not isinstance(s, str):
        return False

    if (
        s.isdigit()
        or utils.is_time(s)
        or s in RESOLUTIONS
        or s in [f["name"] for f in FUNCTIONS]
        or s.lower() in ("and", "or", "not", "true", "false", "not_contain", "not_contain_any")
        or s
        in (
            dsm.ActivityColumns.join_ts,
            dsm.ActivityColumns.join_cohort_next_ts,
            dsm.ActivityColumns.join_cohort_id,
            dsm.ActivityColumns.ts,
        )
        or s.strip() == ""
        or s in CASTING
        or s[0].isdigit()
        or s in ("local", "asc", "desc")
        or s.startswith("compute-")
        or s in ("metrics",)
        or s.lower() == "null"
        or (s.startswith("_") and not s.startswith("_spend"))
    ):
        return False
    return True


def _is_same_as_cohort(a: dsm.AppendActivity, cohort: dsm.CohortActivity, append_cols: list[dsm.GroupColumn]):
    # do not bother doing it if it has a count distinct or list agg
    if a.fetch_type == dsm.AppendFetchTypeEnum.metric and any(
        c for c in append_cols if c.details.applied_function in ("count_distinct", "list_agg")
    ):
        return False

    return (
        cohort is not None
        and a.activity_ids == cohort.activity_ids
        and not a.prefilter_columns  # TODO: Handle the same prefilter columns
        and not a.time_refinements
        and a.joins is None
        and not a.relative_activities
    )


# def _can_use_repeated_at(a: dsm.AppendActivity, dataset_obj: dsm.DatasetObject):
#     if dataset_obj.kind == dsm.DatasetKindEnum.time:
#         return True
#     return (
#         a.activity_ids == dataset_obj.cohort_activity.activity_ids
#         and len(a.activity_ids) == 1  # TODO: Remove this when you always use the lag
#         and a.fetch_type == dsm.AppendFetchTypeEnum.first
#         and not a.prefilter_columns
#         and len(dataset_obj.activity_columns(a.id)) == 1
#         and dataset_obj.activity_column_names(a.id)[0] == dsm.ActivityColumns.ts
#         and not a.time_refinements
#         and a.joins is None
#         and not a.relative_activities
#     )


def _scd_table_name(table_name, activities):
    return f"scd_{table_name}_{utils.slug_path(activities)}"


class DatasetBuilder:
    def __init__(
        self,
        dataset_obj: dsm.DatasetObject,
        activity_stream: CompanyTable,
        qm: QueryMapper = None,
        timeline_dates: dict | None = None,
        custom_functions: dict | None = None,
        variables: dict | None = None,
    ):
        self.dataset_obj: dsm.DatasetObject = dataset_obj

        # Always generate the clean names
        self.dataset_obj.clean_names()
        self.group: dsm.Tab = None

        self.qm: QueryMapper = qm or QueryMapper()
        self.activity_stream: CompanyTable = activity_stream
        self.timeline_dates = timeline_dates or {}
        self.variables = variables or {}
        self.activities: list[str] = []
        # Ensure the columns exits
        if self.dataset_obj.require_custom_functions and not custom_functions:
            raise SilenceError("You must provide the custom functions")
        self.custom_functions = custom_functions or dict()

        # Setup
        self.time_filters: list[dsm.TimeFilter] = []

    def _get_activity_slugs(self, obj: list[dsm.Activity]) -> list[str]:
        slugs = set()
        for a in obj:
            slugs.update(a.slugs)
            if isinstance(a, dsm.AppendActivity):
                for r in a.relative_activities:
                    slugs.update(self.dataset_obj.activity(r.append_activity_id).slugs)

        # TODO: deal with relative_to_activity_slug
        return sorted(list(slugs))

    def _create_scd_table(self, scd):
        qm = self.qm

        query = qm.Query()
        query.set_from(qm.Table(cte=scd["stream"], alias="s"))
        query.add_filter(
            qm.Condition(
                operator=dsm.StringArrayOperatorEnum.is_in,
                left=qm.Column(table_column=dsm.ActivityColumns.activity, table_alias="s"),
                right=[qm.Column(value=a) for a in scd["activity_slug"]],
            )
        )

        # add the join
        query.add_join(
            qm.Join(
                table=qm.Table(
                    schema=scd["dim"].schema_name,
                    table=scd["dim"].table,
                    alias="t",
                ),
                condition=qm.Filter(
                    filters=[
                        qm.Condition(
                            operator=dsm.StringOperatorEnum.equal,
                            left=qm.Column(
                                table_column=scd["dim"].join.foreign_key,
                                table_alias="s",
                                column_type=scd["dim"].join.type,
                            ),
                            right=qm.Column(
                                table_column=scd["dim"].join.id_key,
                                table_alias="t",
                                column_type=scd["dim"].join.type,
                            ),
                        ),
                        "AND",
                        qm.Condition(
                            operator="greater_than",
                            left=qm.Column(table_column=dsm.ActivityColumns.ts, table_alias="s"),
                            right=qm.Column(
                                table_column=scd["dim"].slowly_changing_ts,
                                table_alias="t",
                            ),
                        ),
                    ]
                ),
            )
        )

        query.add_column(
            qm.Column(
                table_column=dsm.ActivityColumns.activity_id,
                table_alias="s",
                name_alias=dsm.ActivityColumns.dim_join_id,
            )
        )
        for c in scd["columns"]:
            query.add_column(qm.Column(table_column=c.details.name, table_alias="t"))

        # add a row number
        query.add_column(
            qm.Column(
                function="row_number_w_group",
                fields=dict(
                    group=[
                        qm.Column(
                            table_column=dsm.ActivityColumns.activity_id,
                            table_alias="s",
                        )
                    ],
                    order=[
                        qm.Column(
                            table_column=scd["dim"].slowly_changing_ts,
                            table_alias="t",
                        ).to_query()
                        + " desc"
                    ],
                ),
                name_alias="row_num",
            )
        )
        # wrap to get the last value
        wrap_query = qm.wrap_query(query)
        wrap_query.add_filter(
            qm.Condition(
                operator=dsm.StringOperatorEnum.equal,
                left=qm.Column(table_column="row_num"),
                right=qm.Column(value=1),
            )
        )

        return wrap_query

    def _create_activity_query(
        self,
        activity_objs: list[dsm.AnyActivity],
    ):
        if isinstance(activity_objs[0], dsm.AppendActivity):
            use_time_filter = self._get_encompassing_time_refinements(activity_objs)
        else:
            use_time_filter = None

        kind = activity_objs[0]._kind

        # union all the activitys
        if self.activity_stream.manually_partition_activity:
            activity_slugs = self._get_activity_slugs(activity_objs)
            # slug_to_object = defaultdict(list)

            # # compute the occurrence
            # for a in activity_objs:
            #     for a_slug in a.slugs:
            #         slug_to_object[a_slug].append(a.fetch_type if not activity_objs[0]._recompute_occurrence else None)

            last_query = None
            # go through all the activitys
            for s in activity_slugs:
                # get all the values
                # occ = list(set(slug_to_object[s]))

                query = self.__get_sql_for_activity(
                    kind,
                    [s],
                    use_time_filter,
                    is_partitioned=True,
                    add_occurrence_filter=None,  # occ[0] if len(occ) == 1 else None,
                )

                # makes it a union
                if last_query:
                    query.set_union(last_query)

                last_query = query
            return query

        else:
            # check if we can globally apply a filter
            # filt_occ = None
            # # check to see if you can prefilter the stream
            # if all(a._can_use_occurrence for a in activity_objs):
            #     for occ in (
            #         dsm.SimpleFetchTypeEnum.first,
            #         dsm.SimpleFetchTypeEnum.last,
            #     ):
            #         if all(a.fetch_type == occ for a in activity_objs):
            #             filt_occ = occ
            #             break

            # decide on recompute
            activity_slugs = self._get_activity_slugs(activity_objs)
            return self.__get_sql_for_activity(
                kind,
                activity_slugs,
                use_time_filter,
                add_occurrence_filter=None,
            )

    def __get_sql_for_activity(
        self,
        kind: str,
        activity_slugs: list[str],
        use_time_filter: dsm.RefinementTimeDetails | None,
        is_partitioned: bool = False,
        add_occurrence_filter: (dsm.AppendFetchTypeEnum | dsm.CohortFetchTypeEnum | None) = None,
    ):
        qm = self.qm
        activity_query = qm.Query()
        activity_query.add_column(qm.Column(all_columns=True))

        # add the from table
        if is_partitioned:
            activity_query.set_from(
                self.qm.stream_table(
                    self.activity_stream.activity_stream,
                    activity=activity_slugs[0],
                    alias="s",
                )
            )
        else:
            activity_query.set_from(self.qm.stream_table(self.activity_stream.activity_stream, alias="s"))
            activity_query.set_where(
                qm.Condition(
                    operator=dsm.StringArrayOperatorEnum.is_in,
                    left=qm.Column(
                        table_alias="s",
                        table_column=dsm.ActivityColumns.activity,
                        column_type=dsm.ColumnTypeEnum.string,
                    ),
                    right=[qm.Column(value=s, column_type=dsm.ColumnTypeEnum.string) for s in activity_slugs],
                )
            )

        # if add_occurrence_filter == dsm.CohortFetchTypeEnum.first:
        #     activity_query.add_filter(
        #         qm.Condition(
        #             operator=dsm.StringOperatorEnum.equal,
        #             left=qm.Column(
        #                 table_alias="s",
        #                 table_column=dsm.ActivityColumns.activity_occurrence,
        #             ),
        #             right=qm.Column(value=1),
        #         )
        #     )
        # else:
        #     # remove data not ready to be used
        #     activity_query.add_filter(
        #         qm.Condition(
        #             operator=dsm.NullOperatorEnum.not_is_null,
        #             left=qm.Column(
        #                 table_alias="s",
        #                 table_column=dsm.ActivityColumns.activity_occurrence,
        #             ),
        #         )
        #     )

        # # add the last
        # if add_occurrence_filter == dsm.CohortFetchTypeEnum.last:
        #     activity_query.add_filter(
        #         qm.Condition(
        #             operator=dsm.NullOperatorEnum.is_null,
        #             left=qm.Column(
        #                 table_alias="s",
        #                 table_column=dsm.ActivityColumns.activity_repeated_at,
        #             ),
        #         )
        #     )

        time_filters = self.__find_cohort_time_filter()

        for f in time_filters:
            # Ignore equal time operators
            if f.operator in (dsm.TimeOperatorEnum.equal, dsm.TimeOperatorEnum.not_equal):
                continue

            if kind in (
                dsm.QueryKindEnum.cohort,
                dsm.QueryKindEnum.in_between,
                dsm.QueryKindEnum.relative_ever,
            ):
                if not f.to_condition:
                    activity_query.add_filter(
                        self.__create_filter(
                            f,
                            qm.Column(
                                table_column=dsm.ActivityColumns.ts,
                                table_alias="s",
                                column_type=dsm.ColumnTypeEnum.timestamp,
                                timezone=self.qm.timezone,
                            ),
                        ),
                        "AND",
                    )
            elif kind == dsm.QueryKindEnum.before:
                for filter in time_filters:
                    ts_col = qm.Column(
                        table_column=dsm.ActivityColumns.ts,
                        table_alias="s",
                        column_type=dsm.ColumnTypeEnum.timestamp,
                        timezone=self.qm.timezone,
                    )

                    if use_time_filter and filter.from_condition:
                        # apply the right filter
                        activity_query.add_filter(
                            qm.Condition(
                                operator="greater_than_equal",
                                left=self._update_column_with_time_filter(
                                    ts_col,
                                    use_time_filter,
                                ),
                                right=self.__map_time_filt(filter.from_condition),
                            ),
                            "AND",
                        )

                    if filter.to_condition:
                        activity_query.add_filter(
                            qm.Condition(
                                operator="less_than",
                                left=ts_col,
                                right=self.__map_time_filt(filter.to_condition),
                            ),
                            "AND",
                        )

                    if use_time_filter and filter.operator in (
                        dsm.TimeOperatorEnum.greater_than_equal,
                        dsm.TimeOperatorEnum.greater_than,
                    ):
                        activity_query.add_filter(
                            qm.Condition(
                                operator=filter.operator,
                                left=self._update_column_with_time_filter(
                                    ts_col,
                                    use_time_filter,
                                ),
                                right=qm.Column(value=filter.time_value, column_type=dsm.ColumnTypeEnum.timestamp),
                            ),
                            "AND",
                        )

                    if filter.operator in (dsm.TimeOperatorEnum.less_than_equal, dsm.TimeOperatorEnum.less_than):
                        activity_query.add_filter(
                            qm.Condition(
                                operator=filter.operator,
                                left=ts_col,
                                right=qm.Column(value=filter.time_value, column_type=dsm.ColumnTypeEnum.timestamp),
                            ),
                            "AND",
                        )

        return activity_query

    def _get_all_column_ids(self, col, output=None, return_col=False, only_id=None):
        """
        traverses the tree to find all the column ids.
        """
        if output is None:
            output = []

        if isinstance(col, list):
            for each_item in col:
                self._get_all_column_ids(each_item, output, return_col, only_id)

        elif isinstance(col, dsm.GroupDetails | dsm.ParentColumn):
            if isinstance(col.details, dsm.ComputedDetails):
                item = col.details.raw_str
                for temp_p in set(re.findall(r"(\w+)", utils.remove_all_in_quote(item))):
                    if is_col_id(temp_p.lower()) and (not only_id or temp_p == only_id):
                        output.append(col if return_col else temp_p)

            elif isinstance(col, dsm.GroupColumn):
                item = col.column_id
                if not only_id or item == only_id:
                    utils.extend_list(output, col if return_col else item)

        elif isinstance(col, dsm.PlotDefinition):
            for item in [
                col.columns.xs,
                col.columns.ys,
                col.columns.color_bys,
                col.columns.y2,
            ]:
                if item is None:
                    continue
                if not isinstance(item, list):
                    item = [item]
                # remove non-ids form the
                #
                item = [c for c in item if is_col_id(c) and (not only_id or c == only_id)]

                # check if the item exists
                if len(item) > 0:
                    if not return_col:
                        utils.extend_list(output, item)
                    else:
                        # extend the list
                        utils.extend_list(output, col)

        return output

    def _can_use_subquery(self):
        """
        figure out if we can put the order and the limit to the cohort subquery
        """
        # don't bother with the sub query if it is time
        if self.dataset_obj.kind == dsm.DatasetKindEnum.time:
            return False

        # if any of the append activities have a filter or is used in ordering
        ordered_id = [o.column_id for o in self.dataset_obj.order]
        for c in self.dataset_obj.columns:
            if (
                c.details.kind == dsm.DetailKindEnum.activity
                and c.details.activity_id == self.dataset_obj.cohort_activity_id
            ):
                continue

            if (
                c.filters is not None
                or c.id in ordered_id
                or (c.details.kind == dsm.DetailKindEnum.computed and c.details.is_window)
            ):
                return False

        return True

    # @tracer.start_as_current_span("setup_the_query")
    def setup_the_query(self, group: dsm.Tab | None):
        """
        Cleans columns and organizes the data
        """

        # initialize the column mapping
        dataset_obj = self.dataset_obj

        scd_dims = []

        if group:
            # carry the parent filters
            if group.parent_filters is not None:
                if group.parent_filters.logical_operator == dsm.LogicalOperatorEnum.AND:
                    for o in group.parent_filters.operands:
                        if c := dataset_obj.column(o.column_id):
                            filt = o.filter
                            if group.parent_filters.is_not or c.filters is None:
                                filt = dsm.BooleanExpression(
                                    logical_operator=dsm.LogicalOperatorEnum.AND,
                                    operands=[o.filter],
                                    is_not=group.parent_filters.is_not,
                                )
                            # add the filter when you compile
                            if c.filters is None:
                                c.filters = filt
                            elif c.filters.logical_operator == dsm.LogicalOperatorEnum.AND and not c.filters.is_not:
                                c.filters.operands.append(filt)
                            else:
                                c.filters = dsm.BooleanExpression(
                                    logical_operator=dsm.LogicalOperatorEnum.AND, operands=[c.filters, filt]
                                )

        # append the columns to each object
        for a in dataset_obj.activities:
            # deal with the columns
            a._referencing_relationships = []

            self.activities.extend(a.slugs)

            # add the activities that reference
            # TODO: FIX THIS
            # for other_a in dataset_obj.activities:
            #     for r in other_a["relationships"]:
            #         if (
            #             r.get("referencing_id") == a["id"]
            #             or r.get("referencing") == a["slug"]
            #         ):
            #             a["referencing_relationships"].append(r)

            # group the activity
            if a.is_cohort:
                for app in self.dataset_obj.append_activities:
                    if app.joins is not None:
                        for j in dsm._get_operands(app.joins):
                            if j.cohort_column:
                                j.cohort_column.label = f"app_{j.cohort_column.label}"
                                a.add_additional_column(j.cohort_column)

            else:
                # replace ever with before
                if self.dataset_obj.kind == dsm.DatasetKindEnum.time and a.relation == dsm.RelationTypeEnum.ever:
                    a.relation = dsm.RelationTypeEnum.before

                # if ts column is missing then add it
                if (
                    not a.fetch_type == dsm.AppendFetchTypeEnum.metric
                ) and dsm.ActivityColumns.ts not in dataset_obj.activity_column_names(a.id):
                    col = dsm.ParentColumn(
                        id=a.id + "_ts",
                        label=dsm.ActivityColumns.ts,
                        output=False,
                        type=dsm.ColumnTypeEnum.timestamp,
                        details=dsm.ActivitySourceDetails(activity_id=a.id, name=dsm.ActivityColumns.ts),
                    )
                    # dataset_obj.columns.append(col)
                    a.add_additional_column(col)

                append_cols = dataset_obj.activity_columns(a.id)
                if _is_same_as_cohort(a, dataset_obj.cohort_activity, append_cols):
                    cohort_columns = {
                        c.details.name: c for c in dataset_obj.activity_columns(dataset_obj.cohort_activity.id)
                    }
                    for ac in append_cols:
                        if cur_col := cohort_columns.get(ac.details.name):
                            ac._referrence_name = cur_col.clean_label
                        else:
                            # add the dimension if needed
                            if ac.details.dim_id and dataset_obj.cohort_activity.dim(ac.details.dim_id) is None:
                                dataset_obj.cohort_activity.dims.append(a.dim(ac.details.dim_id))

                            ac._referrence_name = "ref_" + ac.clean_label
                            dataset_obj.cohort_activity.add_additional_column(ac)

                    a._ignore = True

            # save the slowly changing dimension object
            for cc in dataset_obj.activity_columns(a.id):
                # if (
                #     cc.details.kind == dsm.DetailKindEnum.activity
                #     and cc.details.dim_id
                #     and a.dim(cc.details.dim_id) is None
                # ):
                #     breakpoint()

                if (
                    cc.details.kind == dsm.DetailKindEnum.activity
                    and cc.details.dim_id
                    and a.dim(cc.details.dim_id).slowly_changing_ts
                ):
                    # get the object
                    temp_scd = next(
                        (sd for sd in scd_dims if sd["activity_slug"] == a.slugs and sd["dim_id"] == cc.details.dim_id),
                        None,
                    )

                    if temp_scd:
                        temp_scd["columns"].append(cc)
                    else:
                        scd_dims.append(
                            dict(
                                dim_id=a.details.dim_id,
                                activity_slug=a.slugs,
                                columns=[cc],
                                dim=a.dim(cc.details.dim_id),
                                stream=("cohort_stream" if a.is_cohort else f'{a["kind"]}_stream'),
                            )
                        )

            # can the occurrence be actually used for optimization
            # a._can_use_occurrence = (
            #     False  # (a.is_cohort or a.relation == dsm.RelationTypeEnum.ever) and not a.is_reduced
            # )

            # add if recompute_occurrence
            # a._recompute_occurrence = True
            # (
            #     a.is_reduced
            #     or len(a.slugs) > 1
            #     or (
            #         not a.is_cohort
            #         and (
            #             a.relation == dsm.RelationTypeEnum.in_between
            #             or (a.fetch_type == dsm.AppendFetchTypeEnum.first and a.relation == dsm.RelationTypeEnum.after)
            #             or (a.fetch_type == dsm.AppendFetchTypeEnum.last and a.relation == dsm.RelationTypeEnum.before)
            #         )
            #     )
            # )

        # TODO: figure out what this does
        # # deal with spend column missing data
        # if group and group.get("spend"):
        #     for j in group["spend"]["joins"]:
        #         # get the raw parent dataset
        #         g_col = next(
        #             c
        #             for c in self.get_group_columns(group)
        #             if c["id"] == j["column_id"]
        #         )

        #         parent_col = next(
        #             c
        #             for c in self.get_all_columns(master_object)
        #             if c["id"] == g_col["column_id"]
        #         )
        #         j["join_column_source_details"] = (
        #             parent_col["source_details"]
        #             if parent_col["source_kind"] == "computed"
        #             else None
        #         )
        return scd_dims

    def validate_columns(self, group: dsm.Tab | None):
        # get all the columns
        referrenced_column_ids = self._get_all_column_ids(self.dataset_obj.columns)

        # get all the columns used in the dataset
        potential_added_id = [(a.id + "_ts") for a in self.dataset_obj.activities]
        available_ids = [c.id for c in self.dataset_obj.columns] + potential_added_id

        group_ids = []
        if group:
            referrenced_column_ids.extend(self._get_all_column_ids(group))
            group_ids.extend([c.id for c in group.columns])

        # missing column_ids
        missing_columns = [val for val in referrenced_column_ids if val not in available_ids and val not in group_ids]

        if len(missing_columns) > 0:
            logger.debug("Missing Columns", full_obj=self.dataset_obj.dict())
            raise (
                SilenceError(
                    "The following column_ids do not exist in the dataset but are used: {}".format(
                        ", ".join(missing_columns)
                    )
                )
            )

        duplicated_ids = [val for ii, val in enumerate(available_ids) if val in available_ids[ii + 1 :]]
        duplicated_ids.extend([val for ii, val in enumerate(group_ids) if val in group_ids[ii + 1 :]])
        if len(duplicated_ids) > 0:
            raise (SilenceError("A column Id is being duplicated in the dataset:{}".format(", ".join(duplicated_ids))))

        # Delaing with mapping for dataset code

    def create_full_query_join_filter(
        self,
        cte: str,
        alias: str,
        add_cohort_col: bool = False,
        last_alias: str | None = None,
    ):
        """
        Generates the full_query jooin at th ebottom of the code
        """

        qm = self.qm

        join_filt = qm.Filter()

        if self.dataset_obj.kind != dsm.DatasetKindEnum.time:
            # create the filter
            join_filt.add_filter(
                qm.Condition(
                    operator=dsm.StringOperatorEnum.equal,
                    left=qm.Column(
                        table_alias="c",
                        table_column=dsm.ActivityColumns.join_customer,
                        column_type=dsm.ColumnTypeEnum.string,
                    ),
                    right=qm.Column(
                        table_alias=alias,
                        table_column=dsm.ActivityColumns.join_customer,
                        column_type=dsm.ColumnTypeEnum.string,
                    ),
                ),
                "AND",
            )

        elif last_alias:
            # create the filter
            join_filt.add_filter(
                qm.Condition(
                    operator=dsm.StringOperatorEnum.equal,
                    # this is going to use join customer unless we are joining using the customer (only for time joins)
                    left=qm.Column(
                        table_alias=last_alias,
                        table_column=dsm.ActivityColumns.join_customer,
                        column_type=dsm.ColumnTypeEnum.string,
                    ),
                    right=qm.Column(
                        table_alias=alias,
                        table_column=dsm.ActivityColumns.join_customer,
                        column_type=dsm.ColumnTypeEnum.string,
                    ),
                ),
                "AND",
            )

        # add the cohort to the join
        if add_cohort_col:
            join_filt.add_filter(
                qm.Condition(
                    operator=dsm.StringOperatorEnum.equal,
                    left=qm.Column(table_alias="c", table_column=dsm.ActivityColumns.join_cohort_id),
                    right=qm.Column(
                        table_alias=alias,
                        table_column=dsm.ActivityColumns.join_cohort_id,
                    ),
                ),
                "AND",
            )

        # create the join
        join_table = qm.Join(
            table=qm.Table(cte=cte, alias=alias),
            kind="LEFT" if len(join_filt.filters) > 0 else "CROSS",
            condition=join_filt if len(join_filt.filters) > 0 else None,
        )
        return join_table

    def generate_sql_query(self):
        qm = self.qm
        if self.dataset_obj.kind == dsm.DatasetKindEnum.sql:
            full_query = qm.wrap_query(self.dataset_obj.sql_query)
        else:
            full_query = qm.wrap_query(
                qm.Table(table=self.dataset_obj.table.table_name, schema=self.dataset_obj.table.schema_name)
            )
        return full_query

    def generate_activity_query(self, tab: dsm.Tab | None = None):
        qm = self.qm
        scd_dims = self.setup_the_query(tab)

        # maintain the order so don't use set
        append_activities = [a for a in self.dataset_obj.append_activities if not a._ignore]
        ordered_kinds = []
        for a in append_activities:
            if a._kind not in ordered_kinds:
                ordered_kinds.append(a._kind)

        # add the time filters to the activity
        self.__find_cohort_time_filter()

        # INITIATLIAZE The query object
        full_query = qm.Query()
        if self.dataset_obj.kind == dsm.DatasetKindEnum.activity:
            full_query.add_cte("cohort_stream", self._create_activity_query([self.dataset_obj.cohort_activity]))

        # create all the appends
        for kind in ordered_kinds:
            full_query.add_cte(
                f"{kind}_stream",
                self._create_activity_query([a for a in append_activities if a._kind == kind]),
            )

        for scd in scd_dims:
            full_query.add_cte(
                _scd_table_name(scd["dim"].table, scd["activity_slug"]),
                self._create_scd_table(scd),
            )

        # add the cohort to the query
        full_query.add_cte(
            "cohort",
            self.create_cohort_query(kinds=set(a._kind for a in append_activities)),
        )
        full_query.set_from(qm.Table(cte="cohort", alias="c"))

        # add all the columns
        ignore_columns = []
        if self.dataset_obj.kind == dsm.DatasetKindEnum.activity:
            for c in self.dataset_obj.cohort_activity._additional_columns:
                if (
                    isinstance(c, dsm.ParentColumn)
                    and c._referrence_name is not None
                    and c._referrence_name.startswith("ref_")
                ):
                    ignore_columns.append(c._referrence_name)
                else:
                    ignore_columns.append(c.clean_label)

        full_query.add_column(
            self._get_non_join_columns(full_query.ctes["cohort"], alias="c", ignore_columns=ignore_columns)
        )
        last_alias = None

        # add the normal attribution and conversion
        first_alias = None
        for kind in ordered_kinds:
            # get the naem and sql
            name = "append_" + kind
            alias = name if qm.language == "mysql" else kind

            current_apppend = [a for a in append_activities if a._kind == kind]

            # add the append query
            append_query = self.create_append_query(current_apppend)

            # Add all the dimensional columns
            append_query = self._add_append_dim_columns(append_query, current_apppend)

            # add the rel query
            full_query.add_cte(name, append_query)

            # Now create the full join query
            full_query.add_join(
                self.create_full_query_join_filter(
                    name,
                    alias,
                    add_cohort_col=kind != dsm.QueryKindEnum.ever,
                    last_alias=last_alias,
                )
            )
            full_query.add_column(
                self._get_non_join_columns(
                    full_query.ctes[name],
                    alias=alias,
                )
            )

            if first_alias is None:
                first_alias = alias

            # if there is a customer table, we will use that first then use the next
            if last_alias is None:
                last_alias = alias

        # add all the customer columns first
        if self.dataset_obj.kind == dsm.DatasetKindEnum.time:
            # add the customer dim table
            for d in self.dataset_obj.cohort_time.dims:
                full_query.add_join(
                    self._add_dim_join(
                        d,
                        first_alias,
                        override_column=qm.Column(
                            table_alias=first_alias,
                            table_column=dsm.ActivityColumns.join_customer,
                            column_type=dsm.ColumnTypeEnum.string,
                        ),
                    )
                )

            # add the customer columns
            for c in self.dataset_obj.get_columns(dsm.DetailKindEnum.customer):
                full_query.add_column(self._convert_activity_columm(self.dataset_obj.cohort_time, c))

        return full_query

    @tracer.start_as_current_span("generate_query")
    def generate_query(
        self, group_slug: str | None = None, limit: int | None = DATASET_LIMIT, offset: int | None = None
    ):
        """
        Generates the full dataset object
        """
        qm = self.qm
        # get the group
        if group_slug:
            tab = self.dataset_obj.tab(group_slug)
        else:
            tab = None

        # validate that the columns are referenced
        self.validate_columns(tab)

        if self.dataset_obj.kind in (dsm.DatasetKindEnum.sql, dsm.DatasetKindEnum.table):
            full_query = self.generate_sql_query()
        else:
            full_query = self.generate_activity_query(tab)

        # add the computed columns
        full_query = self.add_computed_columns(full_query, self.dataset_obj.get_columns(dsm.DetailKindEnum.computed))

        # add all the filters that are needed post the query
        full_query = self.add_post_assembly_filters(full_query)

        # add the group by
        if tab:
            # add the take the full query and make it into a cte
            group_query = qm.Query()
            group_query.add_cte("raw_dataset", full_query)
            group_query.set_from(qm.Table(cte="raw_dataset", alias="rd"))

            # Handle OR parent filters
            if tab.parent_filters is not None and tab.parent_filters.logical_operator == dsm.LogicalOperatorEnum.OR:
                filt = qm.Filter()
                for o in tab.parent_filters.operands:
                    col = self._simple_column(o.column_id)
                    filt.add_filter(self.__create_filter(o.filter, col), "OR")

                group_query.add_filter(filt)

            # add the columns
            if tab.kind == dsm.TabKindEnum.parent:
                if tab.hide_show is not None:
                    for c in self.dataset_obj.columns:
                        if (c.id in tab.hide_show.column_ids) == (tab.hide_show.mode == dsm.HideShowEnum.show):
                            group_query.add_column(qm.Column(table_alias="rd", table_column=c.clean_label))
                else:
                    group_query.add_column(qm.Column(all_columns=True))

                self.add_order_by(group_query, group=tab)
                full_query = group_query

            elif tab.kind == dsm.TabKindEnum.group:
                # add the group query
                full_query = self.add_group(group_query, tab)

            full_query.set_limit(limit)
            if offset:
                full_query.set_offset(offset)

        # add the order and clean the output
        elif self._can_use_subquery():
            # you need to put the order on the cohort so the nested limit works then add another order so the output works
            self.add_order_by(full_query.ctes["cohort"])
            self.add_order_by(full_query)
            full_query = self.supress_outputs(full_query)
            full_query.ctes["cohort"].set_limit(limit)
            if offset:
                full_query.ctes["cohort"].set_offset(offset)
        else:
            self.add_order_by(full_query)
            full_query = self.supress_outputs(full_query)
            full_query.set_limit(limit)
            if offset:
                full_query.set_offset(offset)

        return full_query

    def supress_outputs(self, query: Query, columns: list[dsm.GroupColumn | dsm.ParentColumn] | None = None):
        """
        Check and suppress columns
        """
        qm = self.qm
        if columns is None:
            columns = self.dataset_obj.columns

        if all(c.output for c in columns):
            return query

        output_columns = [
            c for c in columns if c.output and not (c.details.kind == dsm.DetailKindEnum.group and c.details.pivoted)
        ]

        # supresss the columns
        new_query = qm.Query()
        new_query.add_comment("Remove all the columns that you hid")
        new_query.set_from(qm.Table(query=query, alias="f"))
        new_query.order_by = query.order_by
        query.order_by = []

        # add the columns you don't want to suppress
        for c in output_columns:
            new_query.add_column(qm.Column(table_alias="f", table_column=c.clean_label))

        return new_query

    def _get_encompassing_time_refinements(self, att_conv_objs: list[dsm.AppendActivity]) -> dsm.RefinementTimeDetails:
        refinement = None

        for att_obj in att_conv_objs:
            has_filt = False
            # check if you have a time filter
            for time in att_obj.time_refinements:
                # Handle encompassing filters
                if time.kind == dsm.RefinementEnum.at_least and any(
                    DATE_SECONDS[time.resolution] + time.value < DATE_SECONDS[tt.resolution] + tt.value
                    for tt in att_obj.time_refinements
                    if tt.kind == dsm.RefinementEnum.within
                ):
                    continue

                if refinement is None:
                    refinement = time
                elif refinement.kind != time.kind:
                    return None
                else:
                    current_is_greater = (
                        DATE_SECONDS[time.resolution] + time.value
                        > DATE_SECONDS[refinement.resolution] + refinement.value
                    )
                    # based on within choose the right refinement
                    if (current_is_greater and refinement.kind == dsm.RefinementEnum.within) or (
                        not current_is_greater and time.kind == dsm.RefinementEnum.at_least
                    ):
                        refinement = time

                has_filt = True

            # Do not bother returning a filter of any are empty
            if not has_filt:
                return None

        return refinement

    def _get_filter_in_join_conds(self, append_activities: list[dsm.AppendActivity], skip_dim_filters: bool = False):
        temp_filt = None
        for ii, a_obj in enumerate(append_activities):
            join_filters = self._create_append_join_filters(a_obj, skip_dim_filters=skip_dim_filters)
            if not join_filters:
                filt = None
            else:
                filt = self.qm.Filter()
                for jf in join_filters:
                    filt.add_filter(jf, "AND")

            if ii == 0:
                temp_filt = filt
            elif temp_filt is None or filt is None or temp_filt.to_query() != filt.to_query():
                return None
            else:
                temp_filt = filt
        return temp_filt

    def _update_column_with_time_filter(self, col, r: dsm.RefinementTimeDetails):
        # TO better deal within time we can do shift the column in the opposite direction
        return self.qm.Column(
            function="date_add",
            fields=dict(
                datepart=r.resolution,
                column=col,
                number=r.value,
            ),
        )

    def _convert_refinment_to_filter(self, r: dsm.RefinementTimeDetails, is_before: bool = False):
        qm = self.qm
        from_column = qm.Column(
            table_alias="c",
            table_column=dsm.ActivityColumns.join_ts,
            column_type=dsm.ColumnTypeEnum.timestamp,
        )
        to_column = qm.Column(
            table_alias="s",
            table_column=dsm.ActivityColumns.ts,
            column_type=dsm.ColumnTypeEnum.timestamp,
        )

        return qm.Condition(
            operator="less_than" if r.kind == dsm.RefinementEnum.within else "greater_than_equal",
            left=qm.Column(
                function="abs",
                fields=dict(
                    column=qm.Column(
                        function="date_diff",
                        fields=dict(
                            datepart=r.resolution,
                            from_column=to_column if is_before else from_column,
                            to_column=from_column if is_before else to_column,
                        ),
                    )
                ),
            ),
            right=qm.Column(value=r.value, column_type=dsm.ColumnTypeEnum.number),
        )

    def __find_cohort_time_filter(self):
        time_filters = []
        cohort_activity = self.dataset_obj.cohort_activity
        if self.dataset_obj.kind == dsm.DatasetKindEnum.activity:
            for cf in cohort_activity.prefilter_columns:
                if cf.filters is not None and cf.filters.logical_operator == dsm.LogicalOperatorEnum.AND:
                    for o in cf.filters.operands:
                        if cf.details.name == dsm.ActivityColumns.ts and isinstance(o, dsm.TimeFilter):
                            time_filters.append(o)

            for c in self.dataset_obj.activity_columns(cohort_activity.id, include_additional=False):
                if c.details.name == dsm.ActivityColumns.ts:
                    if c.filters is not None and c.filters.logical_operator == dsm.LogicalOperatorEnum.AND:
                        for o in c.filters.operands:
                            if isinstance(o, dsm.TimeFilter):
                                time_filters.append(o)

        elif self.dataset_obj.kind == dsm.DatasetKindEnum.time:
            if fr := self.dataset_obj.cohort_time.from_condition:
                time_filters.append(dsm.TimeFilter(from_condition=fr))

            for c in self.dataset_obj.time_columns:
                if c.filters is not None and c.filters.logical_operator == dsm.LogicalOperatorEnum.AND:
                    for o in c.filters.operands:
                        if isinstance(o, dsm.TimeFilter):
                            time_filters.append(o)
        return time_filters

    def __map_time_filt(self, filt: dsm.TimeCondition | None, apply_timezone: bool = True):
        qm = self.qm

        if filt is None and self.dataset_obj.kind == dsm.DatasetKindEnum.time:
            desired_col = qm.Column(
                function="now", fields=dict(), column_type=dsm.ColumnTypeEnum.timestamp, add_timezone=apply_timezone
            )

        elif filt is None:
            desired_col = None

        elif filt.reference == dsm.TimeReferenceEnum.relative:
            desired_col = qm.Column(
                function="date_add",
                fields=dict(
                    datepart=filt.details.resolution,
                    number=filt.details.value * -1,
                    column=qm.Column(
                        function="now",
                        fields=dict(),
                        column_type=dsm.ColumnTypeEnum.timestamp,
                        add_timezone=apply_timezone,
                    ),
                ),
            )

        elif filt.reference == dsm.TimeReferenceEnum.absolute:
            desired_col = qm.Column(
                value=filt.details.date_time,
                casting=dsm.ColumnTypeEnum.timestamp,
                add_timezone=apply_timezone,
            )

        elif filt.reference == dsm.TimeReferenceEnum.start_of:
            desired_col = qm.Column(
                function="date_trunc",
                fields=dict(
                    datepart=filt.details.resolution,
                    column=qm.Column(
                        function="now",
                        fields=dict(),
                        add_timezone=apply_timezone,
                    ),
                ),
            )

        return desired_col

    def __create_filter(self, f: dsm.AnyFilter, column: Column):
        """
        Deal with the Dataset UI filters
        """
        qm = self.qm
        if isinstance(f, dsm.NullFilter):
            return qm.Condition(operator=f.operator, left=column)
        elif isinstance(f, dsm.JoinConditon):
            right_col = qm.Column(
                table_alias="c",
                table_column=f.cohort_column.clean_label,
                column_type=f.cohort_column.type,
            )
            return qm.Condition(
                operator=f.operator,
                left=column,
                right=right_col,
            )

        elif isinstance(f, dsm.NumberFilter):
            return qm.Condition(
                operator=f.operator,
                left=column,
                right=qm.Column(value=f.number, column_type=dsm.ColumnTypeEnum.number),
            )
        elif isinstance(f, dsm.NumberArrayFilter):
            return qm.Condition(
                operator=f.operator,
                left=column,
                right=[qm.Column(value=v, column_type=dsm.ColumnTypeEnum.number) for v in f.numbers],
            )
        elif isinstance(f, dsm.StringFilter):
            return qm.Condition(
                operator=f.operator,
                left=column,
                right=qm.Column(value=f.value, column_type=dsm.ColumnTypeEnum.string),
            )
        elif isinstance(f, dsm.StringArrayFilter):
            if f.operator in (dsm.StringArrayOperatorEnum.contains_any, dsm.StringArrayOperatorEnum.not_contains_any):
                filt = qm.Filter()
                for v in f.values:
                    filt.add_filter(
                        qm.Condition(
                            operator=f.operator.replace("_any", ""),
                            left=column,
                            right=qm.Column(value=v, column_type=dsm.ColumnTypeEnum.string),
                        ),
                        "OR",
                    )

                return filt
            else:
                return qm.Condition(
                    operator=f.operator,
                    left=column,
                    right=[qm.Column(value=v, column_type=dsm.ColumnTypeEnum.string) for v in f.values],
                )

        elif isinstance(f, dsm.BooleanFilter):
            return qm.Condition(
                operator=f.operator,
                left=column,
                right=qm.Column(value=f.is_true, column_type=dsm.ColumnTypeEnum.boolean),
            )

        elif isinstance(f, dsm.VariableFilter):
            compiled_variable = fill_in_template(f.variable, self.variables)
            if isinstance(compiled_variable, list):
                return qm.Condition(
                    operator=f.operator,
                    left=column,
                    right=[qm.Column(value=v, column_type=column.column_type) for v in compiled_variable],
                )
            else:
                return qm.Condition(
                    operator=f.operator,
                    left=column,
                    right=qm.Column(value=compiled_variable, column_type=column.column_type),
                )

        elif isinstance(f, dsm.ColumnToColumnFilter):
            return qm.Condition(operator=f.operator, left=column, right=self._simple_column(f.column_id))

        elif isinstance(f, dsm.TimeFilter):
            filt = qm.Filter()
            if f.operator == dsm.TimeOperatorEnum.time_range:
                if f.from_condition is not None:
                    filt.add_filter(
                        qm.Condition(
                            operator="greater_than_equal",
                            left=column,
                            right=self.__map_time_filt(f.from_condition),
                        )
                    )
                if f.to_condition is not None:
                    filt.add_filter(
                        qm.Condition(
                            operator="less_than",
                            left=column,
                            right=self.__map_time_filt(f.to_condition),
                        )
                    )
            else:
                filt.add_filter(
                    qm.Condition(
                        operator=f.operator,
                        left=column,
                        right=qm.Column(value=f.time_value, column_type=column.column_type, add_timezone=True),
                    )
                )
            if filt.filters:
                return filt
            else:
                return None

    def __create_activity_condition(self, activity_obj: dsm.Activity):
        return self.qm.Condition(
            operator=dsm.StringArrayOperatorEnum.is_in,
            left=self.qm.Column(
                table_alias="s",
                table_column=dsm.ActivityColumns.activity,
                column_type=dsm.ColumnTypeEnum.string,
            ),
            right=[self.qm.Column(value=s, column_type=dsm.ColumnTypeEnum.string) for s in activity_obj.slugs],
        )

    def __get_customer_column(self, has_source, alias="s"):
        """
        returns the column based on the source id
        """

        qm = self.qm

        # create the customer column
        if has_source:
            customer_col = qm.Column(
                function="nvl",
                fields=dict(
                    first_column=qm.Column(
                        table_column="customer",
                        table_alias=alias,
                        column_type=dsm.ColumnTypeEnum.string,
                    ),
                    second_column=qm.Column(
                        table_column="anonymous_customer_id",
                        table_alias=alias,
                        column_type=dsm.ColumnTypeEnum.string,
                    ),
                ),
                name_alias=dsm.ActivityColumns.join_customer,
            )
        else:
            customer_col = qm.Column(
                table_column="customer",
                table_alias=alias,
                name_alias=dsm.ActivityColumns.join_customer,
                column_type=dsm.ColumnTypeEnum.string,
            )

        return customer_col

    def _add_append_dim_columns(self, query: Query, activities: list[dsm.AppendActivity]):
        # For Dimensions we need to decide when to add them
        # If a dimension in a metric, simply include them in the CASE statement
        # if the dimension is a string and we have many of them, then we will just add the join column to the query and then wrap them all.

        wraped_query = None
        for key_idx, a in enumerate(activities):
            for d in a.dims:
                # skip it if it is already added
                if d._alias:
                    continue
                dim_columns = [c for c in self.dataset_obj.activity_columns(a.id) if c.details.dim_id == d.id]

                # if we should use the wrapped query
                if a.fetch_type != dsm.AppendFetchTypeEnum.metric:
                    # if we need a wrapper then add it
                    if not wraped_query:
                        wraped_query = self.qm.wrap_query(query, alias="s")

                    # add dim join using special column
                    col = self.__add_dim_wrapper_column(d, key_idx, a.id)
                    qm_col = self.qm.Column(
                        table_column=col.clean_label,
                        table_alias="s",
                        column_type=col.type,
                    )
                    join = self._add_dim_join(d, key_idx=key_idx, override_column=qm_col)

                    # add the join to the wrapped query
                    wraped_query.add_join(join)

                    # Add the columns used straight to the table
                    for c in dim_columns:
                        wraped_query.add_column(
                            self.qm.Column(
                                table_column=c.details.name,
                                table_alias=d._alias,
                                column_type=c.type,
                                add_timezone=True,
                                name_alias=c.clean_label,
                            )
                        )

        return wraped_query or query

    def __add_dim_wrapper_column(self, dim: dsm.Dimension, key_idx: int, activity_id: str) -> dsm.ParentColumn:
        return dsm.ParentColumn(
            label=f"join_{dim.join.id_key}_{key_idx}_a",
            type=dim.join.type,
            details=dsm.ActivitySourceDetails(name=dim.join.foreign_key, activity_id=activity_id),
        )

    def _add_dim_join(
        self,
        dim: dsm.Dimension,
        alias="s",
        key_idx: int | None = None,
        override_column: Column | None = None,
    ):
        """
        Adds the dim join to the query
        """
        qm = self.qm

        if override_column:
            left_column = override_column

        elif dim.slowly_changing_ts:
            left_column = qm.Column(
                table_alias=alias,
                table_column=dsm.ActivityColumns.activity_id,
                column_type=dsm.ColumnTypeEnum.string,
            )
        else:
            left_column = self._simple_feature_column(alias, dim.join.foreign_key, dim.join.type)

        # add SCD joins
        if dim.slowly_changing_ts:
            table_name = _scd_table_name(dim.table, dim.activity_slug)

            if key_idx:
                table_alias = f"{table_name}_{key_idx}"

            dim._alias = table_alias

            # create the dim join
            dim_join = qm.Join(
                kind="LEFT",
                table=qm.Table(cte=table_name, alias=table_alias),
                condition=qm.Condition(
                    operator=dsm.StringOperatorEnum.equal,
                    left=left_column,
                    right=qm.Column(
                        table_alias=table_alias,
                        table_column=dsm.ActivityColumns.dim_join_id,
                        column_type=dsm.ColumnTypeEnum.string,
                    ),
                ),
            )

        else:
            dim._alias = f"{dim.table}_{key_idx}_tbl" if key_idx else f"{dim.table}_tbl"
            # create the dim join
            dim_join = qm.Join(
                kind="LEFT",
                table=qm.Table(
                    schema=dim.schema_name,
                    table=dim.table,
                    alias=dim._alias,
                ),
                condition=qm.Condition(
                    operator=dsm.StringOperatorEnum.equal,
                    left=left_column,
                    right=qm.Column(
                        table_alias=dim._alias,
                        table_column=dim.join.id_key,
                        column_type=dim.join.type,
                    ),
                ),
            )

        return dim_join

    def __create_occurrence_filter(self, activity_obj: dsm.AnyActivity, alias, rename_column=None):
        qm = self.qm

        if rename_column is None:
            return None

        # handle the filters
        if activity_obj.fetch_type == dsm.SimpleFetchTypeEnum.first:
            return qm.Condition(
                operator=dsm.StringOperatorEnum.equal,
                left=qm.Column(
                    table_column=rename_column,  # or dsm.ActivityColumns.activity_occurrence,
                    table_alias=alias,
                    column_type=dsm.ColumnTypeEnum.number,
                ),
                right=qm.Column(value=1),
            )

        elif activity_obj.fetch_type == dsm.SimpleFetchTypeEnum.last:
            # if activity_obj.is_cohort and rename_column is None:
            #     return qm.Filter(
            #         filters=[
            #             qm.Condition(
            #                 operator=dsm.NullOperatorEnum.is_null,
            #                 left=qm.Column(
            #                     table_column=dsm.ActivityColumns.activity_repeated_at,
            #                     table_alias=alias,
            #                     column_type=dsm.ColumnTypeEnum.timestamp,
            #                 ),
            #             ),
            #         ]
            #     )
            # else:
            return qm.Condition(
                operator=dsm.NullOperatorEnum.is_null,
                left=qm.Column(
                    table_column=rename_column,  # or dsm.ActivityColumns.activity_repeated_at
                    table_alias=alias,
                    column_type=dsm.ColumnTypeEnum.timestamp,
                ),
            )

        return None

    def _apply_quick_function(self, column: dsm.ParentColumn | dsm.PrefilterColumn, qm_col: Column):
        # handle applying the time resolution
        if column.apply_quick_function:
            if column.apply_quick_function != dsm.QuickFunctionEnum.exists:
                qm_col = self.qm.Column(
                    function="date_trunc",
                    fields=dict(
                        datepart=column.apply_quick_function,
                        column=qm_col,
                    ),
                    column_type=dsm.ColumnTypeEnum.timestamp,
                    name_alias=column.clean_label,
                )
            else:
                qm_col = self.qm.Column(
                    function="exists",
                    fields=dict(
                        column=qm_col,
                    ),
                    column_type=dsm.ColumnTypeEnum.number,
                    name_alias=column.clean_label,
                )
        return qm_col

    def _convert_activity_columm(
        self,
        activity: dsm.Activity,
        column: dsm.PrefilterColumn | dsm.ParentColumn,
        alias="s",
    ):
        if column.details.kind == dsm.DetailKindEnum.activity:
            if column.details.dim_id is not None:
                qm_col = self.qm.Column(
                    table_column=column.details.name,
                    table_alias=activity.dim(column.details.dim_id)._alias,
                    column_type=column.type,
                    name_alias=column.clean_label,
                )
            elif column.details.name == dsm.ActivityColumns.feature_json:
                qm_col = self.qm.Column(
                    table_alias=alias,
                    table_column=column.details.name,
                    column_type=dsm.ColumnTypeEnum.number,  # HACK: Use the number so it does the row_number join
                    name_alias=column.clean_label,
                )
            elif column.details.name.startswith(dsm.ActivityColumns.feature_start):
                # OLD WAY
                if column.details.name[8:] in ("1", "2", "3"):
                    qm_col = self.qm.Column(
                        table_alias=alias,
                        json_column=dsm.ActivityColumns.feature_json,
                        json_key=column.details.name[8:],
                        column_type=dsm.ColumnTypeEnum.string,
                        casting=column.type,
                        name_alias=column.clean_label,
                        add_timezone=True,
                    )
                else:
                    qm_col = self.qm.Column(
                        table_alias=alias,
                        json_column=dsm.ActivityColumns.feature_json,
                        json_key=column.details.name[8:],
                        column_type=column.details.type or column.type,
                        add_timezone=True,
                        name_alias=column.clean_label,
                    )
            elif column.details.name == dsm.ActivityColumns.join_customer:
                qm_col = self.__get_customer_column(has_source=activity.has_source, alias=alias)
            else:
                qm_col = self.qm.Column(
                    table_column=column.details.name,
                    table_alias=alias,
                    column_type=column.type,
                    add_timezone=True,
                    name_alias=column.clean_label,
                )

        elif column.details.kind == dsm.DetailKindEnum.customer:
            qm_col = self.qm.Column(
                table_column=column.details.name,
                table_alias=activity.dim(column.details.customer_dim_id)._alias,
                column_type=column.type,
                name_alias=column.clean_label,
            )

        qm_col = self._apply_quick_function(column, qm_col)

        return qm_col

    def _simple_feature_column(
        self, alias: str, table_column: str, column_type: dsm.ColumnTypeEnum, name_alias: str | None = None
    ):
        if table_column.startswith(dsm.ActivityColumns.feature_start):
            # OLD WAY
            if table_column[8:] in ("1", "2", "3"):
                qm_col = self.qm.Column(
                    table_alias=alias,
                    json_column=dsm.ActivityColumns.feature_json,
                    json_key=table_column[8:],
                    column_type=dsm.ColumnTypeEnum.string,
                    casting=column_type,
                    name_alias=name_alias,
                    add_timezone=True,
                )
            else:
                qm_col = self.qm.Column(
                    table_alias=alias,
                    json_column=dsm.ActivityColumns.feature_json,
                    json_key=table_column[8:],
                    column_type=column_type,
                    add_timezone=True,
                    name_alias=name_alias,
                )
        else:
            qm_col = self.qm.Column(
                table_column=table_column,
                table_alias=alias,
                column_type=column_type,
                name_alias=name_alias,
            )

        return qm_col

    def _convert_filter(
        self, filter: dsm.AnyExpression | None, column: Column, activity_obj: dsm.AnyActivity | None = None
    ):
        if filter is None:
            return None

        qm = self.qm
        filt = qm.Filter()
        for o in filter.operands:
            if isinstance(o, dsm.JoinConditon):
                column = self._convert_activity_columm(activity_obj, o.column, "s")

            if isinstance(o, dsm.AnyExpression):
                temp_filt = self._convert_filter(o, column, activity_obj)
            else:
                temp_filt = self.__create_filter(o, column)

            # add the filters
            filt.add_filter(
                temp_filt,
                kind=filter.logical_operator,
            )

        # Add the not
        if not isinstance(filter, dsm.JoinConditonExpression) and filter.is_not:
            filt.is_not = True

        # ignore None filters
        if filt.filters:
            return filt
        return None

    def __create_activity_filter(
        self,
        activity_obj: dsm.AnyActivity,
        alias,
        ignore_occurrence=False,
        ignore_filters=False,
        add_activity=False,
    ):
        """
        Create activity filter for slug and occurrence creates the filter to capture the activity
        """
        qm = self.qm

        if add_activity:
            filt = qm.Filter(filters=[self.__create_activity_condition(activity_obj)])
        else:
            filt = qm.Filter(filters=[])

        # if it is within_cohort then don't worry about the occurrence
        if not ignore_occurrence:
            # handle the filters
            filt.add_filter(self.__create_occurrence_filter(activity_obj, alias), "AND")

        # add the precolum filters
        if not ignore_filters:
            for prefilt in activity_obj.prefilter_columns:
                # Don't bother trying to filter dims
                if prefilt.details.kind == dsm.DetailKindEnum.activity and prefilt.details.dim_id is not None:
                    continue
                column = self._convert_activity_columm(activity_obj, prefilt, alias)
                filt.add_filter(self._convert_filter(prefilt.filters, column), "AND")

        return filt

    def _get_non_join_columns(self, query: Query, alias: str, ignore_columns: list[str] | None = None):
        """
        Loop through all the columns in the query and return valid columns
        """

        qm = self.qm

        valid_columns = []

        # go through all the columns and remove join columns
        # breakpoint()
        for col in query.get_all_columns(only_names=False):
            c = col.get_name()
            if not c.startswith("join_") and (ignore_columns is None or c not in ignore_columns):
                if col.function and col.function in [
                    f["name"]
                    for f in FUNCTIONS
                    if f["kind"] == "agg_functions"
                    and utils.get_simple_type(f["output_type"]) == dsm.ColumnTypeEnum.number
                ]:
                    valid_columns.append(
                        qm.Column(
                            function="nvl",
                            fields=dict(
                                first_column=qm.Column(table_column=c, table_alias=alias),
                                second_column=qm.Column(value=0),
                            ),
                            name_alias=c,
                        )
                    )
                else:
                    valid_columns.append(qm.Column(table_column=c, table_alias=alias))

        return valid_columns

    def __add_cohort_join_columns(
        self,
        query,
        has_source: bool = False,
        needs: list[str] | None = None,
        recompute_next_ts: bool = False,
        is_unique: bool = False,
    ):
        """
        Adds the activity_id
        """

        qm = self.qm

        if needs is None:
            needs = []

        # if it is wrapped then unwrap it
        if query.from_table.kind == "query":
            query = query.from_table.query

        # get all the customer names
        cols = query.get_all_columns(only_names=True)

        # add the join customer
        if dsm.ActivityColumns.join_customer not in cols:
            query.add_column(self.__get_customer_column(has_source, query.from_table.alias))

        # if you need a join timestamp
        if dsm.ActivityColumns.join_ts not in cols:
            # add the ts
            query.add_column(
                qm.Column(
                    table_alias=query.from_table.alias,
                    table_column=dsm.ActivityColumns.ts,
                    name_alias=dsm.ActivityColumns.join_ts,
                    column_type=dsm.ColumnTypeEnum.timestamp,
                )
            )

        if dsm.ActivityColumns.join_cohort_id in needs and dsm.ActivityColumns.join_cohort_id not in cols:
            # add the cohort activity id
            query.add_column(
                qm.Column(
                    table_alias=query.from_table.alias,
                    table_column=dsm.ActivityColumns.activity_id,
                    name_alias=dsm.ActivityColumns.join_cohort_id,
                    column_type=dsm.ColumnTypeEnum.string,
                )
            )

        if (
            dsm.ActivityColumns.join_activity_occurrence in needs
            and dsm.ActivityColumns.join_activity_occurrence not in cols
        ):
            # add it
            query.add_column(
                qm.Column(
                    function="row_number_w_group",
                    fields=dict(
                        group=self.__get_customer_column(has_source, query.from_table.alias),
                        order=qm.Column(
                            table_column=dsm.ActivityColumns.ts,
                            table_alias=query.from_table.alias,
                            column_type=dsm.ColumnTypeEnum.timestamp,
                        ),
                    ),
                    name_alias=dsm.ActivityColumns.join_activity_occurrence,
                )
            )

        if dsm.ActivityColumns.join_cohort_next_ts in needs and dsm.ActivityColumns.join_cohort_next_ts not in cols:
            if is_unique:
                # if the query is unique then just null the cohort next ts
                query.add_column(qm.Column(value=None, name_alias=dsm.ActivityColumns.join_cohort_next_ts))
            elif recompute_next_ts:
                # add it
                query.add_column(
                    qm.Column(
                        function="lead",
                        fields=dict(
                            column=qm.Column(
                                table_column=(
                                    dsm.ActivityColumns.join_ts
                                    if query.from_table.kind == "query"
                                    else dsm.ActivityColumns.ts
                                ),
                                table_alias=query.from_table.alias,
                            ),
                            group=self.__get_customer_column(has_source, query.from_table.alias),
                            order=qm.Column(
                                table_column=(
                                    dsm.ActivityColumns.join_ts
                                    if query.from_table.kind == "query"
                                    else dsm.ActivityColumns.ts
                                ),
                                table_alias=query.from_table.alias,
                            ),
                        ),
                        name_alias=dsm.ActivityColumns.join_cohort_next_ts,
                    )
                )
            else:
                query.add_column(
                    qm.Column(
                        table_alias=query.from_table.alias,
                        table_column=dsm.ActivityColumns.activity_repeated_at,
                        name_alias=dsm.ActivityColumns.join_cohort_next_ts,
                        column_type=dsm.ColumnTypeEnum.timestamp,
                    )
                )

    # @tracer.start_as_current_span("create_time_cohort")
    def create_time_cohort_query(self, needs: list[str]):
        qm = self.qm
        cohort_time = self.dataset_obj.cohort_time
        # create the new table
        if cohort_time.kind in (
            dsm.CohortTimeKindEnum.this,
            dsm.CohortTimeKindEnum.last,
        ):
            # choose the right time solution
            if cohort_time.kind == dsm.CohortTimeKindEnum.last:
                raw_string = "date_add('{resolution}', -1, date_trunc('{resolution}', local_now()))".format(
                    resolution=cohort_time.resolution
                )
                time_column = self._parse_obj(ast.parse(raw_string).body[0].value, make_column=True)

            elif cohort_time.kind == dsm.CohortTimeKindEnum.this:
                raw_string = "date_trunc('{resolution}', local_now())".format(resolution=cohort_time.resolution)
                time_column = self._parse_obj(ast.parse(raw_string).body[0].value, make_column=True)
            from_table = None

        else:
            time_column = qm.Column(table_column=cohort_time.resolution)
            from_table = qm.Table(query=self.__create_time_query(cohort_time))

        time_query = qm.Query()

        if from_table:
            time_query.set_from(from_table)

        for col_name in (
            dsm.ActivityColumns.join_cohort_id,
            dsm.ActivityColumns.join_ts,
            self.dataset_obj.time_columns[0].label,
        ):
            hour_diff = int(utils.date_diff(utils.localnow(self.qm.timezone), utils.utcnow(), "hour"))

            if col_name == dsm.ActivityColumns.join_ts:
                # create the time column for the join_ts
                col = qm.Column(
                    function="time_add",
                    fields=dict(
                        datepart="second",
                        number=-1,
                        column=qm.Column(
                            function=time_column.function,
                            fields=time_column.fields,
                            table_column=time_column.table_column,
                            column_type=dsm.ColumnTypeEnum.timestamp,
                        ),
                    ),
                    comment="We make it a second less to better deal with start of the month dates",
                    name_alias=col_name,
                )

                if hour_diff > 0:
                    time_query.add_column(
                        qm.Column(
                            function="time_add",
                            fields=dict(
                                datepart="hour",
                                number=hour_diff,
                                column=col,
                            ),
                            comment="Moving it to UTC so the join works",
                            name_alias=col_name,
                        )
                    )
                else:
                    time_query.add_column(col)

            else:
                time_query.add_column(
                    qm.Column(
                        function=time_column.function,
                        fields=time_column.fields,
                        table_column=time_column.table_column,
                        column_type=dsm.ColumnTypeEnum.timestamp,
                        name_alias=col_name,
                    )
                )

        if from_table and dsm.ActivityColumns.join_cohort_next_ts in needs:
            col = qm.Column(
                function="date_add",
                fields=dict(
                    datepart=cohort_time.resolution,
                    number=1,
                    column=qm.Column(table_column=cohort_time.resolution),
                ),
                name_alias=dsm.ActivityColumns.join_cohort_next_ts,
                column_type=dsm.ColumnTypeEnum.timestamp,
            )

            if hour_diff > 0:
                time_query.add_column(
                    qm.Column(
                        function="time_add",
                        fields=dict(
                            datepart="hour",
                            number=hour_diff,
                            column=col,
                        ),
                        comment="Moving it to UTC so the join works",
                        name_alias=dsm.ActivityColumns.join_cohort_next_ts,
                    )
                )
            else:
                time_query.add_column(col)
        else:
            if dsm.ActivityColumns.join_cohort_next_ts in needs:
                time_query.add_column(
                    qm.Column(
                        name_alias=dsm.ActivityColumns.join_cohort_next_ts,
                        casting=dsm.ColumnTypeEnum.timestamp,
                        column_type=dsm.ColumnTypeEnum.timestamp,
                    )
                )

        return time_query

    # @tracer.start_as_current_span("create_cohort_query")
    def create_cohort_query(self, kinds: list[str]):
        """
        create the cohort queries
        """

        qm = self.qm

        # decide on what it needs and what to recompute
        needs = [dsm.ActivityColumns.join_ts, dsm.ActivityColumns.join_cohort_id]
        if dsm.QueryKindEnum.in_between in kinds:
            needs.append(dsm.ActivityColumns.join_cohort_next_ts)

        # allow time occurrence
        if self.dataset_obj.kind == dsm.DatasetKindEnum.time:
            # NOTE: For time query the activity id is the time resolution
            cohort_query = self.create_time_cohort_query(
                needs,
            )
            columns = self.dataset_obj.time_columns
        else:
            cohort_query = self.create_activity_cohort_query(needs=needs)
            columns = self.dataset_obj.activity_columns(
                self.dataset_obj.cohort_activity.id, include_additional=True
            ) + self.dataset_obj.get_columns(dsm.DetailKindEnum.customer)

        # add all the column filters
        column_filters = []
        for c in columns:
            if c.filters is not None and not c.has_column_to_column_filter:
                column_filters.append(c)

        # add the column filters
        if len(column_filters) > 0:
            wrapper_query = qm.Query()
            wrapper_query.add_column(qm.Column(all_columns=True))
            wrapper_query.set_from(qm.Table(alias="c", query=cohort_query))

            cohort_filt = qm.Filter()
            for c in column_filters:
                cohort_filt.add_filter(
                    self._convert_filter(
                        c.filters,
                        qm.Column(
                            table_alias="c",
                            table_column=c.clean_label,
                            column_type=c.type,
                        ),
                    ),
                    "AND",
                )

            # add the filter if it is not empty
            if len(cohort_filt.filters) > 0:
                wrapper_query.set_where(cohort_filt)

            final_query = wrapper_query
        else:
            final_query = cohort_query

        return final_query

    # @tracer.start_as_current_span("create_activity_cohort_query")
    def create_activity_cohort_query(self, needs: list[str] | None = None):
        """
        add the activity cohort
        """

        qm = self.qm
        cohort_obj = self.dataset_obj.cohort_activity

        activity_query = qm.Query()
        # add the from table
        activity_query.set_from(
            qm.Table(
                cte="cohort_stream",
                alias="s",
            )
        )
        alias = "s"
        activity_filt = self.__create_activity_filter(cohort_obj, "s", ignore_occurrence=True, ignore_filters=True)

        # # add the relationship columns
        # for r in activity_obj["relationships"]:
        #     if r["slug"] == "column":
        #         activity_query.add_column(
        #             qm.Column(
        #                 table_alias="s",
        #                 table_column=r["column_name"],
        #                 name_alias="join_" + r["column_name"],
        #             )
        #         )

        # for r in activity_obj["referencing_relationships"]:
        #     if r["slug"] == "column":
        #         activity_query.add_column(
        #             qm.Column(
        #                 table_alias="s",
        #                 table_column=r["column_name"],
        #                 name_alias="join_" + r["column_name"],
        #             )
        # )

        # add the enrichment table if the filter was there
        for dim in cohort_obj.dims:
            activity_query.add_join(self._add_dim_join(dim, alias))

        for prefilt in cohort_obj.prefilter_columns:
            column = self._convert_activity_columm(cohort_obj, prefilt, alias)
            activity_filt.add_filter(self._convert_filter(prefilt.filters, column), "AND")

        # Activity filts can be empty
        if activity_filt.filters:
            activity_query.set_where(activity_filt)

        # add the columns
        for c in self.dataset_obj.activity_columns(
            cohort_obj.id, include_additional=True
        ) + self.dataset_obj.get_columns(dsm.DetailKindEnum.customer):
            if c.details.name == dsm.ActivityColumns.join_customer:
                # add the column and rename it to be the right name
                temp_col = self.__get_customer_column(cohort_obj.has_source, alias)
                temp_col.set_name_alias(c.clean_label)
                activity_query.add_column(temp_col)

            elif c.details.name == dsm.ActivityColumns.activity_occurrence:
                # add it
                activity_query.add_column(
                    qm.Column(
                        function="row_number_w_group",
                        fields=dict(
                            group=[
                                self.__get_customer_column(
                                    cohort_obj.has_source,
                                    activity_query.from_table.alias,
                                )
                            ],
                            order=qm.Column(
                                table_column=dsm.ActivityColumns.ts,
                                table_alias=activity_query.from_table.alias,
                                column_type=dsm.ColumnTypeEnum.timestamp,
                            ),
                        ),
                        name_alias=c.clean_label,
                    )
                )
            elif c.details.name == dsm.ActivityColumns.activity_repeated_at:
                # add it
                activity_query.add_column(
                    qm.Column(
                        function="lead",
                        fields=dict(
                            column=qm.Column(
                                table_column=dsm.ActivityColumns.ts,
                                table_alias=activity_query.from_table.alias,
                                column_type=dsm.ColumnTypeEnum.timestamp,
                            ),
                            group=[
                                self.__get_customer_column(
                                    cohort_obj.has_source,
                                    activity_query.from_table.alias,
                                )
                            ],
                            order=qm.Column(
                                table_column=dsm.ActivityColumns.ts,
                                table_alias=activity_query.from_table.alias,
                                column_type=dsm.ColumnTypeEnum.timestamp,
                            ),
                        ),
                        name_alias=c.clean_label,
                    )
                )
            else:
                cohort_column = self._convert_activity_columm(cohort_obj, c, alias)

                # make sure we use the reference name if it is needed
                if isinstance(c, dsm.ParentColumn) and c._referrence_name:
                    cohort_column.set_name_alias(c._referrence_name)

                # wrap the column to properly do the casting
                if cohort_column.casting:
                    if activity_query.where:
                        cohort_column = qm.Column(
                            case=dict(cases=[dict(when=activity_query.where, then=cohort_column)]),
                            name_alias=cohort_column.name_alias,
                        )
                activity_query.add_column(cohort_column)

        # Add the other activities that need be
        # add the shortcut filters
        is_wrapped = False
        for a in self.dataset_obj.activities:
            if a._ignore:
                # make sure the cohort is wrapped
                if not is_wrapped:
                    final_query = qm.wrap_query(activity_query, alias="c")
                    is_wrapped = True

                if a.fetch_type == dsm.AppendFetchTypeEnum.last and a.relation == dsm.RelationTypeEnum.ever:
                    func = "last_value_window"
                elif a.fetch_type == dsm.AppendFetchTypeEnum.first and a.relation == dsm.RelationTypeEnum.ever:
                    func = "first_value_window"
                elif a.relation in dsm.RelationTypeEnum.in_between:
                    func = "lead"
                elif a.fetch_type == dsm.AppendFetchTypeEnum.first and a.relation == dsm.RelationTypeEnum.after:
                    func = "lead"
                elif a.fetch_type == dsm.AppendFetchTypeEnum.last and a.relation == dsm.RelationTypeEnum.before:
                    func = "lag"
                elif a.fetch_type == dsm.AppendFetchTypeEnum.first and a.relation == dsm.RelationTypeEnum.before:
                    func = "first_value_window_before"
                elif a.fetch_type == dsm.AppendFetchTypeEnum.last and a.relation == dsm.RelationTypeEnum.after:
                    func = "after_value_window_after"
                elif a.fetch_type == dsm.AppendFetchTypeEnum.metric:
                    func = None
                else:
                    raise ValueError(f"Unknown fetch type and relation {a.fetch_type} {a.relation}")

                # add the column of the activities using the window function
                for ac in self.dataset_obj.activity_columns(a.id):
                    if func is None:
                        use_func = AGG_TO_WINDOW_FUNC.get((ac.details.applied_function, a.relation))
                    else:
                        use_func = func

                    if use_func is None:
                        raise ValueError(
                            f"Unknown column aggregation and relation {a.fetch_type} {ac.details.applied_function}"
                        )
                    # get the column so applied functions are properly converted
                    col = qm.Column(
                        table_column=ac._referrence_name,
                        table_alias="c",
                        column_type=ac.type,
                        name_alias=ac.clean_label,
                    )
                    col = self._apply_quick_function(ac, col)

                    final_query.add_column(
                        qm.Column(
                            function=use_func,
                            fields=dict(
                                column=col,
                                group=qm.Column(
                                    table_column=dsm.ActivityColumns.join_customer,
                                    table_alias="c",
                                    column_type=dsm.ColumnTypeEnum.string,
                                ),
                                order=qm.Column(
                                    table_column=dsm.ActivityColumns.join_ts,
                                    table_alias="c",
                                    column_type=dsm.ColumnTypeEnum.timestamp,
                                ),
                            ),
                            column_type=ac.type,
                            name_alias=ac.clean_label,
                        )
                    )
        if is_wrapped:
            activity_query = final_query

        # add the wrapper columns
        if cohort_obj.fetch_type != dsm.CohortFetchTypeEnum.all:
            wrapper_query = qm.Query()
            wrapper_query.add_column(qm.Column(all_columns=True))
            wrapper_query.set_from(qm.Table(query=activity_query, alias=alias))

            # add the activity occurrence as a column
            if cohort_obj.fetch_type == dsm.CohortFetchTypeEnum.last:
                self.__add_cohort_join_columns(
                    activity_query,
                    has_source=cohort_obj.has_source,
                    recompute_next_ts=True,
                    needs=[dsm.ActivityColumns.join_cohort_next_ts],
                )
                wrapper_query.set_where(
                    self.__create_occurrence_filter(
                        cohort_obj,
                        alias,
                        rename_column=dsm.ActivityColumns.join_cohort_next_ts,
                    )
                )
            else:
                self.__add_cohort_join_columns(
                    activity_query,
                    has_source=cohort_obj.has_source,
                    needs=[dsm.ActivityColumns.join_activity_occurrence],
                )
                wrapper_query.set_where(
                    self.__create_occurrence_filter(
                        cohort_obj,
                        alias,
                        rename_column=dsm.ActivityColumns.join_activity_occurrence,
                    )
                )

            activity_query = wrapper_query

        # add the cohort columns
        self.__add_cohort_join_columns(
            activity_query,
            has_source=cohort_obj.has_source,
            needs=needs or [],
            recompute_next_ts=True,
            is_unique=cohort_obj.fetch_type != dsm.CohortFetchTypeEnum.all,
        )

        return activity_query

    def add_post_assembly_filters(self, full_query: Query):
        qm = self.qm
        # add all the post filters
        column_filters = []

        for c in self.dataset_obj.columns:
            if c.filters is not None and (
                c.has_column_to_column_filter
                or c.details.kind == dsm.DetailKindEnum.computed
                or (
                    c.details.kind == dsm.DetailKindEnum.activity
                    and c.details.activity_id != self.dataset_obj.cohort_activity_id
                )
            ):
                column_filters.append(c)

        if len(column_filters) > 0:
            # create a wrapper
            new_query = qm.wrap_query(full_query)
            new_query.add_comment("Adding all the post assembly filters")

            full_filter = qm.Filter()
            # add all the post data filters
            for c in column_filters:
                full_filter.add_filter(
                    self._convert_filter(c.filters, self._simple_column(c.id)),
                    "AND",
                )

            new_query.add_filter(full_filter)
            # update the full query pointer
            full_query = new_query

        return full_query

    def _add_aggregation_to_column(
        self,
        col: dsm.ParentColumn,
        activity_obj: dsm.AppendActivity,
        case_column: Column | None = None,
        is_wrapper: bool = False,
    ):
        qm = self.qm

        if case_column is None:
            case_column = qm.Column(table_column=col.clean_label, column_type=col.type)

        base_column = qm.Column(table_alias="s", table_column=dsm.ActivityColumns.ts)

        if is_wrapper:
            if base_c := self.dataset_obj.get_activity_column(activity_obj.id, dsm.ActivityColumns.ts):
                base_column.table_column = base_c.clean_label

        is_first = activity_obj.fetch_type == dsm.AppendFetchTypeEnum.first

        cast_output = False
        # support new types
        if (
            col.type in (dsm.ColumnTypeEnum.number, dsm.ColumnTypeEnum.timestamp)
            or activity_obj.fetch_type == dsm.AppendFetchTypeEnum.metric
        ):
            if (
                activity_obj.relation == dsm.RelationTypeEnum.ever
                and len(activity_obj.relative_activities) > 0
                and activity_obj.fetch_type != dsm.AppendFetchTypeEnum.metric
                and col.type == dsm.ColumnTypeEnum.number
            ):
                if activity_obj.fetch_type == dsm.AppendFetchTypeEnum.first:
                    simple_func = "first_value"
                else:
                    simple_func = "last_value"
                cast_output = True
            elif activity_obj.fetch_type == dsm.AppendFetchTypeEnum.first:
                simple_func = "min"
            elif activity_obj.fetch_type == dsm.AppendFetchTypeEnum.last:
                simple_func = "max"
            elif activity_obj.fetch_type == dsm.AppendFetchTypeEnum.metric:
                # this is just in case we want to add sum or average for occurrence later for numbers
                simple_func = col.details.applied_function

            # create the extra column
            return_column = qm.Column(
                name_alias=col.clean_label,
                function=simple_func,
                fields=dict(
                    column=case_column,
                    percentile=col.details.percentile,
                    base_column=base_column,
                ),
                casting=dsm.ColumnTypeEnum.number if cast_output else None,
            )

        # # don't bother doing the concat if it is just a simple occurrence filter
        # elif not activity_obj._recompute_occurrence:
        #     return_column = qm.Column(
        #         name_alias=col.clean_label,
        #         function="min" if is_first else "max",
        #         fields=dict(
        #             column=case_column,
        #         ),
        #     )
        else:
            # make sure the first value is set as a string
            # this important cause features can be booleans or int
            if case_column.kind == "case":
                for each_case in case_column.case["cases"]:
                    each_case["then"].set_casting(dsm.ColumnTypeEnum.string)

                # add the column
                return_column = qm.Column(
                    name_alias=col.clean_label,
                    casting=col.type if col.type != dsm.ColumnTypeEnum.string else None,
                    function=("first_value_case" if is_first else "last_value_case"),
                    fields=dict(
                        case=case_column.case["cases"][0]["when"],
                        column=case_column.case["cases"][0]["then"],
                        base_column=base_column,
                    ),
                    comment="this is a clever pivot on for groups",
                )

            else:
                # cast the column as a string
                case_column.set_casting(dsm.ColumnTypeEnum.string)

                # process the column
                return_column = qm.Column(
                    name_alias=col.clean_label,
                    casting=col.type if col.type != dsm.ColumnTypeEnum.string else None,
                    function=("first_value" if is_first else "last_value"),
                    fields=dict(column=case_column, base_column=base_column),
                )
        return return_column

    def _remove_operand_dim(self, join: dsm.JoinConditonExpression):
        if join is not None:
            operands = []
            for j in join.operands:
                if isinstance(j, dsm.JoinConditonExpression):
                    self._remove_operand_dim(j)
                elif not (j.column.details.kind == dsm.DetailKindEnum.activity and j.column.details.dim_id is not None):
                    operands.append(j)

            join.operands = operands

    def _create_append_join_filters(self, activity_obj: dsm.AppendActivity, skip_dim_filters: bool = False):
        filters = []
        # Add the column filters
        for cr in activity_obj.prefilter_columns:
            if skip_dim_filters and cr.details.kind == dsm.DetailKindEnum.activity and cr.details.dim_id is not None:
                continue
            column = self._convert_activity_columm(activity_obj, cr, "s")
            temp_filt = self._convert_filter(cr.filters, column)
            filters.append(temp_filt)

        # add the join filters
        if activity_obj.joins is not None:
            # Do not add the dimensional join if it doesn't make sense
            join = deepcopy(activity_obj.joins)
            if skip_dim_filters and join is not None:
                self._remove_operand_dim(join)

            temp_filt = self._convert_filter(join, None, activity_obj=activity_obj)
            filters.append(temp_filt)
        return filters

    # creates the case column
    def _create_case_column_filter(
        self,
        activity_obj: dsm.AppendActivity,
        col_type=dsm.ColumnTypeEnum.string,
        kind=None,
    ):
        qm = self.qm

        # recompute_occurrrence = activity_obj._recompute_occurrence

        # create the column with the filter
        col_filt = self.__create_activity_filter(
            activity_obj,
            "s",
            ignore_occurrence=True,
            ignore_filters=False,
            add_activity=True,
        )

        additional_filters = []
        # if recompute_occurrrence:
        additional_filters.extend(col_filt.filters[2:])
        # else:
        #     additional_filters.extend(col_filt.filters[4:])

        # remove the and and ors
        additional_filters = [a for a in additional_filters if a != "AND"]

        # add the within filters
        for tr in activity_obj.time_refinements:
            temp_filt = self._convert_refinment_to_filter(
                tr, is_before=activity_obj.relation == dsm.RelationTypeEnum.before
            )
            col_filt.add_filter(
                temp_filt,
                "AND",
            )
            additional_filters.append(temp_filt)

        join_filters = self._create_append_join_filters(activity_obj)
        for jf in join_filters:
            col_filt.add_filter(jf, "AND")
            additional_filters.append(jf)

        # create the row numbers
        if (
            activity_obj.fetch_type != dsm.AppendFetchTypeEnum.metric
            and col_type == dsm.ColumnTypeEnum.number
            and len(activity_obj.relative_activities) == 0
        ):
            group = [
                qm.Column(table_alias="s", table_column=dsm.ActivityColumns.activity),
                self.__get_customer_column(activity_obj.has_source),
            ]

            # add the additional column for the subset
            if kind in (
                dsm.QueryKindEnum.in_between,
                dsm.QueryKindEnum.before,
                dsm.QueryKindEnum.relative_ever,
            ):
                group.append(qm.Column(table_alias="c", table_column=dsm.ActivityColumns.join_cohort_id))

            # add the filters to the join
            # use a case statement since some warehouses don't like booleans in partition (MSQQL)
            if additional_filters:
                temp_filter = qm.Filter()
                for f in additional_filters:
                    temp_filter.add_filter(f)

                group.append(
                    qm.Column(
                        case=dict(
                            cases=[
                                dict(
                                    when=temp_filter,
                                    then=qm.Column(value=1),
                                )
                            ]
                        )
                    )
                )

            col_filt.add_filter(
                qm.Condition(
                    operator=dsm.StringOperatorEnum.equal,
                    left=qm.Column(
                        function="row_number_w_group",
                        fields=dict(
                            group=group,
                            order=[
                                qm.Column(
                                    table_alias="s",
                                    table_column=dsm.ActivityColumns.ts,
                                ).to_query()
                                + (" asc" if activity_obj.fetch_type != dsm.AppendFetchTypeEnum.last else " desc")
                            ],
                        ),
                    ),
                    right=qm.Column(
                        value=1,
                        column_type="integer",
                    ),
                ),
                "AND",
            )

        return col_filt

    def _add_relative_activity(self, query: Query, relative_activity: dsm.ActivityRelative, kind: str):
        qm = self.qm
        relative_to_activity = self.dataset_obj.activity(relative_activity.append_activity_id)
        activity_filter = self.__create_activity_filter(
            relative_to_activity,
            "s",
            ignore_occurrence=True,
            ignore_filters=False,
            add_activity=True,
        )
        window_col = qm.Column(
            function=(
                "max_window" if relative_to_activity.fetch_type == dsm.SimpleFetchTypeEnum.last else "min_window"
            ),
            fields=dict(
                column=qm.Column(
                    case=dict(
                        cases=[
                            dict(
                                when=activity_filter,
                                then=qm.Column(
                                    table_column=dsm.ActivityColumns.ts,
                                    table_alias="s",
                                    column_type=dsm.ColumnTypeEnum.timestamp,
                                ),
                            )
                        ]
                    )
                ),
                group=query.columns[: (2 if kind != dsm.QueryKindEnum.ever else 1)],
            ),
        )

        # handle the window column
        if (relative_activity.include_if_null and relative_activity.relation == dsm.RelationTypeEnum.after) or (
            not relative_activity.include_if_null and relative_activity.relation == dsm.RelationTypeEnum.before
        ):
            date_to_use = "1900-01-01"
        else:
            date_to_use = "2100-01-01"

        rel_cond = qm.Condition(
            operator=("greater_than" if relative_activity.relation == dsm.RelationTypeEnum.after else "less_than"),
            left=qm.Column(
                table_column=dsm.ActivityColumns.ts,
                table_alias="s",
                column_type=dsm.ColumnTypeEnum.timestamp,
            ),
            right=qm.Column(
                function="nvl",
                fields=dict(
                    first_column=window_col,
                    second_column=qm.Column(
                        value=date_to_use,
                        casting=dsm.ColumnTypeEnum.timestamp,
                    ),
                ),
            ),
        )

        return rel_cond

    def _create_append_case_column(
        self,
        col: dsm.ParentColumn,
        only_case: bool = False,
        kind: str = None,
        alias: str = "s",
    ):
        """
        Creates a case column based on the case column
        """

        qm = self.qm

        # create the activity column
        activity_obj = self.dataset_obj.activity(col.details.activity_id)
        then_col = self._convert_activity_columm(activity_obj, col, alias)

        if activity_obj.relative_activities and col.type == dsm.ColumnTypeEnum.number:
            then_col.set_casting(dsm.ColumnTypeEnum.string)

        # crea the column filters
        col_filt = self._create_case_column_filter(activity_obj, col_type=col.type, kind=kind)

        # added the att column
        case_column = qm.Column(case=dict(cases=[dict(when=col_filt, then=then_col)]))

        if only_case:
            case_column.set_name_alias(col.clean_label)
            return case_column
        else:
            return self._add_aggregation_to_column(col, activity_obj, case_column)

    def create_append_query(self, append_activities: list[dsm.AppendActivity]):
        """
        Creates the relationship query,
        """
        qm = self.qm
        kind = append_activities[0]._kind
        # helpful flags
        has_source = any(a.has_source for a in append_activities) and (
            self.dataset_obj.kind != dsm.DatasetKindEnum.activity or self.dataset_obj.cohort_activity.has_source
        )
        is_time = self.dataset_obj.kind == dsm.DatasetKindEnum.time
        has_next_ts = is_time or self.dataset_obj.cohort_activity.fetch_type == dsm.CohortFetchTypeEnum.all

        # if you have a number column or custom occurrence then you need to create the wrapper
        t_cols = [
            c
            for a in append_activities
            for c in self.dataset_obj.activity_columns(a.id)
            if a.relative_activities
            or (a.fetch_type != dsm.AppendFetchTypeEnum.metric and c.type == dsm.ColumnTypeEnum.number)
        ]

        create_wrapper = kind == dsm.QueryKindEnum.in_between or len(t_cols) > 0

        # start the query
        query = qm.Query()
        query.add_comment(
            [
                "for attribution and conversion we use a SQL pivot to get unique rows per cohort",
                "SQL pivots are also much faster than doing several joins",
            ]
        )

        # use the cohort column if the cohort column will be there
        query.add_column(self.__get_customer_column(has_source))

        # add the cohort id column that we will use for the join
        if kind != dsm.QueryKindEnum.ever:
            query.add_column(
                qm.Column(
                    table_alias="c",
                    table_column=dsm.ActivityColumns.join_cohort_id,
                    column_type=dsm.ColumnTypeEnum.string,
                    comment="this is used as a session id",
                )
            )

            join_cond = qm.Filter()

            if not is_time:
                join_cond.add_filter(
                    qm.Condition(
                        operator=dsm.StringOperatorEnum.equal,
                        left=query.columns[0],
                        right=qm.Column(
                            table_alias="c",
                            table_column=dsm.ActivityColumns.join_customer,
                            column_type=dsm.ColumnTypeEnum.string,
                        ),
                    )
                )

            # if everything has a within filter then add it
            if time_refinements := self._get_encompassing_time_refinements(append_activities):
                join_cond.add_filter(
                    self._convert_refinment_to_filter(time_refinements, is_before=kind == dsm.QueryKindEnum.before)
                )

            # if everything has a within filter then add it
            if col_join_cond := self._get_filter_in_join_conds(append_activities, skip_dim_filters=True):
                if col_join_cond.filters:
                    join_cond.add_filter(col_join_cond)

            # do the proper time filter
            if kind in (
                dsm.QueryKindEnum.in_between,
                dsm.QueryKindEnum.before,
                dsm.QueryKindEnum.after,
            ):
                join_cond.add_filter(
                    qm.Condition(
                        operator=("less_than" if kind == dsm.QueryKindEnum.before else "greater_than"),
                        left=qm.Column(
                            table_alias="s",
                            table_column=dsm.ActivityColumns.ts,
                            column_type=dsm.ColumnTypeEnum.timestamp,
                        ),
                        right=qm.Column(
                            table_alias="c",
                            table_column=dsm.ActivityColumns.join_ts,
                            column_type=dsm.ColumnTypeEnum.timestamp,
                        ),
                    ),
                    "AND",
                )

            if kind == dsm.QueryKindEnum.in_between and has_next_ts:
                join_cond.add_filter(
                    qm.Condition(
                        operator="less_than_equal",
                        left=qm.Column(
                            table_alias="s",
                            table_column=dsm.ActivityColumns.ts,
                        ),
                        right=qm.Column(
                            function="nvl",
                            fields=dict(
                                first_column=qm.Column(
                                    table_alias="c",
                                    table_column=dsm.ActivityColumns.join_cohort_next_ts,
                                ),
                                second_column=qm.Column(
                                    value="2100-01-01",
                                    casting=dsm.ColumnTypeEnum.timestamp,
                                ),
                            ),
                        ),
                    ),
                    "AND",
                )

        if kind != dsm.QueryKindEnum.ever:
            # create the reference table
            query.set_from(qm.Table(cte="cohort", alias="c"))
            query.add_join(
                qm.Join(
                    table=qm.Table(
                        cte=f"{kind}_stream",
                        alias="s",
                    ),
                    kind="INNER",
                    condition=join_cond,
                )
            )

        else:
            query.set_from(
                qm.Table(
                    cte=f"{kind}_stream",
                    alias="s",
                )
            )

        # handle the wrappers
        if create_wrapper:
            # add all the queries to the wrapper
            wrapper_query = qm.Query()
            wrapper_query.add_column([qm.Column(table_column=c) for c in query.get_all_columns(only_names=True)])
            query.add_column(
                qm.Column(
                    table_column=dsm.ActivityColumns.ts,
                    table_alias="s",
                    column_type=dsm.ColumnTypeEnum.timestamp,
                )
            )
            wrapper_query.set_from(qm.Table(query=query, alias="s"))
            wrapper_query.add_group_by(1)

            if kind != dsm.QueryKindEnum.ever:
                wrapper_query.add_group_by(2)
        else:
            query.add_group_by(1)

            if kind != dsm.QueryKindEnum.ever:
                query.add_group_by(2)

        for key_idx, a in enumerate(append_activities):
            add_dim_ids = []
            # if a dim is used then add it
            for d in a.dims:
                if (
                    any(c for c in a.prefilter_columns if c.details.dim_id == d.id)
                    or a.fetch_type == dsm.AppendFetchTypeEnum.metric
                    or any(j for j in dsm._get_operands(a.joins) if j.column.details.dim_id == d.id)
                ):
                    add_dim_ids.append(d.id)
                    try:
                        query.add_join(self._add_dim_join(d, alias="s"))
                    except TypeError as e:
                        if "alias of the join" in str(e):
                            logger.debug("dim already used but that is fine")
                        else:
                            raise e
                else:
                    # Add the columns needed for the join
                    a.add_additional_column(self.__add_dim_wrapper_column(d, key_idx, a.id))

            # add all the columns
            for col in self.dataset_obj.activity_columns(a.id, include_additional=True):
                # don't add the join_customer or the dim_id since that is not needed
                if (
                    self.dataset_obj.kind == dsm.DatasetKindEnum.activity
                    and col.details.name == dsm.ActivityColumns.join_customer
                    and col.details.applied_function is None
                ) or (col.details.dim_id is not None and col.details.dim_id not in add_dim_ids):
                    continue

                # handle add the unique identifier to time cohorts
                if (
                    self.dataset_obj.kind == dsm.DatasetKindEnum.time
                    and col.details.name == dsm.ActivityColumns.join_customer
                ):
                    temp_col = self.__get_customer_column(has_source, "s")
                    temp_col.set_name_alias(col.clean_label)
                    query.add_column(temp_col)
                    continue

                # add the case column
                case_column = self._create_append_case_column(col, only_case=create_wrapper, kind=kind)

                # if it has relative activity
                for r in a.relative_activities:
                    rel_cond = self._add_relative_activity(query, r, kind)
                    case_column.case["cases"][0]["when"].add_filter(rel_cond, "AND")

                # update the label
                case_column.set_name_alias(col.clean_label)

                # add the case column:
                query.add_column(case_column)

                if create_wrapper:
                    wrapper_query.add_column(self._add_aggregation_to_column(col, a, is_wrapper=True))

        # remove the filter if nothing is filtered
        if query.where and len(query.where.filters) == 0:
            query.where = None

        return wrapper_query if create_wrapper else query

    def _simple_column(
        self,
        column_id: str,
        group: dsm.Tab | None = None,
        is_raw: bool = False,
        alias=None,
        **kwargs,
    ):
        if group:
            col = group.column(column_id)
        else:
            col = self.dataset_obj.column(column_id)

        if not col:
            if column_id == "join_ts":
                return self.qm.Column(
                    table_column="join_ts",
                    column_type=dsm.ColumnTypeEnum.timestamp,
                    table_alias=alias,
                    **kwargs,
                )
            else:
                raise SilenceError(
                    f"One of the columns referenced ({column_id}) was incorrect. Please delete the column and add it again using the auto complete"
                )

        col_name = col.details.name if is_raw else col.clean_label

        return self.qm.Column(
            table_column=col_name,
            name_alias=col.clean_label,
            column_type=col.type,
            table_alias=alias,
            **kwargs,
        )

    # ADD COMPUTED COLUMNS
    def _parse_obj(self, obj, make_column: bool = False, group: dsm.Tab | None = None) -> Column:
        """"""
        qm = self.qm
        if isinstance(obj, str):
            if obj.lower() in ("null", ""):
                return qm.Column()
            else:
                return self._parse_obj(
                    ast.parse(obj.replace("\n", "")).body[0].value, make_column=make_column, group=group
                )
        elif isinstance(obj, ast.Name):
            if obj.id.lower() == "null":
                return qm.Column()

            # HACK: the spend check is because we used to use `_spend..`  in old old spend columns
            elif obj.id.lower().startswith("_") and not obj.id.lower().startswith("_spend"):
                timeline_date = self.timeline_dates[obj.id[1:]]
                return qm.Column(
                    value=timeline_date,
                    column_type=dsm.ColumnTypeEnum.string,
                    casting=dsm.ColumnTypeEnum.timestamp,
                )
            elif isinstance(obj, ast.Attribute):
                if not (group or self.dataset_obj).column(obj.value.id):
                    raise SilenceError(
                        f"One of the columns referenced ({obj.value.id}) was incorrect. Please delete the column and add it again using the auto complete"
                    )

                if obj.attr in ("asc", "desc"):
                    return qm.Order(
                        column=self._simple_column(obj.value.id, group=group),
                        asc=obj.attr == "asc",
                    )
                elif obj.attr in qm.config["cast_mapping"].keys():
                    return self._simple_column(obj.value.id, casting=obj.attr, group=group)
                else:
                    raise DatasetCompileError("invalid way of ordering")
            elif obj.id.lower() in ("true", "false"):
                return qm.Column(value=obj.id.lower() == "true", column_type=dsm.ColumnTypeEnum.boolean)
            else:
                return self._simple_column(obj.id, group=group)

        # deal with attribute
        elif isinstance(obj, ast.Attribute):
            if obj.attr in ("asc", "desc"):
                return qm.Order(
                    column=self._parse_obj(obj.value, True, group=group),
                    asc=obj.attr == "asc",
                )
            elif obj.attr in CONFIG[qm.language]["cast_mapping"].keys():
                col = self._parse_obj(obj.value, True, group=group)
                col.set_casting(obj.attr)
                return col
            elif obj.attr in ("local"):
                return self._simple_column(obj.value.id, group=group, add_timezone=True)
            else:
                raise SilenceError(
                    "The . operator was used and we only support: .asc, .desc, .local .string, .number, .boolean, .timestamp"
                )

        elif isinstance(obj, ast.Constant) and isinstance(obj.value, str):
            if obj.value.lower() == "null":
                return qm.Column(column_type=dsm.ColumnTypeEnum.string)
            else:
                return qm.Column(value=obj.value, column_type=dsm.ColumnTypeEnum.string) if make_column else obj.value

        elif isinstance(obj, ast.Constant) and isinstance(obj.value, float | int):
            return qm.Column(value=obj.value, column_type=dsm.ColumnTypeEnum.number) if make_column else obj.n

        elif isinstance(obj, ast.Constant) and isinstance(obj.value, bool):
            return qm.Column(value=obj.value, column_type=dsm.ColumnTypeEnum.boolean) if make_column else obj.n

        elif isinstance(obj, ast.UnaryOp):
            try:
                return qm.Column(
                    components=[
                        qm.Column(value=-1),
                        "*",
                        self._parse_obj(obj.operand, True, group=group),
                    ]
                )
            except Exception:
                raise SilenceError("A `-` was used in a way that we did not expect, please fix it or contact support")

        elif isinstance(obj, ast.BinOp):
            if isinstance(obj.op, ast.Mult):
                op = "*"
            elif isinstance(obj.op, ast.Add):
                op = "+"
            elif isinstance(obj.op, ast.Div):
                op = "/"
            elif isinstance(obj.op, ast.Sub):
                op = "-"
            else:
                raise (SilenceError(f"Math operation not supported: {str(obj.op)}"))

            left_col = self._parse_obj(obj.left, True, group=group)
            right_col = self._parse_obj(obj.right, True, group=group)
            if op == "/":
                if right_col.function != "nullif":
                    right_col = qm.Column(
                        function="nullif",
                        fields=dict(
                            column=right_col, value_column=qm.Column(value=0, column_type=dsm.ColumnTypeEnum.number)
                        ),
                    )

                # deal with float vs int
                comps = [left_col, "*", qm.Column(value=1.000, column_type=dsm.ColumnTypeEnum.number), op, right_col]
            else:
                comps = [
                    left_col,
                    op,
                    right_col,
                ]

            return qm.Column(components=comps)

        elif isinstance(obj, ast.List | ast.Tuple):
            return [self._parse_obj(a, make_column=make_column, group=group) for a in obj.elts]

        elif isinstance(obj, ast.Compare):
            if isinstance(obj.ops[0], ast.GtE):
                op = "greater_than_equal"
            elif isinstance(obj.ops[0], ast.Gt):
                op = "greater_than"
            elif isinstance(obj.ops[0], ast.LtE):
                op = "less_than_equal"
            elif isinstance(obj.ops[0], ast.Lt):
                op = "less_than"
            elif isinstance(obj.ops[0], ast.Eq):
                op = dsm.StringOperatorEnum.equal
            elif isinstance(obj.ops[0], ast.In):
                op = dsm.StringArrayOperatorEnum.is_in
            else:
                raise DatasetCompileError(f"Non Supported operator for condition :{str(obj.ops[0])}")
            cond = qm.Condition(
                operator=op,
                left=self._parse_obj(obj.left, make_column=True, group=group),
                right=self._parse_obj(obj.comparators[0], make_column=True, group=group),
            )
            return qm.Column(condition=cond) if make_column else cond

        elif isinstance(obj, ast.BoolOp):  # this is a filter
            temp_f = qm.Filter()

            if isinstance(obj.op, ast.And | ast.Or):
                for val in obj.values:
                    temp_f.add_filter(
                        self._parse_obj(val, make_column=isinstance(obj, ast.Call), group=group),
                        "AND" if isinstance(obj.op, ast.And) else "OR",
                    )

                return qm.Column(condition=temp_f) if make_column else temp_f
            else:
                raise DatasetCompileError("we only support and/or combinations")

        elif isinstance(obj, ast.Call):
            if obj.func.id.startswith("_"):
                # if you see a custom function then replace it with the proper functions
                custom_func = self.custom_functions.get(obj.func.id[1:])
                if custom_func is None:
                    raise SilenceError(f"Missing custom function: {obj.func.id[1:]}")

                new_raw_string = custom_func.text_to_replace
                for ii, t_arg in enumerate(obj.args):
                    new_raw_string = new_raw_string.replace("$%i" % (ii + 1), ast.unparse(t_arg))

                return self._parse_obj(
                    ast.parse(new_raw_string).body[0].value,
                    make_column=True,
                    group=group,
                )

            if obj.func.id == "is_time_to_date":
                resolution = self._parse_obj(obj.args[1], group=group)
                ts_col = self._parse_obj(obj.args[0], make_column=True, group=group)

                # return a boolean of the condition
                return qm.Condition(
                    operator="greater_than_equal",
                    left=ts_col,
                    right=qm.Column(
                        function="date_trunc",
                        fields=dict(
                            datepart=resolution,
                            column=qm.Column(function="now", fields=dict()),
                        ),
                    ),
                )

            elif obj.func.id == "local_now":
                return qm.Column(function="now", fields=dict(), timezone=self.qm.timezone)

            elif obj.func.id == "is_last_time_to_date":
                resolution = self._parse_obj(obj.args[1], group=group)
                ts_col = self._parse_obj(obj.args[0], make_column=True, group=group)
                trunc_col = qm.Column(
                    function="date_trunc",
                    fields=dict(
                        datepart=resolution,
                        column=qm.Column(function="now", fields=dict()),
                    ),
                )

                trunc_col_minus_one = qm.Column(
                    function="date_add",
                    fields=dict(
                        datepart=resolution,
                        number=-1,
                        column=trunc_col,
                    ),
                )

                return qm.Filter(
                    filters=[
                        qm.Condition(
                            operator="greater_than_equal",
                            left=ts_col,
                            right=trunc_col_minus_one,
                        ),
                        "AND",
                        qm.Condition(
                            operator="less_than",
                            left=ts_col,
                            right=qm.Column(
                                function="date_add",
                                fields=dict(
                                    datepart="second",
                                    number=qm.Column(
                                        function="date_diff",
                                        fields=dict(
                                            datepart="second",
                                            from_column=trunc_col,
                                            to_column=qm.Column(function="now", fields=dict()),
                                        ),
                                        casting="integer",
                                    ),
                                    column=trunc_col_minus_one,
                                ),
                            ),
                        ),
                    ]
                )

            elif obj.func.id == "iff":
                then_col = self._parse_obj(obj.args[1], make_column=True, group=group)
                else_col = self._parse_obj(obj.args[2], make_column=True, group=group)

                col = qm.Column(
                    case=dict(
                        cases=[
                            dict(
                                when=self._parse_obj(obj.args[0], group=group),
                                then=then_col,
                            )
                        ],
                        else_value=else_col,
                    ),
                    column_type=then_col.get_type() or else_col.get_type(),
                )
                return col

            elif obj.func.id == "is_conv":
                main_column = self._parse_obj(obj.args[0], make_column=True, group=group)
                additional_columns = self._parse_obj(obj.args[1], make_column=True, group=group)

                cond_filter = qm.Filter()

                cond_filter.add_filter(qm.Condition(operator="not_is_null", left=main_column))

                # make sure the timestamp is after every other one and not null
                for each_col in additional_columns:
                    cond_filter.add_filter(qm.Condition(operator="not_is_null", left=each_col))
                    cond_filter.add_filter(qm.Condition(operator="less_than", left=each_col, right=main_column))

                # CASE WHEN ___ is not null and ___ < TIMESTAMP, ...)
                return qm.Column(
                    case=dict(
                        cases=[
                            dict(
                                when=cond_filter,
                                then=qm.Column(value=1, column_type=dsm.ColumnTypeEnum.number),
                            )
                        ],
                        else_value=qm.Column(value=0, column_type=dsm.ColumnTypeEnum.number),
                    ),
                    column_type=dsm.ColumnTypeEnum.number,
                )

            elif obj.func.id == "field_bucket":
                # create the column
                desired_col = self._parse_obj(obj.args[0], make_column=True, group=group)
                groupings = ast.literal_eval(obj.args[1])

                # Just in case
                if groupings.get("group_names") is None:
                    groupings["group_names"] = groupings["groups"]

                cases = []

                # create the right grouping by field
                if groupings["kind"] == dsm.ColumnTypeEnum.string:
                    # # create all the cases from the column
                    for jj, each_g in enumerate(groupings["groups"]):
                        cases.append(
                            dict(
                                when=qm.Condition(
                                    operator=(
                                        dsm.NullOperatorEnum.is_null
                                        if "null" == str(each_g).lower()
                                        else dsm.StringOperatorEnum.equal
                                    ),
                                    left=desired_col,
                                    right=qm.Column(
                                        value=str(each_g),
                                        column_type=dsm.ColumnTypeEnum.string,
                                    ),
                                ),
                                then=qm.Column(
                                    value=groupings["group_names"][jj],
                                    column_type=dsm.ColumnTypeEnum.string,
                                ),
                            )
                        )

                    return qm.Column(
                        case=dict(
                            cases=cases,
                            else_value=qm.Column(
                                value=groupings.get("else_name", "Other"),
                                column_type=dsm.ColumnTypeEnum.string,
                            ),
                        )
                    )

                elif groupings["kind"] == "boolean":
                    return qm.Column(
                        case=dict(
                            cases=[
                                dict(
                                    when=qm.Condition(
                                        operator=dsm.StringOperatorEnum.equal,
                                        left=desired_col,
                                        right=(
                                            qm.Column(
                                                value=1,
                                                column_type=dsm.ColumnTypeEnum.number,
                                            )
                                            if groupings["groups"][0] in ("1", 1)
                                            else qm.Column(value=True, column_type="boolean")
                                        ),
                                    ),
                                    then=qm.Column(
                                        value=groupings["group_names"][0],
                                        column_type=dsm.ColumnTypeEnum.string,
                                    ),
                                )
                            ],
                            else_value=qm.Column(
                                value=groupings.get("else_name", "False"),
                                column_type=dsm.ColumnTypeEnum.string,
                            ),
                        )
                    )

                elif groupings["kind"] == dsm.ColumnTypeEnum.number:
                    # the value to add the right number of zeros
                    val = float(groupings["groups"][-1])
                    is_int = int(val) == val

                    # zero_count = len(str(int(val)))
                    for jj, each_g in enumerate(groupings["groups"]):
                        each_g = float(each_g) if not is_int else int(float(each_g))
                        cases.append(
                            dict(
                                when=qm.Condition(
                                    operator="less_than",
                                    left=desired_col,
                                    right=qm.Column(
                                        value=float(each_g),
                                        column_type=dsm.ColumnTypeEnum.number,
                                    ),
                                ),
                                then=qm.Column(
                                    value=groupings["group_names"][jj],
                                    column_type=dsm.ColumnTypeEnum.string,
                                ),
                            )
                        )

                    return qm.Column(
                        case=dict(
                            cases=cases,
                            else_value=qm.Column(
                                value=groupings["else_name"],
                                column_type=dsm.ColumnTypeEnum.string,
                            ),
                        )
                    )
            else:
                # handle backfill
                if obj.func.id == "not_contain":
                    obj.func.id = "not_contains"

                # get the function
                desired_func = next((item for item in FUNCTIONS if item["name"] == obj.func.id.lower()), None)
                if desired_func is None:
                    raise DatasetCompileError(f"Missing function: {obj.func.id}")

                input_fields = [i["name"] for i in desired_func["input_fields"]]

                # Handle empty inputs
                if len(input_fields) != len(obj.args):
                    obj.args = [o for o in obj.args if not isinstance(o, ast.Constant) or o.value != ""]

                # check for functions
                if len(input_fields) != len(obj.args):
                    raise DatasetCompileError(
                        "{func} requires {n_fields}  ({fields}) the following fields but only received {n}".format(
                            func=desired_func["name"],
                            fields=", ".join(input_fields),
                            n_fields=len(input_fields),
                            n=len(obj.args),
                        )
                    )

                if desired_func["kind"] == "operators":
                    if obj.func.id in (
                        dsm.StringArrayOperatorEnum.contains_any,
                        dsm.StringArrayOperatorEnum.not_contains_any,
                    ):
                        cond = qm.Filter()
                        left = self._parse_obj(obj.args[0], make_column=True, group=group)
                        for v in obj.args[1].elts:
                            cond.add_filter(
                                qm.Condition(
                                    operator=obj.func.id.replace("_any", ""),
                                    left=left,
                                    right=self._parse_obj(v, make_column=True, group=group),
                                ),
                                "OR",
                            )

                    else:
                        cond = qm.Condition(
                            operator=obj.func.id,
                            **{
                                f.split("_")[0]: self._parse_obj(obj.args[ii], make_column=True, group=group)
                                for ii, f in enumerate(input_fields)
                            },
                        )

                    if make_column:
                        return qm.Column(
                            case=dict(
                                cases=[
                                    dict(
                                        when=cond,
                                        then=qm.Column(value=True, column_type="boolean"),
                                    )
                                ],
                                else_value=qm.Column(value=False, column_type="boolean"),
                            ),
                            column_type="boolean",
                        )
                    else:
                        return cond
                else:
                    col = qm.Column(
                        function=obj.func.id,
                        fields={
                            f: self._parse_obj(
                                obj.args[ii],
                                make_column=any(n in f for n in ("column", "left", "right")),
                                group=group,
                            )
                            for ii, f in enumerate(input_fields)
                        },
                    )
                    return col

        elif isinstance(obj, ast.Set):
            raise DatasetCompileError(f"Unexpected Error with freehand function {str(obj)} ")
        else:
            raise DatasetCompileError(f"Something went wrong parsing type: {obj}")

    def _add_computed_column(
        self,
        query: Query,
        col: dsm.ParentColumn | dsm.GroupColumn,
        available_columns: list[str],
        group: dsm.Tab | None = None,
    ):
        if not isinstance(col.details, dsm.ComputedDetails):
            raise DatasetCompileError("The column details for the column is not a computed column")

        qm_col = self._parse_obj(col.details.raw_str, make_column=True, group=group)

        # loop through all the column ids
        for temp_col in qm_col.get_dependent_columns():
            if temp_col not in available_columns and temp_col != dsm.ActivityColumns.join_ts:
                return True

        # parse and add the column
        qm_col.set_name_alias(col.clean_label)

        # create a mapping to override the alias
        if query.from_table.alias:
            for c in qm_col.get_dependent_columns(just_names=False):
                if c.table_column == dsm.ActivityColumns.customer and self.dataset_obj.kind != dsm.DatasetKindEnum.time:
                    c.table_alias = "c"

        # add the column
        query.add_column(qm_col)
        return False

    def add_computed_columns(
        self,
        query: Query,
        columns: list[dsm.ParentColumn | dsm.GroupColumn],
        count: int = 0,
        group: dsm.Tab | None = None,
    ):
        """
        Adds all the computed columns
        """
        set_current_span_attributes(nested=count)

        qm = self.qm

        # nesting the columns
        new_query = qm.wrap_query(query)
        new_query.add_comment("Recursively adding the computed columns")

        aliased_columns = [c.get_name() for c in query.columns if c.name_alias]

        # get all the columns needed
        available_columns = query.get_all_columns(only_names=True, ignore_computed=True)

        # remove the aliased direct columns (because some warehouse cannot be called by an alias)
        available_columns = [a for a in available_columns if a not in aliased_columns]
        # clearly define states
        missing_something = False
        for c in columns:
            if c.clean_label not in available_columns:
                # add the column or if something is missing eer then rerun
                added_nothing = self._add_computed_column(query, c, available_columns, group=group)

                if added_nothing:
                    missing_something = True

        # run the columns again
        if missing_something:
            if len(query.columns) == 1:
                logger.debug("Query So far", query=query.to_query())
                raise DatasetCompileError(
                    "Cannot Add columns: {} because of missing dependency".format(
                        ", ".join(
                            [
                                f"{c.clean_label} ({c.details.raw_str})"
                                for c in columns
                                if c.clean_label not in available_columns
                            ]
                        )
                    )
                )

            return self.add_computed_columns(new_query, columns, count=count + 1, group=group)
        else:
            logger.debug("finished query")
            return query

    def _convert_metric_columns(self, group: dsm.Tab, group_query: Query):
        qm = self.qm

        metric_columns = group.get_columns(dsm.DetailKindEnum.metric)
        base_column = qm.Column(
            table_column=next(
                (c.clean_label for c in self.dataset_obj.output_columns if c.type == dsm.ColumnTypeEnum.timestamp), None
            ),
            table_alias="rd",
        )
        for col in metric_columns:
            parent_column = (
                self._simple_column(col.details.column_id, alias="rd") if col.details.column_id else qm.Column(value=1)
            )

            # handle the pivot
            if col.details.pivoted_on is not None and len(col.details.pivoted_on) > 0:
                # if there is a pivot switch to count
                if col.details.agg_function == dsm.AggregateFunctionEnum.count_all:
                    col.details.agg_function = dsm.AggregateFunctionEnum.count

                # create the pivot filter
                pivot_filt = qm.Filter()
                for p in col.details.pivoted_on:
                    # add the filter that points to the original column
                    pivot_filt.add_filter(
                        qm.Condition(
                            operator=dsm.StringOperatorEnum.equal,
                            left=self._simple_column(group.column(p.column_id).details.column_id, alias="rd"),
                            right=qm.Column(value=p.value),
                        ),
                        "AND",
                    )

                # added the att column
                parent_column = qm.Column(
                    case=dict(
                        cases=[
                            dict(
                                when=pivot_filt,
                                then=parent_column,
                            ),
                        ]
                    )
                )

            # go through he columns
            if col.details.agg_function in (
                dsm.AggregateFunctionEnum.percentile_cont,
                dsm.AggregateFunctionEnum.median,
            ):
                # Handles weird pg edge case whene you are grouping by no columns
                group_window_columns = deepcopy(group_query.group_by) if group_query.group_by else None
                if qm.language == "pg":
                    function = "percentile_cont"
                elif group_window_columns:
                    function = "percentile_cont_window"
                else:
                    function = "percentile_cont_all"

                metric_col = qm.Column(
                    function=function,
                    fields=dict(
                        column=parent_column,
                        percentile=col.details.percentile or 0.5,
                        group=group_window_columns,
                    ),
                    name_alias=col.clean_label,
                )

                # check if sub query exist or not
                if group_query.from_table.kind != "query" and qm.language != "pg":
                    # wrap the query in a sub query
                    temp_query = qm.wrap_query(group_query.from_table, alias="rd")
                    temp_query.ctes = group_query.ctes
                    temp_query.joins = group_query.joins
                    group_query.joins = []

                    # handle any mapping of that this messes up
                    for c in group_query.columns + group_query.group_by:
                        if c.kind == "simple" and c.table_alias != "rd":
                            # swap oout the columns so all the nesting works
                            temp_query.add_column(
                                qm.Column(
                                    table_alias=c.table_alias,
                                    table_column=c.table_column,
                                    name_alias=f"_{c.table_column}",
                                )
                            )
                            c.table_alias = "rd"
                            c.table_column = f"_{c.table_column}"

                    group_query.set_from(qm.Table(query=temp_query, alias="rd"))

                if qm.language != "pg":
                    group_query.from_table.query.add_column(metric_col)

                # add the wrapper column to the main query
                metric_col = qm.Column(
                    function="min",
                    fields=dict(column=self._simple_column(col.id, group=group, alias="rd")),
                    name_alias=col.clean_label,
                )

            elif col.details.agg_function == dsm.AggregateFunctionEnum.rate:
                # this is just the rate of the column so it is the average
                if col.details.conditioned_on_columns:
                    # create a filter to make sure all the timestamps are not null
                    null_filter = qm.Filter()
                    for p in col.details.conditioned_on_columns:
                        null_filter.add_filter(
                            qm.Condition(
                                operator="not_is_null",
                                left=self._simple_column(p, group=group),
                            )
                        )

                    # create the column
                    metric_col = qm.Column(
                        components=[
                            qm.Column(
                                function="sum",
                                fields=dict(column=metric_col, base_column=base_column),
                            ),
                            "/",
                            qm.Column(
                                function="sum",
                                fields=dict(
                                    # add the column that ensures all the columns as
                                    column=qm.Column(
                                        case=dict(
                                            cases=[
                                                dict(
                                                    when=null_filter,
                                                    then=qm.Column(
                                                        value=1.0,
                                                        column_type=dsm.ColumnTypeEnum.number,
                                                    ),
                                                )
                                            ],
                                            else_value=qm.Column(),
                                        )
                                    )
                                ),
                            ),
                        ],
                        name_alias=col.clean_label,
                    )

                # if it is dependent on a column then sum it and divide by the right count
                else:
                    # create the column
                    metric_col = qm.Column(
                        function="average",
                        fields=dict(column=metric_col),
                        name_alias=col.clean_label,
                    )

            else:
                # create the column
                metric_col = qm.Column(
                    function=col.details.agg_function,
                    fields=dict(column=parent_column, base_column=base_column),
                    name_alias=col.clean_label,
                )

            # add the column to the group
            group_query.add_column(metric_col)

    def _add_aggregate_dim(self, group_query: Query, group: dsm.Tab):
        qm = self.qm

        # initialize the new query
        full_query = qm.Query()
        group_cols = group.get_columns(dsm.DetailKindEnum.group)
        metric_cols = group.get_columns(dsm.DetailKindEnum.metric)

        for ag in group.aggregate_dims:
            # handle the distribution of the columns
            dim_column_ids = [s.column_id for s in ag.joins]
            distribute_by = [c for c in group_cols if c.id in dim_column_ids]

            distribute = len(group_cols) != len(dim_column_ids)
            # add the proper distribution if the column needs to be distributed
            if distribute:
                # notify the user
                if len(metric_cols) == 0:
                    raise SilenceError(
                        "Cannot distribute the spend data if you do not have a metric column.  We use the first column!"
                    )

                distribute_col = self._simple_column(ag.distribute_using_column_id, group=group)

                temp_query = qm.Query()
                temp_query.add_column(qm.Column(all_columns=True))
                temp_query.set_from(qm.Table(query=group_query, alias="rd"))
                temp_query.add_column(
                    qm.Column(
                        components=[
                            distribute_col,
                            "*",
                            qm.Column(value=1.0),
                            "/",
                            qm.Column(
                                function=("sum_window" if len(distribute_by) > 0 else "sum_window_all"),
                                fields=dict(
                                    column=distribute_col,
                                    group=[
                                        qm.Column(
                                            table_column=c.clean_label,
                                        )
                                        for c in distribute_by
                                    ],
                                ),
                            ),
                        ],
                        name_alias="event_ratio",
                    )
                )
                # add the group to the ctes
                full_query.add_cte("group_data", temp_query)
            else:
                # add the group to the ctes
                full_query.add_cte("group_data", group_query)

            # create the ad table cte.
            ad_query = qm.Query()
            full_query.add_cte(f"ag_{ag.table}", ad_query)

            ad_query.set_from(
                qm.Table(
                    table=ag.table,
                    schema=ag.schema_name,
                    alias=ag.table,
                )
            )

            if ag.joins == 0:
                ad_condition = qm.Condition(
                    operator=dsm.StringOperatorEnum.equal,
                    left=qm.Column(value=1),
                    right=qm.Column(value=1),
                )
            else:
                ad_condition = qm.Filter()

            # handle the joins to bring in ad data
            for ii, ad_join in enumerate(ag.joins):
                # checking if the column was computed and odin git!
                dependent_column = self.dataset_obj.column(group.column(ad_join.column_id).details.column_id)

                if dependent_column.details.kind == dsm.DetailKindEnum.computed and ad_join.apply_computed_logic:
                    col = self._parse_obj(dependent_column.details.raw_str, make_column=True)
                    for sub_c in col.get_dependent_columns(just_names=False):
                        if sub_c.kind == "simple":
                            sub_c.table_column = ad_join.id_key
                            sub_c.table_alias = ag.table
                else:
                    col = qm.Column(table_column=ad_join.id_key, table_alias=ag.table)

                # setup the name
                col.set_name_alias(ad_join.id_key)
                ad_query.add_column(col)

                # add the join condition for the ads
                ad_condition.add_filter(
                    qm.Condition(
                        operator=dsm.StringOperatorEnum.equal,
                        left=self._simple_column(ad_join.column_id, group=group, alias="g"),
                        right=qm.Column(table_column=ad_join.id_key, table_alias=ag.table),
                    ),
                    "AND",
                )

                # add the group (remember index starts at 0)
                ad_query.add_group_by(ii + 1)

                # add the nvl columns
                full_query.add_column(
                    qm.Column(
                        function="nvl",
                        fields=dict(
                            first_column=self._simple_column(ad_join.column_id, group=group, alias="g"),
                            second_column=qm.Column(table_column=ad_join.id_key, table_alias=ag.table),
                        ),
                        name_alias=group.column(ad_join.column_id).clean_label,
                    )
                )

            # combine the group data and the ad data to be the full table
            full_query.set_from(qm.Table(cte="group_data", alias="g"))
            # join on all the data
            full_query.add_join(
                qm.Join(
                    kind="LEFT",
                    table=qm.Table(cte=f"ag_{ag.table}", alias=ag.table),
                    condition=ad_condition,
                )
            )

            # add all the group columns that were not already added
            for c in group_query.get_all_columns():
                if c.get_name() not in full_query.get_all_columns(only_names=True):
                    full_query.add_column(qm.Column(table_alias="g", table_column=c.get_name()))

            # ADD THE SPEND COLUMNS
            for c in group.get_columns(dsm.DetailKindEnum.aggregate_dim):
                if c.details.aggregate_dim_id == ag.id:
                    # handle the column in the full query
                    if distribute:
                        full_query.add_column(
                            qm.Column(
                                components=[
                                    qm.Column(
                                        table_column=c.details.name,
                                        table_alias=ag.table,
                                    ),
                                    "*",
                                    qm.Column(table_column="event_ratio", table_alias="g"),
                                ],
                                name_alias=c.clean_label,
                            )
                        )
                    else:
                        full_query.add_column(
                            qm.Column(
                                table_column=c.details.name,
                                table_alias=ag.table,
                                name_alias=c.clean_label,
                            )
                        )

                    # add the column to the ad query
                    ad_query.add_column(
                        qm.Column(
                            function="sum",
                            fields=dict(column=qm.Column(table_column=c.details.name, table_alias=ag.table)),
                            name_alias=c.details.name,
                        )
                    )

        return full_query

    def __create_time_query(self, cohort_time: dsm.CohortTime):
        qm = self.qm

        to_date = utils.utcnow()
        future_months = 2

        # create the new table
        time_query = qm.Query()

        if qm.start_data_on:
            from_date = qm.start_data_on
        else:
            from_date = utils.date_add(utils.utcnow(), "year", -5)

        # decide on the from date that we will consider
        # NOTE:  I add -1 in the date so it can properly count the rows
        if from_cond := cohort_time.from_condition:
            if from_cond.reference == dsm.TimeReferenceEnum.relative:
                new_date = utils.date_add(
                    utils.utcnow(),
                    from_cond.details.resolution,
                    -1 * from_cond.details.value,
                )
                if from_cond.details.value < 0:
                    to_date = new_date
                    future_months += int(
                        utils.date_diff(
                            utils.utcnow(),
                            to_date,
                            from_cond.details.resolution,
                        )
                    )
                else:
                    from_date = new_date

            elif from_cond.reference == dsm.TimeReferenceEnum.absolute:
                from_date = utils.date_add(
                    self.qm.date_trunc(from_cond.details.date_time, cohort_time.resolution),
                    cohort_time.resolution,
                    -2,
                )

        count_of_series = (
            int(
                utils.date_diff(
                    from_date,
                    to_date,
                    cohort_time.resolution,
                )
            )
            + 2
        )

        # added a more effienent for the series
        if qm.config.get("series_table"):
            if qm.language == "databricks":
                row_col = qm.Column(table_column="id")
            else:
                row_col = qm.Column(table_column="num")
            time_query.set_from(
                qm.Table(
                    sql=qm.config.get("series_table").format(count=count_of_series),
                    no_wrapping=True,
                    alias="num",
                )
            )
        else:
            row_col = qm.Column(function="row_number_empty", fields={})
            time_query.set_from(
                self.qm.stream_table(
                    self.activity_stream.activity_stream,
                    activity=(
                        self.activities[0]
                        if self.activities and self.activity_stream.manually_partition_activity
                        else None
                    ),
                )
            )
            time_query.set_limit(count_of_series)

        time_column = qm.Column(
            function="date_add",
            fields=dict(
                datepart=cohort_time.resolution,
                number=qm.Column(
                    components=[
                        qm.Column(value=-1),
                        "*",
                        row_col,
                        "+",
                        qm.Column(value=future_months),
                    ]
                ),
                column=qm.Column(
                    function="date_trunc",
                    fields=dict(
                        datepart=cohort_time.resolution,
                        column=qm.Column(function="now", fields={}),
                    ),
                ),
            ),
            name_alias=cohort_time.resolution,
        )

        if cohort_time.kind == dsm.CohortTimeKindEnum.all_end:
            # time_column.set_timezone(self.qm.timezone)
            time_column = qm.Column(
                function="time_add",
                fields=dict(datepart="second", number=-1, column=time_column),
                name_alias=cohort_time.resolution,
            )

        time_query.add_column(time_column)
        return time_query

    # dealing with group
    # @tracer.start_as_current_span("add_group")
    def add_group(self, group_query: Query, group: dsm.Tab):
        """
        Adds the group to the query
        TODO: BREAK THIS UP INTO FUNCTIONS SINCE THIS HAS GOTTEN OUT OF HAND
        """

        qm = self.qm

        # #### DEAL WITH PIVOTS
        # add the group and metrics
        for c in group.get_columns(dsm.DetailKindEnum.group):
            if not c.details.pivoted:
                gc = self._simple_column(c.details.column_id, alias="rd")
                gc.name_alias = c.clean_label
                group_query.add_column(gc)
                group_query.add_group_by(gc)

        self._convert_metric_columns(group, group_query)

        # DEAL WITH FILTERS and computed columns
        if group.aggregate_dims:
            group_query = self._add_aggregate_dim(group_query, group)

        # initialize the metrics filters
        metrics_filter = qm.Filter(filters=[])

        # add the computed columns
        if computed_cols := group.get_columns(dsm.DetailKindEnum.computed):
            # create a wrapper cause the metrics are already added
            temp_query = qm.wrap_query(group_query)
            # add the computed columns
            group_query = self.add_computed_columns(group_query, computed_cols, group=group)

        # add the filters
        for m in group.columns:
            # add the filters of the columns
            if m.filters is not None and (m.details.kind != dsm.DetailKindEnum.group or not m.details.pivoted):
                metrics_filter.add_filter(
                    self._convert_filter(
                        m.filters,
                        self._simple_column(m.id, group=group),
                    ),
                    "AND",
                )

        # Add filters to a wrappe query
        if len(metrics_filter.filters) > 0:
            temp_query = qm.wrap_query(group_query)
            temp_query.set_where(metrics_filter)
            group_query = temp_query

        # add order to the group
        self.add_order_by(group_query, group=group)

        # suppress all outputs
        group_query = self.supress_outputs(
            group_query,
            group.columns,
        )

        return group_query

    def add_order_by(self, group_query: Query, group: dsm.Tab | None = None):
        """
        Add the order to the object
        """
        if group:
            order_obj = group.order
        else:
            order_obj = self.dataset_obj.order

        for o in order_obj:
            column = self._simple_column(o.column_id, group=group)
            group_query.add_order_by(column, asc=o.asc)
