import ast
import re
from collections import defaultdict
from copy import deepcopy
from dataclasses import dataclass

from core import utils
from core.constants import DATASET_LIMIT
from core.errors import DatasetCompileError, SilenceError
from core.graph import graph_client
from core.logger import get_logger
from core.util.opentelemetry import set_current_span_attributes, tracer
from core.v4.mavis import Mavis
from core.v4.query_mapping.config import ALL_TYPES, CASTING, FUNCTIONS, RESOLUTIONS, WINDOW_FUNCTIONS
from core.v4.queryMapper import QueryMapper, clean_column_name

logger = get_logger()

####
# some notes:
#     limiting is what we call cohort
#     append is what we call attributes
#
BLANK_TS = "T00:00:00"
LOWER_OPERATORS = (
    "contains",
    "contains_any",
    "ends_with",
    "starts_with",
    "not_contains_any",
    "not_contains",
    "not_ends_with",
    "not_starts_with",
)


def _create_column_id(c):
    id_pieces = []
    if c.get("name"):
        id_pieces.append(c["name"])

    for k in ("activity_id", "raw_string"):
        if c["source_details"].get(k):
            id_pieces.append(c["source_details"][k])

    return "-".join(id_pieces)


def _filter_hidden_columns(columns, group):
    if group.get("is_show_mode"):
        # NOTE we didn't rename the variable to not break old datasets
        return [c for c in columns if c["id"] in group["hidden_column_ids"]]
    else:
        return [c for c in columns if c["id"] not in group["hidden_column_ids"]]


def _same_column(c, c2):
    return c["name"] == c2["name"]


def _get_group_kinds():
    return ("group", "metrics", "spend", "computed")


def _get_activity_stream_type(col_name):
    if col_name in ("ts", "activity_repeated_at"):
        return "timestamp"
    elif col_name in ("activity_occurrence", "revenue_impact"):
        return "number"
    else:
        return "string"


