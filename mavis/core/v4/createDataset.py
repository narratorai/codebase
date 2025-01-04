from copy import deepcopy
from enum import Enum
from hashlib import md5

from fuzzywuzzy import fuzz
from opentelemetry.trace import get_current_span
from pydantic import BaseModel, Field

import core.v4.query_mapping.config as qm_config
from core import utils
from core.api.customer_facing.activities.utils import ActivityManager
from core.constants import CUSTOMER_COLUMN_NAMES
from core.errors import InternalError, SilenceError
from core.graph import graph_client
from core.logger import get_logger
from core.models.company import CompanyTable
from core.models.ids import UUIDStr, get_uuid
from core.models.internal_link import PORTAL_URL
from core.util.opentelemetry import tracer
from core.v4.dataset import _get_group_kinds, is_time_activity
from core.v4.dataset_comp.query.util import Dataset
from core.v4.datasetPlotter import DatasetPlot

logger = get_logger()

TO_SHOW_PROBABILITY = 0.65

RELATIONSHIPS = dict(
    first_ever=dict(
        occurrence="first",
        relationship_slug=None,
    ),
    last_ever=dict(occurrence="last", relationship_slug=None),
    first_before=dict(occurrence="first", relationship_slug="before"),
    last_before=dict(occurrence="last", relationship_slug="before"),
    first_in_between=dict(occurrence="first", relationship_slug="within_cohort"),
    last_in_between=dict(occurrence="last", relationship_slug="within_cohort"),
    agg_all_in_between=dict(occurrence="metric", relationship_slug="within_cohort"),
    agg_all_ever=dict(occurrence="metric", relationship_slug=None),
    agg_all_before=dict(occurrence="metric", relationship_slug="before"),
    first_after=dict(occurrence="first", relationship_slug="after"),
    last_after=dict(occurrence="last", relationship_slug="after"),
    agg_all_after=dict(occurrence="metric", relationship_slug="after"),
)
ALL_AGG_FUNCTIONS = {
    af["name"]: af for af in qm_config.FUNCTIONS if af["kind"] == "agg_functions" and not af["name"].endswith("_case")
}

ENFORCE_ORDER_TEXT = "(After Prior Activity)"

RelationshipEnum = Enum(value="Relationships", names=[(b.upper(), b) for b in RELATIONSHIPS.keys()])
OccurrenceEnum = Enum(
    value="Occurrences",
    names=[(b.upper(), b) for b in ("all", "first", "last", "custom", "time")],
)
OperatorEnum = Enum(
    value="Operators",
    names=[
        (b["name"].upper(), b["name"])
        for b in qm_config.FUNCTIONS
        + [dict(name="time_range"), dict(name="quick_time_filter"), dict(name="not_contain")]
        if b.get("kind", "operators") == "operators"
    ],
)
ResolutionEnum = Enum(
    value="Resolutions",
    names=[(b.upper(), b) for b in qm_config.RESOLUTIONS + ["month_boundary", "week_boundary", "day_boundary"]],
)
RelationEnum = Enum(value="Relations", names=[(b.upper(), b) for b in ("before", "after")])
RelationOccurrenceEnum = Enum(value="RelationOccurences", names=[(b.upper(), b) for b in ("first", "last")])

TimeOptionsEnum = Enum(
    value="TimeOptions",
    names=[(b.upper(), b) for b in ("within_time", "at_least_time")],
)
UIKindEnum = Enum(
    value="UIKindEnum",
    names=[(b.upper(), b) for b in ("go_to_group", "go_to_plot", "push_notification")],
)
ShowColumnsEnum = Enum(
    value="ShowColumns",
    names=[(b.upper(), b) for b in ("parent", "group")],
)

MutationEnum = Enum(
    value="MutationEnum",
    names=[
        (b.upper(), b)
        for b in (
            "delete",
            "add",
            "add_filter",
            "remove_filters",
            "swap_time_resolution",
            "update",
            "swap_id",
            "add_activity",
            "delete_activity",
            "update_activity",
            "add_group",
            "add_duplicate_parent",
            "add_plot",
            "add_prefilter",
            "add_order",
            "update_spend",
            "add_spend_column",
        )
    ],
)

ColumnKindEnum = Enum(value="ColumnKindEnum", names=[(b.upper(), b) for b in _get_group_kinds()])

AggFunctionsEnum = Enum(
    value="Agg Functions",
    names=[(b.upper(), b.lower()) for b in ALL_AGG_FUNCTIONS.keys()],
)


class DatasetInput(BaseModel):
    override_sql: str | None
    # TODO make a model for the dataset query input
    query: dict
    input_fields: dict = Field(None, alias="fields")


class DatasetMetricInput(BaseModel):
    dataset: DatasetInput

    kpi_id: str | None
    kpi_label: str | None
    kpi_format: str | None

    # TODO: MAke ENUMs
    time_resolution: str = "month"
    impact_direction: str = "increase"
    time_option_id: str | None
    row_name: str | None


class TimeWindow(BaseModel):
    date_part: ResolutionEnum
    from_column_id: str
    to_column_id: str


class ColumnValue(BaseModel):
    key: str
    value: str | None


class Column(BaseModel):
    name: str
    label: str
    type: str
    dropdown_label: str | None
    mavis_type: str | None
    enrichment_table: str | dict = None
    enrichment_table_column: str | None
    slowly_changing_ts_column: str | None
    values: list[ColumnValue] = []
    opt_group: str | None
    kpi_locked: bool = False

    # only for spend
    id: str | None


class MetricColumn(Column):
    agg_function: AggFunctionsEnum


class Filter(BaseModel):
    operator: OperatorEnum = OperatorEnum.EQUAL
    kind: str = "value"
    value: str | float | list[str] | list[int] = None
    or_null: bool = False

    # for time_range
    from_type: str | None
    from_value: str | None
    from_value_kind: str = "value"
    from_value_resolution: str | None
    to_type: str | None
    to_value: str | None
    to_value_kind: str = "value"
    to_value_resolution: str | None
    value_resolution: str | None

    class Config:
        use_enum_values = True


class ResolutionFilter(BaseModel):
    type: str | None
    from_date: str | None
    from_value: int | None
    segmentation: str | None


class ColumnFilter(BaseModel):
    filter: Filter
    activity_column: Column = None
    activity_column_name: str | None

    # TODO: deprecated
    column_type: str | None
    enrichment_table: str | dict = None
    enrichment_table_column: str | None


class OccurrenceFilter(BaseModel):
    occurrence: OccurrenceEnum = OccurrenceEnum.FIRST
    custom_value: int | None
    resolution: str | None
    resolution_filter: ResolutionFilter = None


class TimeFilter(BaseModel):
    time_option: TimeOptionsEnum
    resolution: ResolutionEnum = ResolutionEnum.MINUTE
    value = 30


class AtLeastTimeFilter(BaseModel):
    resolution: ResolutionEnum = ResolutionEnum.MINUTE
    value = 30


class RelativeActivityFilter(BaseModel):
    # activity definition hash for APPEND ACTIVITIES ONLY
    activity_ids: list[UUIDStr]
    relative_relationship: RelationEnum = RelationEnum.BEFORE

    relative_occurrence: RelationOccurrenceEnum = RelationOccurrenceEnum.FIRST
    or_null: bool = True


class CohortColumnFilter(BaseModel):
    operator: OperatorEnum = OperatorEnum.EQUAL

    cohort_column: Column = None
    append_column: Column = None

    cohort_column_name: str | None
    append_column_name: str | None

    # TODO: deprecate
    cohort_column_enrichment_table: str | dict = None
    column_name_enrichment_table: str | dict = None
    column_name_enrichment_table_column: str | None

    class Config:
        use_enum_values = True


class CohortActivity(BaseModel):
    activity_ids: list[str]

    columns: list[Column]
    # filters for but only if
    occurrence_filter: OccurrenceFilter = None
    column_filters: list[ColumnFilter] = []

    # for dropdowns
    all_columns: list[Column] = []
    raw_columns: list[Column] = []
    kpi_locked: bool = False
    name_override: str | None = None

    # for internal use
    original_activity_id: str | None


class AppendActivity(BaseModel):
    activity_ids: list[UUIDStr]
    columns: list[Column]
    relationship_slug: RelationshipEnum = RelationshipEnum.FIRST_IN_BETWEEN

    # filters for but only if
    column_filters: list[ColumnFilter] = []
    time_filters: list[TimeFilter] = []
    relative_activity_filters: list[RelativeActivityFilter] = []
    cohort_column_filters: list[CohortColumnFilter] = []

    # for dropdowns
    all_columns: list[Column] = []
    raw_columns: list[Column] = []
    kpi_locked: bool = False
    name_override: str | None = None

    # for internal use
    original_activity_id: str | None


class DatasetConfig(BaseModel):
    cohort: CohortActivity
    append_activities: list[AppendActivity] = []
    activity_stream: CompanyTable = None


class ShortcutOption(BaseModel):
    key: str
    label: str


class ColumnShortcut(BaseModel):
    column_types: list[str]
    in_parent: bool
    in_group: bool
    key: str
    label: str
    options: list[ShortcutOption]


class RowShortcut(BaseModel):
    in_parent: bool
    in_group: bool
    key: str
    label: str
    add_column_value: bool = False
    select_columns: ShowColumnsEnum = None


class JoinOption(BaseModel):
    column_id: str
    spend_column: str
    apply_computed_logic: bool = True


class SpendConfig(BaseModel):
    table: dict | None
    joins: list[JoinOption] = None
    metrics: list[MetricColumn] = None


class SpendOptions(BaseModel):
    table_options: list[dict] = None
    metric_options: list[MetricColumn] = None
    join_columns: list[Column] = None

    table_default: dict | None
    metric_defaults: list[MetricColumn] = None
    join_defaults: list[JoinOption] = None


class ParentFilter(BaseModel):
    filter: dict
    column_id: str


class EditAction(BaseModel):
    mutation: MutationEnum
    group_slug: str | None
    # column object
    column_kind: ColumnKindEnum = None
    column: dict | None
    new_column: dict | None
    spend_config: SpendConfig = None
    activity: dict | None
    group_name: str | None
    limited_types: list = qm_config.ALL_TYPES
    allowed_columns: list[dict] = []
    mavis_created: bool = False
    plot: dict | None
    plot_name: str | None

    # add group prefilters
    parent_filter: ParentFilter = None
    filter: dict | None
    time_resolution: ResolutionEnum = None


class DatasetSQL(BaseModel):
    group_slug: str | None
    sql_query: str


class UIInstructions(BaseModel):
    kind: UIKindEnum
    group_slug: str | None
    plot_slug: str | None
    notification: utils.Notification = None
    run_tab: bool = False


class PlanExecution(BaseModel):
    plan: list[EditAction] = []
    updated: bool = False
    show_user: bool = False
    staged_dataset: dict
    staged_compiled_sql: list[DatasetSQL] = []
    ui_instructions: list[UIInstructions] = None


class PlanExecutionInput(BaseModel):
    plan: list[EditAction] = []
    updated: bool = False
    show_user: bool = False
    dataset: dict
    ui_instructions: list[UIInstructions] = None


class ActivityData(BaseModel):
    id: list[str]
    slug: list[str]
    slugified: str
    has_source: bool = False
    activity_stream: str
    name: str
    columns: list[Column]
    force_recompute_occurrence: bool | None


class PossibleColumn(BaseModel):
    label: str | None
    column_id: str | None
    column: Column = None
    activity_id: str | None
    opt_group: str | None
    display_format: str | None
    id: str | None


class PossibleColumnMetric(PossibleColumn):
    agg_function: str | None
    computed_string: str | None
    opt_group: str


class PossibleColumnFilter(PossibleColumn):
    filter: Filter = None


def clean_activity_name(name):
    return name if len(name) < 100 else "activities"


def _is_conv_col(col):
    return (
        col.get("source_details")
        and col["source_details"].get("raw_string")
        and (
            col["source_details"]["raw_string"].startswith("exists")
            or col["source_details"]["raw_string"].startswith("is_conv")
        )
    )


def _is_time_between_col(col):
    return (
        col.get("source_details")
        and col["source_details"].get("raw_string")
        and (
            (col["source_details"]["raw_string"].startswith("time_diff"))
            or (col["source_details"]["raw_string"].startswith("date_diff"))
        )
    )


def _column_name(activity, col, relationship_slug, group_func=None, is_repeat=None):
    # deal with first in between mapping to next
    if not group_func and relationship_slug == "first_in_between" and is_repeat:
        relationship_slug = "next"

    if len(activity.name) > 80:
        activity_name = "Activity"
    else:
        activity_name = utils.plural(activity.name)

    # name the total counts
    if group_func:
        display_func = group_func["display_name"]
        relation = utils.title(relationship_slug[8:])

        if (
            col.name.startswith("feature")
            or (col.enrichment_table is not None and col.name not in ("enriched_ts", "enriched_activity_id"))
            or (
                (col.name in ("source_id", "join_customer", "anonymous_customer_id") or col.name.startswith("ts."))
                and group_func["name"] == "count_distinct"
            )
        ):
            # deal with total unique customers
            if group_func["name"] == "count_distinct":
                return f"Total Unique {utils.plural(col.label)} {relation}"

            # # deal with a string that is being counted
            elif col.mavis_type == "string" and group_func["name"] == "count":
                return f"Total {utils.plural(col.label)} {relation}"
            else:
                return f"{display_func} of {col.label} {relation}"

        elif col.name == "ts" and group_func["name"] == "count":
            return f"Total {activity_name} {relation}"

        elif col.name == "revenue_impact" and group_func["name"] == "sum":
            return f"Total {activity_name} Revenue {relation}"

        elif group_func["name"] not in ("count", "count_distinct") and col.name in (
            "ts",
            "revenue_impact",
        ):
            if col.name == "ts":
                label = "Timestamp"
            else:
                label = utils.title(col.name)
            return f"{display_func} {activity_name} {label} {relation}"

        else:
            return None

    # name all the features
    elif col.name.startswith("feature_") or (
        col.enrichment_table is not None and col.name not in ("enriched_ts", "enriched_activity_id")
    ):
        return f"{utils.title(relationship_slug)} {col.label}"

    # generic columns
    elif col.name not in ("customer"):
        # for backfill we need this - label should be correct
        if col.name == "ts":
            label = "Timestamp"
        elif col.name.startswith("ts."):
            label = col.name.split(".")[1]
        else:
            label = col.label

        return f"{utils.title(relationship_slug)} {activity_name} {label}"


def _group_column_name(col, func_slug, new_label=None):
    # get the full object
    group_func = ALL_AGG_FUNCTIONS[func_slug.lower()]

    # grab the label
    col_label = new_label or col.get("label")
    guessed_type = utils.guess_format(col_label)

    if group_func["name"] == "count_all":
        if col.get("activity_occurrence") not in (None, "all", "time"):
            return "Total Customers"
        else:
            return f'Total {clean_activity_name(col["activity_name"])} Rows'

    elif col.get("source_details") and col["source_details"].get("applied_function"):
        applied_func = col["source_details"]["applied_function"]

        # keep the label of the group
        if applied_func == group_func["name"] or (
            col_label.lower().startswith("total") and group_func["name"] == "sum"
        ):
            return col_label
        else:
            return f'{group_func["display_name"]} {col_label}'

    elif col_label.lower().startswith("total") and group_func["name"] == "sum":
        return col_label

    elif col_label.lower().endswith("s") and group_func["name"] == "sum":
        return col_label

    elif guessed_type == "revenue" and group_func["name"] == "sum":
        return f"Total {utils.plural(col_label)}"

    elif col.get("name"):
        return f'{group_func["display_name"]} of {col_label}s'

    # average of a 1/0 is actually a rate
    elif _is_conv_col(col) and group_func["name"] in (
        "average",
        "sum",
    ):
        label = " ".join([c for c in col_label.split(" ") if c.lower() not in ("did", "repeat", "before", "after")])

        if group_func["name"] == "average":
            # remove this from the metric
            label = label.replace(ENFORCE_ORDER_TEXT, "")

            # name this properly
            if col["source_details"].get("activity_kind") == "append":
                if "before" in col_label.lower():
                    return f"Percent of {label}"
                elif "repeat" in col_label.lower():
                    return f"Repeat Rate of {label}"
                else:
                    return f"Conversion Rate to {label}"
            else:
                return f"Rate of {label}"

        elif group_func["name"] == "sum":
            if "repeat" in col_label.lower():
                return f"Total Repeated {label}"
            else:
                return f"Total {label}"

    else:
        return f'{group_func["display_name"]} {col_label}'


