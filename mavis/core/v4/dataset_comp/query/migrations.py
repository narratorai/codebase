from copy import deepcopy

import core.v4.dataset_comp.query.model as dsm
from core import utils
from core.graph import graph_client
from core.models.ids import get_uuid
from core.models.table import ColumnTypeEnum, guess_format


def migrate_data_model(mavis, dataset, master_obj, from_version, to_version):
    if from_version is None:
        from_version = 0

    while from_version != to_version:
        if from_version == 1:
            m = v1_to_v2(mavis, dataset, master_obj)
            master_obj = m.convert()
        from_version += 1

    return master_obj


def _resolution(val):
    if val.endswith("s"):
        return val[:-1]
    return dsm.TimeResolutionEnum(val)


class v1_to_v2:
    def __init__(self, mavis, dataset, master_obj):
        self.mavis = mavis
        self.dataset = dataset
        self.master_obj = deepcopy(master_obj)
        self.activity_mapping = {}
        self.dims = {}
        self.cohort_activity_id = None

        # this is for the translate test
        if self.mavis.company.slug != "test":
            cs = graph_client.get_all_custom_functions(company_id=self.mavis.company.id).custom_function
            self.custom_functions = {c.name: c for c in cs}
        else:
            self.custom_functions = {}

    def convert(self):
        master_obj = self.master_obj
        query_obj = master_obj["query"]

        # convert it
        self.dataset.get_all_columns(query_obj, force_uniqueness=True)

        activities = query_obj["activities"]
        first_id = activities[0]["activity_ids"][0]
        if utils.is_time(first_id):
            kind = dsm.DatasetKindEnum.time
            cohort_time = self.parse_cohort_time_activity(activities[0])
            cohort_activity = None
        else:
            kind = dsm.DatasetKindEnum.activity
            cohort_time = None
            cohort_activity = self.parse_cohort_activity(activities)
            self.activity_mapping[cohort_activity.id] = cohort_activity
            self.cohort_activity_id = cohort_activity.id

        append_activities = self.parse_append_activities(activities, cohort_activity)

        dataset = dsm.DatasetObject(
            kind=kind,
            table_id=(self.mavis.company.table(self.get_activity_stream(query_obj)) or self.mavis.company.tables[0]).id,
            cohort_time=cohort_time,
            cohort_activity=cohort_activity,
            append_activities=append_activities,
            # TODO: Where we are at
            columns=self.parse_columns(query_obj["columns"]),
            all_tabs=self.parse_tabs(query_obj["all_groups"]),
            order=self.parse_order(query_obj["order"]),
            name=query_obj.get("name") or master_obj.get("name") or "New Dataset",
        )

        # handle the time columns
        if kind == dsm.DatasetKindEnum.time:
            for c in dataset.columns:
                if isinstance(c.details, dsm.ActivitySourceDetails) and c.details.activity_id == dataset.cohort_time.id:
                    c.details = dsm.CohortTimeDetails()

            # make srue we get the dim
            dataset.cohort_time.dims = self.dims.get(dataset.cohort_time.id, [])

        cc_ui = []
        if col_order := self.master_obj["query"].get("columns_order"):
            if per_ord := col_order.get("parent"):
                for ii, c_id in enumerate(per_ord["order"]):
                    cc_ui.append(dsm.ColumnUI(id=c_id, order=ii))

        dataset.tab_ui = dsm.TabUI(columns=cc_ui)

        # update all the columns for customer flag
        for c in dataset.columns:
            if c.details.kind == dsm.DetailKindEnum.activity and c.details.name in (
                dsm.ActivityColumns.join_customer,
                dsm.ActivityColumns.customer,
            ):
                if col_ui := dataset.tab_ui.column(c.id):
                    col_ui.is_customer = True
                for t in dataset.all_tabs:
                    if t.kind == dsm.TabKindEnum.group:
                        for g in t.get_columns(dsm.DetailKindEnum.group):
                            if g.details.column_id == c.id:
                                if col_ui := t.tab_ui.column(g.id):
                                    col_ui.is_customer = True
                                break
                    elif t.kind == dsm.TabKindEnum.parent:
                        if col_ui := t.tab_ui.column(c.id):
                            col_ui.is_customer = True

        return dataset

    def get_activity_stream(self, query_obj):
        table = query_obj.get("activity_stream")
        if table:
            return table

        # grab the stream
        for a in query_obj["activities"][::-1]:
            table = a["config"]["activity_stream"]
            if table:
                break

        if table is None:
            table = self.mavis.company.tables[0].activity_stream
        return table

    def parse_time_cond(self, filt, prefix="from"):
        if filt.get(f"{prefix}_type") == "absolute":
            return dsm.TimeCondition(
                reference=dsm.TimeReferenceEnum.absolute,
                details=dsm.AbsoluteTimeDetails(date_time=filt.get(f"{prefix}_value")),
            )
        elif filt.get(f"{prefix}_type") == "relative":
            return dsm.TimeCondition(
                reference=dsm.TimeReferenceEnum.relative,
                details=dsm.RelativeTimeDetails(
                    kind=dsm.RefinementEnum.within,
                    value=filt.get(f"{prefix}_value"),
                    resolution=_resolution(filt.get(f"{prefix}_value_resolution")),
                ),
            )
        elif filt.get(f"{prefix}_type") == "colloquial":
            return dsm.TimeCondition(
                reference=dsm.TimeReferenceEnum.start_of,
                details=dsm.StartOfTimeDetails(resolution=_resolution(filt.get(f"{prefix}_value"))),
            )
        else:
            return None

    def parse_filt(self, filt, column_type):
        # update the contains
        if filt.get("operator") == "not_contain":
            filt["operator"] = "not_contains"

        if filt.get("operator") == "time_range":
            try:
                filt_obj = dsm.TimeFilter(
                    operator=dsm.TimeOperatorEnum.time_range,
                    from_condition=self.parse_time_cond(filt, "from"),
                    to_condition=self.parse_time_cond(filt, "to"),
                )
            except Exception:
                filt_obj = None

        elif filt.get("operator") == "quick_time_filter":
            pieces = filt["value"].split("_")

            if pieces[0] == "last" or pieces[1] == "last":
                filt_obj = dsm.TimeFilter(
                    operator=dsm.TimeOperatorEnum.time_range,
                    from_condition=dsm.TimeCondition(
                        reference=dsm.TimeReferenceEnum.relative,
                        details=dsm.RelativeTimeDetails(
                            kind=dsm.RefinementEnum.within,
                            value=int(pieces[1]),
                            resolution=_resolution(pieces[-1]),
                        ),
                    ),
                )
            elif pieces[0] == "this" or pieces[1] == "this":
                filt_obj = dsm.TimeFilter(
                    operator=dsm.TimeOperatorEnum.time_range,
                    from_condition=dsm.TimeCondition(
                        reference=dsm.TimeReferenceEnum.start_of,
                        details=dsm.StartOfTimeDetails(
                            resolution=_resolution(pieces[-1]),
                        ),
                    ),
                )

        # elif filt.get("kind") == "field":
        #     filt_obj = dsm.VariableFilter(operator=filt["operator"], variable=filt["value"])
        elif filt.get("kind") == "column_id":
            filt_obj = dsm.ColumnToColumnFilter(operator=filt["operator"], column_id=filt["value"])
        elif filt["operator"] in ("not_is_null", "is_null", "is_empty", "not_is_empty"):
            filt_obj = dsm.NullFilter(operator=filt["operator"])
        elif utils.get_simple_type(column_type) == "number":
            if filt["operator"] in ("is_in", "not_is_in"):
                filt_obj = dsm.NumberArrayFilter(
                    operator=filt["operator"],
                    numbers=[float(v) for v in filt.get("value")],
                )
            else:
                filt_obj = dsm.NumberFilter(operator=filt["operator"], number=float(filt.get("value")))
        elif utils.get_simple_type(column_type) == "string":
            if filt["operator"] in (
                "is_in",
                "not_is_in",
                "contains_any",
                "not_contains_any",
            ):
                filt_obj = dsm.StringArrayFilter(
                    operator=filt["operator"],
                    values=[str(v) for v in filt.get("value")],
                )
            else:
                filt_obj = dsm.StringFilter(operator=filt["operator"], value=str(filt.get("value")))
        elif (
            column_type == "boolean"
            or isinstance(filt.get("value"), bool)
            or filt.get("value")
            in [
                "true",
                "false",
            ]
        ):
            if isinstance(filt["value"], str):
                is_true = filt["value"].lower() == "true"
            else:
                is_true = filt["value"]

            filt_obj = dsm.BooleanFilter(
                operator=dsm.BooleanOperatorEnum(filt["operator"]),
                is_true=is_true,
            )
        elif column_type == "timestamp":
            if filt["operator"] == "greater_than_equal":
                from_ = filt.get("value")
                filt_obj = dsm.TimeFilter(
                    operator=dsm.TimeOperatorEnum.time_range,
                    from_condition=dsm.TimeCondition(
                        reference=dsm.TimeReferenceEnum.absolute,
                        details=dsm.AbsoluteTimeDetails(date_time=from_),
                    ),
                )
            elif filt["operator"] == "less_than":
                to_ = filt.get("value")
                filt_obj = dsm.TimeFilter(
                    operator=dsm.TimeOperatorEnum.time_range,
                    to_condition=dsm.TimeCondition(
                        reference=dsm.TimeReferenceEnum.absolute,
                        details=dsm.AbsoluteTimeDetails(date_time=to_),
                    ),
                )
            else:
                filt_obj = dsm.TimeFilter(operator=filt["operator"], time_value=filt["value"])

        else:
            raise ValueError(f"Unknown type {column_type}")

        return filt_obj

    def __find_dim(self, dim, activity_id):
        activity = self.activity_mapping.get(activity_id)
        if activity:
            dims = activity.dims
        else:
            dims = self.dims.get(activity_id)
            if dims is None:
                dims = self.dims[activity_id] = []

        for d in dims:
            if d.table == dim.table and d.schema_name == dim.schema_name:
                return d.id
        else:
            dims.append(dim)
            return dim.id

    def parse_col_details(self, source, source_details, name, mavis_type):
        if source == "activity":
            dim_id = None
            if et := source_details.get("enrichment_table"):
                if isinstance(et, str):
                    et = {"table": et, "schema": self.mavis.company.warehouse_schema}

                # Create the dimension
                dim = dsm.Dimension(
                    id=get_uuid(),
                    table=et.get("table"),
                    schema_name=et.get("schema"),
                    join=dsm.DimensionJoin(
                        id_key=et.get("join_key") or "enriched_activity_id",
                        foreign_key=source_details.get("enrichment_table_column") or "activity_id",
                        type=utils.get_simple_type(et.get("join_key_type") or "string"),
                        slowly_changing_ts=source_details.get("slowly_changing_ts_column"),
                    ),
                )
                dim_id = self.__find_dim(dim, source_details["activity_id"])

            else:
                dim = None

            return dsm.ActivitySourceDetails(
                name=name.split(".")[0],
                activity_id=source_details["activity_id"],
                type=utils.get_simple_type(mavis_type) if mavis_type else None,
                dim_id=dim_id,
                applied_function=source_details.get("applied_function"),
                percentile=(
                    source_details["percentile"] / 100.0
                    if source_details.get("percentile") and source_details.get("percentile") > 1
                    else source_details.get("percentile")
                ),
            )

        elif source == "customer":
            if et := source_details.get("table"):
                if isinstance(source_details["table"], str):
                    customer_dim = dsm.Dimension(
                        id=get_uuid(),
                        table=et,
                        schema_name=self.mavis.company.warehouse_schema,
                        join=dsm.DimensionJoin(
                            id_key="customer",
                            foreign_key="customer",
                            type="string",
                        ),
                    )
                else:
                    customer_dim = dsm.Dimension(
                        id=get_uuid(),
                        table=et["table"],
                        schema_name=et["schema"],
                        join=dsm.DimensionJoin(
                            id_key=et.get("join_key") or "customer",
                            foreign_key="customer",
                            type="string",
                            slowly_changing_ts=source_details.get("slowly_changing_ts_column"),
                        ),
                    )
            else:
                raise ValueError("Unknown customer table")

            dim_id = self.__find_dim(customer_dim, source_details["activity_id"])
            return dsm.CustomerDetails(customer_dim_id=dim_id, name=name.split(".")[0])

        elif source == "computed":
            if rs := source_details.get("raw_string"):
                special_data = []
                for k in self.custom_functions.keys():
                    if k in rs:
                        special_data.append(dsm.SpecialDetailsEnum.custom_functions)

                return dsm.ComputedDetails(
                    raw_str=rs,
                    special_data=special_data,
                )
            else:
                return dsm.ComputedDetails(
                    form_config=source_details,
                    raw_str=self.dataset._get_computed_raw_string(source_details, all=True) or "",
                )
        return None

    def parse_group_col_details(self, kind, col):
        if kind == "group":
            return dsm.GroupDetails(
                column_id=col["column_id"],
                pivoted=col.get("pivoted", False),
            )
        elif kind == "metrics":
            return dsm.MetricsDetails(
                column_id=col.get("column_id"),
                agg_function=dsm.AggregateFunctionEnum(col["agg_function"].lower()),
                percentile=col.get("percentile"),
                pivoted_on=col.get("pivot"),
            )
        elif kind == "spend":
            return dsm.AggregateDetails(aggregate_dim_id=col["dim_id"], name=col["name"])

        elif kind == "computed":
            if col["source_details"].get("raw_string"):
                return dsm.ComputedDetails(
                    raw_str=col["source_details"].get("raw_string"),
                )
            else:
                return dsm.ComputedDetails(
                    form_config=col["source_details"],
                    raw_str=self.dataset._get_computed_raw_string(col["source_details"], all=True) or "",
                )

        return None

    def parse_column_option(self, col):
        # TODO: handle month.name day.ts (MAYBE)
        return dsm.PrefilterColumn(
            label=col["name"].split(".")[0],
            type=utils.get_simple_type(col["type"]),
            apply_quick_function=(col["name"].split(".")[1] if "." in col["name"] else None),
            details=self.parse_col_details(
                col["source_kind"], col["source_details"], col["name"], col.get("mavis_type")
            ),
        )

    def parse_activity_filters(self, filters, activity_id):
        new_filts = []

        for f in filters:
            if col := f.get("activity_column"):
                if col.get("source_details") and col["source_details"].get("enrichment_table") is not None:
                    dim = dsm.Dimension(
                        id=get_uuid(),
                        table=col["source_details"]["enrichment_table"]["table"],
                        schema_name=col["source_details"]["enrichment_table"]["schema"],
                        join=dsm.DimensionJoin(
                            id_key=col["source_details"]["enrichment_table"]["join_key"],
                            foreign_key=col["source_details"]["enrichment_table_column"],
                            type=ColumnTypeEnum.string,
                        ),
                    )
                    dim_id = self.__find_dim(dim, activity_id)
                else:
                    dim_id = None

                new_col = dsm.PrefilterColumn(
                    label=col["name"].split(".")[0],
                    type=utils.get_simple_type(col["type"]),
                    apply_quick_function=(col["name"].split(".")[1] if "." in col["name"] else None),
                    details=dsm.ActivitySourceDetails(
                        activity_id=activity_id,
                        dim_id=dim_id,
                        name=col["name"].split(".")[0],
                    ),
                )
            else:
                name = f["activity_column_name"]
                et = f["enrichment_table"]
                etc = f.get("enrichment_table_column")
                dim_id = None
                if "-" in name:
                    (table, name) = name.split("-")
                    dim = dsm.Dimension(
                        id=get_uuid(),
                        table=table,
                        schema_name=self.mavis.company.warehouse_schema,
                        join=dsm.DimensionJoin(
                            id_key="customer",
                            foreign_key="customer",
                            type="string",
                        ),
                    )
                    dim_id = self.__find_dim(dim, activity_id)
                elif et:
                    dim = dsm.Dimension(
                        id=get_uuid(),
                        table=et,
                        schema_name=self.mavis.company.warehouse_schema,
                        join=dsm.DimensionJoin(
                            id_key="enriched_activity_id",
                            foreign_key=etc or "activity_id",
                            type="string",
                        ),
                    )
                    dim_id = self.__find_dim(dim, activity_id)

                c_type = utils.get_simple_type(f.get("column_type"))

                # guess the type
                if c_type is None:
                    if f.get("filter"):
                        if f["filter"].get("kind") == "value":
                            if isinstance(f["filter"]["value"], str):
                                f["filter"]["value"] = utils.string_to_value(f["filter"]["value"])

                            c_type = utils.get_type(f["filter"]["value"])

                new_col = dsm.PrefilterColumn(
                    label=name.split(".")[0],
                    type=c_type or "string",
                    details=dsm.ActivitySourceDetails(activity_id=activity_id, dim_id=dim_id, name=name.split(".")[0]),
                )

            if f.get("filter"):
                fj = self.parse_filt(f["filter"], new_col.type)
                if fj is not None:
                    if f["filter"].get("or_null"):
                        new_col.filters = dsm.BooleanExpression(
                            logical_operator=dsm.LogicalOperatorEnum.OR,
                            operands=[fj, dsm.NullFilter(operator="is_null")],
                        )
                    else:
                        new_col.filters = dsm.BooleanExpression(
                            logical_operator=dsm.LogicalOperatorEnum.AND, operands=[fj]
                        )
                    new_filts.append(new_col)

        # everything in NArrator is an AND
        return new_filts

    def parse_column_filters(self, filters, col_type):
        new_filts = []

        for f in filters:
            fj = self.parse_filt(f, col_type)
            if fj is not None:
                if f.get("or_null"):
                    new_filts.append(
                        dsm.BooleanExpression(
                            logical_operator=dsm.LogicalOperatorEnum.OR,
                            operands=[fj, dsm.NullFilter(operator="is_null")],
                        )
                    )
                else:
                    new_filts.append(fj)

        # everything in NArrator is an AND
        if new_filts:
            return dsm.BooleanExpression(
                logical_operator=dsm.LogicalOperatorEnum.AND,
                operands=new_filts,
            )
        else:
            return None

    def parse_parent_column_filters(self, filters):
        ct = {c["id"]: utils.get_simple_type(c["type"]) for c in self.master_obj["query"]["columns"]}
        new_filts = []

        for f in filters:
            tf = self.parse_filt(f["filter"], ct.get(f["column_id"]))
            if tf is not None:
                new_filts.append(
                    dsm.ParentFilter(
                        column_id=f["column_id"],
                        filter=tf,
                    )
                )

        # everything in NArrator is an AND
        if new_filts:
            return dsm.ParentFilterExpression(
                logical_operator=dsm.LogicalOperatorEnum.AND,
                operands=new_filts,
            )
        else:
            return None

    def parse_cohort_activity(self, activities):
        cohort = next(a for a in activities if a["kind"] == "limiting")
        if cohort["occurrence"] == "custom":
            cohort["occurrence"] = "all"
            cohort["filters"].append(
                dict(
                    activity_column=dict(
                        name="activity_occurrence",
                        type="number",
                    ),
                    filter=dict(operator="equal", value=cohort["occurrence_value"]),
                )
            )

        ch = dsm.CohortActivity(
            id=cohort["id"],
            slugs=(cohort["slug"] if isinstance(cohort["slug"], list) else [cohort["slug"]]),
            activity_ids=cohort["activity_ids"],
            has_source=_clean_source(cohort["config"]["has_source"]),
            display_name=cohort.get("name") or "no name",
            fetch_type=dsm.CohortFetchTypeEnum(cohort["occurrence"]),
            prefilter_columns=self.parse_activity_filters(cohort["filters"], cohort["id"]),
        )
        # add the prefilter columns after the activity to handle the dim creation
        ch.dims = self.dims.get(cohort["id"], [])
        return ch

    def parse_columns(self, columns):
        new_columns = [
            dsm.ParentColumn(
                id=column["id"],
                label=column["label"],
                type=dsm.ColumnTypeEnum(utils.get_simple_type(column["type"])),
                filters=self.parse_column_filters(column["filters"], utils.get_simple_type(column["type"])),
                output=column.get("output", True),
                display_format=_display_format(column.get("display_format"))
                or guess_format(column["label"], dsm.ColumnTypeEnum(utils.get_simple_type(column["type"]))),
                auto_metrics=column.get("group_func") or [],
                details=self.parse_col_details(
                    column["source_kind"], column["source_details"], column.get("name"), column.get("mavis_type")
                ),
                apply_quick_function=(
                    column["name"].split(".")[1] if column.get("name") and "." in column["name"] else None
                ),
            )
            for column in columns
        ]
        return new_columns

    def parse_group_columns(self, group, dim_id):
        columns = []
        for c in self.dataset.get_group_columns(group):
            c["dim_id"] = dim_id
            columns.append(
                dsm.GroupColumn(
                    id=c["id"],
                    label=c["label"],
                    type=dsm.ColumnTypeEnum(utils.get_simple_type(c["type"])),
                    filters=self.parse_column_filters(c["filters"], c["type"]),
                    output=c.get("output", True),
                    display_format=_display_format(c.get("display_format"))
                    or guess_format(c["label"], dsm.ColumnTypeEnum(utils.get_simple_type(c["type"]))),
                    details=self.parse_group_col_details(c["column_kind"], c),
                )
            )
        return columns

    def parse_spend(self, group):
        if group.get("spend") and group["spend"].get("columns"):
            joins = []
            for j in group["spend"]["joins"]:
                joins.append(
                    dsm.AggregateDimensionJoin(
                        column_id=j["column_id"],
                        id_key=j["spend_column"],
                        distribute_using_column_id=(group["metrics"][0]["id"] if group.get("metrics") else None),
                        apply_computed_logic=j.get("apply_computed_logic", True),
                    )
                )

            # MAKE SURE THIS HAS AN ID??
            (schema, table, _, _) = self.dataset._expand_table(
                group["spend"].get("spend_table", self.mavis.company.spend_table)
            )
            return [
                dsm.AggregateDimension(
                    id=get_uuid(),
                    table=table,
                    schema_name=schema,
                    distribute_using_column_id=(group["metrics"][0]["id"] if group.get("metrics") else None),
                    joins=joins,
                )
            ]
        return []

    def parse_plot(self, plot):
        # fix errors
        plot["config"]["annotations"] = plot["config"]["annotations"] or []
        return plot

    def parse_tabs(self, groups):
        tabs = []
        for g in groups:
            # make sure we have all the types
            all_cols = self.dataset.get_all_columns(self.master_obj["query"], g, force_uniqueness=True)
            kind = dsm.TabKindEnum.parent if g.get("is_parent") else dsm.TabKindEnum.group
            if kind == dsm.TabKindEnum.parent and g.get("hidden_column_ids"):
                hide_show = dsm.HideShow(
                    mode=(dsm.HideShowEnum.show if g.get("is_show_mode") else dsm.HideShowEnum.hide),
                    column_ids=g["hidden_column_ids"],
                )
            else:
                hide_show = None

            aggregate_dims = self.parse_spend(g)
            if aggregate_dims:
                dim_id = aggregate_dims[0].id
            else:
                dim_id = None

            tab = dsm.Tab(
                kind=kind,
                slug=g["slug"],
                label=g["name"],
                order=self.parse_order(g["order"]),
                hide_show=hide_show,
                # TODO:
                parent_filters=self.parse_parent_column_filters(g.get("parent_filters") or []),
                columns=self.parse_group_columns(g, dim_id),
                aggregate_dims=aggregate_dims or [],
                plots=[self.parse_plot(p) for p in g.get("plots") or []],
            )

            cc_ui = []
            if col_order := self.master_obj["query"].get("columns_order"):
                if per_ord := col_order.get(g["slug"]):
                    for ii, c_id in enumerate(per_ord["order"]):
                        if c_id in per_ord["left_pinned"]:
                            pinned = "left"
                        elif c_id in per_ord["right_pinned"]:
                            pinned = "right"
                        else:
                            pinned = None
                        cc_ui.append(dsm.ColumnUI(id=c_id, order=ii, pinned=pinned))

            if not cc_ui:
                if kind == dsm.TabKindEnum.parent:
                    cc_ui = [dsm.ColumnUI(id=c["id"], order=ii) for ii, c in enumerate(all_cols)]
                else:
                    cc_ui = [dsm.ColumnUI(id=c.id, order=ii) for ii, c in enumerate(tab.columns)]

            tab.tab_ui = dsm.TabUI(columns=cc_ui)
            tabs.append(tab)

        return tabs

    def __get_fetch_type(self, relations):
        for r in relations:
            if r["slug"] == "within_cohort":
                return dsm.RelationTypeEnum.in_between
            elif r["slug"] == "after":
                return dsm.RelationTypeEnum.after
            elif r["slug"] == "before":
                return dsm.RelationTypeEnum.before
        else:
            return dsm.RelationTypeEnum.ever

    def __get_time_refinements(self, relations):
        time_refinements = []
        for r in relations:
            if r["slug"] == "within_time":
                time_refinements.append(
                    dsm.RefinementTimeDetails(
                        kind=dsm.RefinementEnum.within,
                        resolution=_resolution(r["relationship_time"]),
                        value=int(r["relationship_time_value"]),
                    )
                )

            elif r["slug"] == "at_least_time":
                time_refinements.append(
                    dsm.RefinementTimeDetails(
                        kind=dsm.RefinementEnum.at_least,
                        resolution=_resolution(r["relationship_time"]),
                        value=int(r["relationship_time_value"]),
                    )
                )

            elif r["slug"] == "within_minutes":
                time_refinements.append(
                    dsm.RefinementTimeDetails(
                        kind=dsm.RefinementEnum.within,
                        resolution=dsm.TimeResolutionEnum.minute,
                        value=int(r["minutes"]),
                    )
                )

        return time_refinements

    def __get_id_joins(self, relations, cohort_activity, append_id):
        id_joins = []
        for r in relations:
            if r["slug"] == "cohort_column":
                if r.get("append_column"):
                    r["cohort_column"]["source_details"]["activity_id"] = self.cohort_activity_id
                    r["append_column"]["source_details"]["activity_id"] = append_id
                    id_joins.append(
                        dsm.JoinConditon(
                            operator=r["operator"],
                            cohort_column=self.parse_column_option(r["cohort_column"]),
                            column=self.parse_column_option(r["append_column"]),
                        )
                    )
                else:
                    c = r["cohort_column_name"]
                    a = r["column_name"]
                    # parse old data
                    if "-" in c:
                        (table, column) = c.split("-")
                        dim = dsm.Dimension(
                            id=get_uuid(),
                            table=table,
                            schema_name=self.mavis.company.warehouse_schema,
                            join=dsm.DimensionJoin(
                                id_key="customer",
                                foreign_key="customer",
                                type="string",
                            ),
                        )
                        dim_id = self.__find_dim(dim, cohort_activity.id)

                        details = dsm.CustomerDetails(customer_dim_id=dim_id, name=column.split(".")[0])
                    else:
                        column = c
                        details = dsm.ActivitySourceDetails(
                            activity_id=cohort_activity.id, dim_id=None, name=c.split(".")[0]
                        )

                    if r.get("column_name_enrichment_table"):
                        dim = dsm.Dimension(
                            id=get_uuid(),
                            table=r["column_name_enrichment_table"],
                            schema_name=self.mavis.company.warehouse_schema,
                            join=dsm.DimensionJoin(
                                id_key="enriched_activity_id",
                                foreign_key="activity_id",
                                type="string",
                            ),
                        )
                        append_dim_id = self.__find_dim(dim, append_id)

                    else:
                        append_dim_id = None

                    id_joins.append(
                        dsm.JoinConditon(
                            operator=r["operator"],
                            cohort_column=dsm.PrefilterColumn(
                                label=column.split(".")[0],
                                apply_quick_function=(column.split(".")[1] if "." in column else None),
                                type="string",
                                details=details,
                            ),
                            column=dsm.PrefilterColumn(
                                label=a.split(".")[0],
                                apply_quick_function=(a.split(".")[1] if "." in a else None),
                                type="string",
                                details=dsm.ActivitySourceDetails(
                                    activity_id=append_id,
                                    dim_id=append_dim_id,
                                    name=a.split(".")[0],
                                ),
                            ),
                        ),
                    )
        if id_joins:
            return dsm.JoinConditonExpression(
                logical_operator=dsm.LogicalOperatorEnum.AND,
                operands=id_joins,
            )
        else:
            return None

    def __get_relative_activity(self, relations):
        relatives = []
        for r in relations:
            if r["slug"] == "relative_to":
                append_activity_id = next(
                    (
                        a["id"]
                        for a in self.master_obj["query"]["activities"]
                        if a["slug"] == r["relative_to_activity_slug"]
                    ),
                    None,
                )

                # This is a hack to ignore work arounds
                if append_activity_id is None:
                    continue

                relatives.append(
                    dsm.ActivityRelative(
                        relation=dsm.SimpleRelationTypeEnum(r["relation"]),
                        append_activity_id=append_activity_id,
                        include_if_null=r.get("or_null", True),
                    )
                )

        return relatives

    def parse_append_activities(self, append_activities, cohort_activity):
        activities = []
        for a in append_activities:
            if a["kind"] == "limiting":
                continue
            id_joins = self.__get_id_joins(a["relationships"], cohort_activity, a["id"])
            prefilt = self.parse_activity_filters(a["filters"], a["id"])

            append_a = dsm.AppendActivity(
                id=a["id"],
                slugs=(a["slug"] if isinstance(a["slug"], list) else [a["slug"]]),
                activity_ids=a["activity_ids"],
                has_source=_clean_source(a["config"]["has_source"]),
                display_name=a.get("name") or "No Name",
                fetch_type=dsm.AppendFetchTypeEnum(a["occurrence"]),
                relation=self.__get_fetch_type(a["relationships"]),
                time_refinements=self.__get_time_refinements(a["relationships"]),
                prefilter_columns=prefilt,
                joins=id_joins,
                relative_activities=self.__get_relative_activity(a["relationships"]),
            )
            # add the prefilter columns after the activity to handle the dim creation
            append_a.dims = self.dims.get(a["id"], [])

            activities.append(append_a)
            self.activity_mapping[append_a.id] = append_a

        return activities

    def parse_order(self, all_orders) -> list[dsm.Order]:
        return [dsm.Order(column_id=order["column_id"], asc=order["order_direction"] == "asc") for order in all_orders]

    def parse_cohort_time_activity(self, activity) -> dsm.CohortTime:
        first_id = activity["activity_ids"][0]

        if first_id == "today":
            first_id = "this_day"
        elif first_id == "yesterday":
            first_id = "last_day"

        pieces = first_id.split("_")

        if len(pieces) == 1:
            time_kind = dsm.CohortTimeKindEnum.all_start
        elif pieces[0] == "ends":
            time_kind = dsm.CohortTimeKindEnum.all_end
        elif pieces[0] == "this" or pieces[1] == "today":
            time_kind = dsm.CohortTimeKindEnum.this
        elif pieces[0] == "last":
            time_kind = dsm.CohortTimeKindEnum.last
        else:
            time_kind = dsm.CohortTimeKindEnum.all_start

        if res_filt := activity.get("resolution_filter"):
            if res_filt["type"] == "relative":
                from_condition = dsm.TimeCondition(
                    reference=dsm.TimeReferenceEnum.relative,
                    details=dsm.RelativeTimeDetails(
                        value=res_filt["from_value"],
                        resolution=res_filt["segmentation"],
                    ),
                )
            elif res_filt["type"] == "absolute":
                from_condition = dsm.TimeCondition(
                    reference=dsm.TimeReferenceEnum.absolute,
                    details=dsm.AbsoluteTimeDetails(date_time=res_filt["from_date"]),
                )
            else:
                from_condition = None

        else:
            from_condition = None

        cohort_time = dsm.CohortTime(
            id=activity["id"],
            resolution=_clean_res(pieces[-1]),
            kind=time_kind,
            from_condition=from_condition,
        )

        return cohort_time


def _clean_res(res):
    if res.endswith("s"):
        return res[:-1]
    return res


def _clean_source(source):
    if isinstance(source, bool):
        return source
    else:
        return True


def _display_format(col_format: str):
    if col_format == "date_short":
        return dsm.DisplayFormatEnum.short_date
    elif col_format == "revenue":
        return dsm.DisplayFormatEnum.currency
    elif col_format == "number":
        return dsm.DisplayFormatEnum.decimal
    elif col_format == "date_short":
        return dsm.DisplayFormatEnum.short_date
    elif col_format == "time":
        return dsm.DisplayFormatEnum.short_date_time
    try:
        return dsm.DisplayFormatEnum(col_format) if col_format else None
    except ValueError:
        return None