def is_col_id(s):
    # ignore if not a string
    if not isinstance(s, str):
        return False

    if (
        s.isdigit()
        or is_time(s)
        or s in RESOLUTIONS
        or s in [f["name"] for f in FUNCTIONS]
        or s.lower() in ("and", "or", "not", "true", "false", "not_contain", "not_contain_any")
        or s
        in (
            "join_ts",
            "join_cohort_next_ts",
            "join_cohort_id",
            "ts",
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


def is_time_activity(activity_obj):
    return activity_obj["occurrence"] == "time"


def _find_func_column(name):
    for f in FUNCTIONS:
        if f["name"] == name:
            return next((c for c in f["input_fields"] if c["kind"] == "column"), None)
    return None


def _get_activity_slugs(obj):
    activities = []
    for o in obj:
        utils.extend_list(activities, o["slug"])
        for r in o["relationships"]:
            if r["slug"] == "relative_to":
                utils.extend_list(activities, r["relative_to_activity_slug"])

    return sorted(list(set(activities)))


def _can_use_repeated_at(a, cohort):
    return (
        a["slug"] == cohort[0]["slug"]
        and len(a["slug"]) == 1  # TODO: remove this and properly use the join_cohort_ts
        and len(cohort) == 1
        and a["occurrence"] == "first"
        and len(a.get("filters", [])) == 0
        and len(a["columns"]) == 1
        and len(a["relationships"]) == 1
        and a["columns"][0]["name"] == "ts"
    )


def _scd_table_name(table_name, activities):
    return f"scd_{table_name}_{utils.slug_path(activities)}"


def is_time(activity_id):
    return activity_id.split("_")[-1].lower().rstrip("s") in (
        "hour",
        "day",
        "week",
        "month",
        "year",
        "quarter",
        "today",
        "yesterday",
    )


def list_activities(dataset_obj):
    activities = dict()
    for activity in dataset_obj["activities"]:
        if activity is None:
            continue
        for ii, a_id in enumerate(activity.get("activity_ids") or []):
            if not is_time(a_id):
                if activity.get("name") or activity.get("slug"):
                    current_name = activity.get("name", utils.slug_path(activity.get("slug"))).lower().split("or")
                    if len(current_name) > ii:
                        activities[a_id] = utils.title(current_name[ii])
                    else:
                        activities[a_id][0]
                else:
                    activities[a_id] = "No Name"
    return activities


def list_activity_slugs(dataset_obj):
    slugs = []
    for activity in dataset_obj["activities"]:
        if activity is None:
            continue
        slugs.extend(activity.get("slug") or [])
        slugs.extend(activity.get("slugs") or [])

        # get all relationship slugs
        for r in activity.get("relationships") or []:
            slugs.extend(r.get("relative_to_activity_slug") or [])

    return slugs


@dataclass
class DatasetService:
    mavis: Mavis
    qm = None
    company = None
    column_mapper = None
    column_types = None
    column_formats = None
    custom_functions = None
    timeline_dates = None
    is_time = False
    ts_column_id = None
    time_filters = None
    timeline_ids = None
    LIMIT = DATASET_LIMIT

    # pot init
    def __post_init__(self):
        self.company = self.mavis.company
        self.qm = QueryMapper(
            language=self.company.warehouse_language,
            copy_role=self.company.resources.company_role,
        )
        self.reset()

    @property
    def query_mapper(self):
        return self.qm

    def reset(self):
        self.time_filters = []
        self.LIMIT = DATASET_LIMIT
        self.column_mapper = dict()
        self.column_types = dict()
        self.column_formats = dict()
        self.is_time = False
        self.ts_column_id = None
        self.timeline_ids = []
        self.activities = []

    def list_activities(self, dataset_obj):
        return list_activities(dataset_obj)

    def list_activity_slugs(self, dataset_obj):
        return list_activity_slugs(dataset_obj)

    @staticmethod
    def _swich_activity_with_source(d_obj, activity_id):
        updated = False
        for a in d_obj["query"]["activities"]:
            if activity_id in a["activity_ids"] and a["config"]["has_source"] is False:
                a["config"]["has_source"] = True
                updated = True

        # change the column to be a join customer
        if updated:
            # only run there are no join_customers
            all_names = [c["name"] for c in d_obj["query"]["columns"] if c.get("name")]
            if "join_customer" not in all_names:
                for c in d_obj["query"]["columns"]:
                    if c.get("name") == "customer":
                        c["name"] = "join_customer"

        return updated

    @staticmethod
    def lexicon_to_autocomplete():
        """
        creates the lexicon array of autocompletegg
        """
        lexicon_array = []
        for f in FUNCTIONS:
            lexicon_array.append(
                dict(
                    caption=f["display_name"],
                    value=f["name"] + "(",
                    meta="{}({}) - {}".format(
                        f["name"],
                        ", ".join([i["name"] for i in f["input_fields"]]),
                        f["description"],
                    ),
                    kind=f["kind"],
                    output_type=f["output_type"],
                )
            )

        return lexicon_array

    def get_timeline_date(self, name):
        if not self.timeline_dates:
            self.timeline_dates = {
                utils.slugify(ct.name): ct.happened_at
                for ct in graph_client.get_timeline(timeline_ids=self.timeline_ids).company_timeline
            }

        if self.timeline_dates.get(name):
            return self.timeline_dates.get(name)
        else:
            raise SilenceError(f"Missing the timeline reference {name}")

    def get_custom_function(self, name):
        if not self.custom_functions:
            self.custom_functions = graph_client.get_all_custom_functions(company_id=self.company.id).custom_function

        for c in self.custom_functions:
            if c.name == name:
                return c
        else:
            raise SilenceError(f"Missing the custom function {name}")

    def get_activity_stream(self, master_object):
        table = master_object.get("activity_stream")

        # grab the stream
        for a in master_object["activities"][::-1]:
            if table:
                break
            table = a["config"]["activity_stream"]

        return self.company.table(table)

    def _create_scd_table(self, scd):
        qm = self.qm

        query = qm.Query()
        query.set_from(qm.Table(cte=scd["stream"], alias="s"))
        query.add_filter(
            qm.Condition(
                operator="is_in",
                left=qm.Column(table_column="activity", table_alias="s"),
                right=[qm.Column(value=a) for a in scd["activity_slug"]],
            )
        )

        # add the join
        query.add_join(
            qm.Join(
                table=qm.Table(
                    schema=scd["enrichment_table"]["schema"],
                    table=scd["enrichment_table"]["table"],
                    alias="t",
                ),
                condition=qm.Filter(
                    filters=[
                        qm.Condition(
                            operator="equal",
                            left=self.__create_column_from_name(
                                scd["enrichment_table_column"],
                                "s",
                                scd["enrichment_table"].get("join_key_type", "string"),
                            ),
                            right=qm.Column(
                                table_column=scd["enrichment_table"]["join_key"],
                                table_alias="t",
                                column_type=scd["enrichment_table"].get("join_key_type"),
                            ),
                        ),
                        "AND",
                        qm.Condition(
                            operator="greater_than",
                            left=qm.Column(table_column="ts", table_alias="s"),
                            right=qm.Column(
                                table_column=scd["slowly_changing_ts_column"],
                                table_alias="t",
                            ),
                        ),
                    ]
                ),
            )
        )

        query.add_column(qm.Column(table_column="activity_id", table_alias="s", name_alias="join_id"))
        for c in scd["columns"]:
            query.add_column(qm.Column(table_column=c["name"], table_alias="t"))

        # add a row number
        query.add_column(
            qm.Column(
                function="row_number_w_group",
                fields=dict(
                    group=[
                        qm.Column(
                            table_column="activity_id",
                            table_alias="s",
                        )
                    ],
                    order=[
                        qm.Column(
                            table_column=scd["slowly_changing_ts_column"],
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
                operator="equal",
                left=qm.Column(table_column="row_num"),
                right=qm.Column(value=1),
            )
        )

        return wrap_query

    def _create_activity_query(self, activity_objs):
        # define the core pieces of the query
        activity_stream = self.company.table(activity_objs[0]["config"]["activity_stream"])

        # make sure it is not none
        if not activity_stream:
            raise SilenceError("Could not find the activity stream: " + activity_objs[0]["config"]["activity_stream"])

        use_time_filter = self._can_use_within_minutes_filters(activity_objs)
        kind = activity_objs[0].get("kind")
        # union all the activitys
        if activity_stream.manually_partition_activity:
            activity_slugs = _get_activity_slugs(activity_objs)
            slug_to_object = defaultdict(list)

            # compute the occurrence
            for a in activity_objs:
                for a_slug in a["slug"]:
                    slug_to_object[a_slug].append(a["occurrence"] if not a.get("recompute_occurrence") else None)

            last_query = None
            # go through all the activitys
            for s in activity_slugs:
                # get all the values
                occ = list(set(slug_to_object[s]))

                query = self.__get_sql_for_activity(
                    activity_stream,
                    kind,
                    [s],
                    use_time_filter,
                    is_partitioned=True,
                    add_occurrence_filter=occ[0] if len(occ) == 1 else None,
                )

                # makes it a union
                if last_query:
                    query.set_union(last_query)

                last_query = query
            return query

        else:
            # check if we can globally apply a filter
            filt_occ = None
            # check to see if you can prefilter the stream
            if all(a.get("can_use_occurrence") for a in activity_objs):
                for occ in ("first", "last"):
                    if all(a["occurrence"] == occ for a in activity_objs):
                        filt_occ = occ
                        break

            # decide on recompute
            activity_slugs = _get_activity_slugs(activity_objs)
            return self.__get_sql_for_activity(
                activity_stream,
                kind,
                activity_slugs,
                use_time_filter,
                add_occurrence_filter=filt_occ,
            )

    def __get_sql_for_activity(
        self,
        activity_stream,
        kind,
        activity_slugs,
        use_time_filter,
        is_partitioned=False,
        add_occurrence_filter=None,
    ):
        qm = self.qm
        activity_query = qm.Query()
        activity_query.add_column(qm.Column(all_columns=True))

        # add the from table
        if is_partitioned:
            activity_query.set_from(
                self.mavis.qm.stream_table(
                    activity_stream.activity_stream,
                    activity=activity_slugs[0],
                    alias="s",
                )
            )
        else:
            activity_query.set_from(self.mavis.qm.stream_table(activity_stream.activity_stream, alias="s"))
            activity_query.set_where(
                qm.Condition(
                    operator="is_in",
                    left=qm.Column(table_alias="s", table_column="activity", column_type="string"),
                    right=[qm.Column(value=s, column_type="string") for s in activity_slugs],
                )
            )

        if add_occurrence_filter == "first":
            activity_query.add_filter(
                qm.Condition(
                    operator="equal",
                    left=qm.Column(table_alias="s", table_column="activity_occurrence"),
                    right=qm.Column(value=1),
                )
            )
        else:
            # remove data not ready to be used
            activity_query.add_filter(
                qm.Condition(
                    operator="not_is_null",
                    left=qm.Column(table_alias="s", table_column="activity_occurrence"),
                )
            )

        # add the last
        if add_occurrence_filter == "last":
            activity_query.add_filter(
                qm.Condition(
                    operator="is_null",
                    left=qm.Column(table_alias="s", table_column="activity_repeated_at"),
                )
            )

        for f in self.time_filters:
            if kind in ("limiting", "in_between", "after"):
                if f["operator"].startswith("greater") or (f["operator"] == "time_range" and f["to_type"] == "now"):
                    activity_query.add_filter(
                        self.__create_filter(
                            f,
                            qm.Column(
                                table_column="ts",
                                table_alias="s",
                                column_type="timestamp",
                                timezone=self.company.timezone,
                            ),
                        ),
                        "AND",
                    )
            elif kind == "before":
                for filter in self.time_filters:
                    if use_time_filter and (
                        filter["operator"].startswith("greater") or filter["operator"] == "time_range"
                    ):
                        if filter["operator"] == "time_range":
                            use_f = deepcopy(filter)
                            use_f["to_type"] = "now"
                        else:
                            use_f = filter

                        # apply the right filter
                        activity_query.add_filter(
                            self.__create_filter(
                                use_f,
                                self._update_column_with_time_filter(
                                    qm.Column(
                                        table_column="ts",
                                        table_alias="s",
                                        column_type="timestamp",
                                        timezone=self.company.timezone,
                                    ),
                                    use_time_filter,
                                ),
                            ),
                            "AND",
                        )

                    if filter["operator"].startswith("less") or filter["operator"] == "time_range":
                        if filter["operator"] == "time_range":
                            use_f = deepcopy(filter)
                            use_f["from_type"] = "start_of_time"
                        else:
                            use_f = filter

                        activity_query.add_filter(
                            self.__create_filter(
                                use_f,
                                qm.Column(
                                    table_column="ts",
                                    table_alias="s",
                                    column_type="timestamp",
                                    timezone=self.company.timezone,
                                ),
                            ),
                            "AND",
                        )

        return activity_query

    @staticmethod
    def _get_activity_ids(master_object):
        return list(
            {
                y
                for activity in master_object["activities"]
                for y in activity["activity_ids"]
                if not is_time_activity(activity)
            }
        )

    @staticmethod
    def _is_feature_col(c):
        return (c.get("name") or "").startswith("feature_") or c["source_kind"] == "customer"

    def _using_activity_feature(self, dataset_obj, group, activity_obj=None):
        columns_with_filters = []
        uses_revenue = False

        metric_ids = [m["column_id"] for m in (group.get("metrics") or []) if m.get("column_id")]
        group_column_ids = [m["column_id"] for m in (group.get("column") or []) if m.get("column_id")]

        computed_columns = [
            self._get_computed_raw_string(c["source_details"])
            for c in dataset_obj["columns"]
            if c["source_kind"] == "computed"
        ]
        # go through the loops and test if the activity feature or revenue is used
        for c in dataset_obj["columns"]:
            if activity_obj:
                if c.get("source_details", {}).get("activity_id") != activity_obj["id"]:
                    continue
            # check if it is customer column
            elif c["source_kind"] != "customer":
                continue

            # had columns
            is_revenue = c.get("name") == "revenue_impact"
            is_feature = self._is_feature_col(c)

            if not (is_revenue or is_feature):
                continue

            has_filter = (
                len([f for f in c.get("filters") or [] if f.get("operator") != "not_is_null"]) > 0
                or len(
                    [
                        f
                        for f in group["parent_filters"]
                        if f["column_id"] == c["id"] and f["filter"].get("operator") != "not_is_null"
                    ]
                )
                > 0
                or c["id"] in metric_ids
                or any(c["id"] in comp for comp in computed_columns)
            )
            # add the activity filters
            if activity_obj:
                has_filter = (
                    has_filter
                    or len(
                        [
                            f
                            for f in activity_obj["filters"]
                            if f["activity_column"].get("name") == c["name"]
                            and f["filter"].get("operator") != "not_is_null"
                        ]
                    )
                    > 0
                )

                # check if it is used in group and it is not a cohort column
                if activity_obj["kind"] != "limiting":
                    has_filter = has_filter or c["id"] in group_column_ids

            # Add the filters
            if has_filter:
                if is_revenue:
                    uses_revenue = True

                if is_feature:
                    columns_with_filters.append(c)

        return (columns_with_filters, uses_revenue)

    def _get_all_column_ids(self, col, output=None, return_col=False, only_id=None):
        """
        traverses the tree to find all the column ids.
        """
        if output is None:
            output = []

        if isinstance(col, list):
            for each_item in col:
                self._get_all_column_ids(each_item, output, return_col, only_id)
        elif isinstance(col, dict):
            # loop through all the columns and add them as needed
            for k, item in col.items():
                if (
                    not k.startswith("_")  # remove any internal only keys
                    and item is not None
                    and item != ""
                    and k != "hidden_column_ids"
                    and (
                        "column_id" in k
                        or (k == "value" and (col.get("value_kind") == "column_id" or col.get("kind") == "column_id"))
                    )
                ):
                    if not only_id or item == only_id:
                        utils.extend_list(output, col if return_col else item)

                # handle the freehand functions
                elif k == "raw_string":
                    for temp_p in set(re.findall(r"(\w+)", utils.remove_all_in_quote(item))):
                        if is_col_id(temp_p.lower()) and (not only_id or temp_p == only_id):
                            output.append(col if return_col else temp_p)

                # handle the plots
                # don't put a y_column in plots since the plot handles it and i don't want it to fail
                elif (
                    k
                    in (
                        "xs",
                        "ys",
                        "color_bys",
                        "y2",
                        "left_output_columns",
                        "conditioned_on_columns",
                    )
                    and item is not None
                ):
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

                elif isinstance(item, dict | list):
                    self._get_all_column_ids(item, output, return_col, only_id)

        return output

    @staticmethod
    def _swap_id(col, old_id, new_id):
        for k in col.keys():
            if (
                "column_id" in k
                or (k == "value" and (col.get("value_kind") == "column_id" or col.get("kind") == "column_id"))
            ) and col.get(k) == old_id:
                col[k] = new_id

            elif k in ("raw_string", "y2", "y_column") and col[k] and old_id in col[k]:
                col[k] = col[k].replace(old_id, new_id)
            elif k in (
                "xs",
                "ys",
                "color_bys",
                "hidden_column_ids",
                "left_output_columns",
                "conditioned_on_columns",
            ) and old_id in (col[k] or []):
                col[k] = [v for v in col[k] or [] if v != old_id]
                if new_id not in col[k]:
                    col[k].append(new_id)
            elif k == "group_func" and any(old_id in c for c in col.get(k) or [] if c.startswith("rate.")):
                for ii, c in enumerate(col[k]):
                    if c.startswith("rate."):
                        col[k][ii] = c.replace(old_id, new_id)

        return col

    def _get_valid_types(self, items, col_id=None):
        # Finds the least common denominator for the types
        # start with all the type
        current_type = list(ALL_TYPES)
        names = []

        for c in items:
            # metrics
            if c.get("agg_function"):
                names.append(c["agg_function"].lower())

            # Any Filter
            elif c.get("filters"):
                for f in c["filters"]:
                    if f.get("operator"):
                        names.append(f["operator"])
                    elif f.get("filter"):
                        names.append(f["filter"]["operator"])

            # computed columns
            elif c.get("kind") and c["kind"] != "freehand_function":
                names.append(c["kind"])

            elif c.get("raw_string") and col_id and self.column_mapper.get(col_id):
                # if it is a freehand function then get the column that are used in it and make sure they are right
                try:
                    qm_column = self.raw_string_to_col(c)

                    # figure out the column type
                    for c in qm_column.get_dependent_columns(just_names=False):
                        if c.get_name() == self.column_mapper[col_id]:
                            current_type = [tc for tc in current_type if tc in c.allowed_types]
                except Exception:
                    logger.warn("Keep the current types")

        # find the least common denominator
        for n in names:
            tc = _find_func_column(n.lower())
            if tc:
                current_type = [c for c in current_type if c in tc["data"]]
        if len(current_type) == 0:
            raise DatasetCompileError("Cannot find a possible type for the column ????")
        return current_type

    def create_column_metric(self, c, table=None, data=None, rows=None, col_format=None):
        """"""
        qm = self.qm

        if table:
            new_query = qm.Query()
            new_query.set_from(table)

        # double check the column type just in case
        simple_type = utils.get_simple_type(c["type"])

        if simple_type == "timestamp":
            vec = [r[c["label"]] for r in data["rows"] if r[c["label"]]]
            if data:
                return (
                    "min_max",
                    [
                        dict(
                            name="Min Date",
                            value=utils.apply_function("min", vec),
                            format="date",
                        ),
                        dict(
                            name="Max Date",
                            value=utils.apply_function("max", vec),
                            format="date",
                        ),
                    ],
                )
            elif table:
                new_query.add_column(
                    qm.Column(
                        function="min",
                        fields=dict(column=qm.Column(table_column=c["label"])),
                        name_alias="min_time",
                    )
                )

                new_query.add_column(
                    qm.Column(
                        function="max",
                        fields=dict(column=qm.Column(table_column=c["label"])),
                        name_alias="max_time",
                    )
                )
                return ("min_max", new_query)
            elif rows:
                return (
                    "min_max",
                    [
                        dict(name="Min Date", value=rows[0]["min_time"], format="date"),
                        dict(name="Max Date", value=rows[0]["max_time"], format="date"),
                    ],
                )

        elif simple_type in ("string", "boolean") or (
            simple_type == "number" and data and all(r[c["label"]] in (0, 1, 0.0, 1.0, None) for r in data["rows"])
        ):
            if data:
                values = dict()
                for r in data["rows"]:
                    if r[c["label"]] not in values.keys():
                        values[r[c["label"]]] = 1
                    else:
                        values[r[c["label"]]] += 1

                unique_vals = len(values.keys())
                if unique_vals <= 30:
                    return (
                        "distribution",
                        [
                            dict(
                                name=str(a) if a is not None else "NULL",
                                value=v * 1.0 / max(1, len(data["rows"])),
                                format="percent",
                            )
                            for a, v in sorted(values.items(), key=lambda kv: kv[1], reverse=True)
                        ],
                    )
                else:
                    return (
                        "duplicates",
                        [
                            dict(name=a, value=v, format="number")
                            for a, v in sorted(values.items(), key=lambda kv: kv[1], reverse=True)
                            if v > 1
                        ][:200],
                    )

            elif table:
                new_query.add_column(qm.Column(table_column=c["label"]))
                new_query.add_group_by(1)
                new_query.add_column(qm.Column(function="count_all", fields=dict(), name_alias="total_events"))
                new_query.add_order_by(1, False)
                new_query.set_limit(100)
                return ("distribution", new_query)
            elif rows:
                total = sum(r["total_events"] for r in rows)
                unique_vals = len(rows)
                if unique_vals <= 30:
                    return (
                        "distribution",
                        [
                            dict(
                                name=r[c["label"]],
                                value=r["total_events"] * 1.0 / total,
                                format="percent",
                            )
                            for r in rows[:100]
                        ],
                    )
                else:
                    return (
                        "duplicates",
                        [
                            dict(
                                name=r[c["label"]],
                                value=r["total_events"],
                                format="number",
                            )
                            for r in rows
                            if r["total_events"] > 1
                        ][:5],
                    )

        elif simple_type == "number":
            if data:
                # create data vector and ignores NULLS
                vec = [r[c["label"]] for r in data["rows"] if r[c["label"]] is not None]
                vec.sort()

                # get the proper data for computing the data
                return (
                    "percentile",
                    [
                        dict(
                            name="Median",
                            value=utils.apply_function("median", vec),
                            format="number" if col_format != "percent" else "percent",
                        ),
                        dict(
                            name="Average",
                            value=utils.apply_function(
                                (
                                    "harmonic_mean"
                                    if utils.apply_function("max", vec) <= 1 and utils.apply_function("min", vec) >= 0
                                    else "average"
                                ),
                                vec,
                            ),
                            format="number" if col_format != "percent" else "percent",
                        ),
                        dict(
                            name="Total / Sum",
                            value=utils.apply_function("sum", vec),
                            format="number" if col_format != "percent" else "percent",
                        ),
                    ],
                )
            elif table:
                new_query.add_column(
                    qm.Column(
                        function="percentile_cont",
                        fields=dict(column=qm.Column(table_column=c["label"]), percentile=0.5),
                        name_alias="median",
                    )
                )
                new_query.add_column(
                    qm.Column(
                        function="percentile_cont",
                        fields=dict(column=qm.Column(table_column=c["label"]), percentile=0.25),
                        name_alias="twenty_five_percent",
                    )
                )
                new_query.add_column(
                    qm.Column(
                        function="percentile_cont",
                        fields=dict(column=qm.Column(table_column=c["label"]), percentile=0.75),
                        name_alias="seventy_five_percent",
                    )
                )
                new_query.add_column(
                    qm.Column(
                        function="average",
                        fields=dict(column=qm.Column(table_column=c["label"])),
                        name_alias="avg",
                    )
                )

                return ("percentile", new_query)
            elif rows:
                return (
                    "percentile",
                    [
                        dict(
                            name="Median",
                            value=rows[0]["median"],
                            format=col_format,
                        ),
                        dict(name="Average", value=rows[0]["avg"], format=col_format),
                        dict(
                            name="25% Percentile",
                            value=rows[0]["twenty_five_percent"],
                            format=col_format,
                        ),
                        dict(
                            name="75% Percentile",
                            value=rows[0]["seventy_five_percent"],
                            format=col_format,
                        ),
                    ],
                )

        else:
            raise DatasetCompileError(f"Invalid column type: {simple_type}")

    # Delaing with mapping for dataset code
    def get_all_columns(
        self,
        master_object,
        group=None,
        force_uniqueness=False,
        group_slug=None,
        only_output=False,
    ):
        columns = None
        if group_slug:
            group = self.get_group_from_slug(master_object, group_slug)

        # add the type
        for c in master_object["columns"]:
            if utils.same_types(c.get("type", "string"), "timestamp"):
                self.ts_column_id = c["id"]
                break

        if group and not group.get("is_parent"):
            columns = self.get_group_columns(group)
        else:
            columns = master_object["columns"]

        if not columns:
            raise DatasetCompileError("No columns found")

        if force_uniqueness:
            column_counts = dict()
            for c in columns:
                # slugify all the names
                # c["label"] = utils.slugify(c["label"])
                column_counts[utils.slugify(c["label"])] = column_counts.get(utils.slugify(c["label"]), -1) + 1
                # adds a uniqueness to the column label
                if column_counts[utils.slugify(c["label"])] > 0:
                    c["label"] = "{} {}".format(c["label"], column_counts[utils.slugify(c["label"])])

                # add every column to the list
                self.column_mapper[c["id"]] = clean_column_name(c["label"])
                self.column_types[c["id"]] = c.get("type", "string")
                self.column_formats[c["id"]] = c.get("display_format") or utils.guess_format(
                    c["label"], c.get("type", "string")
                )

            # add the required join_ts column
            self.column_mapper["join_ts"] = "join_ts"
            self.column_types["join_ts"] = "timestamp"
            self.column_mapper["ts"] = "ts"
            self.column_types["ts"] = "timestamp"

        # only get the output columns
        if only_output:
            columns = [c for c in columns if c["output"] and not c.get("pivoted")]

            # remove hidden columns
            if group and group.get("is_parent") and group.get("hidden_column_ids"):
                columns = _filter_hidden_columns(columns, group)

        return columns

    def get_group_columns(self, g, only_output=False):
        all_cols = []
        for kind in _get_group_kinds():
            all_cols.extend(self._get_columns(g, kind, only_output))
        return all_cols

    @staticmethod
    def _get_columns(group, kind, only_output=False):
        if group is None:
            return []

        # this should never happen but
        if kind == "group":
            cols = group["columns"]
            # filter the group
            # get an order based on the order of the columns
            keys = {o["column_id"]: ii for ii, o in enumerate(group.get("order") or [])}
            cols.sort(key=lambda c: keys.get(c["id"], 1000))

        elif kind == "metrics":
            cols = group["metrics"]
        elif kind == "computed":
            cols = group["computed_columns"]
        elif kind == "spend":
            cols = group["spend"]["columns"] if group.get("spend") and group["spend"].get("columns") is not None else []
        else:
            raise SilenceError(f"The kind {kind} is not valid")

        # add the column kind
        for c in cols:
            c["column_kind"] = kind

        if only_output:
            cols = [c for c in cols if c["output"] and not c.get("pivoted")]

        return cols

    def _update_columns(self, group, kind, new_columns):
        if kind == "group":
            group["columns"] = new_columns
        elif kind == "metrics":
            group["metrics"] = new_columns
        elif kind == "computed":
            group["computed_columns"] = new_columns
        elif kind == "spend" and group.get("spend"):
            group["spend"]["columns"] = new_columns

    def remove_column(self, master_object, column_id, group_slug=None):
        if group_slug:
            group = self.get_group_from_slug(master_object, group_slug)

            for kind in _get_group_kinds():
                self._update_columns(
                    group,
                    kind,
                    [c for c in self._get_columns(group, kind) if c["id"] != column_id],
                )

                # remove the spend join
                if kind == "spend" and group.get("spend"):
                    group["spend"]["joins"] = [j for j in group["spend"]["joins"] if j["column_id"] != column_id]

            # remove the hidden column
            if group.get("hidden_column_ids"):
                group["hidden_column_ids"] = [c for c in group["hidden_column_ids"] if c != column_id]

        else:
            master_object["columns"] = [c for c in master_object["columns"] if c["id"] != column_id]

            # remove all the hidden columns that depend on the column
            for group in master_object["all_groups"]:
                if group.get("hidden_column_ids"):
                    group["hidden_column_ids"] = [c for c in group["hidden_column_ids"] if c != column_id]

    ###########################################################
    ####################   GENERATION   #######################
    ###########################################################

    def _can_use_subquery(self, master_object):
        """
        figure out if we can put the order and the limit to the cohort subquery
        """

        # don't bother with the sub query if it is time
        if master_object["activities"][0]["occurrence"] == "time":
            return False

        order_by_cols = [o["column_id"] for o in master_object["order"]]
        for c in master_object["columns"]:
            if (len(c["filters"]) > 0 or c["id"] in order_by_cols) and c["source_details"].get(
                "activity_kind"
            ) != "limiting":
                return False

            elif c["source_details"].get("raw_string") and any(
                k in str(c["source_details"]["raw_string"]) for k in WINDOW_FUNCTIONS
            ):
                return False

        return True

    @staticmethod
    def get_activity_columns(master_object, activity, include_computed=False):
        columns = []
        for c in master_object["columns"]:
            # add the columns that point at the activity
            if (
                (activity.get("id") and c["source_details"].get("activity_id") == activity["id"])
                or (
                    activity.get("id") is None
                    and activity.get("slug")
                    and c["source_details"].get("activity_slug") == activity["slug"]
                )
            ) and (
                include_computed
                or (
                    c["source_details"].get("activity_kind") == activity["kind"]
                    and c["source_kind"] not in ("computed", "customer")
                )
            ):
                columns.append(c)

        return columns

    def setup_the_query(self, master_object, group, do_not_combine_append=False):
        """
        Cleans columns and organizes the data
        """

        # initialize the column mapping
        self.column_mapper = dict()

        # create a full object
        cohort = []
        append = []
        scd_dims = []
        # stream (append_stream, cohort_stream), activity_slug (a['slug']), columns = [], enrichment_table, enricment_table_column, enrichment_table.string

        # cleans the columns
        all_columns = self.get_all_columns(master_object, force_uniqueness=True)

        # Add the timeline ids
        for a_id in self._get_activity_ids(master_object):
            if a_id not in self.timeline_ids:
                self.timeline_ids.append(a_id)

        # add the kpi id for timelines
        # if master_object.get("kpi"):
        #     self.timeline_ids.append(master_object["kpi"]["id"])

        if group:
            self.get_all_columns(master_object, group, force_uniqueness=True)

            # carry the parent filters
            for p in group.get("parent_filters", []):
                for c in self.get_all_columns(master_object):
                    if c["id"] == p["column_id"]:
                        # add the filter when you compile
                        c["filters"].append(p["filter"])

        is_time_cohort = master_object["activities"][0]["occurrence"] == "time"

        # append the columns to each object
        for _, a in enumerate(master_object["activities"]):
            # deal with the columns
            a["columns"] = self.get_activity_columns(master_object, a)
            a["referencing_relationships"] = []
            a["slug"] = a["slug"] if isinstance(a["slug"], list) else [a["slug"]]

            self.activities.extend(a["slug"])

            # add the activities that reference
            for other_a in master_object["activities"]:
                for r in other_a["relationships"]:
                    if r.get("referencing_id") == a["id"] or r.get("referencing") == a["slug"]:
                        a["referencing_relationships"].append(r)

            # handle the within cohort
            is_within_cohort = False
            is_before = False
            is_after = False

            # go through the relationship and clean up the relationshs
            for r in a["relationships"]:
                # within_minutes is deprecated
                if r["slug"] == "within_minutes":
                    r["slug"] = "within_time"
                    r["relationship_time"] = "minute"
                    r["relationship_time_value"] = r["minutes"]

                if r.get("cohort_column") and r["slug"] == "cohort_column":
                    r["referencing_column_id"] = next(
                        (c["id"] for c in cohort[0]["columns"] if _same_column(c, r["cohort_column"])),
                        None,
                    )

                    # adding the cohort column as a reference
                    if not r["referencing_column_id"] and r["cohort_column"]["source_kind"] != "customer":
                        cohort[0]["columns"].append(r["cohort_column"])
                        self.column_mapper[r["cohort_column"]["id"]] = clean_column_name(r["cohort_column"]["label"])
                        self.column_types[r["cohort_column"]["id"]] = r["cohort_column"].get("type", "string")

                        # save the reference
                        r["referencing_column_id"] = r["cohort_column"]["id"]

                # TODO: DEPRECATE
                elif (
                    r["slug"] == "cohort_column"
                    and "-" not in r["cohort_column_name"]
                    and "." not in r["cohort_column_name"]
                ):
                    r["referencing_column_id"] = next(
                        (
                            c["id"]
                            for c in all_columns
                            if c["name"] == r["cohort_column_name"]
                            and c["source_details"].get("activity_kind") == "limiting"
                        ),
                        None,
                    )

                    # adding the reference
                    if not r["referencing_column_id"]:
                        # get the name for a pretty display
                        a_obj = graph_client.get_activities_w_columns(id=cohort[0]["activity_ids"][0]).activity
                        col = next(
                            (
                                c["label"]
                                for c in utils.get_activity_columns(a_obj)
                                if c["name"] == r["cohort_column_name"]
                            ),
                            r["cohort_column_name"],
                        )

                        # Raise the error
                        raise SilenceError(
                            f"The edit definition has a filter that referencing the `{col}` column from `{cohort[0]['name']}` Activity.  That column has been removed so please add it on the activity with the + button"
                        )

                if r["slug"] == "within_cohort":
                    is_within_cohort = True

                if r["slug"] == "before":
                    is_before = True
                elif r["slug"] == "after":
                    is_after = True

            # group the actiivyt
            if a["kind"] == "limiting":
                cohort.append(a)

            elif a["kind"] in ("append", "conversion"):
                # replace ever with before
                if is_time_cohort and a.get("relationship_slug", "").endswith("ever"):
                    a["relationship_slug"] = a["relationship_slug"].replace("ever", "before")
                    a["relationships"].append(dict(slug="before"))

                # if ts column is missing then add it
                if (
                    not a.get("relationship_slug", "").startswith("agg") and a.get("occurrence", "").lower() != "metric"
                ) and "ts" not in [c["name"] for c in a["columns"]]:
                    a["columns"].append(
                        dict(
                            id=a["id"] + "_ts",
                            label=utils.slugify("_or_".join(a["slug"]) + "_ts"),
                            name="ts",
                            source_kind="activity",
                            type="timestamp",
                            source_details=dict(acticvity_kind=a["kind"], activity_id=a["id"]),
                        )
                    )
                    self.column_mapper[a["columns"][-1]["id"]] = clean_column_name(a["columns"][-1]["label"])
                    self.column_types[a["columns"][-1]["id"]] = a["columns"][-1]["type"]

                if is_within_cohort:
                    # check if it is easier to user the activity repeated at instead of joining
                    if not do_not_combine_append and _can_use_repeated_at(a, cohort):
                        temp_col = a["columns"][0]
                        temp_col["name"] = "activity_repeated_at"
                        cohort[0]["columns"].append(temp_col)
                    else:
                        a["kind"] = "in_between"
                        append.append(a)
                elif is_before:
                    a["kind"] = "before"
                    append.append(a)
                elif is_after:
                    if _can_use_repeated_at(a, cohort):
                        temp_col = a["columns"][0]
                        temp_col["name"] = "activity_repeated_at"
                        cohort[0]["columns"].append(temp_col)
                    else:
                        a["kind"] = "after"
                        append.append(a)
                elif any(
                    r for r in a["relationships"] if r["slug"] in ("within_time", "at_least_time", "cohort_column")
                ):
                    a["kind"] = "relative_ever"
                    append.append(a)
                else:
                    a["kind"] = "ever"
                    append.append(a)

            # save the slowly changing dimension object
            for cc in a["columns"]:
                if cc.get("source_details") and cc["source_details"].get("slowly_changing_ts_column"):
                    # get the object
                    temp_scd = next(
                        (
                            sd
                            for sd in scd_dims
                            if sd["activity_slug"] == a["slug"]
                            and sd["enrichment_table"]["table"] == cc["source_details"]["enrichment_table"]["table"]
                        ),
                        None,
                    )

                    if temp_scd:
                        temp_scd["columns"].append(cc)
                    else:
                        scd_dims.append(
                            dict(
                                activity_slug=a["slug"],
                                columns=[cc],
                                **cc["source_details"],
                                stream=("cohort_stream" if a["kind"] == "limiting" else f'{a["kind"]}_stream'),
                            )
                        )

            # add the filters if they don't exist
            a["filters"] = a.get("filters") or []

            # can the occurrence be actually used for optimization
            a["can_use_occurrence"] = (
                len(a["filters"]) == 0
                and a["kind"] in ("ever", "limiting")
                and len(
                    [
                        r
                        for r in a["relationships"]
                        if r["slug"]
                        in (
                            "relative_to",
                            "within_time",
                            "at_least_time",
                            "cohort_column",
                        )
                    ]
                )
                == 0
            )

            # add if recompute_occurrence
            a["recompute_occurrence"] = (
                any(a["filters"])
                or a["kind"] == "relative_ever"
                or a.get("force_recompute_occurrence")
                or any(
                    [
                        r
                        for r in a["relationships"]
                        if r["slug"]
                        in (
                            "relative_to",
                            "within_time",
                            "at_least_time",
                            "cohort_column",
                        )
                    ]
                )
                or a["kind"] == "relative_ever"
                or a.get("force_recompute_occurrence")
                or len(a["slug"]) > 1
                or is_within_cohort
                or (a["kind"] == "before" and a["occurrence"] == "last")
                or (a["kind"] == "after" and a["occurrence"] == "first")
            )

        # add the computed columns
        computed_columns = [c for c in master_object["columns"] if c["source_kind"] == "computed"]

        raw_str_cols = [self._get_computed_raw_string(c["source_details"]) for c in computed_columns]

        # make sure
        for c in all_columns:
            for f in c.get("filters") or []:
                if f.get("kind") == "column_id":
                    f["apply_at_end"] = True

                # Add some logic to let the system know not to apply
                for comp in raw_str_cols:
                    # TODO: Add some better way to know if something is a window_function
                    if (
                        comp
                        and c["id"] in comp
                        and any(
                            r in comp
                            for r in (
                                "window",
                                "row_number",
                                "lag",
                                "string_agg",
                                "lead",
                                "rand",
                                "_all",
                            )
                        )
                    ):
                        f["apply_at_end"] = True

        # deal with spend column missing data
        if group and group.get("spend"):
            for j in group["spend"]["joins"]:
                # get the raw parent dataset
                g_col = next(c for c in self.get_group_columns(group) if c["id"] == j["column_id"])

                parent_col = next(c for c in self.get_all_columns(master_object) if c["id"] == g_col["column_id"])
                j["join_column_source_details"] = (
                    parent_col["source_details"] if parent_col["source_kind"] == "computed" else None
                )

        return (cohort, append, computed_columns, scd_dims)

    def validate_columns(self, master_object, group):
        # get all the columns
        referrenced_column_ids = self._get_all_column_ids(master_object["columns"])

        # get all the columns used in the dataset
        potential_added_id = [(a["id"] + "_ts") for a in master_object["activities"]]
        available_ids = [c["id"] for c in self.get_all_columns(master_object)] + potential_added_id

        group_ids = []
        if group:
            referrenced_column_ids.extend(self._get_all_column_ids(group))
            group_ids.extend([c["id"] for c in self.get_group_columns(group)])

        # missing column_ids
        missing_columns = [val for val in referrenced_column_ids if val not in available_ids and val not in group_ids]

        if len(missing_columns) > 0:
            raise (
                SilenceError(
                    "The following column_ids do not exist in the dataset but are used: {}".format(
                        ",".join(missing_columns)
                    )
                )
            )

        duplicated_ids = [val for ii, val in enumerate(available_ids) if val in available_ids[ii + 1 :]]
        duplicated_ids.extend([val for ii, val in enumerate(group_ids) if val in group_ids[ii + 1 :]])
        if len(duplicated_ids) > 0:
            raise (SilenceError("A column Id is being duplicated in the dataset:{}".format(", ".join(duplicated_ids))))

    def create_full_query_join_filter(
        self,
        cte,
        alias,
        add_cohort_col=False,
        is_time=False,
        last_alias=None,
    ):
        """
        Generates the full_query jooin at th ebottom of the code
        """

        qm = self.qm

        join_filt = qm.Filter()

        if not is_time:
            # create the filter
            join_filt.add_filter(
                qm.Condition(
                    operator="equal",
                    left=qm.Column(
                        table_alias="c",
                        table_column="join_customer",
                        column_type="string",
                    ),
                    right=qm.Column(
                        table_alias=alias,
                        table_column="join_customer",
                        column_type="string",
                    ),
                ),
                "AND",
            )

        elif last_alias:
            # create the filter
            join_filt.add_filter(
                qm.Condition(
                    operator="equal",
                    # this is going to use join customer unless we are joining using the customer (only for time joins)
                    left=qm.Column(
                        table_alias=last_alias,
                        table_column="join_customer",
                        column_type="string",
                    ),
                    right=qm.Column(
                        table_alias=alias,
                        table_column="join_customer",
                        column_type="string",
                    ),
                ),
                "AND",
            )

        # add the cohort to the join
        if add_cohort_col:
            join_filt.add_filter(
                qm.Condition(
                    operator="equal",
                    left=qm.Column(table_alias="c", table_column="join_cohort_id"),
                    right=qm.Column(table_alias=alias, table_column="join_cohort_id"),
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

    @staticmethod
    def get_group_from_slug(master_object, group_slug):
        return next((g for g in master_object["all_groups"] if g["slug"] == group_slug), None)

    @tracer.start_as_current_span("generate_query")
    def generate_query(self, master_object, group_slug=None, limit=DATASET_LIMIT, offset=None):
        """
        Generates the full dataset object
        """
        # make a copy of the master object cause I mutate it
        master_object = deepcopy(master_object)

        self.reset()
        self.company_table = self.get_activity_stream(master_object)

        qm = self.qm
        # get the group
        group = self.get_group_from_slug(master_object, group_slug)

        # validate that the columns are referenced
        self.validate_columns(master_object, group)

        (
            cohort,
            append,
            computed_columns,
            scd_dims,
        ) = self.setup_the_query(master_object, group)

        # maintain the order so don't use set
        ordered_kinds = []
        for a in append:
            if a["kind"] not in ordered_kinds:
                ordered_kinds.append(a["kind"])

        # add the time filters to the activity
        self.__find_time_filter(cohort[0])

        # INITIATLIAZE The query object
        full_query = qm.Query()
        if not (cohort[0]["occurrence"] == "time"):
            full_query.add_cte("cohort_stream", self._create_activity_query(cohort))

        # create all the appends
        for kind in ordered_kinds:
            full_query.add_cte(
                f"{kind}_stream",
                self._create_activity_query([a for a in append if a["kind"] == kind]),
            )

        for scd in scd_dims:
            full_query.add_cte(
                _scd_table_name(scd["enrichment_table"]["table"], scd["activity_slug"]),
                self._create_scd_table(scd),
            )

        # figure out if it is worth dealing with source
        has_source = all([a["config"]["has_source"] for a in cohort])
        # add the cohort to the query
        full_query.add_cte(
            "cohort",
            self.create_cohort_query(cohort, has_source, kinds=set(a["kind"] for a in append)),
        )
        full_query.set_from(qm.Table(cte="cohort", alias="c"))
        full_query.add_column(self._get_non_join_columns(full_query.ctes["cohort"], alias="c"))
        last_alias = None

        # add the normal attribution and conversion
        for kind in ordered_kinds:
            name = "append_" + kind

            if qm.language == "mysql":
                alias = name
            else:
                alias = kind

            # Dim wrapper
            desired_conv = [a for a in append if a["kind"] == kind]
            dim_query = self.create_dim_query_wrapper(desired_conv)

            rel_query = self.create_relationship_query(
                [a for a in append if a["kind"] == kind],
                has_source,
                kind,
                has_next_ts=any([a for a in cohort if a["occurrence"] in ("all", "time")]),
                is_time=cohort[0]["occurrence"] == "time",
            )

            if dim_query.columns:
                # add all the columns
                dim_query.add_column(qm.Column(all_columns=True, table_alias="s"))
                dim_query.set_from(qm.Table(query=rel_query, alias="s"))
                rel_query = dim_query

            # add the rel query
            full_query.add_cte(name, rel_query)
            full_query.add_join(
                self.create_full_query_join_filter(
                    name,
                    alias,
                    add_cohort_col=kind in ("before", "in_between", "after", "relative_ever"),
                    is_time=cohort[0]["occurrence"] == "time",
                    last_alias=last_alias,
                )
            )
            full_query.add_column(
                self._get_non_join_columns(
                    full_query.ctes[name],
                    alias=alias,
                )
            )

            # if there is a customer table, we will use that first then use the next
            if last_alias is None:
                last_alias = alias

        # add all the customer columns first
        for c in master_object["columns"]:
            if c["source_kind"] == "customer":
                self.add_customer_column(full_query, c, is_time=cohort[0]["occurrence"] == "time")

        # if we have a join_customer then add the source of that customer
        append_col = next(
            (
                c
                for c in master_object["columns"]
                if c["source_kind"] == "activity"
                and c["source_details"]["activity_kind"] == "append"
                and c["name"] == "join_customer"
            ),
            None,
        )

        # add the join column if it exists
        if append_col:
            full_query.add_column(
                qm.Column(
                    table_column="join_customer",
                    name_alias=append_col["label"],
                    table_alias=last_alias,
                    column_type="string",
                )
            )

        # add the computed columns
        full_query = self.add_computed_columns(full_query, computed_columns)

        # add all the post filters
        column_filters = []

        for c in self.get_all_columns(master_object, None):
            if any(c["filters"]):
                if c.get("source_details") is None or c["source_details"].get("activity_kind") != "limiting":
                    column_filters.append(c)

                # add the cohort column filters that
                elif c.get("source_details") and c["source_details"].get("activity_kind") == "limiting":
                    new_filters = [f for f in c["filters"] if f.get("apply_at_end")]
                    if new_filters:
                        c["filters"] = new_filters
                        column_filters.append(c)

        if len(column_filters) > 0:
            # create a wrapper
            new_query = qm.wrap_query(full_query)
            new_query.add_comment("Adding all the post assembly filters")

            full_filter = qm.Filter()
            # add all the post data filters
            for c in column_filters:
                full_filter.add_filter(
                    self.__create_filter(
                        c["filters"],
                        qm.Column(
                            table_column=self.column_mapper[c["id"]],
                            column_type=self.column_types[c["id"]],
                        ),
                    ),
                    "AND",
                )

            # add the fulter
            if len(full_filter.filters) > 0:
                new_query.add_filter(full_filter)
            # update the full query pointer
            full_query = new_query

        # add the group by
        if group:
            # initialize the cohort filter
            group["cohort_time_filters"] = []

            # add the first timestamp filters
            for c in cohort[0]["columns"]:
                if utils.get_simple_type(c["type"]) == "timestamp":
                    group["cohort_time_filters"].extend(c["filters"])
                    break

            # add the pre filters to the dataset
            for f in cohort[0]["filters"]:
                if f.get("activity_column"):
                    if f["activity_column"]["name"] == "ts":
                        group["cohort_time_filters"].append(f["filter"])
                elif f.get("activity_column_name") == "ts":
                    group["cohort_time_filters"].append(f["filter"])

            # add the group query
            full_query = self.add_group(full_query, group, limit=limit, offset=offset)

            # deal with suppressing the hidden columns
            if group.get("is_parent"):
                full_query.set_limit(None)
                # add the order
                self.add_order_by(full_query, group.get("order") or [])
                full_query = self.supress_outputs(
                    full_query,
                    master_object["columns"],
                    only_column_ids=(
                        [c["id"] for c in _filter_hidden_columns(master_object["columns"], group)]
                        if group.get("hidden_column_ids")
                        else None
                    ),
                )
                full_query.set_limit(limit)
                if offset:
                    full_query.set_offset(offset)

        # add the order and clean the output
        elif self._can_use_subquery(master_object):
            # you need to put the order on the cohort so the nested limit works then add another order so the output works
            self.add_order_by(full_query.ctes["cohort"], master_object["order"])
            self.add_order_by(full_query, master_object["order"])
            full_query = self.supress_outputs(full_query, master_object["columns"])
            full_query.ctes["cohort"].set_limit(limit)
            if offset:
                full_query.ctes["cohort"].set_offset(offset)
        else:
            self.add_order_by(full_query, master_object["order"])
            full_query = self.supress_outputs(full_query, master_object["columns"])
            full_query.set_limit(limit)
            if offset:
                full_query.set_offset(offset)

        return full_query

    def supress_outputs(self, query, columns, only_column_ids=None):
        """
        Check and suppress columns
        """
        qm = self.qm

        keep_columns = [c for c in columns if c["output"] and not c.get("pivoted")]
        if len(keep_columns) == len(columns) and not only_column_ids:
            return query

        # supresss the columns
        new_query = qm.Query()
        new_query.add_comment("Remove all the columns that you hid")
        new_query.set_from(qm.Table(query=query, alias="f"))
        new_query.order_by = query.order_by
        query.order_by = []

        # add the columns you don't want to suppress
        for c in keep_columns:
            if not only_column_ids or c["id"] in (only_column_ids or []):
                new_query.add_column(qm.Column(table_alias="f", table_column=self.column_mapper[c["id"]]))

        return new_query

    def clean_columns(self, master_object, group):
        # TODO: DEPRECATE
        # clean up the numbers
        columns = self.get_all_columns(master_object, group, force_uniqueness=True)
        return columns

    ###########################################################
    ####################   FILTERS AND HELPERS     #######
    ###########################################################

    def _can_use_within_minutes_filters(self, att_conv_objs):
        desired_r = None
        for att_obj in att_conv_objs:
            has_filt = False
            # check if you have a time filter
            for r in att_obj["relationships"]:
                if r["slug"] == "within_time":
                    has_filt = True

                    # see if you can figure out the widest ranged time filter and use that
                    if desired_r:
                        res = self._fix_boundary(r.get("relationship_time"))
                        time_val = int(r.get("relationship_time_value"))

                        d_res = self._fix_boundary(desired_r.get("relationship_time"))
                        d_time_val = int(desired_r.get("relationship_time_value"))

                        if RESOLUTIONS.index(res) > RESOLUTIONS.index(d_res):
                            desired_r = r
                        elif RESOLUTIONS.index(res) == RESOLUTIONS.index(d_res) and time_val > d_time_val:
                            desired_r = r

                    else:
                        desired_r = r

            if not has_filt:
                return None

        return desired_r

    def _can_use_column_filters(self, att_conv_objs):
        temp_filt = None

        for att_obj in att_conv_objs:
            has_filt = False
            # check if you have a time filter
            for r in att_obj["relationships"]:
                if r["slug"] == "cohort_column":
                    # keep track if someone has  no filter
                    has_filt = True

                    # create the column
                    new_filt = self._create_cohort_column_filter(r)

                    # if this is the first
                    if r.get("column_name_enrichment_table"):
                        return None
                    elif temp_filt is None:
                        temp_filt = new_filt

                    # not the same filter
                    elif temp_filt.to_query() != new_filt.to_query():
                        return None

            if not has_filt:
                return None
        return temp_filt

    def _create_cohort_column_filter(self, r):
        qm = self.qm

        # remove the contains any operators
        if r["operator"] in ("contains_any", "not_contains_any"):
            r["operator"] = r["operator"][:-4]

        if r.get("cohort_column"):
            # NOTE: we need to do column mapper to get the reference column_id then use the name because we use the filter to create a unique id
            if r["cohort_column"]["source_details"].get("enrichment_table"):
                col_alias = self._expand_table(r["cohort_column"]["source_details"]["enrichment_table"])[1]
            else:
                col_alias = "s"

            if r.get("referencing_column_id"):
                col_type = self.column_types[r["referencing_column_id"]]

                temp_filt = qm.Condition(
                    operator=r["operator"],
                    left=qm.Column(
                        table_column=self.column_mapper[r["referencing_column_id"]],
                        table_alias="c",
                        column_type=col_type,
                    ),
                    right=self.__create_column(r["append_column"], col_alias),
                )

            else:
                temp_filt = qm.Condition(
                    operator=r["operator"],
                    left=self.__create_column(r["cohort_column"], "c"),
                    right=self.__create_column(r["append_column"], col_alias),
                )
        else:
            # TODO: DEPRECATE
            # NOTE: we need to do column mapper to get the reference column_id then use the name because we use the filter to create a unique id
            if r.get("column_name_enrichment_table"):
                col_alias = self._expand_table(r["column_name_enrichment_table"])[1]
            else:
                col_alias = "s"

            if r.get("referencing_column_id"):
                col_type = self.column_types[r["referencing_column_id"]]

                temp_filt = qm.Condition(
                    operator=r["operator"],
                    left=qm.Column(
                        table_column=self.column_mapper[r["referencing_column_id"]],
                        table_alias="c",
                        column_type=col_type,
                    ),
                    right=self.__create_column_from_name(r["column_name"], col_alias, col_type),
                )
                # add time zone if it is the wrong type
                if utils.get_simple_type(col_type) == "timestamp":
                    temp_filt.right.set_timezone(self.company.timezone)

            else:
                temp_filt = qm.Condition(
                    operator=r["operator"],
                    left=self.__create_column_from_name(r["cohort_column_name"], "c"),
                    right=self.__create_column_from_name(r["column_name"], col_alias),
                )
        return temp_filt

    def _update_column_with_time_filter(self, col, r):
        # TO better deal within time we can do shift the column in the opposite direction
        return self.qm.Column(
            function=("time_add" if r["relationship_time"] in RESOLUTIONS[:3] else "date_add"),
            fields=dict(
                datepart=r["relationship_time"],
                column=col,
                number=r["relationship_time_value"],
            ),
        )

    def _create_within_time_filter(self, r, is_before=False, use_join_table=None):
        qm = self.qm
        if use_join_table:
            from_column = qm.Column(
                table_alias=r.get("referencing_id") or r.get("referencing"),
                table_column="join_ts",
            )
            to_column = qm.Column(
                table_alias=use_join_table.alias,
                table_column="join_ts",
            )
        else:
            from_column = qm.Column(table_alias="c", table_column="join_ts")
            to_column = qm.Column(table_alias="s", table_column="ts")

        return qm.Condition(
            operator="less_than",
            left=qm.Column(
                function="abs",
                fields=dict(
                    column=qm.Column(
                        function=self._get_time_func("date_diff", r["relationship_time"]),
                        fields=dict(
                            datepart=self._fix_boundary(r["relationship_time"]),
                            from_column=to_column if is_before else from_column,
                            to_column=from_column if is_before else to_column,
                        ),
                    )
                ),
            ),
            right=qm.Column(value=int(r["relationship_time_value"])),
        )

    @staticmethod
    def _fix_resolution(val):
        if val.endswith("s"):
            return val[:-1]
        return val

    @staticmethod
    def _fix_boundary(resolution):
        # handle the boundary
        if resolution.endswith("_boundary"):
            resolution = resolution[:-9]
        return resolution

    def _get_time_func(self, func, resolution):
        # handle the boundary
        if resolution.endswith("_boundary") or (
            self.company.use_time_boundary and func.lower() in ("date_diff", "time_diff")
        ):
            resolution = resolution[:-0]
            func += "_boundary"

        # handle type
        if self._fix_resolution(resolution) in ("second", "minute", "hour", "day"):
            return func.replace("date", "time")
        return func

    def __find_time_filter(self, activity_obj):
        time_filters = []
        for f in activity_obj["filters"]:
            if f.get("activity_column") and f["activity_column"].get("name") == "ts":
                time_filters.append(f["filter"])
            elif f.get("activity_column_name") == "ts":
                time_filters.append(f["filter"])

        for c in activity_obj["columns"]:
            if c.get("name") == "ts":
                for f in c["filters"]:
                    # remove relationships to a column
                    if (f.get("kind") or f.get("from_value_kind")) == "value":
                        time_filters.append(f)

        self.time_filters = time_filters
        return time_filters

    def __map_time_filt(self, col, prefix):
        qm = self.qm
        company = self.company

        if col[prefix + "_type"] == "relative":
            resolution = self._fix_resolution(col[prefix + "_value_resolution"])
            desired_col = qm.Column(
                function=self._get_time_func("date_add", resolution),
                fields=dict(
                    datepart=self._fix_boundary(resolution),
                    number=int(col[prefix + "_value"]) * -1,
                    column=qm.Column(
                        function="now",
                        fields=dict(),
                        timezone=company.timezone,
                    ),
                ),
            )

        elif col[prefix + "_type"] == "absolute":
            desired_col = qm.Column(
                value=col[prefix + "_value"],
                casting="timestamp",
                timezone=company.timezone,
            )

        elif col[prefix + "_type"] == "colloquial":
            desired_col = self._offset_column(
                qm.Column(
                    function="date_trunc",
                    fields=dict(
                        datepart=self._fix_boundary(self._fix_resolution(col[prefix + "_value"])),
                        column=qm.Column(
                            function="now",
                            fields=dict(),
                            timezone=company.timezone,
                        ),
                    ),
                )
            )
        elif col[prefix + "_type"] == "now" and self.is_time:
            desired_col = qm.Column(function="now", fields=dict(), timezone=self.company.timezone)

        else:
            desired_col = None

        return desired_col

    def _offset_column(self, col):
        if self.company.week_day_offset and col.function == "date_trunc" and col.fields.get("datepart", "") == "week":
            return self.qm.Column(
                function="date_add",
                fields=dict(datepart="day", number=self.company.week_day_offset, column=col),
                name_alias=col.name_alias,
            )
        return col

    # TODO: portal-queries/handler.py calls __create_filter directly ... for now we moved it to this method
    def internal_create_filter(self, f, column):
        return self.__create_filter(f, column)

    def __create_filter(self, f, column):
        """
        Deal with the Dataset UI filters
        """
        qm = self.qm
        # handle batch filters
        if isinstance(f, list):
            return [self.__create_filter(tf, column) for tf in f]

        # fix not not contain
        if f["operator"] == "not_contain":
            f["operator"] = "not_contains"

        # gets the column form the kind
        # TO DO - Make this dynamic
        if f["operator"] in [f["name"] for f in FUNCTIONS if f["kind"] == "operators" and len(f["input_fields"]) >= 2]:
            # properly handle lower opersators
            if f["operator"] in LOWER_OPERATORS:
                # deal with the array
                if isinstance(f.get("value"), list):
                    f["value"] = [str(s).lower() for s in f["value"]]
                elif isinstance(f.get("value"), str):
                    f["value"] = f["value"].lower()

            # handle the time zone issue if the input has time
            if f.get("value_resolution") == "date_time":
                try:
                    f["value"] = utils.make_local(f["value"], self.company.timezone)
                except Exception:
                    logger.exception("Failed")

            right_column = self.value_column(
                (f.get("kind") if f.get("kind") == "column_id" or column is None else column.get_type()),
                f.get("value"),
            )

            # handling type mismatches
            # YOU DO NOT KNOW THE TYPE OF THE COLUMN SO IT IS A PROBLEM
            # ENRICHMENT CAN BE BOOL BUT FEATURES ARE ALWAYS STRINGS
            # TODO: FIGURE OUT HOW TO ADD TYPE TO PREFILTERS
            if (
                column.get_type() == "string"
                and column.kind == "simple"
                and column.table_column.startswith("feature_")
                and not isinstance(right_column, list)
            ):
                right_column.casting = "string"

        else:
            right_column = None

        # add the time filters
        if f["operator"] == "time_range":
            # create the filters
            from_filt = self.__map_time_filt(f, "from")
            to_filt = self.__map_time_filt(f, "to")

            # if no filter then return
            if not (from_filt or to_filt):
                return None

            cond = qm.Filter(filters=[])

            # add the filters if they are not None
            if from_filt:
                cond.add_filter(
                    qm.Condition(operator="greater_than_equal", left=column, right=from_filt),
                    "AND",
                )

            if to_filt:
                cond.add_filter(
                    qm.Condition(operator="less_than", left=column, right=to_filt),
                    "AND",
                )

        elif f["operator"] == "quick_time_filter":
            if not f.get("value"):
                raise SilenceError("Missing value for the time filter")

            pieces = f["value"].split("_")
            res = pieces[-1]

            if pieces[1] == "this":
                right_col = self._offset_column(
                    qm.Column(
                        function="date_trunc",
                        fields=dict(
                            datepart=res,
                            column=qm.Column(function="now", fields=dict()),
                        ),
                    )
                )
            else:
                right_col = self._offset_column(
                    qm.Column(
                        function=self._get_time_func("date_add", res),
                        fields=dict(
                            datepart=res,
                            column=qm.Column(function="now", fields=dict()),
                            number=-1 * int(pieces[1]),
                        ),
                    )
                )

            # right col
            cond = qm.Condition(operator="greater_than_equal", left=column, right=right_col)

        elif f["operator"] in ("contains_any", "not_contains_any"):
            # deal with the column as contains any
            if not isinstance(right_column, list):
                right_column = [right_column]

            # fix the column filter
            cond = qm.Filter(filters=[])
            for r in right_column:
                cond.add_filter(
                    qm.Condition(operator="contains", left=column, right=r),
                    "OR",
                )

            if f["operator"] == "not_contains_any":
                cond.is_not = True

        else:
            cond = qm.Condition(operator=f["operator"], left=column, right=right_column)

        # handle the null case
        if f.get("or_null"):
            cond = qm.Filter(filters=[cond, "OR", qm.Condition(operator="is_null", left=column)])

        return cond

    def __create_activity_condition(self, activity_obj):
        return self.qm.Condition(
            operator="is_in",
            left=self.qm.Column(
                table_alias="s",
                table_column="activity",
                column_type="string",
            ),
            right=[self.qm.Column(value=s, column_type="string") for s in activity_obj["slug"]],
        )

    ##### DEALING WITH ADD COLUMNS OR NECESSARY STUFF ####
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
                    first_column=qm.Column(table_column="customer", table_alias=alias, column_type="string"),
                    second_column=qm.Column(
                        table_column="anonymous_customer_id",
                        table_alias=alias,
                        column_type="string",
                    ),
                ),
                name_alias="join_customer",
            )
        else:
            customer_col = qm.Column(
                table_column="customer",
                table_alias=alias,
                name_alias="join_customer",
                column_type="string",
            )

        return customer_col

    def _expand_table(self, table, default_key=None):
        if isinstance(table, dict):
            table_name = table["table"]
            schema_name = table["schema"]
            join_key = table.get("join_key")
            join_key_type = table.get("join_key_type")
        else:
            table_name = table
            schema_name = self.company.warehouse_schema
            join_key = default_key
            join_key_type = "string"

        return (schema_name, table_name, join_key, join_key_type)

    def __add_enrichment_table_in_dim(
        self,
        query,
        enrichment_table,
        activity_obj,
        enrichment_column=None,
        slowly_changing_ts_column=None,
        key_idx=None,
    ):
        qm = self.qm
        (schema_name, table_name, join_key, join_key_type) = self._expand_table(
            enrichment_table, default_key="enriched_activity_id"
        )

        # For slowly changing dim, we are using the CTE
        if slowly_changing_ts_column:
            table_name = _scd_table_name(table_name, activity_obj["slug"])
            # resetting these since I already use the columns
            join_key = "join_id"
            enrichment_column = "activity_id"

        # add a None enrichment column
        if enrichment_column is None:
            enrichment_column = "activity_id"

        # check for enrichment
        if not table_name:
            raise (SilenceError("Enrichment table was not available for activity"))

        # create a new alias
        alias = f"{table_name}_{key_idx}_tbl"

        col = qm.Column(
            table_alias="s",
            table_column=f"join_{enrichment_column}_{key_idx}_activity",
            column_type=join_key_type,
        )

        # if the table doesn't exist then add it
        enriched_cond = qm.Condition(
            operator="equal",
            left=col,
            right=qm.Column(
                table_alias=alias,
                table_column=join_key,
                column_type=join_key_type,
            ),
        )

        # if the slowly changing dim, then use the dims
        if slowly_changing_ts_column:
            e_table = qm.Table(
                cte=table_name,
                alias=alias,
            )
        else:
            e_table = qm.Table(
                schema=schema_name,
                table=table_name,
                alias=alias,
            )

        new_join = self.qm.Join(
            kind="LEFT",
            table=e_table,
            condition=enriched_cond,
        )

        # check if the join needs to be added
        if new_join.to_query() in [j.to_query() for j in query.joins]:
            return (alias, None, None)
        else:
            # add the join criteria
            query.add_join(
                self.qm.Join(
                    kind="LEFT",
                    table=e_table,
                    condition=enriched_cond,
                )
            )
            return (alias, col, enrichment_column)

    def __add_enrichment_table(
        self,
        query,
        enrichment_table,
        activity_obj,
        enrichment_column=None,
        slowly_changing_ts_column=None,
    ):
        """
        Adds the enrichment join to the query
        """

        qm = self.qm
        (schema_name, table_name, join_key, join_key_type) = self._expand_table(
            enrichment_table, default_key="enriched_activity_id"
        )

        # For slowly changing dim, we are using the CTE
        if slowly_changing_ts_column:
            table_name = _scd_table_name(table_name, activity_obj["slug"])
            # resetting these since I already use the columns
            join_key = "join_id"
            enrichment_column = "activity_id"

        # add a None enrichment column
        if enrichment_column is None:
            enrichment_column = "activity_id"

        activity_filt = self.__create_activity_condition(activity_obj)

        # check for enrichment
        if not table_name:
            raise (SilenceError("Enrichment table was not available for activity"))

        col = self.__create_column_from_name(enrichment_column, "s", join_key_type)
        alias = table_name

        # if the table doesn't exist then add it
        if table_name not in [t.table or t.cte for t in query.get_all_tables()]:
            enriched_cond = qm.Filter(
                filters=[
                    activity_filt,
                    "AND",
                    qm.Condition(
                        operator="equal",
                        left=col,
                        right=qm.Column(
                            table_alias=alias,
                            table_column=join_key,
                            column_type=join_key_type,
                        ),
                    ),
                ]
            )

            # if the slowly changing dim, then use the dims
            if slowly_changing_ts_column:
                e_table = qm.Table(
                    cte=table_name,
                    alias=alias,
                )
            else:
                e_table = qm.Table(
                    schema=schema_name,
                    table=table_name,
                    alias=alias,
                )

            # add the join criteria
            query.add_join(
                self.qm.Join(
                    kind="LEFT",
                    table=e_table,
                    condition=enriched_cond,
                )
            )
            # condition since we already have dependencies
            return alias

        else:
            enrichment_join = next((j for j in query.joins if j.table.table == table_name), None)

            if enrichment_join:
                if hasattr(enrichment_join.condition, "filters"):
                    first_filter = enrichment_join.condition.filters[0]
                else:
                    first_filter = enrichment_join.condition

                # add each extra filter
                for rc in activity_filt.right:
                    # handle not list cases
                    if not isinstance(first_filter.right, list):
                        first_filter.right = [first_filter.right]
                        first_filter.operator = "is_in"

                    if rc.value not in [cc.value for cc in first_filter.right]:
                        first_filter.right.append(rc)

        return table_name

    def __add_customer_table(self, query, customer_table, use_column="customer"):
        """
        Adds the enrichment join to the query
        """

        qm = self.qm

        (schema_name, table_name, join_key, join_key_type) = self._expand_table(customer_table, default_key="customer")

        alias = table_name

        # if the table doesn't exist then add it
        if table_name not in [t.table for t in query.get_all_tables()]:
            # add the join criteria
            query.add_join(
                self.qm.Join(
                    kind="LEFT",
                    table=qm.Table(
                        schema=schema_name,
                        table=table_name,
                        alias=alias,
                    ),
                    condition=qm.Condition(
                        operator="equal",
                        left=qm.Column(
                            table_column=use_column,
                            table_alias=query.from_table.alias,
                            column_type=join_key_type,
                        ),
                        right=qm.Column(
                            table_column=join_key,
                            table_alias=alias,
                            column_type=join_key_type,
                        ),
                    ),
                ),
                insert_index=0,
            )

            return alias

        return table_name

    def __create_occurrence_filter(self, activity_obj, alias, rename_column=None):
        qm = self.qm

        # handle the filters
        if activity_obj["occurrence"] == "first":
            return qm.Condition(
                operator="equal",
                left=qm.Column(
                    table_column=rename_column or "activity_occurrence",
                    table_alias=alias,
                    column_type="number",
                ),
                right=qm.Column(value=1),
            )

        elif activity_obj["occurrence"] == "last":
            if activity_obj["kind"] == "limiting" and rename_column is None:
                return qm.Filter(
                    filters=[
                        qm.Condition(
                            operator="is_null",
                            left=qm.Column(
                                table_column="activity_repeated_at",
                                table_alias=alias,
                                column_type="timestamp",
                            ),
                        ),
                    ]
                )
            else:
                return qm.Condition(
                    operator="is_null",
                    left=qm.Column(
                        table_column=rename_column or "activity_repeated_at",
                        table_alias=alias,
                        column_type="timestamp",
                    ),
                )

        elif activity_obj["occurrence"] == "custom":
            # filter for first
            return qm.Condition(
                operator="equal",
                left=qm.Column(
                    table_column=rename_column or "activity_occurrence",
                    table_alias=alias,
                    column_type="number",
                ),
                right=qm.Column(value=int(activity_obj["occurrence_value"])),
            )

        return None

    def __create_activity_filter(
        self,
        activity_obj,
        alias: str,
        ignore_occurrence: bool = False,
        ignore_filters: bool = False,
        add_activity: bool = False,
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
            for f in activity_obj["filters"]:
                if f.get("activity_column"):
                    # this is to hack around getting the values for dynamic filters
                    if not f["filter"]:
                        continue

                    temp_filter = self.__create_filter(f["filter"], self.__create_column(f["activity_column"], alias))

                # TODO: DEPRECATE
                elif "-" in (f.get("activity_column_name") or ""):
                    (table_alias, name) = f["activity_column_name"].split("-")
                    temp_filter = self.__create_filter(
                        f["filter"],
                        qm.Column(
                            table_alias=table_alias,
                            table_column=name,
                            column_type=f.get("column_type"),
                        ),
                    )
                elif f.get("enrichment_table"):
                    # if it is enrichment fix the type
                    f["filter"]["value"] = utils.string_to_value(f["filter"]["value"])

                    temp_filter = self.__create_filter(
                        f["filter"],
                        qm.Column(
                            table_alias=self._expand_table(f["enrichment_table"])[1],
                            table_column=f["activity_column_name"],
                            column_type=f.get("column_type") or utils.get_type(f["filter"]["value"]),
                        ),
                    )
                elif f.get("activity_column_name"):
                    temp_filter = self.__create_filter(
                        f["filter"],
                        self.__create_column_from_name(f["activity_column_name"], alias, f.get("column_type")),
                    )
                else:
                    raise ValueError("Invalid code path")

                filt.add_filter(temp_filter, "AND")

        return filt if filt.filters else None

    def __create_raw_column(self, c, table_alias):
        qm = self.qm
        company = self.company

        qm_col = None

        raw_type = utils.get_simple_type(c.get("mavis_type") or c["type"])

        # deal with feature columns
        if c["name"] == "feature_json":
            qm_col = qm.Column(
                table_alias=table_alias,
                table_column="feature_json",
                column_type="number",  # HACK: Use the number so it does the row_number join
                name_alias=self.column_mapper.get(c["id"]),
            )
        elif c["name"].startswith("feature_"):
            qm_col = qm.Column(
                table_alias=table_alias,
                json_column="feature_json",
                json_key=c["name"][8:],
                ## This is just to deal with the backfill
                column_type="string" if c["name"][8:] in ("1", "2", "3") else raw_type,
                casting=raw_type if c["name"][8:] in ("1", "2", "3") else None,
                timezone=(
                    company.timezone
                    if raw_type == "timestamp" and not any(r in c["name"] for r in RESOLUTIONS)
                    else None
                ),
                name_alias=self.column_mapper.get(c["id"]),
            )

        elif "." in c["name"] and c["name"].split(".")[1] in RESOLUTIONS:
            qm_col = self.__create_column_from_name(c["name"], table_alias)
            if self.column_mapper.get(c["id"]):
                qm_col.set_name_alias(self.column_mapper[c["id"]])

        if not qm_col:
            # create the column
            qm_col = qm.Column(
                table_alias=table_alias,
                table_column=c["name"],
                column_type=raw_type,
                timezone=company.timezone if raw_type == "timestamp" else None,
                name_alias=self.column_mapper.get(c["id"]),
            )

        return qm_col

    def __create_column(self, column, table_alias):
        if column is None:
            return None

        elif column["source_kind"] == "customer":
            table_alias = self._expand_table(column["source_details"]["table"])[1]
        elif column["source_details"].get("enrichment_table"):
            table_alias = self._expand_table(column["source_details"]["enrichment_table"])[1]

        return self.__create_raw_column(column, table_alias)

    def __create_column_from_name(self, name, table_alias, col_type=None):
        if "-" in name:
            (table_alias, name) = name.split("-")
        # get the column
        if "." in name and name.split(".")[1] in RESOLUTIONS:
            (col_name, resolution) = name.split(".")[:2]

            # create the column
            qm_col = self._offset_column(
                self.qm.Column(
                    function="date_trunc",
                    fields=dict(
                        datepart=resolution,
                        column=self.qm.Column(
                            table_alias=table_alias,
                            table_column=col_name,
                            column_type="timestamp",
                            timezone=self.company.timezone,
                        ),
                    ),
                    column_type="timestamp",
                )
            )
        elif name.startswith("feature"):
            qm_col = self.qm.Column(
                table_alias=table_alias,
                json_column="feature_json",
                json_key=name[8:],
                casting=utils.get_simple_type(col_type),
            )
        else:
            qm_col = self.qm.Column(
                table_column=name,
                table_alias=table_alias,
                column_type=(_get_activity_stream_type(name) if table_alias in ("s", "c") else col_type),
            )

        return qm_col

    ###########################################################
    ####################   COHORT     ######################
    ###########################################################

    def _get_non_join_columns(self, query, alias):
        """
        Loop through all the columns in the query and return valid columns
        """

        qm = self.qm

        valid_columns = []

        # go through all the columns and remove join columns

        for col in query.get_all_columns(only_names=False):
            c = col.get_name()
            if not c.startswith("join_"):
                if col.function and col.function in [
                    f["name"]
                    for f in FUNCTIONS
                    if f["kind"] == "agg_functions" and utils.get_simple_type(f["output_type"]) == "number"
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
        has_source=False,
        needs=None,
        recompute_next_ts=False,
        is_unique=False,
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
        if "join_customer" not in cols:
            query.add_column(self.__get_customer_column(has_source, query.from_table.alias))

        # if you need a join timestamp
        if "join_ts" not in cols:
            # add the ts
            query.add_column(
                qm.Column(
                    table_alias=query.from_table.alias,
                    table_column="ts",
                    name_alias="join_ts",
                    column_type="timestamp",
                )
            )

        if "join_cohort_id" in needs and "join_cohort_id" not in cols:
            # add the cohort activity id
            query.add_column(
                qm.Column(
                    table_alias=query.from_table.alias,
                    table_column="activity_id",
                    name_alias="join_cohort_id",
                    column_type="string",
                )
            )

        if "join_activity_occurrence" in needs and "join_activity_occurrence" not in cols:
            # add it
            query.add_column(
                qm.Column(
                    function="row_number_w_group",
                    fields=dict(
                        group=self.__get_customer_column(has_source, query.from_table.alias),
                        order=qm.Column(
                            table_column="ts",
                            table_alias=query.from_table.alias,
                            column_type="timestamp",
                        ),
                    ),
                    name_alias="join_activity_occurrence",
                )
            )

        if "join_cohort_next_ts" in needs and "join_cohort_next_ts" not in cols:
            if is_unique:
                # if the query is unique then just null the join_next_ts
                query.add_column(qm.Column(value=None, name_alias="join_cohort_next_ts"))
            elif recompute_next_ts:
                # add it
                query.add_column(
                    qm.Column(
                        function="lead",
                        fields=dict(
                            column=qm.Column(
                                table_column=("join_ts" if query.from_table.kind == "query" else "ts"),
                                table_alias=query.from_table.alias,
                            ),
                            group=self.__get_customer_column(has_source, query.from_table.alias),
                            order=qm.Column(
                                table_column=("join_ts" if query.from_table.kind == "query" else "ts"),
                                table_alias=query.from_table.alias,
                            ),
                        ),
                        name_alias="join_cohort_next_ts",
                    )
                )
            else:
                query.add_column(
                    qm.Column(
                        table_alias=query.from_table.alias,
                        table_column="activity_repeated_at",
                        name_alias="join_cohort_next_ts",
                        column_type="timestamp",
                    )
                )

        if "join_next_ts" in needs and "join_next_ts" not in cols:
            if is_unique:
                # if the query is unique then just null the join_next_ts
                query.add_column(qm.Column(value=None, name_alias="join_next_ts"))
            elif recompute_next_ts:
                # add it
                query.add_column(
                    qm.Column(
                        function="lead",
                        fields=dict(
                            column=qm.Column(table_column="ts", table_alias=query.from_table.alias),
                            group=self.__get_customer_column(has_source),
                            order=qm.Column(table_column="ts", table_alias=query.from_table.alias),
                        ),
                        name_alias="join_next_ts",
                    )
                )
            else:
                query.add_column(
                    qm.Column(
                        table_alias=query.from_table.alias,
                        table_column="activity_repeated_at",
                        name_alias="join_next_ts",
                        column_type="timestamp",
                    )
                )

    def create_time_cohort_query(self, time_option, column_label, needs, resolution_filter=None):
        qm = self.qm

        # just to make the code below nicer
        if time_option == "today":
            time_option = "this_day"
        elif time_option == "yesterday":
            time_option = "last_day"

        # create the new table
        if time_option.split("_")[0] in ("this", "last"):
            # choose the right time solution
            if time_option.startswith("last"):
                raw_string = "date_add('{resolution}', -1, date_trunc('{resolution}', local_now()))".format(
                    resolution=time_option.split("_")[-1]
                )
                time_column = self._parse_obj(ast.parse(raw_string).body[0].value, make_column=True)

            elif time_option.startswith("this"):
                raw_string = "date_trunc('{resolution}', local_now())".format(resolution=time_option.split("_")[-1])
                time_column = self._parse_obj(ast.parse(raw_string).body[0].value, make_column=True)
            from_table = None

        else:
            time_column = qm.Column(table_column=time_option)
            from_table = qm.Table(query=self.__create_time_query(time_option, resolution_filter=resolution_filter))

        time_query = qm.Query()

        if from_table:
            time_query.set_from(from_table)

        hour_diff = int(utils.date_diff(utils.localnow(self.company.timezone), utils.utcnow(), "hour"))
        for col_name in ("join_cohort_id", "join_ts", column_label):
            if col_name == "join_ts":
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
                            column_type="timestamp",
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
                        column_type="timestamp",
                        name_alias=col_name,
                    )
                )

        if from_table and "join_cohort_next_ts" in needs:
            if time_option.startswith("end_of"):
                res = self._fix_resolution(time_option.split("_")[-1])
            else:
                res = time_option

            col_name = "join_cohort_next_ts"
            col = qm.Column(
                function="date_add" if res in RESOLUTIONS[-4:] else "time_add",
                fields=dict(
                    datepart=res,
                    number=1,
                    column=qm.Column(table_column=time_option),
                ),
                name_alias=col_name,
                column_type="timestamp",
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
            if "join_cohort_next_ts" in needs:
                time_query.add_column(
                    qm.Column(
                        name_alias="join_cohort_next_ts",
                        casting="timestamp",
                        column_type="timestamp",
                    )
                )

        return time_query

    def create_cohort_query(self, activity_objects, has_source, kinds):
        """
        create the cohort queries
        """

        qm = self.qm

        if len(activity_objects) > 1:
            # add the needed column for the first activity
            needs = []
            if "in_between" in kinds or "relative_ever" in kinds:
                needs.append("join_cohort_id")

            if "after_before_next" in [a["slug"] for a in activity_objects[0]["referencing_relationships"]]:
                needs.append("join_next_ts")

            # create the initial query
            initial_query = self.create_activity_cohort_query(activity_objects[0], has_source, needs=needs)

            # if there are more joins then make the query
            cohort_query = qm.Query()
            cohort_query.set_from(qm.Table(query=initial_query, alias=activity_objects[0]["id"]))
            cohort_query.add_column(qm.Column(all_columns=True, table_alias=activity_objects[0]["id"]))

            # TODO: DEPRECATE
            for activity_obj in activity_objects[1:]:
                # added needs for activity object
                needs = []
                if "after_before_next" in [a["slug"] for a in activity_obj.get("referencing_relationships") or []]:
                    needs.append("join_next_ts")

                # create a query
                next_cohort_query = self.create_activity_cohort_query(activity_obj, has_source, needs=needs)

                # Add the new cohort
                current_table = qm.Table(query=next_cohort_query, alias=activity_obj["id"])

                # add the join to the cohort
                cohort_query.add_join(
                    qm.Join(
                        table=current_table,
                        kind="INNER" if activity_obj["did"] else "LEFT",
                        condition=self._create_cohort_relationship(
                            cohort_query, current_table, activity_obj["relationships"]
                        ),
                    )
                )

                # handle the did not
                if not activity_obj["did"]:
                    cohort_query.add_filter(
                        qm.Condition(
                            operator="is_null",
                            left=qm.Column(
                                table_alias=current_table.alias,
                                table_column="join_customer",
                                column_type="string",
                            ),
                        ),
                        "AND",
                    )

                # add all the non join columns
                for c in activity_obj["columns"]:
                    cohort_query.add_column(
                        qm.Column(
                            table_column=self.column_mapper[c["id"]],
                            table_alias=activity_obj["id"],
                            column_type=c["type"],
                        )
                    )

            # support different needs based on the type
            recompute_next_ts = False
            if "in_between" in kinds:
                needs = ["join_cohort_next_ts", "join_cohort_id"]
                recompute_next_ts = True
            elif any(a in kinds for a in ("before", "after", "relative_ever")):
                needs = ["join_cohort_id"]
            else:
                needs = []

            # if you have a within cohort then only compute stuff for the "all"s
            if any(needs):
                self.__add_cohort_join_columns(
                    cohort_query,
                    has_source,
                    needs=needs,
                    recompute_next_ts=recompute_next_ts,
                    is_unique=not any([a for a in activity_objects if a["occurrence"] == "all"]),
                )

        else:
            # decide on what it needs and what to recompute
            if "in_between" in kinds:
                needs = ["join_ts", "join_cohort_id", "join_cohort_next_ts"]
            elif any(a in kinds for a in ("before", "after", "relative_ever")):
                needs = ["join_ts", "join_cohort_id"]
            else:
                needs = []

            # allow time occurrence
            if activity_objects[0]["occurrence"] == "time":
                self.is_time = True
                # NOTE: For time query the activity id is the time resolution
                cohort_query = self.create_time_cohort_query(
                    activity_objects[0]["activity_ids"][0],
                    activity_objects[0]["columns"][0]["label"],
                    needs,
                    resolution_filter=activity_objects[0].get("resolution_filter"),
                )
            else:
                cohort_query = self.create_activity_cohort_query(activity_objects[0], has_source, needs=needs)

        # add all the column filters
        column_filters = []
        for a in activity_objects:
            column_filters.extend([c for c in a["columns"] if any(c["filters"])])

        # add the column filters
        if len(column_filters) > 0:
            wrapper_query = qm.Query()
            wrapper_query.add_column(qm.Column(all_columns=True))
            wrapper_query.set_from(qm.Table(alias="c", query=cohort_query))

            cohort_filt = qm.Filter()
            for c in column_filters:
                cohort_filt.add_filter(
                    self.__create_filter(
                        [f for f in c["filters"] if not f.get("apply_at_end")],
                        qm.Column(
                            table_column=self.column_mapper[c["id"]],
                            table_alias="c",
                            column_type=c["type"],
                        ),
                    ),
                    "AND",
                )

            # add the filter if it is not empty
            if len(cohort_filt.filters) > 0:
                wrapper_query.set_where(cohort_filt)

            return wrapper_query
        else:
            return cohort_query

    def _create_cohort_relationship(self, cohort_query, join_table, relationships):
        """
        creates the relationship between the cohort query and the join table
            - IF the relationship needs a join ts or an activity repeated at then this will handle the computation
        """

        qm = self.qm

        cond = qm.Filter(
            filters=[
                qm.Condition(
                    operator="equal",
                    left=qm.Column(
                        table_alias=cohort_query.from_table.alias,
                        table_column="join_customer",
                    ),
                    right=qm.Column(table_alias=join_table.alias, table_column="join_customer"),
                )
            ]
        )
        is_before = any(r["slug"] == "before" for r in relationships)
        # added all the relationships
        for r in relationships:
            if r["slug"] in ("after", "before", "after_before_next"):
                cond.add_filter(
                    qm.Condition(
                        operator=("greater_than" if r["slug"] == "before" else "less_than"),
                        left=qm.Column(
                            table_alias=r.get("referencing_id") or r.get("referencing"),
                            table_column="join_ts",
                        ),
                        right=qm.Column(table_alias=join_table.alias, table_column="join_ts"),
                    ),
                    "AND",
                )

            # handle the dynamic moments
            elif r["slug"] == "within_time":
                cond.add_filter(
                    self._create_within_time_filter(r, is_before=is_before, use_join_table=join_table),
                    "AND",
                )

            # handle the dynamic moments
            elif r["slug"] == "at_least_time":
                temp_cond = self._create_within_time_filter(r, is_before=is_before, use_join_table=join_table)
                temp_cond.operator = "greater_than_equal"
                temp_cond.right.value += 1

            # handle the dynamic moments
            if r["slug"] == "after_before_next":
                cond.add_filter(
                    qm.Condition(
                        operator="less_than_equal",
                        left=qm.Column(table_alias=join_table.alias, table_column="join_ts"),
                        right=qm.Column(
                            function="nvl",
                            fields=dict(
                                first_column=qm.Column(
                                    table_alias=r.get("referencing_id") or r.get("referencing"),
                                    table_column="join_next_ts",
                                ),
                                second_column=qm.Column(value="2100-01-01", casting="timestamp"),
                            ),
                        ),
                    ),
                    "AND",
                )

            # handle the key join columns
            if r["slug"] == "column":
                cond.add_filter(
                    qm.Condition(
                        operator="equal",
                        left=qm.Column(
                            table_alias=join_table.alias,
                            table_column="join_" + r["column_name"],
                        ),
                        right=qm.Column(
                            table_alias=r.get("referencing_id") or r.get("referencing"),
                            table_column="join_" + r["column_name"],
                        ),
                    ),
                    "AND",
                )

        return cond

    def create_activity_cohort_query(self, activity_obj, has_source=False, needs=None):
        """
        add the activity cohort
        """

        qm = self.qm

        # make sure you have an activity stream
        if activity_obj["config"]["activity_stream"] is None:
            raise (
                SilenceError(
                    "Cannot create activity object because the stream is NULL: activity= {}".format(
                        activity_obj["slug"]
                    )
                )
            )

        activity_query = qm.Query()
        # add the from table
        activity_query.set_from(
            qm.Table(
                cte="cohort_stream",
                alias="s",
            )
        )

        activity_filt = self.__create_activity_filter(
            activity_obj,
            "s",
            ignore_occurrence=activity_obj["recompute_occurrence"],
        )
        # Activity filts can be empty
        if activity_filt:
            activity_query.set_where(activity_filt)

        # add the relationship columns
        for r in activity_obj["relationships"]:
            if r["slug"] == "column":
                activity_query.add_column(
                    qm.Column(
                        table_alias="s",
                        table_column=r["column_name"],
                        name_alias="join_" + r["column_name"],
                    )
                )

        for r in activity_obj["referencing_relationships"]:
            if r["slug"] == "column":
                activity_query.add_column(
                    qm.Column(
                        table_alias="s",
                        table_column=r["column_name"],
                        name_alias="join_" + r["column_name"],
                    )
                )

        # add the enrichment table if the filter was there
        for f in activity_obj["filters"]:
            # handle add the filter in the pre-filter
            if f.get("activity_column") and f["activity_column"]["source_details"].get("enrichment_table"):
                c = f["activity_column"]
                self.__add_enrichment_table(
                    activity_query,
                    c["source_details"]["enrichment_table"],
                    activity_obj,
                    enrichment_column=c["source_details"].get("enrichment_table_column"),
                    slowly_changing_ts_column=c["source_details"].get("slowly_changing_ts_column"),
                )

            elif f.get("enrichment_table"):
                self.__add_enrichment_table(
                    activity_query,
                    f["enrichment_table"],
                    activity_obj,
                    enrichment_column=f.get("enrichment_table_column"),
                    slowly_changing_ts_column=f.get("slowly_changing_ts_column"),
                )

            elif "-" in (f.get("activity_column_name") or ""):
                self.__add_customer_table(activity_query, f["activity_column_name"].split("-")[0])

        # add the columns
        for c in activity_obj["columns"]:
            if c["name"] == "join_customer":
                # add the column and rename it to be the right name
                temp_col = self.__get_customer_column(has_source)
                temp_col.set_name_alias(self.column_mapper[c["id"]])
                activity_query.add_column(temp_col)

            elif c["name"] == "activity_occurrence" and activity_obj["recompute_occurrence"]:
                # add it
                activity_query.add_column(
                    qm.Column(
                        function="row_number_w_group",
                        fields=dict(
                            group=[self.__get_customer_column(has_source, activity_query.from_table.alias)],
                            order=qm.Column(
                                table_column="ts",
                                table_alias=activity_query.from_table.alias,
                                column_type="timestamp",
                            ),
                        ),
                        name_alias=self.column_mapper[c["id"]],
                    )
                )
            else:
                # added enrichment as needed
                if c["source_details"].get("enrichment_table"):
                    alias = self.__add_enrichment_table(
                        activity_query,
                        c["source_details"]["enrichment_table"],
                        activity_obj,
                        enrichment_column=c["source_details"].get("enrichment_table_column"),
                        slowly_changing_ts_column=c["source_details"].get("slowly_changing_ts_column"),
                    )
                else:
                    alias = "s"

                # add the alias
                cohort_column = self.__create_raw_column(c, alias)
                # wrap the column to properly do the casting
                if cohort_column.casting:
                    if activity_query.where:
                        cohort_column = qm.Column(
                            case=dict(cases=[dict(when=activity_query.where, then=cohort_column)]),
                            name_alias=cohort_column.name_alias,
                        )
                activity_query.add_column(cohort_column)

        # add the wrapper columns
        if activity_obj["recompute_occurrence"] and activity_obj["occurrence"] != "all":
            wrapper_query = qm.Query()
            wrapper_query.add_column(qm.Column(all_columns=True))
            wrapper_query.set_from(qm.Table(query=activity_query, alias="s"))

            # add the activity occurrence as a column
            if activity_obj["occurrence"] == "last":
                self.__add_cohort_join_columns(
                    activity_query,
                    has_source=has_source and activity_obj["config"]["has_source"],
                    recompute_next_ts=True,
                    needs=["join_cohort_next_ts"],
                )
                wrapper_query.set_where(
                    self.__create_occurrence_filter(activity_obj, "s", rename_column="join_cohort_next_ts")
                )
            else:
                self.__add_cohort_join_columns(
                    activity_query,
                    has_source=has_source and activity_obj["config"]["has_source"],
                    needs=["join_activity_occurrence"],
                )
                wrapper_query.set_where(
                    self.__create_occurrence_filter(activity_obj, "s", rename_column="join_activity_occurrence")
                )

            activity_query = wrapper_query

        # add the cohort columns
        self.__add_cohort_join_columns(
            activity_query,
            has_source=has_source and activity_obj["config"]["has_source"],
            needs=needs or [],
            recompute_next_ts=activity_obj["recompute_occurrence"],
            is_unique=not activity_obj["occurrence"] == "all",
        )

        return activity_query

    ###########################################################
    ####### ATTRIBUTION AND CONVERSION  ########################
    ###########################################################

    def __add_agg(self, col, activity_obj, case_column=None, is_wrapper=False):
        qm = self.qm

        if case_column is None:
            case_column = qm.Column(table_column=self.column_mapper[col["id"]], column_type=col["type"])

        base_column = qm.Column(
            table_alias="s",
            # Use the ts of the activity not just a regular ts in case there are multiple activities
            table_column=next(
                (self.column_mapper[c["id"]] for c in activity_obj["columns"] if c["name"] == "ts" and is_wrapper),
                "ts",
            ),
        )

        simple_type = utils.get_simple_type(col["type"])
        # support new types
        if simple_type in ("number", "timestamp") or activity_obj["occurrence"] == "metric":
            if activity_obj["occurrence"] == "first":
                simple_func = "min"
            elif activity_obj["occurrence"] == "last":
                simple_func = "max"
            elif activity_obj["occurrence"] == "custom":
                simple_func = "min"
            elif activity_obj["occurrence"] == "metric":
                # this is just in case we want to add sum or average for occurrence later for numbers
                simple_func = col["source_details"].get("applied_function") or activity_obj[
                    "occurrence_value"
                ].lower().replace(" ", "_")
            else:
                raise DatasetCompileError("occurrence value was incorrect : {}".format(activity_obj["occurrence"]))

            # create the extra column
            return_column = qm.Column(
                name_alias=self.column_mapper[col["id"]],
                function=simple_func,
                fields=dict(
                    column=case_column,
                    percentile=activity_obj.get("percentile"),
                    base_column=base_column,
                ),
            )

        # don't bother doing the concat if it is just a simple occurrence filter
        elif not activity_obj["recompute_occurrence"]:
            return_column = qm.Column(
                name_alias=self.column_mapper[col["id"]],
                function="min" if activity_obj["occurrence"] == "first" else "max",
                fields=dict(
                    column=case_column,
                ),
            )
        else:
            # make sure the first value is set as a string
            # this important cause features can be booleans or int
            if case_column.kind == "case":
                for each_case in case_column.case["cases"]:
                    each_case["then"].set_casting("string")

                # add the column
                return_column = qm.Column(
                    name_alias=self.column_mapper[col["id"]],
                    casting=col["type"] if simple_type not in ("string",) else None,
                    function=("first_value_case" if activity_obj["occurrence"] == "first" else "last_value_case"),
                    fields=dict(
                        case=case_column.case["cases"][0]["when"],
                        column=case_column.case["cases"][0]["then"],
                        base_column=base_column,
                    ),
                    comment="this is a clever pivot on for groups",
                )

            else:
                # cast the column as a string
                case_column.set_casting("string")

                # process the column
                return_column = qm.Column(
                    name_alias=self.column_mapper[col["id"]],
                    casting=col["type"] if simple_type not in ("string",) else None,
                    function=("first_value" if activity_obj["occurrence"] == "first" else "last_value"),
                    fields=dict(column=case_column, base_column=base_column),
                )
        return return_column

    # creates the case column
    def _create_case_column_filter(self, activity_obj, col_type="string", kind=None):
        qm = self.qm

        # create the column with the filter
        col_filt = self.__create_activity_filter(
            activity_obj,
            "s",
            ignore_occurrence=activity_obj["recompute_occurrence"],
            ignore_filters=False,
            add_activity=True,
        )

        additional_filters = []
        if activity_obj["recompute_occurrence"]:
            additional_filters.extend(col_filt.filters[2:])
        else:
            additional_filters.extend(col_filt.filters[4:])

        # remove the and and ors
        additional_filters = [a for a in additional_filters if a != "AND"]

        # add within_minutes
        is_before = any(r["slug"] == "before" for r in activity_obj["relationships"])
        for r in activity_obj["relationships"]:
            # support a sub join via case statement for within minutes
            if r["slug"] == "within_time":
                temp_filt = self._create_within_time_filter(r, is_before=is_before)
                col_filt.add_filter(
                    temp_filt,
                    "AND",
                )

                additional_filters.append(temp_filt)

            # support a sub join via case statement for a normal foreign key join
            elif r["slug"] == "cohort_column":
                temp_filt = self._create_cohort_column_filter(r)
                col_filt.add_filter(temp_filt)
                additional_filters.append(temp_filt)

            # Support within time reference
            elif r["slug"] == "at_least_time":
                col_filt.add_filter(
                    qm.Condition(
                        operator="greater_than_equal",
                        left=qm.Column(
                            function="abs",
                            fields=dict(
                                column=qm.Column(
                                    function=self._get_time_func("date_diff", r["relationship_time"]),
                                    fields=dict(
                                        datepart=self._fix_boundary(r["relationship_time"]),
                                        from_column=qm.Column(table_alias="c", table_column="join_ts"),
                                        to_column=qm.Column(table_alias="s", table_column="ts"),
                                    ),
                                )
                            ),
                        ),
                        right=qm.Column(value=int(r["relationship_time_value"])),
                    ),
                    "AND",
                )
                additional_filters.append(col_filt.filters[-1])

        # create the row numbers
        if (
            activity_obj["recompute_occurrence"]
            and activity_obj["occurrence"] != "metric"
            and (activity_obj["occurrence"] == "custom" or utils.get_simple_type(col_type) == "number")
        ):
            group = [
                qm.Column(table_alias="s", table_column="activity"),
                self.__get_customer_column(activity_obj["config"]["has_source"]),
            ]

            # add the additional column for the subset
            if kind in ("in_between", "before", "after", "relative_ever"):
                group.append(qm.Column(table_alias="c", table_column="join_cohort_id"))

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
                    operator="equal",
                    left=qm.Column(
                        function="row_number_w_group",
                        fields=dict(
                            group=group,
                            order=[
                                qm.Column(table_alias="s", table_column="ts").to_query()
                                + (" asc" if activity_obj["occurrence"] != "last" else " desc")
                            ],
                        ),
                    ),
                    right=qm.Column(
                        value=(
                            int(activity_obj.get("occurrence_number") or activity_obj.get("occurrence_value"))
                            if activity_obj["occurrence"] not in ("first", "last")
                            else 1
                        ),
                        column_type="integer",
                    ),
                ),
                "AND",
            )

        return col_filt

    def __create_case_column(self, col, activity_obj, only_case=False, kind=None):
        """
        Creates a case column based on the case column
        """

        qm = self.qm

        if col["source_kind"] == "activity":
            if col["name"] == "join_customer":
                then_col = self.__get_customer_column(activity_obj["config"]["has_source"], "s")
            else:
                then_col = self.__create_raw_column(col, "s")

        if col["source_details"].get("enrichment_table"):
            if col["source_details"].get("slowly_changing_ts_column"):
                alias = _scd_table_name(
                    col["source_details"]["enrichment_table"]["table"],
                    activity_obj["slug"],
                )
            else:
                alias = self._expand_table(col["source_details"]["enrichment_table"])[1]

            then_col = self.__create_raw_column(col, alias)

        elif col["source_kind"] == "computed":
            then_col = self.raw_string_to_col(col["source_details"])

        # crea the column filters
        col_filt = self._create_case_column_filter(activity_obj, col_type=col.get("mavis_type"), kind=kind)

        # added the att column
        case_column = qm.Column(case=dict(cases=[dict(when=col_filt, then=then_col)]))

        if only_case:
            case_column.set_name_alias(self.column_mapper[col["id"]])
            return case_column
        else:
            return self.__add_agg(col, activity_obj, case_column)

    def create_dim_query_wrapper(self, desired_conv):
        """Creates a wrapper around the relationship query for dimensions and feature json for efficiency

        Args:
            desired_conv (dict): the objects in this relationship query

        Returns:
            dim_query: A query that can be used

        NOTE: This also manipulates the desired_conv object (columns will be added and removed as they are added to the dim query)
        """
        qm = self.qm
        dim_query = qm.Query()
        for att_ii, aq in enumerate(desired_conv):
            # Don't bother with the metric
            if aq["occurrence"] == "metric":
                continue

            removed_iis = []
            # added_json = False
            for ii, col in enumerate(aq["columns"]):
                if col["source_details"].get("enrichment_table"):
                    (
                        alias,
                        join_col,
                        activity_column,
                    ) = self.__add_enrichment_table_in_dim(
                        dim_query,
                        col["source_details"].get("enrichment_table"),
                        aq,
                        enrichment_column=col["source_details"].get("enrichment_table_column"),
                        slowly_changing_ts_column=col["source_details"].get("slowly_changing_ts_column"),
                        key_idx=att_ii,
                    )

                    # add the column to the dim query
                    dim_query.add_column(self.__create_raw_column(col, alias))

                    if join_col:
                        id = f"{alias}_{join_col}"
                        self.column_mapper[id] = join_col.table_column
                        # add the join column
                        aq["columns"].append(
                            dict(
                                id=id,
                                name=activity_column,
                                type=join_col.column_type,
                                mavis_type=join_col.column_type,
                                source_kind="activity",
                                source_details=dict(),
                            )
                        )

                    removed_iis.append(ii)

                # elif (
                #     # BUG: Cannot figure out how to get first not null value from query
                #     # BUG 2: If your feature json has an enrichment this doesn't work
                #     # UPDATE: Redshift allows you to do MAX() but it returns NULL
                #     col["source_kind"] == "activity"
                #     and col["name"] != "feature_json"
                #     and col["name"].startswith("feature_")
                # ):
                #     id = f"join_a{att_ii}_feature_json"

                #     # create the column based on the feature_json
                #     qm_col = self.__create_raw_column(col, "s")

                #     # we need to replace the feature json with the new name
                #     qm_col.json_column = id

                #     dim_query.add_column(qm_col)
                #     removed_iis.append(ii)

                #     if not added_json:
                #         # add the JSON column with new name
                #         aq["columns"].append(
                #             dict(
                #                 id=id,
                #                 name="feature_json",
                #                 type="number",
                #                 mavis_type="number",
                #                 source_kind="activity",
                #                 source_details=dict(),
                #             )
                #         )
                #         self.column_mapper[id] = id
                #         added_json = True
                else:
                    continue

            # remove the columns
            aq["columns"] = [c for ii, c in enumerate(aq["columns"]) if ii not in removed_iis]

        return dim_query

    def create_relationship_query(self, att_conv_objs, has_source, kind, has_next_ts=True, is_time=False):
        """
        Creates the relationship query,
        kind = 'before', 'ever', 'relative_ever', 'in_between', "after"
        """

        qm = self.qm

        # if you have a number column or custom occurrence then you need to create the wrapper
        create_wrapper = any(
            a
            for a in att_conv_objs
            if a["occurrence"] == "custom"
            or (
                a["occurrence"] != "metric"
                and any([c for c in a["columns"] if utils.get_simple_type(c["type"]) == "number"])
            )
            or any(r for r in a["relationships"] if r["slug"] == "relative_to")
        ) or (kind == "in_between" and len(att_conv_objs) > 0)

        # start the query
        query = qm.Query()
        query.add_comment(
            [
                "for attribution and conversion we use a SQL pivot to get unique rows per cohort",
                "SQL pivots are also much faster than doing several joins",
            ]
        )

        # use the cohort column if the cohort column will be there
        query.add_column(
            self.__get_customer_column(has_source and any([a for a in att_conv_objs if a["config"]["has_source"]]))
        )

        # add the cohort id column that we will use for the join
        if kind in ("in_between", "before", "after", "relative_ever"):
            query.add_column(
                qm.Column(
                    table_alias="c",
                    table_column="join_cohort_id",
                    column_type="string",
                    comment="this is used as a session id",
                )
            )

            join_cond = qm.Filter()

            if not is_time:
                join_cond.add_filter(
                    qm.Condition(
                        operator="equal",
                        left=query.columns[0],
                        right=qm.Column(
                            table_alias="c",
                            table_column="join_customer",
                            column_type="string",
                        ),
                    )
                )

            # if everything has a within filter then add it
            use_time_filter = self._can_use_within_minutes_filters(att_conv_objs)
            if use_time_filter:
                join_cond.add_filter(self._create_within_time_filter(use_time_filter, is_before=kind == "before"))

            # if everything has a within filter then add it
            use_column_filter = self._can_use_column_filters(att_conv_objs)
            if use_column_filter:
                join_cond.add_filter(use_column_filter)

            # do the proper time filter
            if kind in ("in_between", "before", "after"):
                join_cond.add_filter(
                    qm.Condition(
                        operator="less_than" if kind == "before" else "greater_than",
                        left=qm.Column(table_alias="s", table_column="ts", column_type="timestamp"),
                        right=qm.Column(
                            table_alias="c",
                            table_column="join_ts",
                            column_type="timestamp",
                        ),
                    ),
                    "AND",
                )

            if kind == "in_between" and has_next_ts:
                join_cond.add_filter(
                    qm.Condition(
                        operator="less_than_equal",
                        left=qm.Column(table_alias="s", table_column="ts"),
                        right=qm.Column(
                            function="nvl",
                            fields=dict(
                                first_column=qm.Column(table_alias="c", table_column="join_cohort_next_ts"),
                                second_column=qm.Column(value="2100-01-01", casting="timestamp"),
                            ),
                        ),
                    ),
                    "AND",
                )

        if kind in ("in_between", "before", "after", "relative_ever"):
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
            query.add_column(qm.Column(table_column="ts", table_alias="s", column_type="timestamp"))
            wrapper_query.set_from(qm.Table(query=query, alias="s"))
            wrapper_query.add_group_by(1)

            if kind in ("in_between", "before", "after", "relative_ever"):
                wrapper_query.add_group_by(2)
        else:
            query.add_group_by(1)

            if kind in ("in_between", "before", "after", "relative_ever"):
                query.add_group_by(2)

        for att_conv_obj in att_conv_objs:
            # add the enrichment table if the filter was there
            for f in att_conv_obj["filters"]:
                if f.get("activity_column") and f["activity_column"]["source_details"].get("enrichment_table"):
                    self.__add_enrichment_table(
                        query,
                        f["activity_column"]["source_details"]["enrichment_table"],
                        att_conv_obj,
                        enrichment_column=f["activity_column"]["source_details"].get("enrichment_table_column"),
                    )

                # TODO: DEPRECATE
                elif f.get("enrichment_table"):
                    self.__add_enrichment_table(
                        query,
                        f.get("enrichment_table"),
                        att_conv_obj,
                        enrichment_column=f.get("enrichment_table_column"),
                        slowly_changing_ts_column=f.get("slowly_changing_ts_column"),
                    )

            # checks for relationships to see if they need to add enrichement
            for r in att_conv_obj["relationships"]:
                if r.get("cohort_column"):
                    if r["cohort_column"]["source_kind"] == "customer":
                        self.__add_customer_table(
                            query,
                            r["cohort_column"]["source_details"]["table"],
                            use_column="join_customer",
                        )

                    elif r["cohort_column"]["source_details"].get("enrichment_table"):
                        self.__add_enrichment_table(
                            query,
                            r["cohort_column"]["source_details"]["enrichment_table"],
                            att_conv_obj,
                            enrichment_column=r["cohort_column"]["source_details"].get("enrichment_table_column"),
                            slowly_changing_ts_column=r["cohort_column"]["source_details"].get(
                                "slowly_changing_ts_column"
                            ),
                        )

                else:
                    # TODO: Deprecate
                    if r.get("cohort_column_name") and "-" in r["cohort_column_name"]:
                        self.__add_customer_table(
                            query,
                            r["cohort_column_name"].split("-")[0],
                            use_column="join_customer",
                        )

                    if r.get("column_name_enrichment_table"):
                        self.__add_enrichment_table(
                            query,
                            r["column_name_enrichment_table"],
                            att_conv_obj,
                            enrichment_column=r.get("column_name_enrichment_table_column"),
                        )

            # add all the columns
            for col in att_conv_obj["columns"]:
                if col["name"] == "join_customer":
                    continue
                # check and add enrichment
                if col["source_details"].get("enrichment_table"):
                    self.__add_enrichment_table(
                        query,
                        col["source_details"].get("enrichment_table"),
                        att_conv_obj,
                        enrichment_column=col["source_details"].get("enrichment_table_column"),
                        slowly_changing_ts_column=col["source_details"].get("slowly_changing_ts_column"),
                    )

                # add the case column
                case_column = self.__create_case_column(col, att_conv_obj, only_case=create_wrapper, kind=kind)

                # if it has relative activity
                new_filt = []
                for r in att_conv_obj["relationships"]:
                    # add a relative filter
                    if r["slug"] == "relative_to":
                        activity_filter = qm.Condition(
                            operator="is_in",
                            left=qm.Column(
                                table_alias="s",
                                table_column="activity",
                                column_type="string",
                            ),
                            right=[qm.Column(value=s, column_type="string") for s in r["relative_to_activity_slug"]],
                        )

                        rel_cond = qm.Condition(
                            operator=("greater_than" if r["relation"] == "after" else "less_than"),
                            left=qm.Column(
                                table_column="ts",
                                table_alias="s",
                                column_type="timestamp",
                            ),
                            right=qm.Column(
                                function=("max_window" if r.get("relative_occurrence") == "last" else "min_window"),
                                fields=dict(
                                    column=qm.Column(
                                        case=dict(
                                            cases=[
                                                dict(
                                                    when=activity_filter,
                                                    then=qm.Column(
                                                        table_column="ts",
                                                        table_alias="s",
                                                        column_type="timestamp",
                                                    ),
                                                )
                                            ]
                                        )
                                    ),
                                    group=query.columns[
                                        : (
                                            2
                                            if kind
                                            in (
                                                "in_between",
                                                "before",
                                                "after",
                                                "relative_ever",
                                            )
                                            else 1
                                        )
                                    ],
                                ),
                            ),
                        )

                        # for or null then lets just put a big comment
                        if r.get("or_null", True):
                            rel_cond.right = qm.Column(
                                function="nvl",
                                fields=dict(
                                    first_column=rel_cond.right,
                                    second_column=qm.Column(
                                        value=("1900-01-01" if r["relation"] == "after" else "2100-01-01"),
                                        casting="timestamp",
                                    ),
                                ),
                            )

                        case_column.case["cases"][0]["when"].add_filter(rel_cond, "AND")

                        # add the new activity filter
                        # if not (
                        #     len(r["relative_to_activity_slug"]) == 1
                        #     and r["relative_to_activity_slug"][0]
                        #     in (a["slug"][0] for a in att_conv_objs)
                        # ):
                        #     query.where.add_filter(activity_filter, "OR")

                if len(new_filt) > 0:
                    # replace the case column with a wrapper
                    case_column = qm.Column(
                        case=dict(cases=[dict(when=qm.Filter(filters=new_filt), then=case_column)]),
                    )

                # update the label
                case_column.set_name_alias(self.column_mapper[col["id"]])

                # add the case column:
                if create_wrapper:
                    wrapper_query.add_column(self.__add_agg(col, att_conv_obj, is_wrapper=True))

                query.add_column(case_column)
            # activity_filt = self.__create_activity_filter(
            #     att_conv_obj,
            #     "s",
            #     ignore_occurrence=att_conv_obj["recompute_occurrence"],
            # )

            # # just create the filters
            # if activity_filt:
            #     query.add_filter(
            #         activity_filt,
            #         "OR",
            #     )

            # remove the filter if nothing is filtered
            if query.where and len(query.where.filters) == 0:
                query.where = None

        return wrapper_query if create_wrapper else query

    ###########################################################
    ############# CUSTOMER ATTRIBUTE ########################
    ###########################################################
    def add_customer_column(self, query, col, is_time=False):
        """
        Adds the customer columns and table
        """

        qm = self.qm

        (schema_name, table_name, join_key, join_key_type) = self._expand_table(
            col["source_details"]["table"], default_key="customer"
        )

        if table_name not in [t.table for t in query.get_all_tables()]:
            # add the join to the customer table (if it si time then cross join)
            if is_time:
                if len(query.joins) > 0:
                    query.add_join(
                        qm.Join(
                            table=qm.Table(
                                schema=schema_name,
                                table=table_name,
                                alias="ct",
                            ),
                            condition=qm.Condition(
                                operator="equal",
                                left=qm.Column(
                                    table_alias=query.joins[0].table.alias,
                                    table_column="join_customer",
                                    column_type=join_key_type,
                                ),
                                right=qm.Column(
                                    table_alias="ct",
                                    table_column=join_key,
                                    column_type=join_key_type,
                                ),
                            ),
                            kind="LEFT",
                        )
                    )
                else:
                    query.add_join(
                        qm.Join(
                            table=qm.Table(
                                schema=schema_name,
                                table=table_name,
                                alias="ct",
                            ),
                            kind="CROSS",
                        )
                    )

            else:
                query.add_join(
                    qm.Join(
                        table=qm.Table(
                            schema=schema_name,
                            table=table_name,
                            alias="ct",
                        ),
                        condition=qm.Condition(
                            operator="equal",
                            left=qm.Column(
                                table_alias="c",
                                table_column="join_customer",
                                column_type="string",
                            ),
                            right=qm.Column(
                                table_alias="ct",
                                table_column=join_key,
                                column_type="string",
                            ),
                        ),
                        kind="LEFT",
                    )
                )

        # add the column to the table
        query.add_column(
            qm.Column(
                table_alias="ct",
                table_column=col["name"],
                name_alias=col["label"] if col["label"] != col["name"] else None,
            )
        )

    ###########################################################
    ############# COMPUTED COLUMNS ########################
    ###########################################################
    def value_column(self, kind, value):
        qm = self.qm
        # deal with value
        if isinstance(value, list):
            return [self.value_column(kind, v) for v in value]

        # clean up the kind of the column
        simple_type = utils.get_simple_type(kind)

        # this handles the value field which is vague
        if kind == "column_id":
            return qm.Column(
                table_column=self.column_mapper[value],
                column_type=self.column_types[value],
            )
        elif value is not None and isinstance(value, bool):
            return qm.Column(value=value, column_type="boolean")

        elif kind != "string" and value != "None" and str(value).lower() in ("false", "true"):
            return qm.Column(value=value, column_type="string", casting="boolean")

        elif value is not None and isinstance(value, float):
            return qm.Column(value=value, column_type="number")
        # handle the nulls (I added the { to handle bad fields)
        elif (
            value and isinstance(value, str) and (value.lower() in ("null", "") or kind in ("null",) or "{" in value)
        ) or value is None:
            return qm.Column(value=None)
        elif simple_type == "number":
            return qm.Column(value=float(value) if value is not None else None, column_type="number")
        elif simple_type == "timestamp":
            if BLANK_TS in str(value) or BLANK_TS in utils.make_local(value, self.company.timezone) or len(value) == 10:
                return qm.Column(
                    value=value[:10],
                    casting="date",
                    column_type="date",
                )
            else:
                return qm.Column(
                    value=value,
                    casting="timestamp",
                    timezone=self.company.timezone,
                    column_type="timestamp",
                )
        elif simple_type in ("boolean",):
            return qm.Column(
                value=(str(value).lower() in ("true", "1") if not isinstance(value, bool) else value),
                column_type="boolean",
            )
        # elif simple_type == "string":
        else:
            return qm.Column(value=str(value), column_type="string")

    @staticmethod
    def _parse_with_ast(raw_string):
        try:
            return ast.parse(raw_string).body[0].value
        except Exception as e:
            if "positional argument" in utils.get_error_message(e) and "=" in raw_string:
                raise SilenceError("It looks like you are using `=` to compare values, please use `==` instead.")

            raise SilenceError(
                f"Could not parse syntax of the string: {utils.get_error_message(e).replace('(<unknown>, line 1)','')}"
            )

    @staticmethod
    def _value_to_raw_string(val, val_kind):
        if val_kind == "string":
            if isinstance(val, list):
                return str(val)
            else:
                return f"'{val}'"
        elif val_kind == "timestamp":
            return f"'{val}'.timestamp"
        elif val_kind == "boolean":
            return str(val.lower() == "true")
        else:
            return val

    def _parse_time_cond(self, filt, prefix="from"):
        key = f"{prefix}_value"
        if filt.get(f"{prefix}_type") == "absolute":
            return f' "{filt[key]}".timestamp'
        elif filt.get(f"{prefix}_type") == "relative":
            return f" date_add('{filt.get(key +'_resolution')}', {filt.get(key)}, now())"
        elif filt.get(f"{prefix}_type") == "colloquial":
            return f" date_trunc('{filt.get(key)}', now())"
        else:
            return None

    def _filter_to_raw_str(self, filters):
        rs = []
        for f in filters:
            column_id = f.get("column_id") or f["filter"].get("column_id")
            details = dict(
                column_id=column_id,
                operator=f.get("operator") or f["filter"].get("operator"),
            )
            if details["operator"] in ("is_null", "not_is_null"):
                filt = "{operator}({column_id})".format(**details)
            elif details["operator"] == "time_range":
                filt = []
                if from_cond := self._parse_time_cond(f["filter"], prefix="from"):
                    filt.append(f"{column_id} >= " + from_cond)

                if to_cond := self._parse_time_cond(f["filter"], prefix="to"):
                    filt.append(f"{column_id} < " + to_cond)

                filt = " and ".join(filt)

            else:
                val = f.get("value") or f["filter"].get("value")
                if isinstance(val, str) and self.column_mapper.get(val):
                    details["value"] = val
                else:
                    details["value"] = self._value_to_raw_string(val, self.column_types[details["column_id"]])
                filt = "{operator}({column_id}, {value})".format(**details)

            if f.get("or_null"):
                rs.append("({filt} or is_null({column_id})".format(column_id=details["column_id"], filt=filt))
            else:
                rs.append(filt)

            rs.append(" and ")

        return "".join(rs[:-1])

    def raw_string_to_col(self, source_details):
        qm = self.qm

        # if there is a raw string then user it
        if source_details.get("raw_string"):
            raw_string = str(source_details.get("raw_string")).replace("\n", "").replace("\t", "")
            parsed_string = self._parse_with_ast(raw_string)

            col = self._parse_obj(parsed_string, make_column=True)

            if col.function == "date_trunc":
                col = self._offset_column(col)

        # deal with ifttt independently
        elif source_details["kind"] == "ifttt":
            column_cases = []

            # create all the cases
            for case in source_details["cases"]:
                col_filt = qm.Filter()
                for f in case["filters"]:
                    col_filt.add_filter(
                        self.__create_filter(
                            f["filter"],
                            qm.Column(
                                table_column=self.column_mapper[f["column_id"]],
                                column_type=self.column_types[f["column_id"]],
                            ),
                        ),
                        "AND",
                    )

                then_col = self.value_column(case["value_kind"], case["value"])
                if (
                    case["value_kind"] != "column_id"
                    and then_col.column_type
                    and not utils.same_types(then_col.get_type(), case["value_kind"])
                ):
                    then_col.set_casting(utils.get_simple_type(case["value_kind"]))
                column_cases.append(
                    dict(
                        when=col_filt,
                        then=then_col,
                    )
                )

            else_col = self.value_column(source_details["value_kind"], source_details["value"])

            if (
                source_details["value_kind"] != "column_id"
                and else_col.column_type
                and not utils.same_types(else_col.get_type(), source_details["value_kind"])
            ):
                else_col.set_casting(utils.get_simple_type(source_details["value_kind"]))

            col = qm.Column(case=dict(cases=column_cases, else_value=else_col))
        elif source_details["kind"] == "bin":
            # create the binned column
            binned_column = qm.Column(
                table_column=self.column_mapper[source_details["column_id"]],
                column_type=self.column_types[source_details["column_id"]],
            )

            column_cases = []
            # create all the cases
            for each_bin in source_details["bins"]:
                column_cases.append(
                    dict(
                        when=qm.Filter(
                            filters=[
                                qm.Condition(
                                    operator="greater_than_equal",
                                    left=binned_column,
                                    right=qm.Column(value=each_bin["from_value"]),
                                ),
                                "AND",
                                qm.Condition(
                                    operator="less_than",
                                    left=binned_column,
                                    right=qm.Column(value=each_bin["to_value"]),
                                ),
                            ]
                        ),
                        then=qm.Column(value=each_bin["name"]),
                    )
                )

            # create the dataset object
            col = qm.Column(
                case=dict(
                    cases=column_cases,
                    else_value=qm.Column(value=source_details["else_name"]),
                )
            )

        # otherwise try to deal with it
        else:
            raw_string = self._get_computed_raw_string(source_details)

            if raw_string:
                raw_string = raw_string.replace("{", "").replace("}", "").strip()
                parsed_string = self._parse_with_ast(raw_string)
                col = self._parse_obj(parsed_string, make_column=True)
                if col.function == "date_trunc":
                    col = self._offset_column(col)
            else:
                col = qm.Column(value=None)
        return col

    # ADD COMPUTED COLUMNS
    def _parse_obj(self, obj, make_column=False):
        """"""
        qm = self.qm
        if isinstance(obj, ast.Name):
            if obj.id.lower() == "null":
                return qm.Column()

            # HACK: the spend check is because we used to use `_spend..`  in old old spend columns
            elif obj.id.lower().startswith("_") and not obj.id.lower().startswith("_spend"):
                timeline_date = self.get_timeline_date(obj.id[1:])
                return qm.Column(value=timeline_date, column_type="string", casting="timestamp")
            elif isinstance(obj, ast.Attribute):
                if not self.column_mapper.get(obj.value.id):
                    raise SilenceError(
                        f"One of the columns referenced ({obj.value.id}) was incorrect. Please delete the column and add it again using the auto complete"
                    )

                if obj.attr in ("asc", "desc"):
                    return qm.Order(
                        column=qm.Column(
                            table_column=self.column_mapper[obj.value.id],
                            column_type=self.column_types[obj.value.id],
                        ),
                        asc=obj.attr == "asc",
                    )
                elif obj.attr in qm.config["cast_mapping"].keys():
                    return qm.Column(
                        table_column=self.column_mapper[obj.value.id],
                        column_type=self.column_types[obj.value.id],
                        casting=obj.attr,
                    )
                else:
                    raise DatasetCompileError("invalid way of ordering")
            else:
                if not self.column_mapper.get(obj.id):
                    raise SilenceError(
                        f"One of the columns referenced ({obj.id}) was incorrect. Please delete the column and add it again using the auto complete"
                    )

                return qm.Column(
                    table_column=self.column_mapper[obj.id],
                    column_type=self.column_types[obj.id],
                )

        # deal with attribute
        elif isinstance(obj, ast.Attribute):
            if not self.column_mapper.get(obj.value.id):
                raise SilenceError(
                    f"One of the columns referenced ({obj.value.id}) was incorrect. Please delete the column and add it again using the auto complete"
                )

            if obj.attr in ("asc", "desc"):
                return qm.Order(
                    column=qm.Column(
                        table_column=self.column_mapper[obj.value.id],
                        column_type=self.column_types[obj.value.id],
                    ),
                    asc=obj.attr == "asc",
                )
            elif obj.attr in qm.config["cast_mapping"].keys():
                return qm.Column(
                    table_column=self.column_mapper[obj.value.id],
                    column_type=self.column_types[obj.value.id],
                    casting=obj.attr,
                )
            elif obj.attr in ("local"):
                return qm.Column(
                    table_column=self.column_mapper[obj.value.id],
                    column_type=self.column_types[obj.value.id],
                    timezone=self.company.timezone,
                )
            else:
                raise SilenceError(
                    "The . operator was used and we only support: .asc, .desc, .local .string, .number, .boolean, .timestamp"
                )

        elif isinstance(obj, ast.Str):
            if obj.s.lower() == "null":
                return qm.Column(column_type="string")
            else:
                return qm.Column(value=obj.s, column_type="string") if make_column else obj.s

        elif isinstance(obj, ast.Constant | ast.Num):
            return qm.Column(value=obj.n, column_type="number") if make_column else obj.n

        elif isinstance(obj, ast.UnaryOp):
            try:
                return qm.Column(
                    components=[
                        qm.Column(value=-1),
                        "*",
                        self._parse_obj(obj.operand, True),
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
            return qm.Column(
                components=[
                    self._parse_obj(obj.left, True),
                    op,
                    self._parse_obj(obj.right, True),
                ]
            )

        elif isinstance(obj, ast.List | ast.Tuple):
            return [self._parse_obj(a, make_column=make_column) for a in obj.elts]

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
                op = "equal"
            elif isinstance(obj.ops[0], ast.In):
                op = "is_in"
            else:
                raise DatasetCompileError(f"Non Supported operator for condition :{str(obj.ops[0])}")
            cond = qm.Condition(
                operator=op,
                left=self._parse_obj(obj.left, make_column=True),
                right=self._parse_obj(obj.comparators[0], make_column=True),
            )
            return qm.Column(condition=cond) if make_column else cond

        elif isinstance(obj, ast.BoolOp):  # this is a filter
            temp_f = qm.Filter()

            if isinstance(obj.op, ast.And | ast.Or):
                for val in obj.values:
                    temp_f.add_filter(
                        self._parse_obj(val, make_column=False),
                        "AND" if isinstance(obj.op, ast.And) else "OR",
                    )

                return qm.Column(condition=temp_f) if make_column else temp_f
            else:
                raise DatasetCompileError("we only support and/or combinations")

        elif isinstance(obj, ast.Call):
            if obj.func.id.startswith("_"):
                # if you see a custom function then replace it with the proper functions
                custom_func = self.get_custom_function(obj.func.id[1:])

                new_raw_string = custom_func.text_to_replace
                for ii, t_arg in enumerate(obj.args):
                    new_raw_string = new_raw_string.replace("$%i" % (ii + 1), ast.unparse(t_arg))

                return self._parse_obj(ast.parse(new_raw_string).body[0].value, make_column=True)

            if obj.func.id == "is_time_to_date":
                # date_add('week', -1, date_trunc('week', now()))
                resolution = self._fix_resolution(self._parse_obj(obj.args[1]))
                ts_col = self._parse_obj(obj.args[0], make_column=True)

                # return a boolean of the condition
                return qm.Condition(
                    operator="greater_than_equal",
                    left=ts_col,
                    right=self._offset_column(
                        qm.Column(
                            function="date_trunc",
                            fields=dict(
                                datepart=resolution,
                                column=qm.Column(function="now", fields=dict()),
                            ),
                        )
                    ),
                )

            elif obj.func.id == "local_now":
                return qm.Column(function="now", fields=dict(), timezone=self.company.timezone)

            elif obj.func.id == "is_last_time_to_date":
                resolution = self._fix_resolution(self._parse_obj(obj.args[1]))
                ts_col = self._parse_obj(obj.args[0], make_column=True)
                trunc_col = self._offset_column(
                    qm.Column(
                        function="date_trunc",
                        fields=dict(
                            datepart=resolution,
                            column=qm.Column(function="now", fields=dict()),
                        ),
                    )
                )

                trunc_col_minus_one = qm.Column(
                    function=self._get_time_func("date_add", resolution),
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
                                function=self._get_time_func("date_add", "second"),
                                fields=dict(
                                    datepart="second",
                                    number=qm.Column(
                                        function=self._get_time_func("date_diff", "second"),
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
                then_col = self._parse_obj(obj.args[1], make_column=True)
                else_col = self._parse_obj(obj.args[2], make_column=True)
                return qm.Column(
                    case=dict(
                        cases=[
                            dict(
                                when=self._parse_obj(obj.args[0]),
                                then=then_col,
                            )
                        ],
                        else_value=else_col,
                    ),
                    column_type=then_col.get_type() or else_col.get_type(),
                )

            elif obj.func.id == "is_conv":
                main_column = self._parse_obj(obj.args[0], make_column=True)
                additional_columns = self._parse_obj(obj.args[1], make_column=True)

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
                                then=qm.Column(value=1, column_type="number"),
                            )
                        ],
                        else_value=qm.Column(value=0, column_type="number"),
                    ),
                    column_type="number",
                )

            elif obj.func.id == "field_bucket":
                # create the column
                desired_col = self._parse_obj(obj.args[0], make_column=True)
                groupings = ast.literal_eval(obj.args[1])

                # Just in case
                if groupings.get("group_names") is None:
                    groupings["group_names"] = groupings["groups"]

                cases = []

                # create the right grouping by field
                if groupings["kind"] == "string":
                    # # create all the cases from the column
                    for jj, each_g in enumerate(groupings["groups"]):
                        cases.append(
                            dict(
                                when=qm.Condition(
                                    operator=("is_null" if "null" == str(each_g).lower() else "equal"),
                                    left=desired_col,
                                    right=qm.Column(value=str(each_g), column_type="string"),
                                ),
                                then=qm.Column(
                                    value=groupings["group_names"][jj],
                                    column_type="string",
                                ),
                            )
                        )

                    return qm.Column(
                        case=dict(
                            cases=cases,
                            else_value=qm.Column(
                                value=groupings.get("else_name", "Other"),
                                column_type="string",
                            ),
                        )
                    )

                elif groupings["kind"] == "boolean":
                    return qm.Column(
                        case=dict(
                            cases=[
                                dict(
                                    when=qm.Condition(
                                        operator="equal",
                                        left=desired_col,
                                        right=(
                                            qm.Column(value=1, column_type="number")
                                            if groupings["groups"][0] in ("1", 1)
                                            else qm.Column(value=True, column_type="boolean")
                                        ),
                                    ),
                                    then=qm.Column(
                                        value=groupings["group_names"][0],
                                        column_type="string",
                                    ),
                                )
                            ],
                            else_value=qm.Column(
                                value=groupings.get("else_name", "False"),
                                column_type="string",
                            ),
                        )
                    )

                elif groupings["kind"] == "number":
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
                                    right=qm.Column(value=float(each_g), column_type="number"),
                                ),
                                then=qm.Column(
                                    value=groupings["group_names"][jj],
                                    column_type="string",
                                ),
                            )
                        )

                    return qm.Column(
                        case=dict(
                            cases=cases,
                            else_value=qm.Column(
                                value=groupings["else_name"],
                                column_type="string",
                            ),
                        )
                    )
            else:
                # get the function
                desired_func = next(item for item in FUNCTIONS if item["name"] == obj.func.id.lower())

                input_fields = [i["name"] for i in desired_func["input_fields"]]

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

                if self._fix_resolution(desired_func["kind"]) == "operator":
                    cond = qm.Condition(
                        operator=obj.func.id,
                        **{
                            f.split("_")[0]: self._parse_obj(obj.args[ii], make_column=True)
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
                            )
                            for ii, f in enumerate(input_fields)
                        },
                    )
                    # fix the offset
                    if desired_func["name"] == "date_trunc":
                        col = self._offset_column(col)
                    return col
        elif isinstance(obj, ast.Set):
            raise DatasetCompileError(f"Unexpected Error with freehand function {obj.elts[0].id} ")
        else:
            raise DatasetCompileError(f"Something went wrong parsing type: {obj}")

    def _add_computed_column(self, query, col, available_columns):
        # loop through all the column ids
        for temp_col in self.raw_string_to_col(col["source_details"]).get_dependent_columns():
            if temp_col not in available_columns and temp_col != "join_ts":
                return True

        # parse and add the column
        return_col = self.raw_string_to_col(col["source_details"])
        return_col.set_name_alias(self.column_mapper[col["id"]])

        # create a mapping to override the alias
        if query.from_table.alias:
            for c in return_col.get_dependent_columns(just_names=False):
                if c.table_column == "customer" and not self.is_time:
                    c.table_alias = "c"

        # add the column
        query.add_column(return_col)
        return False

    # deal with computed columns
    def add_computed_columns(self, query, columns, count=0):
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
            if utils.slugify(self.column_mapper[c["id"]]) not in available_columns:
                # add the column or if something is missing eer then rerun
                added_nothing = self._add_computed_column(query, c, available_columns)

                if added_nothing:
                    missing_something = True

        # run the columns again
        if missing_something:
            if len(query.columns) == 1:
                # add the query that it made it to
                set_current_span_attributes(query=query.to_query())

                raise DatasetCompileError(
                    "Cannot Add columns: {} because of missing dependency".format(
                        ", ".join(
                            [
                                self.column_mapper[c["id"]]
                                for c in columns
                                if self.column_mapper[c["id"]] not in available_columns
                            ]
                        )
                    )
                )

            return self.add_computed_columns(new_query, columns, count=count + 1)
        else:
            logger.debug("finished query")
            return query

    ###########################################################
    ##################    GROUP  ########################
    ###########################################################
    def _add_metric_column(self, group_query, metric_obj, raw_group_column_object):
        qm = self.qm

        replace_count_all = False
        # handle the pivot
        if len(metric_obj["pivot"]) > 0:
            # create the pivot filter
            pivot_filt = qm.Filter()
            for p in metric_obj["pivot"]:
                # find the referenced column
                original_column = next(x for x in raw_group_column_object if x["id"] == p["column_id"])

                # add the filter that points to the original column
                pivot_filt.add_filter(
                    qm.Condition(
                        operator="equal" if p["value"] is not None else "is_null",
                        left=qm.Column(
                            table_column=self.column_mapper[original_column["column_id"]],
                            table_alias="rd",
                            column_type=self.column_types[original_column["column_id"]],
                        ),
                        right=qm.Column(value=p["value"]),
                    ),
                    "AND",
                )

            # added the att column
            metric_col = qm.Column(
                case=dict(
                    cases=[
                        dict(
                            when=pivot_filt,
                            then=(
                                qm.Column(
                                    table_column=self.column_mapper[metric_obj["column_id"]],
                                    table_alias="rd",
                                )
                                if metric_obj["column_id"]
                                else qm.Column(value=1)
                            ),
                        )
                    ]
                )
            )
            replace_count_all = True

        # this handles the count_all
        elif metric_obj["column_id"] is None:
            metric_col = None

        # deal with the normal column
        else:
            metric_col = qm.Column(
                table_column=self.column_mapper[metric_obj["column_id"]],
                table_alias="rd",
            )

        # handle the base column
        if metric_obj.get("base_column_id"):
            base_column = qm.Column(
                table_column=self.column_mapper[metric_obj["base_column_id"]],
                table_alias="rd",
            )
        elif self.ts_column_id:
            base_column = self.column_mapper[self.ts_column_id]
        else:
            base_column = None

        # deal with special median and percentile functions
        if metric_obj["agg_function"].lower() in ("median", "percentile_cont"):
            group_window_columns = deepcopy(group_query.group_by)

            percentile = 0.0
            if metric_obj.get("percentile"):
                percentile = float(metric_obj["percentile"])
                if percentile > 1.0:
                    percentile /= 100.0

            # add the column to the subquery

            # Handles weird pg edge case whene you are grouping by no columns
            # if qm.language == "pg" and len(group_window_columns) == 0: # USED TO BE THIS but didn't work
            if qm.language == "pg":
                col = qm.Column(
                    function="percentile_cont",
                    fields=dict(
                        column=metric_col,
                        percentile=(0.5 if metric_obj["agg_function"].lower() == "median" else percentile),
                    ),
                    name_alias=metric_obj["label"],
                )

            else:
                additional = qm.Column(
                    function=("percentile_cont_window" if len(group_window_columns) > 0 else "percentile_cont_all"),
                    fields=dict(
                        column=metric_col,
                        group=(group_window_columns if len(group_window_columns) > 0 else None),
                        percentile=(0.5 if metric_obj["agg_function"].lower() == "median" else percentile),
                    ),
                    name_alias=metric_obj["label"],
                )

                # check if sub query exist or not
                if group_query.from_table.kind != "query":
                    # wrap the query in a sub query
                    temp_query = qm.Query()
                    temp_query.ctes = group_query.ctes
                    temp_query.add_column(qm.Column(all_columns=True, table_alias="rd"))

                    # handle any addition to the time query
                    temp_query.set_from(group_query.from_table)
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

                group_query.from_table.query.add_column(additional)

                # add the wrapper column to the main query
                col = qm.Column(
                    function="min",
                    fields=dict(
                        column=qm.Column(
                            table_column=self.column_mapper[metric_obj["id"]],
                            table_alias="rd",
                        )
                    ),
                    name_alias=self.column_mapper[metric_obj["id"]],
                )

        elif metric_obj["agg_function"].lower() == "rate":
            # this is just the rate of the column so it is the average
            if metric_obj.get("conditioned_on_columns"):
                # create a filter to make sure all the timestamps are not null
                null_filter = qm.Filter()
                for p in metric_obj["conditioned_on_columns"]:
                    null_filter.add_filter(
                        qm.Condition(
                            operator="not_is_null",
                            left=qm.Column(
                                table_column=self.column_mapper[p],
                                column_type=self.column_types[p],
                            ),
                        )
                    )

                # create the column
                col = qm.Column(
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
                                                then=qm.Column(value=1.0, column_type="number"),
                                            )
                                        ],
                                        else_value=qm.Column(),
                                    )
                                )
                            ),
                        ),
                    ],
                    name_alias=self.column_mapper[metric_obj["id"]],
                )

            # if it is dependent on a column then sum it and divide by the right count
            else:
                # create the column
                col = qm.Column(
                    function="average",
                    fields=dict(column=metric_col),
                    name_alias=self.column_mapper[metric_obj["id"]],
                )

        else:
            # handle pivots
            if metric_obj["agg_function"].lower() == "count_all" and replace_count_all:
                agg_func = "count"
            else:
                agg_func = metric_obj["agg_function"].lower()

            # create the column
            col = qm.Column(
                function=agg_func,
                fields=dict(column=metric_col, base_column=base_column),
                name_alias=self.column_mapper[metric_obj["id"]],
            )

        # add the column to the group
        group_query.add_column(col)

    def _add_spend(self, group_query, group, spend_config):
        qm = self.qm

        # add spend table if it exists and has columns
        if spend_config is None or not spend_config["columns"]:
            return group_query

        # initialize the new query
        full_query = qm.Query()

        # handle the distribution of the columns
        spend_ids = [s["column_id"] for s in spend_config["joins"]]
        distribute_by = [c for c in group["columns"] if c["id"] in spend_ids]
        distribute = any(c for c in group["columns"] if c["id"] not in spend_ids)

        # add the proper distribution if the column needs to be distributed
        if distribute:
            # notify the user
            if len(group["metrics"]) == 0:
                raise SilenceError(
                    "Cannot distribute the spend data if you do not have a metric column.  We use the first column!"
                )

            temp_query = qm.Query()
            temp_query.add_column(qm.Column(all_columns=True))
            temp_query.set_from(qm.Table(query=group_query, alias="rd"))
            temp_query.add_column(
                qm.Column(
                    components=[
                        qm.Column(table_column=self.column_mapper[group["metrics"][0]["id"]]),
                        "*",
                        qm.Column(value=1.0),
                        "/",
                        qm.Column(
                            function=("sum_window" if len(distribute_by) > 0 else "sum_window_all"),
                            fields=dict(
                                column=qm.Column(table_column=self.column_mapper[group["metrics"][0]["id"]]),
                                group=[qm.Column(table_column=self.column_mapper[c["id"]]) for c in distribute_by],
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
        full_query.add_cte("ad_data", ad_query)

        (schema_name, table_name, _, _) = self._expand_table(spend_config.get("spend_table", self.company.spend_table))

        ad_query.set_from(
            qm.Table(
                table=table_name,
                schema=schema_name,
                alias="ss",
            )
        )

        if len(spend_config["joins"]) == 0:
            ad_condition = qm.Condition(
                operator="equal",
                left=qm.Column(value=1),
                right=qm.Column(value=1),
            )
        else:
            ad_condition = qm.Filter()

        # handle the joins to bring in ad data
        for ii, ad_join in enumerate(spend_config["joins"]):
            # checking if the column was computed and odin git!
            if ad_join.get("join_column_source_details") and ad_join.get("apply_computed_logic", True):
                col = self.raw_string_to_col(ad_join["join_column_source_details"])
                for sub_c in col.get_dependent_columns(just_names=False):
                    if sub_c.kind == "simple":
                        sub_c.table_column = ad_join["spend_column"]
                        sub_c.set_table_alias("ss")
            else:
                col = qm.Column(table_column=ad_join["spend_column"], table_alias="ss")

            # setup the name
            col.set_name_alias(ad_join["spend_column"])
            ad_query.add_column(col)

            # add the join condition for the ads
            ad_condition.add_filter(
                qm.Condition(
                    operator="equal",
                    left=qm.Column(
                        table_column=self.column_mapper[ad_join["column_id"]],
                        table_alias="g",
                    ),
                    right=qm.Column(table_column=ad_join["spend_column"], table_alias="a"),
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
                        first_column=qm.Column(
                            table_column=self.column_mapper[ad_join["column_id"]],
                            table_alias="g",
                        ),
                        second_column=qm.Column(table_column=ad_join["spend_column"], table_alias="a"),
                    ),
                    name_alias=self.column_mapper[ad_join["column_id"]],
                )
            )

        # combine the group data and the ad data to be the full table
        full_query.set_from(qm.Table(cte="group_data", alias="g"))
        # join on all the data
        full_query.add_join(
            qm.Join(
                kind="LEFT",
                table=qm.Table(cte="ad_data", alias="a"),
                condition=ad_condition,
            )
        )

        # add all the group columns that were not already added
        for c in group_query.get_all_columns():
            if c.get_name() not in full_query.get_all_columns(only_names=True):
                full_query.add_column(qm.Column(table_alias="g", table_column=c.get_name()))

        # ADD THE SPEND COLUMNS
        for c in spend_config["columns"]:
            # handle the column in the full query
            if distribute:
                full_query.add_column(
                    qm.Column(
                        components=[
                            qm.Column(table_column=c["name"], table_alias="a"),
                            "*",
                            qm.Column(table_column="event_ratio", table_alias="g"),
                        ],
                        name_alias=self.column_mapper[c["id"]],
                    )
                )
            else:
                full_query.add_column(
                    qm.Column(
                        table_column=c["name"],
                        table_alias="a",
                        name_alias=self.column_mapper[c["id"]],
                    )
                )

            # add the column to the ad query
            ad_query.add_column(
                qm.Column(
                    function="sum",
                    fields=dict(column=qm.Column(table_column=c["name"], table_alias="ss")),
                    name_alias=c["name"],
                )
            )

        # if there is a cohort time filter then also apply the same filter to the ad
        if group.get("cohort_time_filters"):
            ad_query.add_filter(
                self.__create_filter(
                    group.get("cohort_time_filters"),
                    qm.Column(table_column="enriched_ts", column_type="timestamp"),
                ),
                "AND",
            )

        return full_query

    def __create_time_query(self, time_option, resolution_filter=None):
        qm = self.qm
        company = self.company

        is_end = "end_of" in time_option
        is_offset = "offset" in time_option

        to_date = utils.utcnow()
        resolution = self._fix_resolution(time_option.split("_")[-1])

        future_months = 2

        # create the new table
        time_query = qm.Query()

        if company.start_data_on:
            from_date = company.start_data_on
        else:
            from_date = utils.date_add(utils.utcnow(), "year", -5)

        # decide on the from date that we will consider
        # NOTE:  I add -1 in the date so it can properly count the rows
        if resolution_filter and resolution_filter.get("type"):
            if resolution_filter["type"] == "relative":
                res = int(resolution_filter["from_value"])
                new_date = utils.date_add(
                    utils.utcnow(),
                    resolution_filter["segmentation"],
                    -1 * res,
                )
                if res < 0:
                    to_date = new_date
                    future_months += int(
                        utils.date_diff(
                            utils.utcnow(),
                            to_date,
                            resolution,
                        )
                    )
                else:
                    from_date = new_date

            elif resolution_filter["type"] == "absolute":
                from_date = utils.date_add(
                    self.mavis.date_trunc(resolution_filter["from_date"], resolution),
                    resolution,
                    -2,
                )

        count_of_series = (
            int(
                utils.date_diff(
                    from_date,
                    to_date,
                    resolution,
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
                self.mavis.qm.stream_table(
                    self.company_table.activity_stream,
                    activity=(
                        self.activities[0]
                        if self.activities and self.company_table.manually_partition_activity
                        else None
                    ),
                )
            )
            time_query.set_limit(count_of_series)

        time_column = qm.Column(
            function=self._get_time_func("date_add", resolution),
            fields=dict(
                datepart=resolution,
                number=qm.Column(
                    components=[
                        qm.Column(value=-1),
                        "*",
                        row_col,
                        "+",
                        qm.Column(value=future_months),
                    ]
                ),
                column=self._offset_column(
                    qm.Column(
                        function="date_trunc",
                        fields=dict(
                            datepart=resolution,
                            column=qm.Column(function="now", fields={}),
                        ),
                    ),
                ),
            ),
            name_alias=resolution,
        )

        if is_offset and resolution == "quarter":
            time_column = qm.Column(
                function="date_add",
                fields=dict(datepart="month", number=1, column=time_column),
                name_alias=time_option,
            )

        if is_end:
            # time_column.set_timezone(self.company.timezone)
            time_column = qm.Column(
                function="time_add",
                fields=dict(datepart="second", number=-1, column=time_column),
                name_alias=time_option,
            )

        time_query.add_column(time_column)
        return time_query

    def _add_time_window(self, query, c):
        # initialize the main variables
        qm = self.qm

        if "time_window" not in query.ctes.keys():
            time_query = self.__create_time_query(c["source_details"]["resolution"])

            # add the query to the cte
            query.add_cte("time_window", time_query)

            # create a resolution column
            res_column = qm.Column(table_column=c["source_details"]["resolution"], table_alias="tw")

            # add the join needed
            query.add_join(
                qm.Join(
                    kind="INNER",
                    table=qm.Table(cte="time_window", alias="tw"),
                    condition=qm.Filter(
                        filters=[
                            qm.Condition(
                                operator="greater_than_equal",
                                left=res_column,  # resolution column
                                right=qm.Column(
                                    table_column=self.column_mapper[c["source_details"]["from_column_id"]],
                                    table_alias=query.from_table.alias,
                                ),  # window from_column
                            ),
                            "AND",
                            qm.Condition(
                                operator="less_than",
                                left=res_column,  # resolution column
                                right=qm.Column(
                                    function="nvl",
                                    fields=dict(
                                        first_column=qm.Column(
                                            table_column=self.column_mapper[c["source_details"]["to_column_id"]]
                                        ),
                                        second_column=qm.Column(function="now", fields={}),
                                    ),
                                    table_alias=query.from_table.alias,
                                ),  # window to_column or now
                            ),
                        ]
                    ),
                )
            )

        col = qm.Column(
            table_column=c["source_details"]["resolution"],
            table_alias="tw",
            name_alias=self.column_mapper[c["id"]],
        )

        return col

    # dealing with group
    def add_group(self, query, group, limit=DATASET_LIMIT, offset=None):
        """
        Adds the group to the query
        TODO: BREAK THIS UP INTO FUNCTIONS SINCE THIS HAS GOTTEN OUT OF HAND
        """

        qm = self.qm

        # add the take the full query and make it into a cte
        group_query = qm.Query()
        group_query.add_cte("raw_dataset", query)
        group_query.set_from(qm.Table(cte="raw_dataset", alias="rd"))

        # just return the group
        if group.get("is_parent"):
            group_query.add_column(qm.Column(all_columns=True))
            # add order to the group
            # self.add_order_by(group_query, group["order"])
            group_query.set_limit(limit)
            if offset:
                group_query.set_offset(offset)
            return group_query

        # #### DEAL WITH PIVOTS
        # add the group and metrics
        for c in group["columns"]:
            if not c.get("pivoted"):
                if c.get("source_kind", "group") == "group":
                    col = qm.Column(
                        table_column=self.column_mapper[c["column_id"]],
                        table_alias="rd",
                        name_alias=self.column_mapper[c["id"]],
                        column_type=self.column_types[c["column_id"]],
                    )

                    # TODO:
                    # IF this is aggregating a cohort column and there is a filter on it then filter it from the cohort
                    #

                elif c.get("source_kind") == "time_conversion_window":
                    # add the time window join
                    col = self._add_time_window(group_query, c)

                group_query.add_column(col)
                group_query.add_group_by(col)

            # add the cohort filter before the join
            elif c["filters"]:
                for f in c["filters"]:
                    group_query.add_filter(
                        self.__create_filter(
                            f,
                            qm.Column(
                                table_column=self.column_mapper[c["id"]],
                                column_type=self.column_types[c["id"]],
                            ),
                        ),
                        "AND",
                    )

        # initialize the metrics filters
        metrics_filter = qm.Filter(filters=[])

        # add all the metrics
        for m in group["metrics"]:
            self._add_metric_column(group_query, m, group["columns"])

        # DEAL WITH FILTERS and computed columns
        group_query = self._add_spend(group_query, group, group.get("spend"))

        # add the filters
        for m in self.get_group_columns(group):
            # ignore pivot filter since they are processed before
            if m.get("pivoted"):
                continue

            # add the filters of the columns
            for f in m["filters"]:
                metrics_filter.add_filter(
                    self.__create_filter(
                        f,
                        qm.Column(
                            table_column=self.column_mapper[m["id"]],
                            column_type=self.column_types[m["id"]],
                        ),
                    ),
                    "AND",
                )

        # add the computed columns
        if len(group["computed_columns"]) > 0:
            # create a wrapper cause the metrics are already added
            temp_query = qm.wrap_query(group_query)

            # add the computed columns
            group_query = self.add_computed_columns(temp_query, group["computed_columns"])

        # Add filters to a wrappe query
        if len(metrics_filter.filters) > 0:
            temp_query = qm.wrap_query(group_query)
            temp_query.set_where(metrics_filter)
            group_query = temp_query

        # add order to the group
        self.add_order_by(group_query, group["order"])
        # suppress all outputs
        group_query = self.supress_outputs(group_query, self.get_group_columns(group))
        group_query.set_limit(limit)
        if offset:
            group_query.set_offset(offset)

        return group_query

    def add_order_by(self, group_query, order_obj):
        """
        Add the order to the object
        """
        for o in order_obj:
            column = self.qm.Column(
                table_column=self.column_mapper[o["column_id"]],
                column_type=self.column_types[o["column_id"]],
            )
            group_query.add_order_by(column, asc=o["order_direction"] == "asc")

    ###########################################################
    ########### Supporting OLD COMPUTED COLUMNS   ###################
    ###########################################################

    def _get_computed_raw_string(self, column_def, all=False):
        """"""

        # we added this to support old dataset computed columns
        if column_def.get("segmentation"):
            column_def["datepart"] = self._fix_resolution(column_def["segmentation"])
        if column_def.get("interval"):
            column_def["number"] = column_def["interval"]

        # apply the mapping
        raw_string = None
        # we do this cause space is confusing
        if column_def.get("raw_string"):
            raw_string = column_def.get("raw_string").replace("\n", "").replace("\t", "")

        elif column_def["kind"] == "replace":
            raw_string = """replace({column_id}, '{remove_str}', '{replace_str}')""".format(**column_def)

        elif column_def["kind"] == "string_between":
            raw_string = "string_between({column_id}, '{from_piece}','{to_piece}')".format(**column_def)

        elif column_def["kind"] == "math_operation":
            raw_string = "nvl({column_id}, 0){operation}{number}".format(**column_def)

        elif column_def["kind"] == "math_operation_multi_column":
            if column_def["operation"] == "/":
                raw_string = "nvl({column_id},0)*1.0{operation}nullif({second_column_id},0)".format(**column_def)
            else:
                raw_string = "nvl({column_id},0)*1.0{operation}nvl({second_column_id},0)".format(**column_def)

        elif column_def["kind"] == "number_decimate":
            raw_string = "decimate_number({column_id}, {number})".format(**column_def)

        elif column_def["kind"] == "string_concatenate":
            if column_def.get("string_before") and column_def.get("string_after"):
                raw_string = "concat(concat('{string_before}', {column_id}), '{string_after}')".format(**column_def)
            elif column_def.get("string_before"):
                raw_string = "concat('{string_before}', {column_id})".format(**column_def)
            elif column_def.get("string_after"):
                raw_string = "concat({column_id}, '{string_after}')".format(**column_def)

        elif column_def["kind"] == "string_concatenate_multi_column":
            raw_string = "concat(concat({column_id}, '{delimiter}'), {second_column_id})".format(**column_def)

        elif column_def["kind"] == "time_add":
            if column_def["datepart"].lower() in RESOLUTIONS[-4:]:
                raw_string = "date_add('{datepart}', {number}, {column_id})".format(**column_def)
            else:
                raw_string = "time_add('{datepart}', {number}, {column_id})".format(**column_def)

        elif column_def["kind"] == "time_to_now":
            if self._fix_boundary(column_def["datepart"].lower()) in RESOLUTIONS[-4:]:
                raw_string = "date_diff('{datepart}', {column_id}, local_now())".format(**column_def)
            else:
                raw_string = "time_diff('{datepart}', {column_id}, local_now())".format(**column_def)

        elif column_def["kind"] == "time_between":
            if self._fix_boundary(column_def["datepart"].lower()) in RESOLUTIONS[-4:]:
                raw_string = "date_diff('{datepart}', {column_id}, {second_column_id})".format(**column_def)
            else:
                raw_string = "time_diff('{datepart}', {column_id}, {second_column_id})".format(**column_def)

        elif column_def["kind"] == "time_truncate":
            if column_def["resolution"] in (1, "1"):
                raw_string = "date_trunc('{datepart}', {column_id})".format(**column_def)
            elif column_def["datepart"].lower() in RESOLUTIONS[-4:]:
                raw_string = "date_trunc_resolution('{datepart}', {column_id}, {resolution})".format(**column_def)
            else:
                raw_string = "time_trunc_resolution('{datepart}', {column_id}, {resolution})".format(**column_def)
        elif column_def["kind"] == "date_part":
            raw_string = "date_part('{datepart}', {column_id})".format(**column_def)
        # WINDOW FUNCTIONS
        elif column_def["kind"] in (
            "row_number",
            "running_total",
            "percent_of_total",
            "moving_average",
        ):
            # add the full order to make things easiers
            if column_def.get("order"):
                column_def["full_order"] = ", ".join(
                    ["{}.{}".format(o["column_id"], o["order_direction"]) for o in column_def["order"]]
                )
            # add the row number to make things easier
            if column_def.get("group_column_ids"):
                column_def["group"] = ", ".join([f"{g}" for g in column_def["group_column_ids"]])

            has_group = column_def.get("group") and len(column_def["group"]) > 0

            # map the columns
            if column_def["kind"] == "row_number":
                if has_group:
                    raw_string = "row_number_w_group([{group}], [{full_order}])".format(**column_def)
                else:
                    raw_string = "row_number_all([{full_order}])".format(**column_def)

            elif column_def["kind"] == "running_total":
                if has_group:
                    raw_string = "running_total({column_id}, [{group}], [{full_order}])".format(**column_def)
                else:
                    raw_string = "running_total_all({column_id}, [{full_order}])".format(**column_def)

            elif column_def["kind"] == "percent_of_total":
                if has_group:
                    raw_string = "ratio_to_report({column_id}, [{group}])".format(**column_def)
                else:
                    raw_string = "percent_of_total_all({column_id})".format(**column_def)

            elif column_def["kind"] == "moving_average":
                if has_group:
                    raw_string = "moving_average({column_id}, [{group}], [{full_order}], {window_size})".format(
                        **column_def
                    )
                else:
                    raw_string = "moving_average_all({column_id}, [{full_order}], {window_size})".format(**column_def)

        # add a layer to deal with ifttt and bin
        elif all and column_def["kind"] == "ifttt":
            raw_string = []
            for case in column_def["cases"]:
                filter = self._filter_to_raw_str(case["filters"])
                value = self._value_to_raw_string(case["value"], case["value_kind"])
                # Add the raw string
                raw_string.append(f"iff( {filter}, {value} , ")

            raw_string.append(
                f'{self._value_to_raw_string(column_def["value"], column_def["value_kind"])} {")" *  len(column_def["cases"]) }'
            )
            raw_string = "".join(raw_string)

        elif all and column_def["kind"] == "bin":
            raw_string = []
            for each_bin in column_def["bins"]:
                raw_string.append(
                    "iff({column_id} >= {from_value} and {column_id} < {to_value}, '{name}', ".format(
                        **each_bin, **column_def
                    )
                )

            raw_string.append(" '{else_name}' {paren}".format(**column_def, paren=")" * len(column_def["bins"])))

            raw_string = "".join(raw_string)

        return raw_string