@tracer.start_as_current_span("get_activity_columns")
def get_activity_columns(
    mavis,
    activity_ids: list[str],
    relationship_slug: RelationshipEnum = None,
    include_customer=False,
    stream_table=None,
    activities=None,
    include_values=True,
    cohort_activity_ids=None,
    cohort_occurrence=None,
    index=None,
    company_table=None,
):
    get_current_span().set_attributes(
        {
            "activity_id": activity_ids,
            "relationship_slug": relationship_slug.value if relationship_slug else "",
        }
    )

    # handle missing activities
    if activities is None:
        activities = {a.id: a for a in graph_client.get_activities_w_columns(ids=activity_ids).activities}

    # deal with sorting the ids so they can be compared
    if cohort_activity_ids and relationship_slug and relationship_slug.value == "first_in_between":
        cohort_activity_ids.sort()
        activity_ids.sort()
        is_repeat = cohort_activity_ids == activity_ids
    else:
        is_repeat = False

    is_time = cohort_activity_ids and utils.is_time(cohort_activity_ids[0])

    past_activities = dict()
    # get the activity
    activity = _get_activity(
        mavis,
        activities,
        activity_ids,
        include_values=include_values,
        past_activities=past_activities,
        company_table=company_table,
    )

    if not company_table:
        if stream_table:
            company_table = mavis.company.table(stream_table)
        elif activity:
            company_table = mavis.company.table(activity.activity_stream)
        else:
            company_table = mavis.company.tables[0]

    all_columns = []
    end_columns = []
    default_columns = []

    if relationship_slug and is_time:
        customer_addons = []

        # only add the customer addons for the first append
        if index is None or index == 1:
            if not relationship_slug.value.startswith("agg"):
                customer_addons.append(("customer", "Customer"))

            if activity.has_source:
                customer_addons.append(("join_customer", "Unique Identifier"))

        # add the customer add on
        for name, label in customer_addons:
            col = dict(
                name=name,
                label=label,
                mavis_type="string",
                type="string",
            )
            default_columns.append(col)
            all_columns.append(col)

    if relationship_slug is None:
        # add all the columns
        for c in activity.columns:
            # add better labeling of the activity column
            if cohort_occurrence in ("first", "last") and (
                c.name in ("revenue_impact", "activity_id") and c.name.startswith("feature_")
            ):
                c.label = f"{cohort_occurrence.title()} {c.label}"

            c.dropdown_label = c.label
            all_columns.append(c.dict())

            # add support for all timestamp columns
            if c.type == "timestamp":
                for r in qm_config.RESOLUTIONS[2:]:
                    # simplify the name
                    if c.name == "ts":
                        name = r.title()
                    else:
                        name = f"{r.title()} of {c.label}"
                    end_columns.append(
                        dict(
                            name=f"{c.name}.{r}",
                            dropdown_label=name,
                            label=name,
                            type="timestamp",
                            enrichment_table=c.enrichment_table,
                            enrichment_table_column=c.enrichment_table_column,
                            slowly_changing_ts_column=c.slowly_changing_ts_column,
                        )
                    )

            if (
                not c.enrichment_table
                and "." not in c.name
                and c.name
                not in (
                    "source",
                    "source_id",
                    "_activity_source",
                    "_run_at",
                    "anonymous_customer_id",
                    "activity_repeated_at",
                )
            ):
                default_columns.append(c.dict())

    # agg functions
    elif relationship_slug.value.startswith("agg"):
        # create the columns
        all_cols = [
            Column(**c)
            for c in get_activity_columns(
                mavis,
                activity_ids,
                activities=activities,
                include_values=False,
                company_table=company_table,
            )["all_columns"]
        ]

        for af in ALL_AGG_FUNCTIONS.values():
            for c in all_cols:
                label = _column_name(activity, c, relationship_slug.value, group_func=af)

                # ignore anything without a label
                if label is None:
                    continue

                # only include the agg functions that work
                if len(af["input_fields"]) > 0 and utils.get_simple_type(c.type) in af["input_fields"][0]["data"]:
                    col = dict(
                        name=f'{af["name"]}-{c.name}',
                        label=label,
                        enrichment_table=c.enrichment_table,
                        enrichment_table_column=c.enrichment_table_column,
                        slowly_changing_ts_column=c.slowly_changing_ts_column,
                        dropdown_label=f'{af["display_name"]} ({c.label})',
                        mavis_type=c.type,
                        type=_get_type(c.type, af["name"]),
                    )

                    # add the column
                    all_columns.append(col)

                    # add the count column by default
                    if col["name"] in ("count-ts", "sum-revenue_impact"):
                        default_columns.append(col)

    else:
        # add all the columns
        for c in activity.columns:
            label = _column_name(
                activity,
                c,
                relationship_slug.value,
                is_repeat=is_repeat,
            )
            if label:
                c.dropdown_label = str(c.label)
                c.label = label
                if c.name == "ts":
                    default_columns.append(c.dict())

                all_columns.append(
                    dict(
                        **c.dict(),
                        group_func=(["count_distinct"] if c.name in CUSTOMER_COLUMN_NAMES else None),
                    )
                )

        name_piece = (
            "from"
            if relationship_slug.value.endswith("before")
            or (relationship_slug.value == "first_ever" and cohort_occurrence != "first")
            else "to"
        )
        # add the main data
        for c in ("did", "did_with_order", "minute", "hour", "day", "week", "month"):
            if is_repeat:
                temp_label = "{first} Repeat {activity_name}".format(
                    activity_name=clean_activity_name(activity.name),
                    first="Did" if c == "did" else c + "s " + name_piece,
                )

            elif c == "did":
                temp_label = "Did {activity_name} {relative}".format(
                    activity_name=clean_activity_name(activity.name),
                    relative=relationship_slug.value.split("_")[-1],
                )

            elif c == "did_with_order":
                temp_label = "Did {activity_name} {relative} {context}".format(
                    activity_name=clean_activity_name(activity.name),
                    relative=relationship_slug.value.split("_")[-1],
                    context=ENFORCE_ORDER_TEXT,
                )

            else:
                temp_label = f"{c}s {name_piece} {clean_activity_name(activity.name)}"

            col = dict(
                name=f"{c}-{activity.slugified}",
                label=utils.title(temp_label),
                mavis_type="timestamp",
                type="integer" if c == "did" else "float",
            )
            col["dropdown_label"] = col["label"]

            # add the columns
            all_columns.append(col)

            # fixed indent
            if c in (
                "did",
                (company_table.default_time_between if company_table and company_table.default_time_between else "day"),
            ):
                default_columns.append(col)

    # add the customer columns
    if include_customer:
        # handle the case where there is no customer table
        if company_table and company_table.customer_dim_table_id:
            current_column_names = [c["name"] for c in all_columns]

            dim_table = graph_client.get_dim(id=company_table.customer_dim_table_id).dim_table_by_pk

            table_values = dict()
            # if include_values:
            #     table_values = {
            #         c["name"]: c["values"][:10] for c in mavis.get_index_file(dim_table.id, "dim_tables")["columns"]
            #     }

            all_columns.extend(
                [
                    dict(
                        name=f"{dim_table.table}-{c.name}",
                        mavis_type=c.type,
                        type=utils.get_simple_type(c.type),
                        label=utils.title(c.label),
                        dropdown_label=c.label,
                        opt_group=get_opt_group(f"{dim_table.table}-{c.name}"),
                        values=table_values.get(c.name, []),
                    )
                    for c in dim_table.columns
                    if c.name not in current_column_names
                ]
            )

    # move all the columns to the bottom
    all_columns.extend(end_columns)
    return dict(all_columns=all_columns, default_columns=default_columns)


@tracer.start_as_current_span("generate_dataset_obj")
def generate_dataset_obj(mavis, dataset_config: DatasetConfig, use_all_columns: bool = False):
    # for the edge that 2 join-customers are added then remove one
    # TODO make mavis aware of the append activities so it only defaults it for the first one
    found_join = False
    for a in dataset_config.append_activities:
        if found_join:
            a.columns = [c for c in a.columns if c.name != "join_customer"]
        elif any(c for c in a.columns if c.name == "join_customer"):
            found_join = True

    # note: maybe valuable to combine the activities
    (activity_objects, columns) = _get_activities_and_columns(mavis, dataset_config, use_all_columns=use_all_columns)

    dataset_obj = _create_dataset_obj(activity_objects, columns)
    return dict(staged_dataset=dataset_obj)


def apply_quick_explore(dataset: Dataset, plan, column, filter=None, remove_filters=False):
    # get all the objects
    activity_objs = {a["id"]: a for a in dataset.obj["query"]["activities"]}

    # get the proper columns
    current_cols = {c["id"]: c for c in dataset.obj["query"]["columns"]}

    # handle adding the columns to the plan
    for p in plan:
        if p.mutation == p.mutation.ADD:
            current_cols[p.new_column["id"]] = p.new_column

            # add the ID if it exists
            if column.column_id is None and _is_same_col(
                column.column, activity_objs[column.activity_id], p.new_column
            ):
                column.column_id = p.new_column["id"]

    if column.column_id:
        desired_col = current_cols[column.column_id]
    else:
        (desired_col, _) = _convert_column_config_to_col(
            dataset.mavis, activity_objs[column.activity_id], column.column, None
        )

        _add_action(plan, "add", new_column=desired_col)

    # only remove filters if column id exists
    if remove_filters and column.column_id:
        _add_action(plan, "remove_filters", column=desired_col)

    _add_action(plan, "add_filter", filter=filter.dict(), column=desired_col)

    return plan


def find_time_res_column(dataset: Dataset, update_to=None):
    time_res = None
    # Find the date_trunc column
    for c in dataset.ds.get_all_columns(dataset.obj["query"], force_uniqueness=True):
        if c["source_kind"] == "computed":
            try:
                col = dataset.ds.raw_string_to_col(c["source_details"])
            except Exception:
                col = None

            if col and col.function == "date_trunc":
                time_res = col.fields["datepart"]

                # if needed sawp everything
                if update_to and update_to != time_res:
                    word_mapping = [
                        utils.Mapping(
                            old_id=utils.slugify(time_res),
                            new_id=utils.slugify(update_to),
                        ),
                        utils.Mapping(old_id=utils.title(time_res), new_id=utils.title(update_to)),
                    ]

                    # replace all the words
                    utils.recursive_apply(
                        c["source_details"],
                        utils.replace_str,
                        word_mapping=word_mapping,
                    )

                    # replace it for every group too
                    for g in dataset.obj["query"]["all_groups"]:
                        g["name"] = utils.replace_str(g["name"], word_mapping=word_mapping)

                        # update group by columns
                        for tc in g["columns"]:
                            tc["label"] = utils.replace_str(tc["label"], word_mapping=word_mapping)

                        # handle all the plots
                        for p in g["plots"]:
                            p["name"] = utils.replace_str(p["name"], word_mapping=word_mapping)
                            utils.recursive_apply(
                                p["config"]["axes"],
                                utils.replace_str,
                                word_mapping=word_mapping,
                            )

    return time_res


def _get_activity_id(c):
    return c["source_details"].get("activity_id")


def _can_add(columns, c, activity_id, cohort_id=None):
    if cohort_id and cohort_id == activity_id and c.name == "ts":
        return False

    if c.name.split("-")[0] in [
        "list_agg",
        "did_with_order",
        "second",
        "minute",
        "quarter",
        "year",
    ]:
        return False

    if c.name.split(".")[-1] in qm_config.RESOLUTIONS:
        return False

    if c.name.startswith("_") or c.name in ("activity_repeated_at",):
        return False

    for tc in columns:
        if tc.column and c.name == tc.column.name and activity_id == tc.activity_id:
            return False
    return True


def _add_id(col):
    if isinstance(col, PossibleColumnMetric):
        col.id = md5(  # noqa: S303
            f"{col.column_id or (col.column.name if col.column else '')}_{col.computed_string or ''}_{col.agg_function.lower() if col.agg_function else None}".encode(),
            usedforsecurity=False,
        ).hexdigest()
    else:
        col.id = md5(  # noqa: S303
            f"{col.column_id or (col.column.name if col.column else '')}_{col.activity_id or ''}".encode(),
            usedforsecurity=False,
        ).hexdigest()


@tracer.start_as_current_span("get_possible_metric_columns")
def get_possible_metric_columns(dataset):
    orignial_to_idx = {}
    y_metrics = []
    added_ids = []

    # Add the count Columns
    desired_col = PossibleColumnMetric(
        column_id=None,
        agg_function="count_all",
        label="Total rows",
        opt_group="Metrics",
        display_format=None,
    )
    _add_id(desired_col)
    y_metrics.append(desired_col)

    # go through all the columns
    for g in dataset.obj["query"]["all_groups"]:
        for c in g["metrics"]:
            if c["agg_function"].lower() == "percentile_cont":
                continue

            if c["agg_function"].lower() == "rate":
                af = f'{c["agg_function"].lower()}.{".".join(c.get("conditioned_on_columns") or [])}'
            else:
                af = c["agg_function"].lower()
            try:
                desired_col = PossibleColumnMetric(
                    column_id=c["column_id"],
                    agg_function=af,
                    label=c["label"],
                    opt_group="Group Metrics",
                    display_format=c.get("display_format"),
                )
                _add_id(desired_col)
            except Exception:
                logger.error("Failed to create possible column metric", metric=c)
                continue

            if desired_col.id not in orignial_to_idx.values():
                # add the y metric
                y_metrics.append(desired_col)

            orignial_to_idx[f'{g["slug"]}.{c["id"]}'] = desired_col.id
            added_ids.append(c["id"])

        for c in g["computed_columns"]:
            raw_string = dataset.ds._get_computed_raw_string(c["source_details"])

            # don't bother if the computed column is on the group columns
            if raw_string is None or any(
                gc["id"] in raw_string for gc in dataset.ds.get_group_columns(g) if gc["column_kind"] != "metrics"
            ):
                continue

            # Replace all the metrics with IDs
            for mc in sorted(g["metrics"], key=lambda x: len(x["id"]), reverse=True):
                raw_string = raw_string.replace(
                    mc["id"],
                    orignial_to_idx[f'{g["slug"]}.{mc["id"]}'],
                )

            # add the columns
            desired_col = PossibleColumnMetric(
                computed_string=raw_string,
                label=c["label"],
                opt_group="Computed Metrics",
                display_format=c.get("display_format"),
            )
            _add_id(desired_col)

            if desired_col.id not in orignial_to_idx.values():
                # add the y metric
                y_metrics.append(desired_col)

            orignial_to_idx[f'{g["slug"]}.{c["id"]}'] = desired_col.id

    # Add the possible columns
    for c in dataset.obj["query"]["columns"]:
        agg_funcs = c.get("group_func") or []

        # aad a couple of extra cols
        if utils.same_types(c["type"], "string"):
            agg_funcs.append("count_distinct")
        if utils.same_types(c["type"], "number"):
            agg_funcs.extend(["sum", "average"])

        for agg_func in set(agg_funcs):
            # handle rates
            af = agg_func.split("#")[0].lower()

            if af == "rate" or af.startswith("rate"):
                continue

            label = _group_column_name(c, af)

            try:
                desired_col = PossibleColumnMetric(
                    column_id=c["id"],
                    agg_function=af,
                    label=label,
                    display_format=(agg_func.split("#")[1].lower() if "#" in agg_func else None),
                    opt_group="Dataset Metrics",
                )
            except Exception:
                logger.exception("Failed to create possible column metric", agg_func=agg_func)
                continue

            _add_id(desired_col)

            if desired_col.id not in orignial_to_idx.values():
                # add the y metric
                y_metrics.append(desired_col)

    return (y_metrics, orignial_to_idx)


def _is_same_col(column_config, config_activity, dataset_col):
    if dataset_col["name"]:
        if column_config.name.split("-")[-1] == dataset_col["name"] and config_activity["id"] == _get_activity_id(
            dataset_col
        ):
            return True
    elif column_config.name:
        if _map_definitions_name(config_activity, dataset_col) == column_config.name:
            return True

    return False


@tracer.start_as_current_span("get_quick_explore_columns")
def get_quick_explore_columns(dataset: Dataset, just_cohort=False, add_values=True):
    # get the config
    dataset_config = DatasetConfig(**make_definition(dataset, include_values=add_values))

    cohort = _get_cohort_activity(dataset.obj["query"])

    # Don't bother with time cohorts
    if is_time_activity(cohort):
        raise SilenceError("Explore is not supported on TIME cohorts")

    columns = []
    time_filter = None

    current_cols = dataset.ds.get_all_columns(dataset.obj["query"], force_uniqueness=True)
    activity_objs = {a["id"]: a for a in dataset.obj["query"]["activities"]}

    activity_cols = {dataset_config.cohort.original_activity_id: dataset_config.cohort.all_columns}

    selected_filters = []
    for a in dataset_config.append_activities:
        activity_cols[a.original_activity_id] = a.all_columns

    # go through the columns
    for c in current_cols:
        activity_id = _get_activity_id(c)

        if activity_id:
            # don't add the time filters
            if activity_id == cohort["id"] and c["name"] == "ts" and c["filters"]:
                time_filter = c["filters"][0]

            # get the column from the options
            temp_col = next(
                (tc for tc in activity_cols[activity_id] if _is_same_col(tc, activity_objs[activity_id], c)),
                None,
            )

            # HACK: Handle join customer for now
            if temp_col is None and c.get("name") == "join_customer":
                c["name"] = "customer"
                temp_col = next(
                    (tc for tc in activity_cols[activity_id] if _is_same_col(tc, activity_objs[activity_id], c)),
                    None,
                )

        else:
            temp_col = dict(label=c["label"], type=c["type"], name="")

        # add all the columns
        output_col = dict(
            column_id=c["id"],
            column=temp_col,
            activity_id=activity_id,
            label=c["label"],
            opt_group="Dataset Columns",
        )
        columns.append(PossibleColumn(**output_col))

        for f in c["filters"]:
            selected_filters.append(PossibleColumnFilter(**output_col, filter=f))

    # add all the columns from cohort:
    for activity_id, all_cols in activity_cols.items():
        for c in all_cols:
            if _can_add(columns, c, activity_id, cohort["id"]):
                # add the activity id
                if activity_id == cohort["id"]:
                    if "-" in c.name:
                        opt_group = "Customer Attributes"
                    else:
                        opt_group = "Cohort Attributes"
                else:
                    opt_group = "Advanced Columns"

                # add the column
                columns.append(
                    PossibleColumn(
                        column_id=None,
                        column=c,
                        activity_id=activity_id,
                        label=c.label,
                        opt_group=opt_group,
                    )
                )

    # only add the cohort column
    if just_cohort:
        columns = [c for c in columns if c.activity_id == cohort["id"]]

    # add all the column_ids
    for c in columns:
        _add_id(c)

    return (columns, selected_filters, time_filter)


@tracer.start_as_current_span("get_all_possible_metrics")
def get_all_possible_metrics(dataset_obj):
    (plan, _) = _create_group(dataset_obj, [])
    return [p.new_column for p in plan if p.mutation == MutationEnum.ADD]


def __clean_activity_kind(kind):
    if kind == "conversion":
        return "append"
    return kind


def _relationship_id(r):
    pieces = [r["slug"]]
    if r["slug"] == "relative_to":
        pieces.extend(
            [
                r["relation"],
                r.get("relative_occurrence") or "first",
                ",".join(r["relative_to_activity_slug"]),
            ]
        )
    elif r["slug"] == "cohort_column":
        pieces.extend([r["cohort_column_name"], r["column_name"]])
    return "-".join(pieces)


def _activity_id(dataset: Dataset, a, before_activities=None, full=False):
    if isinstance(a["slug"], str):
        a["slug"] = [a["slug"]]

    if full:
        # create the column case filter
        query = dataset.ds._create_case_column_filter(dict(a, recompute_occurrence=False)).to_query()

        # creates a unique id
        return (
            query
            + ",".join([_relationship_id(r) for r in a.get("relationships", [])])
            + __clean_activity_kind(a["kind"])
            + a.get("relationship_slug", "")
            + (a["occurrence"] if a["kind"] == "limiting" else "")
            + str(a.get("resolution_filter", ""))
        )
    else:
        # keep track of how often you see this activity
        c = len([ba for ba in before_activities or [] if str(sorted(ba["slug"])) == str(sorted(a["slug"]))])
        return str(c) + str(sorted(a["slug"]))


@tracer.start_as_current_span("diff_dataset")
def diff_dataset(dataset: Dataset, staged_dataset):
    plan = []

    # create the ids based on the query
    current_activities = {
        _activity_id(dataset, a, before_activities=dataset.obj["query"]["activities"][:ii]): a
        for ii, a in enumerate(dataset.obj["query"]["activities"])
    }
    # add the full ids because when you delete a middle one, we want to ensure our ids don't get all muddled up
    all_current_full_ids = {
        _activity_id(dataset, v, full=True): v | dict(short_key=k) for k, v in current_activities.items()
    }

    # make sure all the config and reference are set up
    new_activities = {
        _activity_id(dataset, a, before_activities=staged_dataset["query"]["activities"][:ii]): dict(**a, ii=ii)
        for ii, a in enumerate(staged_dataset["query"]["activities"])
    }

    # reorder based on the activities
    for k, v in new_activities.items():
        if current_activities.get(k):
            current_activities[k]["ii"] = v["ii"]

    ts_mappings = []
    for new_id, new_activity in new_activities.items():
        # add missing activity
        new_cols = {
            utils.slugify(c["label"]): c
            for c in dataset.ds.get_activity_columns(staged_dataset["query"], new_activity, include_computed=True)
        }

        # check if the activity is NEW
        if current_activities.get(new_id) is None:
            # Add the activity
            _add_action(plan, "add_activity", activity=new_activity)
            for c in new_cols.values():
                _add_action(plan, "add", new_column=c)
                _add_group_func_columns(dataset.obj, plan, c)

        else:
            current_a = current_activities.get(new_id)
            # check to see if anything else changed with the activities
            new_full_id = _activity_id(dataset, new_activity, full=True)
            if all_current_full_ids.get(new_full_id):
                # swap out the current_activities in case the same activity with different slugs was used
                current_activities[all_current_full_ids[new_full_id]["short_key"]] = current_a
                current_activities[new_id] = current_a
                current_a = all_current_full_ids[new_full_id]
            else:
                new_activity["temp_id"] = new_id
                _add_action(plan, "update_activity", activity=new_activity)

            # update the activity with the activity ids
            current_a["activity_ids"] = new_activity["activity_ids"]
            current_a["name"] = new_activity["name"]

            # The activity already exists so check to see if the columns have changed
            current_cols = {
                utils.slugify(c["label"]): c
                for c in dataset.ds.get_activity_columns(
                    dataset.obj["query"],
                    current_a,
                    include_computed=True,
                )
            }

            # get the timestamp columns
            new_ts_column_id = next((c["id"] for _, c in new_cols.items() if c["name"] == "ts"), None)
            current_ts_column_id = next(
                (c["id"] for _, c in current_cols.items() if c["name"] == "ts"),
                None,
            )

            # add the timestamp replacements
            if new_ts_column_id and current_ts_column_id:
                ts_mappings.append((new_ts_column_id, current_ts_column_id))

            # add all the missing columns
            for n_id, n_c in new_cols.items():
                if not current_cols.get(n_id):
                    n_c["source_details"]["activity_id"] = current_a["id"]

                    # deal with swapping out the dependent ids for all the timestamp
                    for rep_maps in ts_mappings:
                        # swap the values (raw string)
                        dataset.ds._swap_id(
                            n_c["source_details"],
                            rep_maps[0],  # new timestamp id
                            rep_maps[1],  # current_ts_id
                        )

                        # Also swap out the group func as well
                        dataset.ds._swap_id(
                            n_c,
                            rep_maps[0],  # new timestamp id
                            rep_maps[1],  # current_ts_id
                        )

                    _add_action(plan, "add", new_column=n_c)
                    _add_group_func_columns(dataset.obj, plan, n_c)

            # add all the missing columns
            for c_id, c_c in current_cols.items():
                if not new_cols.get(c_id):
                    _add_action(plan, "delete", column=c_c)
                    _add_delete_metric(dataset, plan, c_c)

    # Look for removals of activities
    for current_id, current_activity in current_activities.items():
        # Check if the activity does not exists
        if new_activities.get(current_id) is None:
            _add_action(plan, "delete_activity", activity=current_activity)

            # delete all the columns
            for c in dataset.ds.get_activity_columns(dataset.obj["query"], current_activity, include_computed=True):
                _add_action(plan, "delete", column=c)
                _add_delete_metric(dataset, plan, c)

    res = _update_plan(dataset, plan)

    # resort the activities
    res["staged_dataset"]["query"]["activities"] = sorted(
        res["staged_dataset"]["query"]["activities"], key=lambda k: k["ii"]
    )

    return res


@tracer.start_as_current_span("_add_action")
def _add_action(plan, mutation, **kwargs):
    temp_a = EditAction(mutation=mutation, **kwargs)
    if not _is_in_plan(plan, temp_a):
        plan.append(temp_a)
        return True
    return False


def _find_or_add_time_column(dataset: Dataset, resolution, plan, time_column=None):
    query_obj = dataset.query
    cohort_ts_column = _get_cohort_column(query_obj, "ts")

    # create the truncated column
    if time_column is None:
        time_column = _create_computed_column(
            "date_trunc('{}', {})".format(resolution, cohort_ts_column["id"]),
            (
                "{} of {}".format(utils.title(resolution), cohort_ts_column["label"])
                if cohort_ts_column["label"].lower() != "timestamp"
                else utils.title(resolution)
            ),
        )

    # check if the column exist and use the one found or the new one
    found_column = _check_columns(dataset, query_obj["columns"], time_column)

    # add it if it is missing
    if not found_column:
        # if the column doesn't exist then add the new column
        _add_action(plan, "add", new_column=time_column)

    return found_column or time_column


def _make_config_filters(activity_filters):
    filts = []

    for f in activity_filters:
        if f.get("activity_column"):
            filts.append(
                dict(
                    activity_column=dataset_column_to_activity_column(f["activity_column"]),
                    filter=f["filter"],
                    activity_column_name=f.get("activity_column_name"),
                )
            )
        else:
            # FOR BACKFILL
            filts.append(
                dict(
                    filter=f["filter"],
                    activity_column_name=f.get("activity_column_name"),
                    column_type=f.get("column_type"),
                    enrichment_table=f.get("enrichment_table"),
                    enrichment_table_column=f.get("enrichment_table_column"),
                )
            )

    return filts


def _make_cohort_column_filters(r):
    if r.get("cohort_column"):
        res = dict(
            operator=r["operator"],
            cohort_column=dataset_column_to_activity_column(r["cohort_column"]),
            append_column=dataset_column_to_activity_column(r["append_column"]),
            cohort_column_name=r.get("cohort_column_name"),
            append_column_name=r.get("column_name"),
        )
    else:
        # FOR THE BACKFILL
        res = dict(
            operator=r["operator"],
            cohort_column_name=r.get("cohort_column_name"),
            append_column_name=r.get("column_name"),
            cohort_column_enrichment_table=r.get("cohort_column_enrichment_table"),
            column_name_enrichment_table=r.get("column_name_enrichment_table"),
            column_name_enrichment_table_column=r.get("column_name_enrichment_table_column"),
        )

    return res


@tracer.start_as_current_span("_fix_dataset_activity_ids")
def _fix_dataset_activity_ids(query_obj, missing_activity_ids, activities_by_slug, activity_index):
    all_slugs = {a.slug: a.id for a in activity_index}

    all_new_activities = []
    # go through each activity and fix it
    for activity in query_obj["activities"]:
        if activity is None or not activity.get("activity_ids"):
            continue

        # remove all the activity ids
        activity["activity_ids"] = [a for a in activity["activity_ids"] if a not in missing_activity_ids]

        new_activity_ids = [
            all_slugs[s] for s in activity["slug"] if not activities_by_slug.get(s) and all_slugs.get(s)
        ]
        # add all the ids using the slugs that were not there
        activity["activity_ids"].extend(new_activity_ids)
        all_new_activities.extend(new_activity_ids)

    if all_new_activities:
        return graph_client.get_activities_w_columns(ids=all_new_activities).activities
    else:
        return []


@tracer.start_as_current_span("make_definition")
def make_definition(dataset: Dataset, include_values=True):
    stream_table = (
        dataset.obj["query"].get("activity_stream")
        or dataset.obj["query"]["activities"][0]["config"]["activity_stream"]
    )

    company_table = dataset.mavis.company.table(stream_table)

    all_activity_ids = list(utils.list_activities(dataset.obj["query"]).keys())
    all_activity_slugs = utils.list_activity_slugs(dataset.obj["query"])

    # split the data
    all_activities = graph_client.get_activities_w_columns(ids=all_activity_ids).activities

    activities_by_slug = {a.slug: a for a in all_activities}
    activities_by_id = {a.id: a for a in all_activities}

    # find activity_ids not in the activity_by_id dict
    missing_activity_ids = set(all_activity_ids) - set(activities_by_id.keys())
    missing_slugs = set(all_activity_slugs) - set(activities_by_slug.keys())
    new_activities = []

    # if anything is wrong then get all the activities
    if missing_activity_ids or missing_slugs:
        activity_index = graph_client.activity_index(dataset.mavis.company.id).all_activities

    # fix the activity ids
    if missing_activity_ids:
        new_activities = _fix_dataset_activity_ids(
            dataset.obj["query"],
            missing_activity_ids,
            activities_by_slug,
            activity_index,
        )

    # add all the missing slugs
    if missing_slugs:
        new_activities = graph_client.get_activities_w_columns(
            ids=[a.id for a in activity_index if a.slug in missing_slugs]
        ).activities

    # add the activities to the dict
    all_activities.extend(new_activities)
    activities_by_id.update(**{a.id: a for a in new_activities})
    activities_by_slug.update(**{a.slug: a for a in new_activities})

    cohort_obj = dataset.obj["query"]["activities"][0]
    if not cohort_obj["slug"]:
        cohort_activity_ids = cohort_obj.get("activity_ids")
    else:
        cohort_activity_ids = [activities_by_slug[s].id for s in cohort_obj["slug"] if activities_by_slug.get(s)]

    cohort_columns = get_activity_columns(
        dataset.mavis,
        cohort_activity_ids,
        None,
        stream_table=stream_table,
        activities=activities_by_id,
        include_customer=True,
        include_values=include_values,
    )["all_columns"]
    # map the cohort
    cohort = dict(
        name_override=cohort_obj.get("name_override"),
        kpi_locked=cohort_obj.get("kpi_locked") or False,
        original_activity_id=cohort_obj["id"],
        activity_ids=cohort_activity_ids,
        columns=[
            dataset_column_to_activity_column(c)
            for c in dataset.obj["query"]["columns"]
            if (c["source_kind"] == "activity" and c["source_details"].get("activity_id") == cohort_obj["id"])
            or c["source_kind"] == "customer"
        ],
        all_columns=cohort_columns,
        raw_columns=cohort_columns,
        occurrence_filter=dict(
            occurrence=cohort_obj["occurrence"],
            custom_value=cohort_obj["occurrence_value"],
            resolution=(cohort_activity_ids[0] if utils.is_time(cohort_activity_ids[0]) else None),
            resolution_filter=cohort_obj.get("resolution_filter"),
        ),
        column_filters=_make_config_filters(cohort_obj["filters"]),
    )

    # create the append activities
    append_activities = []
    for ac in dataset.obj["query"]["activities"][1:]:
        append_activity_ids = [activities_by_slug[s].id for s in ac["slug"] if activities_by_slug.get(s)]
        if len(append_activity_ids) == 0:
            continue

        # add the relationship_slug
        if ac.get("relationship_slug"):
            relationship_slug = ac["relationship_slug"]
        else:
            relationship_slug = next(
                k
                for k, v in RELATIONSHIPS.items()
                if v["occurrence"] == ac.get("occurrence")
                and v["relationship_slug"]
                == next(
                    (
                        r["slug"]
                        for r in ac["relationships"]
                        if r["slug"]
                        in (
                            "within_cohort",
                            "before",
                        )
                    ),
                    None,
                )
            )

        append_activity = dict(
            name_override=ac.get("name_override"),
            kpi_locked=ac.get("kpi_locked") or False,
            original_activity_id=ac["id"],
            activity_ids=append_activity_ids,
            relationship_slug=relationship_slug,
            columns=[
                dataset_column_to_activity_column(c, ac)
                for c in dataset.obj["query"]["columns"]
                if c["source_details"].get("activity_id") == ac["id"]
            ],
            column_filters=_make_config_filters(ac["filters"]),
            time_filters=[
                dict(
                    time_option=r["slug"],
                    resolution=r["relationship_time"],
                    value=r["relationship_time_value"],
                )
                for r in ac["relationships"]
                if r["slug"].endswith("_time")
            ],
            relative_activity_filters=[
                dict(
                    relative_relationship=r["relation"],
                    activity_ids=[
                        activities_by_slug.get(rs).id
                        for rs in r["relative_to_activity_slug"]
                        if activities_by_slug.get(rs)
                    ],
                    relative_occurrence=r.get("relative_occurrence") or "first",
                    or_null=r.get("or_null", True),
                )
                for r in ac["relationships"]
                if r["slug"] == "relative_to"
            ],
            cohort_column_filters=[
                _make_cohort_column_filters(r) for r in ac["relationships"] if r["slug"] == "cohort_column"
            ],
            all_columns=get_activity_columns(
                dataset.mavis,
                append_activity_ids,
                RelationshipEnum(relationship_slug),
                stream_table=stream_table,
                activities=activities_by_id,
                include_values=include_values,
                cohort_activity_ids=cohort_activity_ids,
            )["all_columns"],
            # TODO : remove join_customer
            raw_columns=[
                c
                for c in get_activity_columns(
                    dataset.mavis,
                    append_activity_ids,
                    None,
                    stream_table=stream_table,
                    activities=activities_by_id,
                    include_values=include_values,
                )["all_columns"]
                if c["name"] not in ("join_customer")
            ],
        )

        # if it exists then append the columns
        for temp_a in append_activities:
            if all(v == append_activity[k] for k, v in temp_a.items() if k != "columns"):
                temp_a["columns"].extend(append_activity["columns"])
                break
        else:
            append_activities.append(append_activity)

    # create the dataset
    dataset_config = dict(
        activity_stream=company_table,
        cohort=cohort,
        append_activities=append_activities,
    )
    return dataset_config


@tracer.start_as_current_span("add_group")
def add_group(dataset: Dataset, column_ids=None, time_window: TimeWindow = None, template=None):
    # create the group
    (plan, group_slug) = _create_group(dataset.obj, column_ids or [], time_window)
    name_col = {c["id"]: c["name"] for c in dataset.ds.get_all_columns(dataset.obj["query"]) if c.get("name")}

    ui_instructions = [
        dict(
            kind=UIKindEnum.GO_TO_GROUP,
            group_slug=group_slug,
        )
    ]

    if any(name_col.get(c_id) in CUSTOMER_COLUMN_NAMES for c_id in column_ids):
        ui_instructions.append(
            dict(
                kind=UIKindEnum.PUSH_NOTIFICATION,
                notification=utils.Notification(
                    type=utils.NotificationTypeEnum.WARNING,
                    duration=5,
                    message="Grouping by customer is not recommended, Use FIRST or LAST.",
                    description="If your trying to get a unique row per user, then change the occurrence in the edit definition to be first or last",
                ),
            )
        )
    elif any(name_col.get(c_id) in ("ts", "activity_id") for c_id in column_ids):
        ui_instructions.append(
            dict(
                kind=UIKindEnum.PUSH_NOTIFICATION,
                notification=utils.Notification(
                    type=utils.NotificationTypeEnum.WARNING,
                    duration=5,
                    message="Grouping by a raw columns is not common.",
                    description="Please start a chat so we can better guide you on your dataset.",
                ),
            )
        )

    plan_exec = _update_plan(dataset, plan, ui_instructions=ui_instructions)

    return plan_exec


@tracer.start_as_current_span("_update_swap")
def _update_swap(staged_dataset: Dataset, plan, action, all_dependents=None):
    # guess an appropriate column
    (action.new_column, action.allowed_columns) = _guess_swap_column(staged_dataset, action, plan)
    added = False
    # if there are no valid type then delete the columns
    if action.new_column is None:
        new_plan = []
        if all_dependents is None:
            all_dependents = _get_all_dependents(staged_dataset, action.group_slug, action.column["id"])

        # cascade delete the column
        for col_group_slug, dependents in all_dependents:
            for c in dependents:
                _add_action(
                    new_plan,
                    "delete",
                    group_slug=col_group_slug,
                    column=c,
                    column_kind=c.get("column_kind"),
                )
                added = True

        # reorder to be the first
        plan.remove(action)
        for temp_p in new_plan:
            plan.insert(0, temp_p)

    return added


def dataset_column_to_activity_column(c, append_activity=None):
    if append_activity:
        name = _map_definitions_name(append_activity, c)
    else:
        if c["source_kind"] != "activity" and c.get("source_details", {}).get("table"):
            (_, table_name, _) = utils.expand_table(c["source_details"]["table"])
            name = f'{table_name}-{c["name"]}'
        else:
            name = c["name"]

    col = dict(
        name=name,
        mavis_type=c.get("mavis_type"),
        type=c.get("type"),
        label=utils.title(c["label"]),
        enrichment_table=c["source_details"].get("enrichment_table"),
        enrichment_table_column=c["source_details"].get("enrichment_table_column"),
        slowly_changing_ts_column=c["source_details"].get("slowly_changing_ts_column"),
        kpi_locked=c.get("kpi_locked") or False,
    )
    col["opt_group"] = get_opt_group(
        col["name"] or "",
        enrichment_table=col["enrichment_table"],
        slowly_changing_ts_column=col["slowly_changing_ts_column"],
    )

    return col


def get_opt_group(name, enrichment_table=None, slowly_changing_ts_column=None):
    if "-" in name:
        return "Customer Dims"
    elif enrichment_table and isinstance(enrichment_table, dict):
        if slowly_changing_ts_column:
            return f"Slowly Changing Dims ({enrichment_table['table']})"
        else:
            return f"Additional Dims ({enrichment_table['table']})"
    elif enrichment_table:
        return f"Additional Dims ({enrichment_table})"
    else:
        return "Activity Dims"


# deal with plan and casting it
def _update_plan(
    dataset: Dataset,
    plan: list[EditAction],
    ui_instructions=None,
    compile_all_sql=True,
) -> PlanExecution:
    # loop through the plan and check if there is any dependencies
    updated = False  # did the plan change at all
    added = True  # did we add something so we need to try again

    # keep trying to reprocess until your data converges
    count = 0
    while added:
        added = False
        # create the dataset
        staged_dataset = Dataset(mavis=dataset.mavis, obj=deepcopy(dataset.obj))

        dataset.ds.get_all_columns(staged_dataset.obj["query"], force_uniqueness=True)

        # add all the columns and deletes
        for action in plan:
            if action.mutation != action.mutation.SWAP_ID:
                _implement_action(staged_dataset, action)

        # refresh the main columns
        dataset.ds.get_all_columns(staged_dataset.obj["query"], force_uniqueness=True)

        # now try to swap the columns
        for action in plan:
            added = _get_cascading_impact(staged_dataset, plan, action)
            if added:
                updated = True
                break

            if action.mutation == action.mutation.SWAP_ID:
                _implement_action(staged_dataset, action)

        count += 1

        if count > 2000:
            raise InternalError("Code hit an infinite loop")

    # JUST FOR BACKFILL
    for ac in staged_dataset.obj["query"]["activities"]:
        if ac["kind"] != "limiting" and not ac.get("relationship_slug"):
            ac["relationship_slug"] = next(
                (
                    k
                    for k, v in RELATIONSHIPS.items()
                    if v["occurrence"] == ac.get("occurrence")
                    and v["relationship_slug"]
                    == (ac["relationships"][0]["slug"] if len(ac["relationships"]) > 0 else None)
                ),
                None,
            )

    # # reorder the activities
    _fix_activities_and_columns(staged_dataset)

    # Compile the SQL to ensure the data is correct
    staged_compiled_sql = []

    res = dict(
        plan=plan,
        show_user=_decide_to_show_user(plan) if updated else False,
        staged_dataset=staged_dataset.obj,
        staged_compiled_sql=staged_compiled_sql,
        ui_instructions=ui_instructions,
    )

    # updated the show user
    if not res["show_user"] and len([p for p in plan if p.mutation == p.mutation.SWAP_ID]) > 0:
        res["ui_instructions"] = [
            dict(
                kind=UIKindEnum.PUSH_NOTIFICATION,
                notification=utils.Notification(
                    message="Updated dependent columns caused by this change",
                    description=", ".join(
                        "Swapped `{from_name}` -> `{to_name}`".format(
                            from_name=p.column["label"], to_name=p.new_column["label"]
                        )
                        for p in plan
                        if p.mutation == p.mutation.SWAP_ID
                    ),
                ),
            )
        ]

    return res


def _decide_to_show_user(plan):
    """
    Only prompt the user with the reconciler if a decision (swap) needs to be made and we are less than 80% confident in
    our choice
    """
    if any(
        p
        for p in plan
        if p.mutation == p.mutation.SWAP_ID and p.new_column.get("probability", 0.0) < TO_SHOW_PROBABILITY
    ):
        return True
    else:
        return False


def _get_cascading_impact(dataset: Dataset, plan, action: EditAction) -> list[EditAction]:
    added = False

    # setup the column mapper
    if action.group_slug:
        group = dataset.ds.get_group_from_slug(dataset.obj["query"], action.group_slug)
        # run this to add all the ids
        group_columns = dataset.ds.get_all_columns(dataset.obj["query"], group, force_uniqueness=True)
    else:
        group = None

    # only check for cascading on delete
    if action.mutation == action.mutation.DELETE:
        all_dependents = _get_all_dependents(dataset, action.group_slug, action.column["id"])

        for _, dependents in all_dependents:
            # check if the column is in the dependent column
            if len(dependents) > 0:
                # get all the valid type
                required_types = dataset.ds._get_valid_types(dependents, action.column["id"])

                added = added or _add_action(
                    plan,
                    "swap_id",
                    group_slug=action.group_slug,
                    column_kind=action.column_kind,
                    column=action.column,
                    # TODO: add depends on
                    limited_types=required_types,
                    mavis_created=True,
                )

                if added:
                    _update_swap(
                        dataset,
                        plan,
                        plan[-1],
                        all_dependents=all_dependents,
                    )

    elif action.mutation == action.mutation.SWAP_ID and action.column.get("pivoted"):
        # Delete all pivoted dependent columns
        for c in group_columns:
            if action.column["id"] in dataset.ds._get_all_column_ids(c):
                added = added or _add_action(
                    plan,
                    "delete",
                    group_slug=action.group_slug,
                    column_kind=c.get("column_kind"),
                    column=c,
                    mavis_created=True,
                )
    elif action.mutation == action.mutation.SWAP_ID and action.new_column is None:
        # # deal with swapping and fill in the values
        added = added or _update_swap(dataset, plan, action)

    return added


def _get_all_dependents(dataset: Dataset, group_slug, column_id):
    all_dependents = []

    if group_slug:
        all_groups = [("group", dataset.ds.get_group_from_slug(dataset.obj["query"], group_slug))]
    else:
        # go through all the objects independently to deal with column mapper
        all_groups = [("group", g) for g in dataset.obj["query"]["all_groups"]]
        all_groups.append(
            (
                "parent",
                {k: v for k, v in dataset.obj["query"].items() if k != "all_groups"},
            )
        )

    for kind, obj in all_groups:
        current_group_slug = obj["slug"] if kind == "group" else None

        # setup the group replacement
        dataset.ds.get_all_columns(
            dataset.obj["query"],
            group=obj if kind == "group" else None,
            force_uniqueness=True,
        )

        # check all the references
        dependents = dataset.ds._get_all_column_ids(obj, return_col=True, only_id=column_id)

        # add all the dependencies
        all_dependents.append((current_group_slug, dependents))

    return all_dependents


@tracer.start_as_current_span("_add_group_func_columns")
def _add_group_func_columns(dataset_obj, plan, column):
    added_cols = []
    group_column_renames = dict()
    # if you adding a column with group functions the group function to all the groups
    for g in dataset_obj["query"]["all_groups"]:
        group_cols = []

        # find all the columns
        group_column_ids = [c["column_id"] for c in g["columns"]]
        group_column_slugs = {
            utils.slugify(c["agg_function"] + (c["column_id"] or "")): c["label"] for c in g["metrics"]
        }

        # apply the function if it does not
        for group_func in column.get("group_func") or []:
            (group_func, col_format) = _get_format(group_func, column.get("display_format"))

            if column["id"] not in group_column_ids:
                new_column = _create_metric_column(column, group_func, dataset_obj, display_format=col_format)
                col_key = utils.slugify(new_column["agg_function"] + new_column["column_id"])

                # update the column name if we already have a renamed column
                if group_column_renames.get(col_key):
                    new_column["label"] = group_column_renames[col_key]

                # save the column
                if not group_column_slugs.get(col_key):
                    added = _add_action(
                        plan,
                        "add",
                        group_slug=g["slug"],
                        column_kind="metrics",
                        new_column=new_column,
                        mavis_created=True,
                    )
                    # if added
                    if added:
                        group_cols.append(new_column)

                # given that the column exists, check to see if it is the same label and save it
                elif group_column_slugs.get(col_key) != new_column["label"]:
                    group_column_renames[col_key] = group_column_slugs.get(col_key)

        # add the current column
        if len(group_cols) > 0:
            added_cols.append(dict(group_name=g["name"], columns=group_cols))
    return added_cols


@tracer.start_as_current_span("_add_delete_metric")
def _add_delete_metric(dataset: Dataset, plan, column):
    for g in dataset.obj["query"]["all_groups"]:
        for c in dataset.ds._get_columns(g, "metrics"):
            if column["id"] in dataset.ds._get_all_column_ids(c):
                _add_action(
                    plan,
                    "delete",
                    group_slug=g["slug"],
                    column_kind="metrics",
                    column=c,
                    mavis_created=True,
                )


def _is_in_plan(plan: list[EditAction], action: EditAction):
    for p in plan:
        if (
            action.group_slug == p.group_slug
            and action.mutation.value == p.mutation.value
            and (p.column and action.column["id"] == p.column.get("id"))
            and (action.new_column is None or action.new_column["id"] == p.new_column["id"])
            and not action.mutation == action.mutation.ADD_FILTER
        ):
            return True
    return False


def _empty_group(name, slug):
    return dict(
        name=name,
        slug=slug,
        columns=[],
        metrics=[],
        computed_columns=[],
        pivot=[],
        parent_filters=[],
        order=[],
        plots=[],
    )


def _implement_action(dataset: Dataset, action: EditAction):
    get_current_span().set_attribute("action", action.json())

    if action.mutation == action.mutation.DELETE:
        dataset.ds.remove_column(dataset.obj["query"], action.column["id"], group_slug=action.group_slug)

    elif action.mutation == action.mutation.ADD_PREFILTER:
        group = dataset.ds.get_group_from_slug(dataset.obj["query"], group_slug=action.group_slug)

        group["parent_filters"].append(action.parent_filter.dict())

    # delete everything in spend
    elif action.mutation == action.mutation.ADD_PLOT:
        group = dataset.ds.get_group_from_slug(dataset.obj["query"], group_slug=action.group_slug)

        # create the plot
        plot_slug = utils.slugify(action.plot["axes"]["title"])

        group["plots"].append(
            dict(
                name=action.plot["axes"]["title"],
                slug=plot_slug,
                config=action.plot,
            )
        )

        # create the story if it doesn't exist
        if not dataset.obj["query"].get("story"):
            dataset.obj["query"]["story"] = dict(content=[])

        # add the plot to the story
        dataset.obj["query"]["story"]["content"].append(
            dict(type="plot", plot=dict(slug=plot_slug, group_slug=action.group_slug))
        )

    # add the joins from the UI
    elif action.mutation == action.mutation.UPDATE_SPEND:
        group = dataset.ds.get_group_from_slug(dataset.obj["query"], action.group_slug)

        # crete the object if not there
        if not group.get("spend"):
            group["spend"] = dict(columns=[])

        # add the join
        group["spend"]["joins"] = [j.dict() for j in action.spend_config.joins or []]

        # added the removing of spend table
        if action.spend_config.table:
            group["spend"]["spend_table"] = action.spend_config.table
        else:
            group["spend"]["spend_table"] = None

        group["spend"]["columns"].extend(
            [
                _create_metric_column(c.dict(), c.agg_function.value, include_name=True)
                for c in (action.spend_config.metrics or [])
            ]
        )

    elif action.mutation == action.mutation.UPDATE_ACTIVITY:
        same_activity = next(
            (
                a
                for ii, a in enumerate(dataset.obj["query"]["activities"])
                if _activity_id(dataset, a, dataset.obj["query"]["activities"][:ii]) == action.activity["temp_id"]
            ),
            None,
        )

        if not same_activity:
            raise SilenceError("Could not find the activity")

        # update all the fields of the activity that is not the id field
        for k, v in action.activity.items():
            if k not in ["id"]:
                same_activity[k] = v

    elif action.mutation == action.mutation.UPDATE:
        # find the Id column
        column = next(
            (
                c
                for c in dataset.ds.get_all_columns(dataset.obj["query"], group_slug=action.group_slug)
                if c["id"] == action.column["id"]
            ),
            None,
        )
        if not column:
            raise SilenceError("Could not find the column with id: {}".format(action.column["id"]))
        cascade_rename = False
        # swap out the name of the column
        if action.group_slug:
            group = dataset.ds.get_group_from_slug(dataset.obj["query"], action.group_slug)

            # update the name
            if group.get("plots"):
                group["plots"] = utils.recursive_update(
                    group["plots"],
                    utils.replace_str,
                    word_mapping=[
                        utils.Mapping(
                            old_id=action.column["label"],
                            new_id=action.new_column["label"],
                        )
                    ],
                )

            if column.get("column_kind") == "group":
                # replacing the group name
                group["name"] = group["name"].replace(action.column["label"], action.new_column["label"])

                # remove all the  1 1 1 at the end of group name when we sap the name
                while group["name"][-1].isdigit():
                    group["name"] = group["name"][:-2]

        elif column["label"] != action.new_column["label"]:
            cascade_rename = True

        # update the column
        column.update(**{k: v for k, v in action.new_column.items() if k != "id"})

        # if the name changed, then cascade the change
        if cascade_rename:
            (plan, _) = _apply_column_shortcut(
                dataset,
                None,
                action.new_column,
                "cascade_rename",
            )
            for t_action in plan:
                _implement_action(dataset, t_action)

        # update all the fie
    elif action.mutation == action.mutation.ADD:
        if action.group_slug:
            group = dataset.ds.get_group_from_slug(dataset.obj["query"], action.group_slug)
            current_columns = dataset.ds._get_columns(group, action.column_kind.value)
        else:
            current_columns = dataset.obj["query"]["columns"]

        # append the new column
        current_columns.append(action.new_column)

    # add support for adding filters
    elif action.mutation == action.mutation.ADD_FILTER:
        column = next(
            (
                c
                for c in dataset.ds.get_all_columns(dataset.obj["query"], group_slug=action.group_slug)
                if c["id"] == action.column["id"]
            ),
            None,
        )

        qm_col = dataset.qm.Column(table_column=column["name"])

        # find the filters
        temp_filt = dataset.ds.internal_create_filter(action.filter, qm_col)

        if temp_filt:
            # add the filter if it doesn't exist
            for f in column["filters"]:
                if temp_filt.to_query() == dataset.ds.internal_create_filter(f, qm_col).to_query():
                    break
            else:
                column["filters"].append(action.filter)

    # add support for adding filters
    elif action.mutation == action.mutation.REMOVE_FILTERS:
        column = next(
            (
                c
                for c in dataset.ds.get_all_columns(dataset.obj["query"], group_slug=action.group_slug)
                if c["id"] == action.column["id"]
            ),
            None,
        )

        # add the filters
        if column:
            column["filters"] = []

    # add support for adding filters
    elif action.mutation == action.mutation.SWAP_TIME_RESOLUTION:
        find_time_res_column(dataset, update_to=action.time_resolution.value)

    elif action.mutation == action.mutation.SWAP_ID:
        # log all the swapped ids so other places that use the dataset can deal with the swapped ids
        dataset.obj["query"]["swapped_ids"] = dataset.obj["query"].get("swapped_ids") or []
        dataset.obj["query"]["swapped_ids"].append(
            dict(
                group_slug=action.group_slug,
                old_id=action.column["id"],
                new_id=action.new_column["id"],
            )
        )

        if action.group_slug:
            group = dataset.ds.get_group_from_slug(dataset.obj["query"], action.group_slug)
            all_references = dataset.ds._get_all_column_ids(
                group,
                return_col=True,
                only_id=action.column["id"],
            )
        else:
            all_references = dataset.ds._get_all_column_ids(
                dataset.obj["query"], return_col=True, only_id=action.column["id"]
            )

        # replace all the references
        for r in all_references:
            dataset.ds._swap_id(r, action.column["id"], action.new_column["id"])

            # swap out the name of the column
            if action.group_slug and group.get("plots"):
                group["plots"] = utils.recursive_update(
                    group["plots"],
                    utils.replace_str,
                    word_mapping=[
                        utils.Mapping(
                            old_id=action.column["label"],
                            new_id=action.new_column["label"],
                        )
                    ],
                )

            if r.get("column_id") and r.get("type") and r.get("column_kind") == "group":
                r["type"] = action.new_column["type"]
                r["mavis_type"] = action.new_column.get("mavis_type")

                # replacing the group name
                if action.group_slug:
                    group["name"] = group["name"].replace(action.column["label"], action.new_column["label"])

            # update the label
            if r.get("label"):
                # update the main column label
                r["label"] = action.new_column["label"]

    elif action.mutation == action.mutation.ADD_ACTIVITY:
        dataset.obj["query"]["activities"].append(action.activity)

    elif action.mutation == action.mutation.DELETE_ACTIVITY:
        dataset.obj["query"]["activities"] = [
            a for a in dataset.obj["query"]["activities"] if a["id"] != action.activity["id"]
        ]

    elif action.mutation == action.mutation.ADD_GROUP:
        dataset.obj["query"]["all_groups"].append(_empty_group(action.group_name, action.group_slug))
    elif action.mutation == action.mutation.ADD_DUPLICATE_PARENT:
        dataset.obj["query"]["all_groups"].append(
            dict(
                name=action.group_name,
                slug=action.group_slug,
                is_parent=True,
                parent_filters=[],
                columns=[],
                metrics=[],
                computed_columns=[],
                pivot=[],
                order=[],
                plots=[],
                duplicate_parent_markdown="\n\n".join(
                    [
                        "## Notes Here",
                        "Enter all the info about these set of customers here.",
                    ]
                ),
            )
        )

        # add the parent group
        if dataset.obj["query"].get("columns_order"):
            dataset.obj["query"]["columns_order"][action.group_slug] = dataset.obj["query"]["columns_order"]["parent"]

    elif action.mutation == action.mutation.ADD_ORDER:
        if action.group_slug:
            g = dataset.ds.get_group_from_slug(dataset.obj["query"], action.group_slug)
            # find the group kind
            group_ts_col = next(
                (
                    c
                    for c in dataset.ds._get_columns(g, "group")
                    if utils.get_simple_type(c["type"]) in ("number", "timestamp")
                ),
                None,
            )
            order_by = []
            group_cols = [c for c in dataset.ds._get_columns(g, "group") if not c.get("pivoted")]

            # use the kind to decide the order
            if group_ts_col:
                order_by.append(
                    _make_order(
                        group_ts_col["id"],
                        is_desc=utils.get_simple_type(group_ts_col["type"]) == "timestamp",
                    )
                )

                group_cols = [c for c in group_cols if c["id"] != group_ts_col["id"]]

                if len(group_cols) >= 2:
                    order_by.extend([_make_order(c["id"]) for c in group_cols[:-1]])

            # add the metric
            metric_cols = dataset.ds._get_columns(g, "metrics")
            if group_cols and metric_cols:
                order_by.append(_make_order(metric_cols[0]["id"], is_desc=True))

            g["order"] = order_by

        else:
            dataset.obj["query"]["order"] = [
                _make_order(
                    next(
                        c["id"]
                        for c in dataset.ds.get_all_columns(dataset.obj["query"])
                        if utils.get_simple_type(c["type"]) == "timestamp"
                    ),
                    is_desc=True,
                )
            ]


def _is_id_column(c):
    return c and (c.endswith("_id") or c in ("customer", "join_customer"))


@tracer.start_as_current_span("_guess_swap_column")
def _guess_swap_column(dataset: Dataset, action: EditAction, plan: list[EditAction]):
    """
    This will go through all the columns that are available and find the column that we think is the highest likihood
    match for the swap
    """
    get_current_span().set_attribute("action", action.json())

    columns = dataset.ds.get_all_columns(dataset.obj["query"], group_slug=action.group_slug)
    all_columns = []

    recently_added_ids = [tc.new_column["id"] for tc in plan if tc.mutation == tc.mutation.ADD]

    # add the spend if it has been recently added
    spend_add = next((s for s in plan if s.mutation == s.mutation.UPDATE_SPEND), None)
    if spend_add:
        recently_added_ids.extend([c["id"] for c in columns if c.get("column_kind") == "spend"])

    # TODO: Make this more a a distribution and add variance then sample from the PDF

    # create a list of all the columns and their probability
    for c in columns:
        # utils.cprint(c)
        prob = 1.0000000000
        # only allow the same types
        if utils.get_simple_type(c["type"]) not in action.limited_types:
            prob = 0.0

        # do not reuse the same recursive loop
        if action.column["id"] in dataset.ds._get_all_column_ids(c):
            prob = 0.0

        # if same activity then great
        if (
            c.get("source_details")
            and action.column.get("source_details")
            and action.column["source_details"].get("activity_kind") == c["source_details"].get("activity_kind")
        ):
            prob *= 0.8
        else:
            prob *= 0.2

        # if they have the same kind
        if action.column.get("source_kind") == c.get("source_kind"):
            prob *= 0.7
        else:
            prob *= 0.3

        # if they have the same type
        if action.column["type"] == c["type"]:
            prob *= 0.6
        else:
            prob *= 0.4

        # add a mapping of ids
        if _is_id_column(action.column.get("name")) == _is_id_column(c.get("name")):
            prob *= 0.9
        else:
            prob *= 0.1

        # if they have the same type
        if (action.column.get("agg_function") or "").lower() == (c.get("agg_function") or "").lower():
            prob *= 0.7
        else:
            prob *= 0.3

        # if they have the same type
        if action.column.get("column_id") == c.get("column_id"):
            prob *= 0.9
        else:
            prob *= 0.1

        # if its the same raw name
        if action.column.get("name") == c.get("name") or (
            (c.get("name") or "").startswith("feature") and (action.column["name"] or "").startswith("features")
        ):
            prob *= 0.6
        else:
            prob *= 0.4

        # if its newly added
        if c["id"] in recently_added_ids:
            prob *= 0.6
        else:
            prob *= 0.4

        # map based on name (need to add .0001 to never remove an option due to name)
        prob *= (fuzz.partial_token_sort_ratio(action.column.get("label"), c.get("label"))) * 2.0 / 100 + 0.001

        # add the columns
        if prob > 0:
            c["probability"] = prob
            all_columns.append(deepcopy(c))

    # normalize and sort based on probability
    total = sum([ca["probability"] for ca in all_columns])
    for ca in all_columns:
        ca["probability"] /= total

    all_columns = sorted(all_columns, key=lambda i: i["probability"], reverse=True)

    # get the maximum column
    return (
        all_columns[0] if len(all_columns) > 0 else None,
        utils.filter_dict(all_columns, ["id", "label", "type", "column_kind", "probability"]),
    )


# create the groups
@tracer.start_as_current_span("get_column_shortcuts")
def get_column_shortcuts():
    column_shortcuts = [
        dict(
            column_types=[t for t in qm_config.ALL_TYPES if t != "timestamp"],
            in_parent=True,
            in_group=False,
            key="group_by",
            label="Group by",
            options=[
                dict(key=o, label=utils.title(o))
                for o in ["only_column"] + [f"by-{r}" for r in qm_config.RESOLUTIONS[3:7]]
            ],
        ),
        dict(
            column_types=["timestamp"],
            in_parent=True,
            in_group=False,
            key="group_by",
            label="Group by",
            options=[
                dict(key=r, label=utils.title(r)) for r in qm_config.RESOLUTIONS[3:7] + qm_config.RESOLUTIONS[-1:]
            ],
        ),
        dict(
            column_types=["number"],
            in_parent=False,
            in_group=True,
            key="plot_col",
            label="Visualize Metric",
            options=[],
        ),
        dict(
            column_types=["timestamp"],
            in_parent=True,
            in_group=True,
            key="truncate_time",
            label="Truncate Time",
            options=[
                dict(key=r, label=utils.title(r)) for r in qm_config.RESOLUTIONS[3:7] + qm_config.RESOLUTIONS[-1:]
            ],
        ),
        dict(
            column_types=["timestamp"],
            in_parent=True,
            in_group=True,
            key="extract_part",
            label="Get Part of Timestamp",
            options=[dict(key="DAYOFWEEK", label="Day of Week")]
            + [dict(key=r, label=utils.title(r)) for r in qm_config.RESOLUTIONS],
        ),
        dict(
            column_types=qm_config.ALL_TYPES,
            in_parent=True,
            in_group=False,
            key="add_exists_column",
            label="Add IS NOT NULL flag (0/1)",
            options=[],
        ),
        dict(
            column_types=["timestamp"],
            in_parent=True,
            in_group=False,
            key="quick_computed_column",
            label="Add a Computed Column",
            options=[
                dict(key="to_epoch", label="To Epoch"),
                dict(key="days_to_now", label="Days to Now"),
                dict(key="months_to_now", label="Months to Now"),
                dict(key="years_to_now", label="years to Now"),
            ],
        ),
        dict(
            column_types=["number"],
            in_parent=True,
            in_group=True,
            key="quick_computed_column",
            label="Add a Computed Column",
            options=[
                dict(key="floor", label="Floor"),
                dict(key="decimate_by_5", label="Bucket by 5"),
                dict(key="abs", label="Get Absolute Value"),
            ],
        ),
        dict(
            column_types=["string"],
            in_parent=True,
            in_group=False,
            key="quick_computed_column",
            label="Add a Computed Column",
            options=[dict(key="lower", label="Lower text")],
        ),
        dict(
            column_types=["number"],
            in_parent=False,
            in_group=True,
            key="add_top_10",
            label="Filter for Top 10",
            options=[],
        ),
        dict(
            column_types=["number"],
            in_parent=False,
            in_group=True,
            key="percent_of_total",
            label="Add % of Total",
            options=[],
        ),
        dict(
            column_types=["number"],
            in_parent=False,
            in_group=True,
            key="running_total",
            label="Add Cumulative SUM",
            options=[],
        ),
        dict(
            column_types=["number"],
            in_parent=False,
            in_group=True,
            key="diff_from_last_row",
            label="Add Diff from last row",
            options=[],
        ),
        dict(
            column_types=["number"],
            in_parent=False,
            in_group=True,
            key="percent_increase_from_last_row",
            label="Add % Increase from last row",
            options=[],
        ),
        dict(
            column_types=qm_config.ALL_TYPES,
            in_parent=True,
            in_group=True,
            key="cascade_rename",
            label="Cascade Name and Format",
            options=[],
        ),
        dict(
            column_types=qm_config.ALL_TYPES,
            in_parent=True,
            in_group=False,
            key="delete_dependent_metrics",
            label="Delete Dependent Metrics",
            options=[],
        ),
        dict(
            column_types=["number"],
            in_parent=True,
            in_group=True,
            key="format_type",
            label="Change Display Format",
            options=[dict(key=v, label=v.title()) for v in ("number", "revenue", "percent", "raw")],
        ),
        dict(
            column_types=["timestamp"],
            in_parent=True,
            in_group=True,
            key="format_type",
            label="Change Display Format",
            options=[
                dict(key=v, label=utils.title(v))
                for v in (
                    "date",
                    "date_short",
                    "time",
                    "year",
                    "quarter",
                    "month",
                    "week",
                    "raw",
                )
            ],
        ),
    ]

    # Add the metrics
    for k in qm_config.ALL_TYPES:
        column_shortcuts.append(
            dict(
                column_types=[k],
                in_parent=True,
                in_group=False,
                key="make_metric",
                label="Add a Metric Column to groups",
                options=[
                    dict(key=af["name"], label=utils.title(af["name"]))
                    for af in ALL_AGG_FUNCTIONS.values()
                    if len(af["input_fields"]) > 0 and k in af["input_fields"][0]["data"]
                ],
            )
        )
    return column_shortcuts


# create the groups
@tracer.start_as_current_span("get_row_shortcuts")
def get_row_shortcuts():
    row_shortcuts = [
        dict(
            in_parent=False,
            in_group=True,
            key="slice_row_group_by",
            label="Drilldown and slice by",
            select_columns=ShowColumnsEnum.PARENT,
        ),
        dict(
            in_parent=False,
            in_group=True,
            key="find_in_parent",
            label="Drilldown to these customers",
        ),
    ]

    return row_shortcuts


def _convert_column_config_to_col(mavis, activity_obj, col, customer_table=None):
    if col is None:
        return (None, None)

    if "-" in col.name:
        (table, _) = col.name.split("-")

        company_table = mavis.company.table(activity_obj["config"]["activity_stream"])
        dim_table = graph_client.get_dim(id=company_table.customer_dim_table_id).dim_table_by_pk

        # update the dim table if is the customer table
        if dim_table.table == table:
            table = dict(
                schema=dim_table.schema_,
                table=dim_table.table,
                join_key=dim_table.join_key,
                join_key_type=next(
                    (c.type for c in dim_table.columns if c.name == dim_table.join_key),
                    "string",
                ),
            )
        new_col = _create_customer_col(table, col, activity_obj["id"])

    elif col.name == "revenue_impact":
        new_col = _create_column(activity_obj, col, group_func=["sum"])
    else:
        new_col = _create_column(activity_obj, col)
    return (new_col, customer_table)


@tracer.start_as_current_span("apply_column_shortcut")
def apply_column_shortcut(dataset, group_slug, column, shortcut_key, shortcut_option):
    (plan, ui_instructions) = _apply_column_shortcut(dataset, group_slug, column, shortcut_key, shortcut_option)

    return _update_plan(dataset, plan, ui_instructions=ui_instructions)


def _apply_column_shortcut(dataset: Dataset, group_slug, column, shortcut_key, shortcut_option=None):
    plan = []

    # this is to instantiate the column mapper - really need a better way to do this
    dataset.ds.get_all_columns(dataset.obj["query"], group_slug=group_slug, force_uniqueness=True)
    column = next(
        c
        for c in dataset.ds.get_all_columns(dataset.obj["query"], group_slug=group_slug, force_uniqueness=True)
        if c["id"] == column["id"]
    )

    if group_slug:
        ui_instructions = [dict(kind=UIKindEnum.GO_TO_GROUP, group_slug=group_slug)]
    else:
        ui_instructions = []

    # go through all the value
    if shortcut_key == "group_by":
        if shortcut_option == "only_column":
            column_ids = [column["id"]]

        else:
            is_timestamp = utils.get_simple_type(column["type"]) == "timestamp"

            if is_timestamp:
                column_ids = []
                resolution = shortcut_option
            elif shortcut_option.startswith("by-"):
                column_ids = [column["id"]]
                resolution = shortcut_option[3:]
            else:
                resolution = shortcut_option
                column_ids = []

            # get the cohort ts column
            cohort_ts_column = _get_cohort_column(dataset.obj["query"], "ts")

            # Use the default
            if not is_timestamp and cohort_ts_column:
                time_column = None
            else:
                time_column = _create_computed_column(
                    "date_trunc('{}', {})".format(resolution, column["id"] if is_timestamp else "join_ts.local"),
                    (
                        "{} of {}".format(utils.title(resolution), column["label"])
                        if is_timestamp
                        and not (column.get("name") == "ts" and column["source_details"]["activity_kind"] == "limiting")
                        else utils.title(resolution)
                    ),
                )

            found_column = _find_or_add_time_column(dataset, resolution, plan, time_column)

            column_ids.insert(0, found_column["id"])

        # create the group plan
        (temp_plan, temp_group_slug) = _create_group(dataset.obj, column_ids, plan=plan)
        plan.extend(temp_plan)

        ui_instructions.append(dict(kind=UIKindEnum.GO_TO_GROUP, group_slug=temp_group_slug))

        # if the group column is a customer - tell the user to use first
        if column["name"] in ("customer", "anonymous_customer_id", "join_customer"):
            ui_instructions.append(
                dict(
                    kind=UIKindEnum.PUSH_NOTIFICATION,
                    notification=utils.Notification(
                        type=utils.NotificationTypeEnum.WARNING,
                        duration=5,
                        message="Grouping by customer is not recommended, Use FIRST or LAST.",
                        description="If your trying to get a unique row per user, then change the occurrence in the edit definition to be first or last",
                    ),
                )
            )

    elif shortcut_key == "plot_col":
        plot_config = dict(dataset=dict(tab_slug=group_slug))

        plot = DatasetPlot(plot_config, dataset)

        # update the y column
        plot.config.columns.ys = [column["id"]]
        plot.generate_cols()
        plot.reset_axis()

        _add_action(plan, "add_plot", group_slug=group_slug, plot=plot.get_config())

        ui_instructions = [
            dict(
                kind=UIKindEnum.GO_TO_PLOT,
                plot_slug=utils.slugify(plot.config.axes.title),
            )
        ]

    elif shortcut_key == "truncate_time":
        _add_action(
            plan,
            "add",
            group_slug=group_slug,
            column_kind="computed",
            new_column=_create_computed_column(
                "date_trunc('{}', {})".format(shortcut_option, column["id"]),
                (
                    "{} of {}".format(utils.title(shortcut_option), column["label"])
                    if not (column.get("name") == "ts" and column["source_details"]["activity_kind"] == "limiting")
                    else utils.title(shortcut_option)
                ),
            ),
        )
    elif shortcut_key == "make_kpi":
        if not (column.get("column_id") and column.get("agg_function")):
            ui_instructions = [
                dict(
                    kind=UIKindEnum.PUSH_NOTIFICATION,
                    notification=utils.Notification(
                        type=utils.NotificationTypeEnum.ERROR,
                        duration=5,
                        message="Could not create KPI.",
                        description="KPI can only be created on Metric Columns",
                    ),
                )
            ]
        else:
            group = dataset.ds.get_group_from_slug(dataset.query, group_slug)
            # create the metric
            metric_input = DatasetMetricInput(
                dataset=dataset.obj,
                kpi_id=f'{column["agg_function"].lower()}.{column["column_id"]}',
                kpi_label=column["label"],
                kpi_format=column.get("display_format") or utils.guess_format(column["label"], "number"),
                time_resolution="month",
                row_name=_create_count_all_column(dataset.obj["query"])["label"],
                impact_direction="increase",
            )
            _create_metric(dataset.mavis, metric_input)

            ui_instructions = [
                dict(
                    kind=UIKindEnum.PUSH_NOTIFICATION,
                    notification=utils.Notification(
                        type=utils.NotificationTypeEnum.SUCCESS,
                        duration=5,
                        message="Metric Created",
                    ),
                )
            ]

    elif shortcut_key == "extract_part":
        # you get the resolution
        _add_action(
            plan,
            "add",
            group_slug=group_slug,
            column_kind="computed",
            new_column=_create_computed_column(
                "date_part('{}', {})".format(shortcut_option, column["id"]),
                "{} from {}".format(
                    (utils.title(shortcut_option) if shortcut_option != "DAYOFWEEK" else "Day of Week"),
                    column["label"],
                ),
            ),
        )
    elif shortcut_key == "add_exists_column":
        # adds a flag if the column exists
        _add_action(
            plan,
            "add",
            group_slug=group_slug,
            column_kind="computed",
            new_column=_create_computed_column(
                "exists({})".format(column["id"]),
                "{} Exists".format(column["label"]),
                group_func=["sum"],
            ),
        )
    elif shortcut_key == "quick_computed_column":
        # adds a flag if the column exists
        if shortcut_option == "to_epoch":
            raw_string = "timestamp_to_epoch({id})"
            label = "{label} Epoch"

        elif shortcut_option == "days_to_now":
            raw_string = "date_diff('day', {id}, local_now())"
            label = "Days From {label}"

        elif shortcut_option == "months_to_now":
            raw_string = "date_diff('month', {id}, local_now())"
            label = "Month From {label}"

        elif shortcut_option == "year_to_now":
            raw_string = "date_diff('year', {id}, local_now())"
            label = "Years From {label}"

        elif shortcut_option == "floor":
            raw_string = "floor({id})"
            label = "Rounded {label}"

        elif shortcut_option == "decimate_by_5":
            raw_string = "decimate_number({id}, 5)"
            label = "Bucketed {label} by 5"

        elif shortcut_option == "abs":
            raw_string = "abs({id})"
            label = "Absolute {label}"

        elif shortcut_option == "lower":
            raw_string = "lower({id})"
            label = "Lower {label}"

        # clean up the column
        raw_string = raw_string.format(**column)
        label = label.format(**column)
        # add the column
        _add_action(
            plan,
            "add",
            group_slug=group_slug,
            column_kind="computed",
            new_column=_create_computed_column(raw_string, label),
        )
    elif shortcut_key in (
        "running_total",
        "percent_of_total",
        "add_top_10",
        "diff_from_last_row",
        "percent_increase_from_last_row",
    ):
        group = dataset.ds.get_group_from_slug(dataset.obj["query"], group_slug)
        group_columns = [c for c in dataset.ds._get_columns(group, "group") if not c.get("pivoted")]

        computed_group = []
        computed_order = []

        if len(group_columns) == 1:
            computed_order.append(group_columns[0]["id"])

        elif len(group_columns) > 1:
            order_column_id = next(
                (c["id"] for c in group_columns if utils.get_simple_type(c["type"]) in ("timestamp", "number")),
                group_columns[0]["id"],
            )

            if shortcut_key in (
                "running_total",
                "diff_from_last_row",
                "percent_increase_from_last_row",
            ):
                computed_order = [order_column_id]
                computed_group.extend([c["id"] for c in group_columns if c["id"] not in computed_order])
            else:
                computed_group.append(order_column_id)

                # add the remainder as order
                computed_order.extend([c["id"] for c in group_columns if c["id"] not in computed_group])

        # notify the user if no possible way to run that query
        if len(group_columns) == 0:
            ui_instructions = [
                dict(
                    kind=UIKindEnum.PUSH_NOTIFICATION,
                    notification=utils.Notification(
                        message="Cannot create that computed column because there are no columns in the group",
                        type="error",
                    ),
                )
            ]

        else:
            if shortcut_key == "running_total":
                if len(computed_group) == 0:
                    raw_string = "running_total_all({id}, {order})"
                else:
                    raw_string = "running_total({id}, {group}, {order})"

                label = "Cumulative {}".format(column["label"])

            elif shortcut_key == "diff_from_last_row":
                if len(computed_group) == 0:
                    raw_string = "{id} - lag_all({id}, {order})"
                else:
                    raw_string = "{id} - lag({id}, {group}, {order})"

                col_name = utils.slugify(next(g["label"] for g in group_columns if g["id"] in computed_order))
                label = "Diff of {}".format(column["label"])

            elif shortcut_key == "percent_increase_from_last_row":
                if len(computed_group) == 0:
                    raw_string = "({id} - lag_all({id}, {order}))* 1.00 / nullif(lag_all({id}, {order}), 0)"
                else:
                    raw_string = "({id} - lag({id}, {group}, {order}))* 1.00 / nullif(lag({id}, {group}, {order}), 0)"

                col_name = utils.slugify(next(g["label"] for g in group_columns if g["id"] in computed_order))

                for a in qm_config.RESOLUTIONS:
                    if a in col_name:
                        label = "{l}O{l} {name}".format(l=a[0].upper(), name=column["label"])
                        break
                else:
                    label = "Percent Increase of {}".format(column["label"])

            elif shortcut_key == "percent_of_total":
                if len(computed_group) == 0:
                    raw_string = "percent_of_total_all({id})"
                else:
                    raw_string = "ratio_to_report({id}, {group})"

                label = "Percent of {}".format(column["label"])

            elif shortcut_key == "add_top_10":
                if len(computed_group) == 0:
                    # if it is a computed column then copy it
                    raw_string = "row_number_all({id}.desc)"
                else:
                    # if it is a computed column then copy it
                    raw_string = "row_number_w_group({group}, {id}.desc)"

                label = "Top 10 {}".format(column["label"])

            raw_string = raw_string.format(
                id=column["id"],
                group="[{}]".format(", ".join(computed_group)),
                order="[{}]".format(", ".join(computed_order)),
            )

            new_column = _create_computed_column(raw_string, label, col_type="number")

            # added the right display format
            if shortcut_key in ("percent_increase_from_last_row", "percent_of_total"):
                new_column["display_format"] = "percent"
            elif shortcut_key in ("running_total", "diff_from_last_row"):
                new_column["display_format"] = column.get("display_format")

            if shortcut_key == "add_top_10":
                new_column["filters"].append(
                    dict(
                        operator="less_than_equal",
                        kind="value",
                        or_null=False,
                        value="10",
                    )
                )

            # clean up the column
            raw_string = raw_string.format(**column)
            # add the column
            _add_action(
                plan,
                "add",
                group_slug=group_slug,
                column_kind="computed",
                new_column=new_column,
            )

    elif shortcut_key == "make_metric":
        if column.get("group_func") is None:
            column["group_func"] = []

        if shortcut_option not in column["group_func"]:
            column["group_func"].append(shortcut_option)

        # add the action
        _add_action(plan, "update", column=column, new_column=column)

        # add the metric to all the columns
        added_columns = _add_group_func_columns(dataset.obj, plan, column)

        ui_instructions = [
            dict(
                kind=UIKindEnum.PUSH_NOTIFICATION,
                notification=utils.Notification(
                    message="Updated Column to have an additional default metric and updated groups",
                    description="Added {}".format(
                        " AND ".join(
                            [
                                "{cols} to {group} ".format(
                                    group=g["group_name"],
                                    cols=", ".join([c["label"] for c in g["columns"]]),
                                )
                                for g in added_columns
                            ]
                        )
                    ),
                ),
            )
        ]

    elif shortcut_key == "format_type":
        column["display_format"] = shortcut_option
        # add the action
        _add_action(plan, "update", group_slug=group_slug, column=column, new_column=column)
        # go through the groups and deal with the change
        for g in dataset.obj["query"]["all_groups"]:
            for c in dataset.ds.get_all_columns(dataset.obj["query"], group=g, force_uniqueness=True):
                # grab the column
                if c.get("column_id") == column["id"] or c["label"] == column["label"]:
                    # if the format is different then update it
                    if shortcut_option != c.get("display_format"):
                        c["display_format"] = shortcut_option
                        _add_action(
                            plan,
                            "update",
                            group_slug=g["slug"],
                            column=c,
                            new_column=c,
                        )

    elif shortcut_key == "cascade_rename":
        for g in dataset.obj["query"]["all_groups"]:
            for c in dataset.ds.get_all_columns(dataset.obj["query"], group=g, force_uniqueness=True):
                temp_c = deepcopy(c)
                updated = False
                if group_slug:
                    # if it is a group column and it has the same definition then replace it
                    if (
                        c.get("column_kind") == column.get("column_kind")
                        and (
                            c["column_kind"] != "computed"
                            and all(
                                c.get(k) == column.get(k)
                                for k in [
                                    "agg_function",
                                    "column_id",
                                    "name",
                                    "percentile",
                                ]
                            )
                        )
                        or (
                            c.get("column_kind") == "computed"
                            and c.get("source_details")
                            and column.get("source_details")
                            and dataset.ds.raw_string_to_col(c["source_details"]).to_query()
                            == dataset.ds.raw_string_to_col(column["source_details"]).to_query()
                        )
                    ):
                        temp_c["label"] = column["label"]
                        temp_c["display_format"] = column.get("display_format")
                        updated = True

                # Recreate all the column metrics with this new name
                elif c.get("column_id") == column["id"]:
                    if c.get("agg_function"):
                        temp_c["label"] = _group_column_name(column, c["agg_function"])

                        updated = True
                    else:
                        temp_c["label"] = column["label"]
                        temp_c["display_format"] = column.get("display_format")
                        updated = True

                # Add the action
                if updated:
                    _add_action(
                        plan,
                        "update",
                        group_slug=g["slug"],
                        column=c,
                        new_column=temp_c,
                    )

        ui_instructions = [
            dict(
                kind=UIKindEnum.PUSH_NOTIFICATION,
                notification=utils.Notification(
                    message="Updated Column Name in all the groups",
                ),
            )
        ]
    elif shortcut_key == "delete_dependent_metrics":
        # add the deleting of all metrics columns
        _add_delete_metric(dataset, plan, column)

        ui_instructions = [
            dict(
                kind=UIKindEnum.PUSH_NOTIFICATION,
                notification=utils.Notification(
                    message="Deleted All dependencies",
                ),
            )
        ]
    return (plan, ui_instructions)


@tracer.start_as_current_span("apply_row_shortcut")
def apply_row_shortcut(
    dataset: Dataset,
    group_slug,
    row,
    selected_column_id,
    shortcut_key,
    shortcut_column_id,
):
    plan = []

    ui_instructions = []

    # this is to instantiate the column mapper - really need a better way to do this
    cols = dataset.ds.get_all_columns(dataset.obj["query"], group_slug=group_slug, force_uniqueness=True)
    parent_cols = dataset.ds.get_all_columns(dataset.obj["query"], force_uniqueness=True)
    # get the group
    group = dataset.ds.get_group_from_slug(dataset.obj["query"], group_slug) if group_slug else None

    cm = dataset.ds.column_mapper
    pcl = {c["id"]: c for c in parent_cols}

    # go through all the value
    if shortcut_key == "slice_row_group_by":
        new_slug = cm[shortcut_column_id] + get_uuid()[:6]
        # add the group
        _add_action(
            plan,
            "add_group",
            group_slug=new_slug,
            group_name=f"by {pcl[shortcut_column_id]['label']} ({','.join([str(row[cm[c['id']]]) for c in cols if c['column_kind'] == 'group' ])})",
        )

        # add the selected column as a group column
        _add_action(
            plan,
            "add",
            group_slug=new_slug,
            column_kind="group",
            new_column=_create_group_column(pcl[shortcut_column_id]),
        )

        # add all the current parent filters
        for f in group.get("parent_filters") or []:
            _add_action(plan, "add_prefilter", group_slug=new_slug, parent_filter=f)

        group_col_ids = []
        # get all the group column values
        for col in cols:
            if col["column_kind"] == "group":
                # add column
                _add_action(
                    plan,
                    "add_prefilter",
                    group_slug=new_slug,
                    parent_filter=ParentFilter(
                        filter=dict(
                            operator=("equal" if row[cm[col["id"]]] is not None else "is_null"),
                            kind="value",
                            value_resolution=(
                                "date"
                                if utils.get_simple_type(col["type"]) == "timestamp" and len(row[cm[col["id"]]]) == 10
                                else None
                            ),
                            value=row[cm[col["id"]]],
                        ),
                        column_id=col["column_id"],
                    ),
                )

                group_col_ids.append(col["id"])
            elif col["column_kind"] != "computed" or not any(
                g_id in (col["source_details"].get("raw_string") or "") for g_id in group_col_ids
            ):
                # add column
                _add_action(
                    plan,
                    "add",
                    group_slug=new_slug,
                    column_kind=col["column_kind"],
                    new_column=col,
                )

        ui_instructions.append(dict(kind=UIKindEnum.GO_TO_GROUP, group_slug=new_slug, run_tab=True))

    elif shortcut_key in ("find_in_parent", "find_in_parent_plot"):
        # create the columns to make it easier
        group_cols = [c for c in cols if c["column_kind"] == "group" and c["output"] and not c.get("pivoted")]
        append_ts = None

        names = []
        new_slug = utils.slugify(group["name"]) + get_uuid()[:6]
        # add the group
        _add_action(
            plan,
            "add_duplicate_parent",
            group_slug=new_slug,
            group_name="".join(names),
        )

        group_obj = plan[-1]

        # add all the current parent filters
        for f in group.get("parent_filters") or []:
            _add_action(plan, "add_prefilter", group_slug=new_slug, parent_filter=f)

        # get all the group column values
        for col in group_cols:
            # add column
            _add_action(
                plan,
                "add_prefilter",
                group_slug=new_slug,
                parent_filter=ParentFilter(
                    filter=dict(
                        operator=("equal" if row[cm[col["id"]]] is not None else "is_null"),
                        kind="value",
                        value_resolution=(
                            "date"
                            if utils.get_simple_type(col["type"]) == "timestamp" and len(row[cm[col["id"]]]) == 10
                            else None
                        ),
                        or_null=False,
                        value=row[cm[col["id"]]],
                    ),
                    column_id=col["column_id"],
                ),
            )
            names.append(f"{col['label']} = {row[cm[col['id']]]}")

        # if an append ts then filter it out
        if append_ts:
            # add column
            _add_action(
                plan,
                "add_prefilter",
                group_slug=new_slug,
                parent_filter=ParentFilter(
                    filter=dict(operator="not_is_null"),
                    column_id=append_ts["id"],
                ),
            )

        # to help deal with metric
        if shortcut_key == "find_in_parent_plot":
            selected_col = next(c for c in cols if c["id"] == selected_column_id)
            agg_func = (selected_col.get("agg_function") or "").lower()

            if agg_func in ("sum", "average"):
                _add_action(
                    plan,
                    "add_prefilter",
                    group_slug=new_slug,
                    parent_filter=ParentFilter(
                        filter=dict(
                            operator="not_equal",
                            kind="value",
                            or_null=False,
                            value=0,
                        ),
                        column_id=selected_col["column_id"],
                    ),
                )
                names.append(f"Non-Zero {selected_col['label']}")
            elif agg_func == "count":
                _add_action(
                    plan,
                    "add_prefilter",
                    group_slug=new_slug,
                    parent_filter=ParentFilter(
                        filter=dict(
                            operator="not_is_null",
                            kind="value",
                            or_null=False,
                            value="",
                        ),
                        column_id=selected_col["column_id"],
                    ),
                )
                names.append(f"Not NULL {selected_col['label']}")

        group_obj.group_name = " - ".join(names)
        ui_instructions.append(dict(kind=UIKindEnum.GO_TO_GROUP, group_slug=new_slug, run_tab=True))

    return _update_plan(dataset, plan, ui_instructions=ui_instructions)


def _check_columns(dataset: Dataset, columns, new_column):
    # check to see if the column was already added
    for c in columns:
        if c["source_kind"] == "computed" and c["source_kind"] == new_column["source_kind"]:
            current_q = dataset.ds.raw_string_to_col(c["source_details"]).to_query()
            new_q = dataset.ds.raw_string_to_col(new_column["source_details"]).to_query()
            if current_q == new_q:
                return c
        elif (
            c.get("agg_function")
            and new_column.get("agg_function")
            and c.get("agg_function").lower() == new_column.get("agg_function").lower()
        ):
            return c
    return None


def _remove_spend_columns(dataset: Dataset, plan, group_slug, keep_ids=None):
    group = dataset.ds.get_group_from_slug(dataset.obj["query"], group_slug=group_slug)

    # remove the column
    for c in dataset.ds._get_columns(group, "spend"):
        if c["id"] not in (keep_ids or []):
            _add_action(
                plan,
                "delete",
                group_slug=group_slug,
                column_kind="spend",
                column=c,
                mavis_created=True,
            )


@tracer.start_as_current_span("update_spend")
def update_spend(dataset: Dataset, group_slug, spend_config: SpendConfig = None):
    plan = []
    keep_ids = []

    # handle the ids and all the issues
    if spend_config and spend_config.metrics:
        # get the current group
        group = dataset.ds.get_group_from_slug(dataset.obj["query"], group_slug)
        # get the current names
        spend_names = {f"{c['agg_function']}.{c['name']}".lower(): c for c in dataset.ds._get_columns(group, "spend")}
        new_metrics = []
        for mc in spend_config.metrics:
            # update the names
            if spend_names.get(mc.id):
                keep_ids.append(spend_names[mc.id]["id"])
            else:
                mc.id = utils.make_id(mc.label)
                new_metrics.append(mc)

        # add the metrics
        spend_config.metrics = new_metrics

    # remove the spend columns
    _add_action(
        plan,
        "update_spend",
        group_slug=group_slug,
        spend_config=spend_config or SpendConfig(),
    )
    _remove_spend_columns(dataset, plan, group_slug, keep_ids=keep_ids)
    # let the user know you added the columns
    ui_instructions = [
        dict(
            kind=UIKindEnum.PUSH_NOTIFICATION,
            notification=utils.Notification(
                type=utils.NotificationTypeEnum.SUCCESS,
                message="Updated Aggregate Join",
            ),
        )
    ]
    return _update_plan(dataset, plan, ui_instructions=ui_instructions)


def get_spend_options(dataset: Dataset, group_slug, input_table: dict = None):
    company_table = dataset.ds.get_activity_stream(dataset.obj["query"])

    group = dataset.ds.get_group_from_slug(dataset.obj["query"], group_slug=group_slug)

    # copy over the values
    use_spend = group.get("spend") and group["spend"]["columns"] and not input_table

    all_dims = graph_client.get_company_table_aggregation_w_columns(
        table_id=company_table.id
    ).company_table_aggregation_dim

    # if we have spend then use the right table
    if use_spend:
        (schema, table, _, _) = dataset.ds._expand_table(
            group["spend"].get("spend_table", dataset.mavis.company.spend_table)
        )
        input_table = dict(schema=schema, table=table)
    elif not input_table:
        if len(all_dims) == 0:
            return dict(table_options=[], table_default=None)

        first_dim = all_dims[0]
        input_table = first_dim.dim_table.dict()

    # define all the tables
    table_options = []
    current_dim = None

    for d in all_dims:
        table_options.append(
            dict(
                schema=d.dim_table.schema_,
                table=d.dim_table.table,
                label=f"{d.dim_table.schema_}.{d.dim_table.table}",
                id=f"{d.dim_table.schema_}.{d.dim_table.table}",
            )
        )

        if (
            table_options[-1]["schema"] == (input_table.get("schema") or input_table.get("schema_"))
            and input_table["table"] == table_options[-1]["table"]
        ):
            current_dim = d.dim_table
            table_default = table_options[-1]

    if not current_dim:
        table_default = table_options[0]
        current_dim = all_dims[0].dim_table

    # create the option column
    join_columns = [c.dict() for c in current_dim.columns]
    metric_options = []
    for af in ALL_AGG_FUNCTIONS.values():
        if len(af["input_fields"]) != 1:
            continue

        # Add all the column metrics
        for c in current_dim.columns:
            if (
                utils.get_simple_type(c.type) not in af["input_fields"][0]["data"]
                or not utils.same_types(af["output_type"], "number")
                or (af["name"] in ("count",) and utils.same_types(c.type, "string"))
            ):
                continue

            # define the metric option
            metric_options.append(
                dict(
                    id=f"{af['name']}.{c.name}",
                    name=c.name,
                    label=f'{af["name"]}({c.name})',
                    agg_function=af["name"],
                    type=af["output_type"],
                )
            )

    if use_spend:
        join_defaults = group["spend"]["joins"]
        metric_defaults = group["spend"]["columns"]

        # BECAUSE OF BACKFILL
        for m in metric_defaults:
            m["agg_function"] = m.get("agg_function", "").lower() or "sum"
            m["id"] = f"{m['agg_function']}.{m['name']}"

    else:
        # guess all the joins
        join_defaults = []
        metric_defaults = []

        # go through and find all the columns
        for gc in dataset.ds._get_columns(group, "group"):
            best_match = utils.pick_best_option(
                [jc for jc in join_columns if utils.same_types(jc["type"], gc["type"])],
                gc["label"],
            )

            # add the best matched column
            if best_match:
                join_defaults.append(
                    JoinOption(
                        column_id=gc["id"],
                        spend_column=best_match["name"],
                        apply_computed_logic=utils.get_simple_type(gc["type"]) in ("timestamp", "number"),
                    )
                )

        for mc in metric_options:
            # add the metric column
            if mc["agg_function"] == "sum":
                metric_defaults.append(mc)

    return dict(
        table_default=table_default,
        table_options=table_options,
        metric_options=metric_options,
        metric_defaults=metric_defaults,
        join_columns=join_columns,
        join_defaults=join_defaults,
    )


@tracer.start_as_current_span("swap_group_by")
def swap_group_by(dataset: Dataset, group_slug, column, new_column_id):
    get_current_span().set_attributes({"from_column_id": column["id"], "to_column_id": new_column_id})

    plan = []

    # get the columns
    dataset.ds.get_all_columns(dataset.obj["query"], group_slug=group_slug, force_uniqueness=True)
    group = dataset.ds.get_group_from_slug(dataset.obj["query"], group_slug=group_slug)
    dependents = dataset.ds._get_all_column_ids(group, return_col=True, only_id=column["id"])

    # get all the required types
    required_types = dataset.ds._get_valid_types(dependents, column["id"])

    # get the new column
    new_col = next(c for c in dataset.ds.get_all_columns(dataset.obj["query"]) if c["id"] == new_column_id)
    new_group_column = _create_group_column(new_col)

    # valid types
    # beeline.add(dict(column_type=new_col["type"], valid_types=", ".join(required_types)))

    # If the column is a valid type then swap it or to add it
    if utils.get_simple_type(new_col["type"]) in required_types:
        new_group_column["filters"] = column["filters"]
        _add_action(
            plan,
            "update",
            group_slug=group_slug,
            column=column,
            new_column=new_group_column,
        )
    else:
        _add_action(plan, "delete", group_slug=group_slug, column_kind="group", column=column)
        new_group_column["id"] = column["id"]
        _add_action(
            plan,
            "add",
            group_slug=group_slug,
            column_kind="group",
            new_column=new_group_column,
        )

    # reset the order based on the new group by
    _add_action(
        plan,
        "add_order",
        group_slug=group_slug,
    )
    return _update_plan(dataset, plan)


def _get_format(group_func, display_format=None):
    if "#" in group_func:
        return group_func.split("#")
    elif display_format:
        if group_func.startswith("count"):
            return (group_func, "number")
        elif group_func in ("max", "min", "sum", "median"):
            return (group_func, display_format)
        else:
            return (group_func, None)
    else:
        return (group_func, None)


@tracer.start_as_current_span("_create_group")
def _create_group(dataset_obj, columns_ids, time_window=None, name=None, plan=None):
    # create group columns
    cm = {c["id"]: c for c in dataset_obj["query"]["columns"]}

    # add newly added columns from the plan
    if plan:
        for p in plan:
            if p.mutation == p.mutation.ADD:
                cm[p.new_column["id"]] = p.new_column

    plan = []

    # add the groups
    group_names = [utils.title(cm[c]["label"]) for c in columns_ids]
    group_activity_id = {c_id: cm[c_id]["source_details"].get("activity_id") or "" for c_id in columns_ids}

    if time_window:
        group_names.append(utils.title(time_window.date_part.value))

    group_slug = utils.slugify("_".join(group_names) or "all") + get_uuid()[:8]

    # add the group
    _add_action(
        plan,
        "add_group",
        group_slug=group_slug,
        group_name=name or ("by " + (" & ".join(group_names) or "All")),
    )

    # add all the group columns
    for c in columns_ids:
        _add_action(
            plan,
            "add",
            group_slug=group_slug,
            column_kind="group",
            new_column=_create_group_column(cm[c]),
        )

    if time_window:
        _add_action(
            plan,
            "add",
            group_slug=group_slug,
            column_kind="group",
            new_column=_create_time_window_column(time_window),
        )

    all_metric_columns = [_create_count_all_column(dataset_obj["query"])]

    if time_window is None:
        # add the columns
        for c in dataset_obj["query"]["columns"]:
            # if the activity_id is the same
            # and it is a 1/0 column
            for group_func in c.get("group_func") or []:
                (group_func, col_format) = _get_format(group_func, c.get("display_format"))
                # deal with the column from the same activity having weird conversion so do the percent of total
                if (
                    group_func == "average"
                    and _is_conv_col(c)
                    and c["source_details"].get("activity_id") in group_activity_id.values()
                ):
                    non_activity_cols = ", ".join(
                        k for k, v in group_activity_id.items() if v != c["source_details"]["activity_id"]
                    )
                    # choose the proper function
                    if non_activity_cols:
                        raw_string = f"ratio_to_report({all_metric_columns[0]['id']}, [{non_activity_cols}])"
                    else:
                        raw_string = f"percent_of_total_all({all_metric_columns[0]['id']})"

                    # create the metrics
                    _add_action(
                        plan,
                        "add",
                        group_slug=group_slug,
                        column_kind="computed",
                        new_column=_create_computed_column(
                            raw_string,
                            _group_column_name(c, group_func),
                            col_type="number",
                        ),
                    )

                # check
                elif c["id"] not in columns_ids:
                    all_metric_columns.append(
                        _create_metric_column(c, group_func, dataset_obj, display_format=col_format)
                    )

    # add a code for the name
    last_group_metrics = (
        {
            (c["agg_function"].lower() + (c["column_id"] or "")): c["label"]
            for c in dataset_obj["query"]["all_groups"][-1]["metrics"]
        }
        if len(dataset_obj["query"]["all_groups"]) > 0
        else {}
    )

    # loop and add the columns
    for metric_col in all_metric_columns:
        # update the name if it was renamed
        metric_col["label"] = last_group_metrics.get(
            metric_col["agg_function"].lower() + (metric_col["column_id"] or ""),
            metric_col["label"],
        )

        # create the metrics
        _add_action(
            plan,
            "add",
            group_slug=group_slug,
            column_kind="metrics",
            new_column=metric_col,
        )

    _add_action(
        plan,
        "add_order",
        group_slug=group_slug,
    )
    return (plan, group_slug)


@tracer.start_as_current_span("_create_dataset_obj")
def _create_dataset_obj(activity_objects, columns):
    # create the proper object
    d = dict(
        override_sql=None,
        fields=dict(),
        query=dict(
            activity_stream=activity_objects[0]["config"]["activity_stream"],
            activities=activity_objects,
            columns=columns,
            all_groups=[],
            order=[
                dict(
                    column_id=next(c["id"] for c in columns if c["type"] == "timestamp"),
                    order_direction="desc",
                )
            ],
        ),
    )

    return d


def _make_order(col_id, is_desc=False):
    return dict(column_id=col_id, order_direction="desc" if is_desc else "asc")


def _get_activity(
    mavis,
    activities,
    activity_ids,
    include_values=False,
    append_name=False,
    past_activities=None,
    company_table=None,
):
    if len(activity_ids) == 0:
        raise (SilenceError("An activity used no longer exist.  Please contact support for help!"))

    if past_activities and past_activities.get(",".join(activity_ids)):
        return past_activities.get(",".join(activity_ids))

    if utils.is_time(activity_ids[0]):
        time_option = activity_ids[0]

        a_data = dict(
            id=[time_option],
            slug=[],
            slugified=time_option,
            name=utils.title(time_option),
            has_source=True,
            activity_stream=mavis.company.tables[0].activity_stream,
            columns=[
                dict(
                    id=time_option,
                    name="ts",
                    label=utils.title(time_option),
                    type="timestamp",
                )
            ],
        )
        if past_activities is not None:
            past_activities[activity_ids[0]] = ActivityData(**a_data)
        return ActivityData(**a_data)

    # create the activity object
    activity = activities.get(activity_ids[0])

    if not activity:
        raise SilenceError("Activity Could not be found")

    has_source = "anonymous_customer_id" in [c.name for c in activity.column_renames if c.has_data]

    if not company_table:
        if activity.table_id:
            company_table = mavis.company.table(activity.table_id)
            if company_table is None:
                raise (SilenceError(f"Could not find Activity Stream table for activity {activity.name}"))
        else:
            company_table = mavis.company.table(activity.transformations[0].transformation.table)

    a_data = dict(
        id=[activity.id],
        slug=[activity.slug],
        name=activity.name,
        has_source=has_source,
        activity_stream=company_table.activity_stream,
        columns=utils.get_activity_columns(
            activity,
            include_activity=len(activity_ids) > 1,
            include_super_admin=mavis.user.is_internal_admin,
        ),
    )

    # make sure you force recompute occurrence if it doesn't have the columns
    if any(
        imp_col not in [c.name for c in activity.column_renames]
        for imp_col in ("activity_occurrence", "activity_repeated_at")
    ):
        a_data["force_recompute_occurrence"] = True

    # add the column values
    for c in a_data["columns"]:
        c["opt_group"] = get_opt_group(c["name"], c.get("enrichment_table"), c.get("slowly_changing_ts_column"))

        # add the values
        if include_values:
            cv = ActivityManager(mavis=mavis).get_column_values(activity.id)
            c["values"] = cv.get(c["name"], [])[:10]
        else:
            c["values"] = []

        if len(activity_ids) > 1 or append_name:
            for col_value in c["values"][:10]:
                col_value["key"] = "{} - {}".format(activity.name, col_value["key"])

    # append all the other activities
    for a_id in activity_ids[1:]:
        temp_activity = _get_activity(
            mavis,
            activities,
            [a_id],
            include_values,
            append_name=True,
            past_activities=past_activities,
            company_table=company_table,
        )

        # update the main object
        a_data["slug"].extend(temp_activity.slug)
        a_data["id"].extend(temp_activity.id)
        a_data["name"] += " Or " + temp_activity.name
        a_data["has_source"] = a_data["has_source"] or temp_activity.has_source
        a_data["force_recompute_occurrence"] = (
            a_data.get("force_recompute_occurrence") or temp_activity.force_recompute_occurrence
        )

        # merge the columns
        for c in temp_activity.columns:
            new_col = next((tc for tc in a_data["columns"] if tc["name"] == c.name), None)

            if new_col:
                # combine the label
                if utils.slugify(new_col["label"]) != utils.slugify(c.label):
                    if len(new_col["label"]) > 80:
                        if not new_col["label"].endswith("or other"):
                            new_col["label"] += "or other"
                    else:
                        new_col["label"] += " or " + c.label

                # on different types choose string
                if utils.get_simple_type(new_col["type"]) != utils.get_simple_type(c.type):
                    new_col["type"] = "string"

                # append the values
                new_col["values"].extend([nv.dict() for nv in c.values[:10]])

            else:
                # add the column if it doesn't exist
                a_data["columns"].append(c.dict())

    # Create the slug to use every where
    a_data["slugified"] = "_or_".join([utils.slugify(s) for s in a_data["slug"]])

    if past_activities is not None:
        past_activities[",".join(activity_ids)] = ActivityData(**a_data)
    return ActivityData(**a_data)


def __get_all_activities(mavis, dataset_config):
    # create the list of ids
    activity_ids = deepcopy(dataset_config.cohort.activity_ids)
    for a in dataset_config.append_activities:
        activity_ids.extend(a.activity_ids)
        for r in a.relative_activity_filters:
            activity_ids.extend(r.activity_ids)

    activities = {
        a.id: a
        for a in graph_client.get_activities_w_columns(ids=[a for a in activity_ids if not utils.is_time(a)]).activities
    }
    # I am adding a dict() for all the values cause I think I may want to add it
    return activities


@tracer.start_as_current_span("_get_activities_and_columns")
def _get_activities_and_columns(mavis, dataset_config: DatasetConfig, use_all_columns: bool = False):
    activity_objects = []
    columns = []

    # get the activities and values
    activities = __get_all_activities(mavis, dataset_config)

    # add the cohort activity
    past_activities = dict()
    cohort_activity = _get_activity(
        mavis,
        activities,
        dataset_config.cohort.activity_ids,
        include_values=False,
        past_activities=past_activities,
    )

    activity_objects.append(
        _create_activity_object(
            mavis,
            cohort_activity,
            dataset_config.cohort.occurrence_filter,
            dataset_config.cohort.column_filters,
            kind="limiting",
            name_override=dataset_config.cohort.name_override,
        )
    )

    customer_table = None
    # add enrichment columns
    for col in dataset_config.cohort.all_columns if use_all_columns else dataset_config.cohort.columns:
        (new_col, customer_table) = _convert_column_config_to_col(mavis, activity_objects[0], col, customer_table)
        columns.append(new_col)

    previous_ts = []
    # add all the appended activities
    for append_config in dataset_config.append_activities:
        # get the append activity
        append_activity = _get_activity(
            mavis,
            activities,
            append_config.activity_ids,
            include_values=False,
            past_activities=past_activities,
        )
        activity_objects.append(
            _create_activity_object(
                mavis,
                append_activity,
                None,
                append_config.column_filters,
                customer_table=customer_table,
                kind="append",
                name_override=append_config.name_override,
            )
        )
        _update_relationships(mavis, append_config, activity_objects, columns, activities, customer_table)

        # add the cohort activity
        (append_columns, ts_col) = _append_relationship_columns(
            activity_objects[-1],
            (append_config.all_columns if use_all_columns else append_config.columns),
            previous_ts_columns=previous_ts,
        )

        columns.extend(append_columns)
        if ts_col:
            previous_ts.append(ts_col["id"])

    return (activity_objects, columns)


def _check_column_exists(name, table_obj):
    col_obj = next((c for c in table_obj.column_renames if c.name == name), None)

    # handle a column being removed
    if col_obj is None:
        raise SilenceError(f"The column `{name}` has been removed from the transformation")

    elif table_obj.last_resynced_at is None or col_obj.created_at > table_obj.last_resynced_at:
        trans_maintenance = graph_client.get_active_transformation_maintenance(
            id=table_obj.id, last_updated_at=utils.utcnow()
        ).transformation_maintenance

        if len(trans_maintenance) > 0:
            raise SilenceError(
                f"The column `{name}` has been added but the data has not yet been updated due to an error. \n\n {trans_maintenance[0].notes}"
            )

        # IF the column was added but the data hasn't updated yet to be used in the table then error
        elif (
            table_obj.last_resynced_at
            and abs(utils.date_diff(col_obj.created_at, table_obj.last_resynced_at, "minutes")) < 30
        ):
            raise SilenceError(
                f"The column `{name}` has been added but the data has not yet been updated. Please wait till processing is complete."
            )


def _append_name_to_dataset_column(col, activity_obj, ts_column, previous_ts_columns=None):
    (func, name) = col.name.split("-")[:2]
    if func == "did":
        return _create_activity_computed_column(
            activity_obj,
            "exists({})".format(ts_column["id"] if ts_column else (activity_obj["id"] + "_ts")),
            col,
            group_func=["sum", "average"],
        )

    elif func == "did_with_order":
        return _create_activity_computed_column(
            activity_obj,
            "is_conv({ts_col}, [{previous_ts}])".format(
                ts_col=(ts_column["id"] if ts_column else (activity_obj["id"] + "_ts")),
                previous_ts=", ".join(previous_ts_columns or []),
            ),
            col,
            group_func=["sum", "rate." + ".".join(previous_ts_columns)],
        )
    elif func in qm_config.RESOLUTIONS:
        proper_time_func = "date_diff" if (func.lower() in qm_config.RESOLUTIONS[-4:]) else "time_diff"

        from_time_column = "join_ts.local" if ts_column else "join_ts"
        to_time_column = ts_column["id"] if ts_column else (activity_obj["id"] + "_ts")

        is_before = (
            activity_obj["relationship_slug"].endswith("before") or activity_obj["relationship_slug"] == "first_ever"
        )

        # append the proper time columns
        return _create_activity_computed_column(
            activity_obj,
            "{}('{}', {}, {})".format(
                proper_time_func,
                func,
                to_time_column if is_before else from_time_column,
                from_time_column if is_before else to_time_column,
            ),
            col,
            group_func=["average"],
        )
    else:
        # add the group function that makes sense for a metric
        if func in ("min", "max", "median", "average"):
            group_func = [func]
        elif func in "stddev":
            group_func = ["average"]
        elif func not in ("list_agg", "list_agg_unique"):
            group_func = ["sum", "average"]
        else:
            group_func = []

        # add the column
        return _create_column(
            activity_obj,
            col,
            applied_function=func,
            group_func=group_func,
        )


# relationship
@tracer.start_as_current_span("_append_relationship_columns")
def _append_relationship_columns(activity_obj, activity_columns, previous_ts_columns=None):
    columns = []

    # get the activity columns
    ts_column = next(
        (_create_column(activity_obj, c) for c in activity_columns if c.name == "ts"),
        None,
    )

    # add the equation or metric columns
    for col in activity_columns:
        if "-" not in col.name:
            # use the ts column cause we will reference the id
            if col.name == "ts":
                columns.append(ts_column)

            elif col.name.startswith("ts."):
                columns.append(
                    _create_activity_computed_column(
                        activity_obj,
                        "date_trunc('{}', {})".format(
                            col.name.split(".")[1],
                            (ts_column["id"] if ts_column else (activity_obj["id"] + "_ts")),
                        ),
                        col,
                        group_func=["sum", "average"],
                    )
                )

            elif col.name == "revenue_impact":
                columns.append(_create_column(activity_obj, col, group_func=["sum#revenue"]))
            else:
                columns.append(_create_column(activity_obj, col))

        else:
            columns.append(_append_name_to_dataset_column(col, activity_obj, ts_column, previous_ts_columns))

    return (columns, ts_column)


@tracer.start_as_current_span("_map_definitions_name")
def _map_definitions_name(activity_obj, column_obj):
    name = []
    if activity_obj["occurrence"] == "metric" and activity_obj["occurrence_value"]:
        name.append(activity_obj.get("occurrence_value", "").lower())
        name.append(column_obj["name"])

    elif column_obj.get("source_details") and column_obj["source_details"].get("applied_function"):
        name.append(column_obj["source_details"]["applied_function"].lower())
        name.append(column_obj["name"])

    elif (
        column_obj["source_kind"] == "computed"
        and __clean_activity_kind(column_obj["source_details"].get("activity_kind")) == "append"
    ):
        r = column_obj["source_details"]["raw_string"]
        if any(
            r.startswith(piece)
            for piece in (
                "iff",
                "exists",
            )
        ):
            name.append("did")
        elif r.startswith("is_conv"):
            name.append("did_with_order")
        elif r.startswith("date_diff") or r.startswith("time_diff"):
            resolution = r[11 : 11 + r[11:].find("'")]
            # remove the resolution "s"
            resolution = resolution[:-1] if resolution.endswith("s") else resolution
            name.append(resolution)

        # get the activity
        name.append("_or_".join([utils.slugify(s) for s in activity_obj["slug"]]))

    elif column_obj["source_kind"] == "customer":
        name.append(column_obj["source_details"]["table"])
        name.append(column_obj["name"])

    elif column_obj.get("name"):
        name.append(column_obj["name"])

    return "-".join(name)


@tracer.start_as_current_span("_update_relationships")
def _update_relationships(mavis, activity_obj, processed_objects, columns, activities, customer_table):
    relationships = processed_objects[-1]["relationships"]
    processed_objects[-1]["relationship_slug"] = activity_obj.relationship_slug.value

    # add the occurrence and main value
    r = RELATIONSHIPS[activity_obj.relationship_slug.value]
    processed_objects[-1]["occurrence"] = r["occurrence"]
    if r["relationship_slug"]:
        relationships.append(dict(slug=r["relationship_slug"]))

    # add all the filters
    for f in activity_obj.time_filters:
        relationships.append(
            dict(
                slug=f.time_option.value,
                relationship_time=f.resolution.value,
                relationship_time_value=f.value,
            )
        )

    for f in activity_obj.relative_activity_filters:
        # add the relationship
        relationships.append(
            dict(
                slug="relative_to",
                relation=f.relative_relationship.value,
                relative_occurrence=f.relative_occurrence.value,
                relative_to_activity_slug=[activities[a_id].slug for a_id in f.activity_ids],
                or_null=f.or_null,
            )
        )

    for f in activity_obj.cohort_column_filters:
        relationships.append(
            dict(
                operator=f.operator,
                slug="cohort_column",
                cohort_column=_convert_column_config_to_col(
                    mavis, processed_objects[-1], f.cohort_column, customer_table
                )[0],
                append_column=_convert_column_config_to_col(
                    mavis, processed_objects[-1], f.append_column, customer_table
                )[0],
                column_name=f.append_column_name,
                cohort_column_name=f.cohort_column_name,
                # TODO: deprecate
                cohort_column_enrichment_table=f.cohort_column_enrichment_table,
                column_name_enrichment_table=f.column_name_enrichment_table,
                column_name_enrichment_table_column=f.column_name_enrichment_table_column,
            )
        )


# Column creation
def _get_type(col_type, func):
    if func is None:
        return utils.get_simple_type(col_type)
    else:
        current_func = next(
            (f for f in qm_config.FUNCTIONS if f["name"] == func.lower().split(".")[0]),
            None,
        )
        if current_func and current_func["output_type"] != "column":
            return current_func["output_type"]
        else:
            return utils.get_simple_type(col_type)


def _create_column(activity_obj, col_obj, group_func=None, applied_function=None, override_label=None):
    col = dict(
        id=utils.make_id(col_obj.name),
        name=col_obj.name.split("-")[-1],
        label=utils.title(override_label or col_obj.label),
        output=True,
        filters=[],
        mavis_type=col_obj.mavis_type,
        group_func=group_func,
        type=_get_type(col_obj.type, applied_function),
        source_kind="activity",
        source_details=dict(
            activity_kind=activity_obj["kind"],
            activity_id=activity_obj["id"],
            enrichment_table=col_obj.enrichment_table,
            enrichment_table_column=col_obj.enrichment_table_column,
            slowly_changing_ts_column=col_obj.slowly_changing_ts_column,
            applied_function=applied_function,
        ),
    )

    if utils.is_time(activity_obj["id"]):
        col["filters"].append(
            dict(
                operator="greater_than",
                value=utils.date_add(utils.date_trunc(utils.utcnow(), "year", "redshift"), "year", -1),
                kind="value",
                or_null=False,
                value_resolution="year",
            )
        )
    return col


def _create_group_column(col):
    c = dict(
        id=utils.make_id(col["label"]),
        filters=[],
        label=col["label"],
        name="",
        output=True,
        mavis_type=col.get("mavis_type") or col["type"],
        type=col["type"],
        source_kind="group",
        column_id=col["id"],
        pivoted=False,
    )
    return c


def _create_time_window_column(time_window: TimeWindow):
    c = dict(
        id=utils.make_id(time_window.date_part.value),
        filters=[],
        label=utils.title(time_window.date_part.value),
        name="",
        output=True,
        mavis_type=None,
        type="timestamp",
        column_id=None,
        pivoted=False,
        source_kind="time_conversion_window",
        source_details=dict(
            resolution=time_window.date_part.value,
            from_column_id=time_window.from_column_id,
            to_column_id=time_window.to_column_id,
        ),
    )
    return c


def _create_metric_column(col, group_func, dataset_obj=None, display_format=None, include_name=False):
    # hack for columns that are references
    if include_name:
        col["label"] = utils.title(col["name"])
        # if "." in col["id"]:
        #     col["id"] = None

    # handle the rate is a special case of 1,0 columns
    if group_func.startswith("rate."):
        # create the mapper for cleaner references
        activity_names = {a["id"]: a["name"] for a in dataset_obj["query"]["activities"]}

        new_label = "{} from {}".format(
            col["label"],
            " & ".join(
                activity_names.get(c["source_details"].get("activity_id"), "MISSING")
                for c in dataset_obj["query"]["columns"]
                if c["id"] in group_func.split(".")
            ),
        )
        label = _group_column_name(col, "average", new_label=new_label)
        agg_function = "RATE"
        conditioned_on_columns = [s for s in group_func.split(".")[1:] if s]
    else:
        agg_function = group_func.upper()
        conditioned_on_columns = None
        label = _group_column_name(col, group_func)

    # create the column
    metric_col = dict(
        # this is just to deal with spend
        id=(col.get("id") if include_name else None) or utils.make_id(label),
        label=label,
        # HACK: To deal with rate
        agg_function=agg_function,
        conditioned_on_columns=conditioned_on_columns,
        output=True,
        column_id=col.get("id"),
        filters=[],
        pivot=[],
        mavis_type=None,
        display_format=display_format or utils.guess_format(label, type=_get_type(col.get("type"), group_func)),
        type=_get_type(col.get("type"), group_func),
    )
    if include_name:
        metric_col["name"] = col.get("name")
    return metric_col


def _create_customer_col(table, col, activity_id):
    if isinstance(table, dict):
        table_name = table["table"]
    else:
        table_name = table

    return dict(
        id=utils.make_id(table_name + "_" + col.name.split("-")[-1]),
        filters=[],
        label=col.label,
        name=col.name.split("-")[-1],
        output=True,
        source_details=dict(table=table, activity_id=activity_id),
        source_kind="customer",
        mavis_type=col.type,
        type=col.type,
    )


def _create_activity_computed_column(activity_obj, raw_string, col, group_func=None):
    # create the column
    col = dict(
        id=utils.make_id(col.name),
        name=None,
        label=col.label,
        output=True,
        filters=[],
        mavis_type=col.type,
        type=_get_type(col.type, raw_string[: raw_string.find("(")]),
        group_func=group_func,
        source_kind="computed",
        source_details=dict(
            raw_string=raw_string,
        ),
    )

    # add the activity object
    col["source_details"].update(
        activity_kind="append",
        activity_id=activity_obj["id"],
        enrichment_table=None,
    )
    return col


def _create_computed_column(raw_string, label, col_type=None, group_func=None):
    col = dict(
        id=utils.make_id(label),
        name=None,
        label=label,
        output=True,
        filters=[],
        mavis_type=None,
        type=_get_type(col_type, raw_string[: raw_string.find("(")]),
        group_func=group_func or [],
        source_kind="computed",
        source_details=dict(kind="freehand_function", raw_string=raw_string),
    )
    return col


def _create_activity_object(
    mavis,
    activity: ActivityData,
    occurrence_filter: OccurrenceFilter,
    column_filters: list[ColumnFilter],
    customer_table=None,
    kind=None,
    name_override=None,
):
    occurrence_value = None

    # add the filter
    if occurrence_filter:
        occurrence = occurrence_filter.occurrence.value
        occurrence_value = occurrence_filter.custom_value
    else:
        occurrence = "all"

    # add all the filters
    pre_filters = [f.dict() for f in column_filters]

    temp = dict(
        id=utils.make_id(activity.name),
        name=activity.name,
        name_override=name_override,
        slug=activity.slug,
        activity_ids=activity.id,
        did=True,
        occurrence=occurrence,
        occurrence_value=occurrence_value,
        force_recompute_occurrence=activity.force_recompute_occurrence,
        resolution_filter=(occurrence_filter.resolution_filter if occurrence_filter else None),
        config=dict(
            has_source=activity.has_source,
            activity_stream=activity.activity_stream,
        ),
        relationships=[],
        filters=pre_filters,
        kind=kind,
    )

    # handle prefilters column objects
    for ii, f in enumerate(column_filters):
        if f.activity_column:
            pre_filters[ii]["activity_column"] = _convert_column_config_to_col(
                mavis, temp, f.activity_column, customer_table
            )[0]

    return temp


def _fix_activities_and_columns(dataset: Dataset):
    dataset.obj["query"]["activities"] = [a for a in dataset.obj["query"]["activities"] if a["kind"] == "limiting"] + [
        a for a in dataset.obj["query"]["activities"] if a["kind"] != "limiting"
    ]

    # copy the reference
    columns = dataset.obj["query"]["columns"]

    # add the cohort columns
    new_columns = []

    # add the customer columns
    for a in dataset.obj["query"]["activities"]:
        new_columns.extend(dataset.ds.get_activity_columns(dataset.obj["query"], a, True))

    # add the rest of the computed columns
    new_columns.extend(
        [c for c in columns if c["source_kind"] == "computed" and c["source_details"].get("activity_id") is None]
    )

    dataset.obj["query"]["columns"] = new_columns


def _create_count_all_column(query_obj):
    cohort_activity = _get_cohort_activity(query_obj)
    return _create_metric_column(
        dict(
            activity_name=cohort_activity.get("name") or utils.slugify(utils.slug_path(cohort_activity.get("slug"))),
            activity_occurrence=cohort_activity.get("occurrence"),
        ),
        "count_all",
        display_format="number",
    )


def _create_metric(dataset: Dataset, input: DatasetMetricInput):
    content = []
    # grab the dataset
    d_obj = input.dataset.dict()
    mavis = dataset.mavis
    dataset.obj = d_obj
    query_obj = dataset.query

    # remove all the groups
    query_obj["all_groups"] = []
    columns = {c["id"]: c for c in query_obj["columns"]}

    # get the cohort activity
    cohort_activity = next(a for a in query_obj["activities"] if a["kind"] == "limiting" and a["occurrence"] != "time")

    # add the table_id
    mavis.company.table(cohort_activity["config"]["activity_stream"])

    # define the cohort timestamp
    cohort_ts_column = _get_cohort_column(query_obj, "ts")

    # add an alert
    if cohort_ts_column is None:
        raise SilenceError(
            "No time column in primary activity.  We use this column to process all this data over time."
        )

    # get the metric
    (func, col_id) = input.kpi_id.split(".")

    # Remove all the shit you don't need
    # - Activities that are not used in any filter or any way
    # - Columns in the activity that are not used
    # - ADD A is_locked=True on every column!

    # go backwards to deal with computed columns nested dependencies
    remove_unused_dataset(dataset, [col_id], keep_ids=[input.time_option_id])

    # # validate the locking of the kpi
    for c in query_obj["columns"]:
        c["kpi_locked"] = True

    # lock the activity
    for a in query_obj["activities"]:
        a["kpi_locked"] = True

    # add the group func column
    columns[col_id]["group_func"] = [f"{func}#{input.kpi_format}"]

    generated_dataset = None
    # _add_group_with_plot(
    #     mavis,
    #     d_obj,
    #     group_slug=input.time_resolution,
    #     column=cohort_ts_column,
    #     shortcut_option=input.time_resolution,
    #     metric_column_id=col_id,
    #     metric_name=input.kpi_label,
    #     title=f"{input.kpi_label} over {utils.title(input.time_resolution)}",
    #     xaxis=utils.title(input.time_resolution),
    #     group_title=input.time_resolution,
    #     is_line=True,
    # )

    # ADD the Time to DATE
    generated_dataset = _add_time_to_date(dataset, generated_dataset, cohort_ts_column, input.time_resolution)

    new_id = get_uuid()
    dataset.id = new_id
    dataset.obj = generated_dataset
    dataset.update()

    content.append(f"CREATED DATASET {PORTAL_URL}/{mavis.company.slug}/datasets/edit/{new_id}")
    return dict(markdown="\n".join(content))


def _get_cohort_column(query_obj, name):
    return next(
        (c for c in query_obj["columns"] if c["name"] == name and c["source_details"]["activity_kind"] == "limiting"),
        None,
    )


def _get_cohort_activity(query_obj):
    return next((a for a in query_obj["activities"] if a["kind"] == "limiting"), None)


def _add_time_to_date(dataset: Dataset, cohort_ts_column, time_resolution):
    slug_name = f"{time_resolution}_to_date"

    # add the time to date column
    column = _create_computed_column(
        raw_string=f"iff(is_time_to_date({cohort_ts_column['id']}, '{time_resolution}'), 'current', iff(is_last_time_to_date({cohort_ts_column['id']}, '{time_resolution}'), 'last', 'other'))",
        label=f"{utils.title(time_resolution)} to Date Grouping",
        col_type="string",
    )
    column["id"] = "time_to_date"
    dataset.obj["query"]["columns"].append(column)

    # create the dataset column
    plan_ex = apply_column_shortcut(
        dataset,
        slug_name,
        column=column,
        shortcut_key="group_by",
        shortcut_option="only_column",
    )
    generated_dataset = plan_ex["staged_dataset"]

    group = generated_dataset["query"]["all_groups"][-1]

    # add the parent filter
    group["parent_filters"].append(
        dict(
            filter=dict(
                operator="time_range",
                kind="value",
                or_null=False,
                value_resolution="date",
                from_type="relative",
                from_value_kind="value",
                from_value=2,
                from_value_resolution=time_resolution,
                to_type="now",
            ),
            column_id=cohort_ts_column["id"],
        )
    )

    group["slug"] = slug_name
    group["kpi_locked"] = True

    # lock all the columns
    for c in dataset.ds.get_group_columns(group):
        c["kpi_locked"] = True

    return generated_dataset


def remove_unused_group(dataset: Dataset, group, keep_ids=None):
    ds = dataset.ds
    group_cols = ds.get_group_columns(group)
    columns = {c["id"]: c for c in group_cols}
    if keep_ids is None:
        keep_ids = []

    # add all the column kinds
    for c in group_cols:
        if c["id"] in keep_ids or c.get("filters") or c.get("column_kind") == "group":
            keep_ids.append(c["id"])
            ds._get_all_column_ids(columns[c["id"]], keep_ids)

    # get the dependent columns
    col_ids = []
    for ki in keep_ids:
        if col_id := columns.get(ki, {}).get("column_id"):
            col_ids.append(col_id)

    # add the prefilters
    for filt in group.get("parent_filters") or []:
        col_ids.append(filt["column_id"])

    for kind in _get_group_kinds():
        ds._update_columns(
            group,
            kind,
            [c for c in ds._get_columns(group, kind) if c["id"] in keep_ids],
        )

    # only keep the orders if it is using a valid column_id
    group["order"] = [o for o in group["order"] if o["column_id"] in col_ids]

    return col_ids


def remove_unused_dataset(dataset: Dataset, query_obj, col_ids, keep_ids=None):
    # grab all the columns
    columns = {c["id"]: c for c in query_obj["columns"]}

    if keep_ids is None:
        keep_ids = []

    cohort_ts_column = _get_cohort_column(query_obj, "ts")

    # add the dependencies of the output column
    for col_id in col_ids:
        dataset.ds._get_all_column_ids(columns[col_id], keep_ids)

    # add the column ids
    col_ids.append(cohort_ts_column["id"])

    for c in query_obj["columns"][::-1]:
        # filters are important or a key column or a customer
        if len(c["filters"]) > 0 or c["id"] in col_ids or c["id"] in keep_ids:
            keep_ids.append(c["id"])
            # add the dependency of the column
            dataset.ds._get_all_column_ids(c, keep_ids)

    # remove all the column ids we don't need and then remove the extra activities
    column_activity_ids = set(
        c["source_details"]["activity_id"]
        for c in query_obj["columns"]
        if c["id"] in keep_ids and c["source_details"].get("activity_id")
    )

    # Add the key cohort columns
    for c in query_obj["columns"]:
        if c["source_details"].get("activity_id") in column_activity_ids and (
            (
                c["source_details"].get("activity_kind") == "limiting"
                and c.get("name") in ("customer", "join_customer", "anonymous_customer_id", "ts")
            )
            or (c["source_details"].get("activity_kind") == "append" and c.get("name") == "ts")
        ):
            keep_ids.append(c["id"])

    # update the activities
    query_obj["activities"] = [a for a in query_obj["activities"] if a["id"] in column_activity_ids]

    keep_cohort_names = utils.recursive_find(query_obj["activities"], ["cohort_column_name"])

    keep_ids.extend(
        [
            c["id"]
            for c in query_obj["columns"]
            if c.get("name") in keep_cohort_names and c["source_details"].get("activity_kind") == "limiting"
        ]
    )

    # save all the columns needed
    query_obj["columns"] = [c for c in query_obj["columns"] if c["id"] in keep_ids]
