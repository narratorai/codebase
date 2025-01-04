import re
from enum import StrEnum
from typing import Literal, Union

from pydantic import BaseModel, Field, PrivateAttr, root_validator

from core.errors import SilenceError
from core.models.ids import get_uuid
from core.models.table import ColumnTypeEnum, DisplayFormatEnum, TableColumnContext
from core.utils import slugify, title
from core.v4.query_mapping.components import clean_column_name
from core.v4.query_mapping.config import RESOLUTIONS, WINDOW_FUNCTIONS


class ActivityColumns(StrEnum):
    activity = "activity"
    activity_occurrence = "activity_occurrence"
    activity_repeated_at = "activity_repeated_at"
    anonymous_customer_id = "anonymous_customer_id"
    join_customer = "join_customer"
    feature_json = "feature_json"
    customer = "customer"
    activity_id = "activity_id"
    ts = "ts"
    join_cohort_id = "join_cohort_id"
    dim_join_id = "join_id"
    join_ts = "join_ts"
    join_cohort_next_ts = "join_cohort_next_ts"
    join_activity_occurrence = "join_activity_occurrence"

    link = "link"
    revenue_impact = "revenue_impact"

    # Other columns
    customer_display_name = "customer_display_name"
    # used for sql debugging
    run_at = "_run_at"
    activity_source = "_activity_source"
    # Used to identify a feature
    feature_start = "feature_"


class ColumnCollectionEnum(StrEnum):
    min = "min"
    default = "default"
    missing = "missing"
    common = "common"
    all = "all"


class DatasetKindEnum(StrEnum):
    activity = "activity"
    sql = "sql"
    time = "time"
    table = "table"


class TabKindEnum(StrEnum):
    group = "group"
    parent = "parent"


class TimeResolutionEnum(StrEnum):
    second = "second"
    minute = "minute"
    hour = "hour"
    day = "day"
    week = "week"
    month = "month"
    quarter = "quarter"
    year = "year"

    # boundary ones
    second_boundary = "second_boundary"
    minute_boundary = "minute_boundary"
    hour_boundary = "hour_boundary"
    day_boundary = "day_boundary"
    week_boundary = "week_boundary"
    month_boundary = "month_boundary"
    quarter_boundary = "quarter_boundary"
    year_boundary = "year_boundary"


class QuickFunctionEnum(StrEnum):
    hour = "hour"
    day = "day"
    week = "week"
    month = "month"
    quarter = "quarter"
    year = "year"
    exists = "exists"


class DetailKindEnum(StrEnum):
    sql = "sql"
    # for activity
    time = "time"
    customer = "customer"
    activity = "activity"
    computed = "computed"
    # for group
    group = "group"
    metric = "metric"
    aggregate_dim = "aggregate_dim"


class TimeOperatorEnum(StrEnum):
    time_range = "time_range"
    equal = "equal"
    not_equal = "not_equal"
    greater_than = "greater_than"
    less_than = "less_than"
    greater_than_equal = "greater_than_equal"
    less_than_equal = "less_than_equal"


class NullOperatorEnum(StrEnum):
    is_null = "is_null"
    not_is_null = "not_is_null"
    is_empty = "is_empty"
    not_is_empty = "not_is_empty"


class StringOperatorEnum(StrEnum):
    # standard operators
    contains = "contains"
    starts_with = "starts_with"
    ends_with = "ends_with"
    greater_than = "greater_than"
    less_than = "less_than"
    greater_than_equal = "greater_than_equal"
    less_than_equal = "less_than_equal"
    equal = "equal"
    not_equal = "not_equal"
    not_contains = "not_contains"
    not_starts_with = "not_starts_with"
    not_ends_with = "not_ends_with"


class StringArrayOperatorEnum(StrEnum):
    contains_any = "contains_any"
    not_contains_any = "not_contains_any"
    is_in = "is_in"
    not_is_in = "not_is_in"


class NumberOperatorEnum(StrEnum):
    greater_than = "greater_than"
    less_than = "less_than"
    greater_than_equal = "greater_than_equal"
    less_than_equal = "less_than_equal"
    equal = "equal"
    not_equal = "not_equal"


class NumberArrayOperatorEnum(StrEnum):
    is_in = "is_in"
    not_is_in = "not_is_in"


class BooleanOperatorEnum(StrEnum):
    equal = "equal"
    not_equal = "not_equal"


class TimeReferenceEnum(StrEnum):
    relative = "relative"
    absolute = "absolute"
    start_of = "start_of"


class AggregateFunctionEnum(StrEnum):
    count_all = "count_all"
    count = "count"
    count_distinct = "count_distinct"
    sum = "sum"
    average = "average"
    max = "max"
    min = "min"
    stddev = "stddev"
    median = "median"
    percentile_cont = "percentile_cont"
    rate = "rate"
    # SHOULD RARELY BE USED
    list_agg_unique = "list_agg_unique"
    list_agg = "list_agg"


class SimpleFetchTypeEnum(StrEnum):
    first = "first"
    last = "last"


class AppendFetchTypeEnum(StrEnum):
    first = "first"
    last = "last"
    metric = "metric"


class CohortFetchTypeEnum(StrEnum):
    first = "first"
    last = "last"
    all = "all"


class SimpleRelationTypeEnum(StrEnum):
    before = "before"
    after = "after"


class RelationTypeEnum(StrEnum):
    ever = "ever"
    before = "before"
    after = "after"

    # Only if Cohort Fetch Type is all
    in_between = "in_between"


class RefinementEnum(StrEnum):
    within = "within"
    at_least = "at_least"


class HideShowEnum(StrEnum):
    hide = "hide"
    show = "show"


class LogicalOperatorEnum(StrEnum):
    AND = "AND"
    OR = "OR"


class CohortTimeKindEnum(StrEnum):
    all_start = "all_start"
    all_end = "all_end"
    last = "last"
    this = "this"


class PlotKindEnum(StrEnum):
    line = "line"
    bar = "bar"
    horizontal_bar = "horizontal_bar"
    stack = "stack"
    horizontal_bar_stack = "horizontal_bar_stack"
    scatter = "scatter"
    area = "area"
    funnel = "funnel"
    rose = "rose"
    pie = "pie"
    donut = "donut"


class RegressionEnum(StrEnum):
    linear = "linear"
    exp = "exp"
    loess = "loess"
    log = "log"
    poly = "poly"
    pow = "pow"
    quad = "quad"


class AnnotationKindEnum(StrEnum):
    point = "point"
    vertical_line = "vertical_line"
    horizontal_line = "horizontal_line"
    color_y_below = "color_y_below"
    color_y_above = "color_y_above"
    color_x_left = "color_x_left"
    color_x_right = "color_x_right"


class GroupModeEnum(StrEnum):
    over_time = "over_time"
    multi_over_time = "multi_over_time"
    numeric = "numeric"
    values = "values"
    metrics = "metrics"


class QueryKindEnum(StrEnum):
    cohort = "cohort"
    append = "append"
    in_between = "in_between"
    ever = "ever"
    before = "before"
    after = "after"
    relative_ever = "relative_ever"


class SpecialDetailsEnum(StrEnum):
    timeline = "timeline"
    custom_functions = "custom_functions"


def _clean_id(id: str) -> str:
    # if it starts with a number, add an 'a' before it
    if id[0].isdigit():
        id = "a" + id
    if id[-1] == "_":
        id = id[:-1]
    return id


def get_id() -> str:
    return _clean_id(get_uuid()[:12])


class RelativeTimeDetails(BaseModel):
    resolution: TimeResolutionEnum
    value: int


class RefinementTimeDetails(RelativeTimeDetails):
    kind: RefinementEnum


class AbsoluteTimeDetails(BaseModel):
    date_time: str


class StartOfTimeDetails(BaseModel):
    resolution: TimeResolutionEnum


class TimeCondition(BaseModel):
    reference: TimeReferenceEnum
    details: RelativeTimeDetails | AbsoluteTimeDetails | StartOfTimeDetails


class ColumnToColumnFilter(BaseModel):
    operator: NumberOperatorEnum | StringOperatorEnum
    column_id: str


class TimeFilter(BaseModel):
    operator: TimeOperatorEnum = TimeOperatorEnum.time_range
    from_condition: TimeCondition | None = None
    to_condition: TimeCondition | None = None
    time_value: str | None = None

    @root_validator
    def validate_time_filter(cls, values):
        if not any([values.get("from_condition"), values.get("to_condition"), values.get("time_value")]):
            raise ValueError("At least one of from_condition, to_condition, or time_value must be provided")
        return values


class NullFilter(BaseModel):
    operator: NullOperatorEnum


class NumberValue(BaseModel):
    number: float


class NumberFilter(BaseModel):
    operator: NumberOperatorEnum
    number: float


class NumberArrayFilter(BaseModel):
    operator: NumberArrayOperatorEnum
    numbers: list[float]


class StringFilter(BaseModel):
    operator: StringOperatorEnum
    value: str


class InterpretedFilter(BaseModel):
    operator: StringOperatorEnum
    value: Literal["current_user"]


class StringConstraintFilter(StringFilter):
    constraints: list[str]


class StringArrayFilter(BaseModel):
    operator: StringArrayOperatorEnum
    values: list[str]


class StringArrayConstraintFilter(StringArrayFilter):
    constraints: list[str]


class BooleanFilter(BaseModel):
    operator: BooleanOperatorEnum
    is_true: bool


class VariableFilter(BaseModel):
    operator: StringOperatorEnum | StringArrayOperatorEnum | NumberOperatorEnum | NumberArrayOperatorEnum
    variable: str
    variable_value: str | bool | float | None = None


AnyFilter = (
    TimeFilter
    | NullFilter
    | BooleanFilter
    | StringFilter
    | StringArrayFilter
    | NumberFilter
    | NumberArrayFilter
    | VariableFilter
    | StringConstraintFilter
    | StringArrayConstraintFilter
    | InterpretedFilter
)


class BooleanExpression(BaseModel):
    logical_operator: LogicalOperatorEnum
    operands: list[Union["BooleanExpression", AnyFilter, ColumnToColumnFilter]]
    is_not: bool = False


class CohortTimeDetails(BaseModel):
    kind: DetailKindEnum = DetailKindEnum.time
    # TODO:
    # add some column here


class ActivitySourceDetails(BaseModel):
    kind: DetailKindEnum = DetailKindEnum.activity
    name: str
    activity_id: str
    type: ColumnTypeEnum | None = None
    dim_id: str | None = None
    applied_function: str | None = None
    percentile: float | None = None


class CustomerDetails(BaseModel):
    kind: DetailKindEnum = DetailKindEnum.customer
    name: str
    customer_dim_id: str


class SQLDetails(BaseModel):
    kind: DetailKindEnum = DetailKindEnum.sql
    field: str
    # add something here


class PivotColumn(BaseModel):
    column_id: str
    value: str | bool | float | None


class MetricsDetails(BaseModel):
    kind: DetailKindEnum = DetailKindEnum.metric
    agg_function: AggregateFunctionEnum
    pivoted_on: list[PivotColumn] | None = None
    column_id: str | None
    # only for percentile agg function
    percentile: float | None = None
    # only for rate agg function
    conditioned_on_columns: list[str] | None = None


class GroupDetails(BaseModel):
    kind: DetailKindEnum = DetailKindEnum.group
    column_id: str
    pivoted: bool = False
    # use_as_column: bool = False  # Used to transpose the data


class ComputedDetails(BaseModel):
    kind: DetailKindEnum = DetailKindEnum.computed
    raw_str: str
    special_data: list[SpecialDetailsEnum] | None = None
    form_config: dict | None = None
    activity_id: str | None = None

    @property
    def is_window(self) -> bool:
        return any(cf in self.raw_str for cf in WINDOW_FUNCTIONS)


class AggregateDetails(BaseModel):
    kind: DetailKindEnum = DetailKindEnum.aggregate_dim
    name: str
    aggregate_dim_id: str


class ColumnBasic(BaseModel):
    label: str
    type: ColumnTypeEnum = ColumnTypeEnum.string
    filters: BooleanExpression | None = None
    examples: list[str] = Field(default_factory=list)

    @property
    def label_slug(self) -> str:
        return _clean_id(re.sub("[^A-Za-z0-9]+", "_", self.label.lower()).rstrip("_"))

    @property
    def clean_label(self) -> str:
        return clean_column_name(self.label)

    @property
    def has_column_to_column_filter(self) -> bool:
        if self.filters is None:
            return False
        for o in _get_operands(self.filters):
            if isinstance(o, ColumnToColumnFilter):
                return True
        return False

    def add_filter(self, filt: AnyFilter, is_not: bool = False):
        # Handle the is_not case
        if is_not:
            filt = BooleanExpression(logical_operator=LogicalOperatorEnum.AND, operands=[filt], is_not=True)

        # add the proper filters
        if self.filters is None:
            if isinstance(filt, BooleanExpression):
                self.filters = filt
            else:
                self.filters = BooleanExpression(logical_operator=LogicalOperatorEnum.AND, operands=[filt])
        elif self.filters.logical_operator == LogicalOperatorEnum.AND and not self.filters.is_not:
            self.filters.operands.append(filt)
        else:
            self.filters = BooleanExpression(logical_operator=LogicalOperatorEnum.AND, operands=[self.filters, filt])

    def quick_filter(self, operator: str, value: str | bool | float | None | list[str | bool | float]):
        if isinstance(value, list):
            if self.type == ColumnTypeEnum.string:
                return StringArrayFilter(operator=operator, values=value)
            elif self.type == ColumnTypeEnum.number:
                return NumberArrayFilter(operator=operator, numbers=value)
        elif value is None:
            return NullFilter(operator=operator)
        elif self.type == ColumnTypeEnum.boolean:
            return BooleanFilter(operator=operator, is_true=value)
        elif self.type == ColumnTypeEnum.string:
            return StringFilter(operator=operator, value=value)
        elif self.type == ColumnTypeEnum.number:
            return NumberFilter(operator=operator, number=value)
        elif self.type == ColumnTypeEnum.timestamp:
            return TimeFilter(operator=operator, time_value=value)


class PrefilterColumn(ColumnBasic):
    label: str
    type: ColumnTypeEnum = ColumnTypeEnum.string
    apply_quick_function: QuickFunctionEnum | None = None
    filters: BooleanExpression | None = None
    details: ActivitySourceDetails | CustomerDetails

    @property
    def dim_id(self) -> str | None:
        if self.details.kind == DetailKindEnum.activity:
            return self.details.dim_id
        elif self.details.kind == DetailKindEnum.customer:
            return self.details.customer_dim_id
        else:
            return None


class ColumnOption(BaseModel):
    name: str
    label: str
    type: ColumnTypeEnum = ColumnTypeEnum.string
    auto_metrics: list[str] = Field(default_factory=list)
    details: ActivitySourceDetails | CustomerDetails | ComputedDetails | CohortTimeDetails | SQLDetails


def _get_operands(filt: BooleanExpression | None):
    operands = []
    if filt is None:
        return operands

    for f in filt.operands:
        if isinstance(f, BooleanExpression):
            operands.extend(_get_operands(f))
        else:
            operands.append(f)
    return operands


class Column(ColumnBasic):
    id: str = Field(default_factory=get_id)
    output: bool = True
    display_format: DisplayFormatEnum | None = None


def clean_names(columns: list[Column]):
    column_counts = dict()
    for c in columns:
        # slugify all the names
        column_counts[c.clean_label] = column_counts.get(c.clean_label, -1) + 1
        # adds a uniqueness to the column label
        if column_counts[c.clean_label] > 0:
            c.label = "{} {}".format(c.label, column_counts[c.clean_label])


class DimensionJoin(BaseModel):
    id_key: str  # key of the dimension
    foreign_key: str  # key of the activity
    type: ColumnTypeEnum


class AggregateDimensionJoin(BaseModel):
    id_key: str
    column_id: str
    apply_computed_logic: bool = False


class Dimension(BaseModel):
    id: str = Field(default_factory=get_id)
    dim_id: str | None = None  # will later migrate this to be better
    table: str
    schema_name: str | None = None
    slowly_changing_ts: str | None = None
    join: DimensionJoin
    _alias: str = PrivateAttr(default=None)


class AggregateDimension(BaseModel):
    id: str = Field(default_factory=get_id)
    dim_id: str | None = None  # will later migrate this to be better
    table: str
    schema_name: str | None = None
    distribute_using_column_id: str | None = None
    joins: list[AggregateDimensionJoin] = Field(default_factory=list)


class CohortTime(BaseModel):
    id: str = Field(default_factory=get_id)
    resolution: TimeResolutionEnum
    kind: CohortTimeKindEnum = CohortTimeKindEnum.all_start
    from_condition: TimeCondition | None
    dims: list[Dimension] = Field(default_factory=list)

    def dim(self, dim_id) -> Dimension:
        return next((dim for dim in self.dims if dim.id == dim_id), None)


class ParentColumn(Column):
    auto_metrics: list[str] = Field(default_factory=list)
    apply_quick_function: QuickFunctionEnum | None = None
    details: ActivitySourceDetails | CustomerDetails | ComputedDetails | CohortTimeDetails | SQLDetails

    _referrence_name: str = PrivateAttr(default=None)

    def to_prefilter_column(self) -> PrefilterColumn:
        return PrefilterColumn(
            label=self.label,
            type=self.type,
            apply_quick_function=self.apply_quick_function,
            filters=self.filters,
            details=self.details,
        )

    def is_same(self, other: "ParentColumn") -> bool:
        return self.details.dict() == other.details.dict() and self.apply_quick_function == other.apply_quick_function

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, ParentColumn):
            return NotImplemented
        return self.is_same(other)

    @property
    def dim_id(self) -> str | None:
        if self.details.kind == DetailKindEnum.activity:
            return self.details.dim_id
        elif self.details.kind == DetailKindEnum.customer:
            return self.details.customer_dim_id
        else:
            return None


class GroupColumn(Column):
    details: MetricsDetails | GroupDetails | ComputedDetails | AggregateDetails


class Order(BaseModel):
    column_id: str
    asc: bool = False


class ParentFilter(BaseModel):
    column_id: str
    filter: AnyFilter | ColumnToColumnFilter


class JoinConditon(BaseModel):
    operator: StringOperatorEnum | NumberOperatorEnum = StringOperatorEnum.equal
    cohort_column: PrefilterColumn
    column: PrefilterColumn


class JoinConditonExpression(BaseModel):
    logical_operator: LogicalOperatorEnum
    operands: list[Union["JoinConditonExpression", JoinConditon]]


class ParentFilterExpression(BaseModel):
    logical_operator: LogicalOperatorEnum
    operands: list[Union["ParentFilterExpression", ParentFilter]]
    is_not: bool = False

    def remove_operand_column(self, column_id: str):
        for i, o in enumerate(self.operands):
            if isinstance(o, ParentFilterExpression):
                o.remove_operand_column(column_id)
                if len(o.operands) == 0:
                    self.operands.pop(i)
            elif isinstance(o, ParentFilter) and o.column_id == column_id:
                self.operands.pop(i)

        if len(self.operands) == 0:
            return True
        return False


AnyExpression = Union[BooleanExpression, JoinConditonExpression, ParentFilterExpression]


class Activity(BaseModel):
    id: str = Field(default_factory=get_id)
    slugs: list[str]
    activity_ids: list[str]
    has_source: bool
    display_name: str

    # Pre-filters
    prefilter_columns: list[PrefilterColumn] = Field(default_factory=list)
    dims: list[Dimension] = Field(default_factory=list)
    _ignore: bool = PrivateAttr(default=False)
    _additional_columns: list[ParentColumn] = PrivateAttr(default=[])
    _referencing_relationships: list[str] = PrivateAttr(default=[])
    # _can_use_occurrence: bool = PrivateAttr(default=True)
    # _recompute_occurrence: bool = PrivateAttr(default=False)

    def dim(self, dim_id) -> Dimension:
        return next((dim for dim in self.dims if dim.id == dim_id), None)

    def add_additional_column(self, column: ParentColumn):
        for a in self._additional_columns:
            if column.details.name == a.details.name or column.clean_label == a.clean_label:
                return
        self._additional_columns.append(column)


class CohortActivity(Activity):
    fetch_type: CohortFetchTypeEnum

    @property
    def is_reduced(self) -> bool:
        return len(self.prefilter_columns) > 0

    @property
    def is_cohort(self):
        return True

    @property
    def _kind(self):
        return QueryKindEnum.cohort


class HideShow(BaseModel):
    mode: HideShowEnum
    column_ids: list[str]


class ActivityRelative(BaseModel):
    relation: SimpleRelationTypeEnum
    append_activity_id: str  # Ensure this only points to FIRS Tand Last Activities
    include_if_null: bool = True


class AppendActivity(Activity):
    fetch_type: AppendFetchTypeEnum
    relation: RelationTypeEnum

    time_refinements: list[RefinementTimeDetails] = Field(default_factory=list)
    joins: JoinConditonExpression | None = None
    relative_activities: list[ActivityRelative] = Field(default_factory=list)

    @property
    def is_reduced(self) -> bool:
        return (
            len(self.time_refinements or self.relative_activities or self.prefilter_columns) > 0
            or self.joins is not None
        )

    @property
    def is_cohort(self):
        return False

    @property
    def _kind(self):
        if self.relation == RelationTypeEnum.before:
            return QueryKindEnum.before
        elif self.relation == RelationTypeEnum.after:
            return QueryKindEnum.after
        elif self.relation == RelationTypeEnum.in_between:
            return QueryKindEnum.in_between
        elif self.relation == RelationTypeEnum.ever and (self.time_refinements or self.joins is not None):
            return QueryKindEnum.relative_ever
        else:
            return QueryKindEnum.ever

    @property
    def is_relative_ever(self) -> bool:
        return self._kind == QueryKindEnum.relative_ever


# to help reference this all the time
AnyActivity = Union[CohortActivity | AppendActivity]


class SelectedColumn(BaseModel):
    y2_available: bool = False
    ys: list[str] = []
    xs: list[str] = []
    color_bys: list[str] = []
    y2: str | None


class Annotation(BaseModel):
    x_location: str | None
    y_location: float | str = None
    color: str = "#565656"
    content: str = ""
    kind: AnnotationKindEnum = AnnotationKindEnum.point


class StatisticConfig(BaseModel):
    color: str = "#873bf4"


class Axis(BaseModel):
    autogen_title: str | None
    title: str | None
    y_axis: str | None
    x_axis: str | None
    y_log: bool = False
    y2_axis: str | None
    plot_kind: PlotKindEnum = None

    # auto config based on the type
    smooth: bool = True
    y_start: float | None
    y_end: float | None
    add_conversion: bool = False
    show_labels: bool = False
    add_sliders: bool = False
    slider_start: int = 0
    slider_end: int = 100
    is_percent: bool = False
    hide_legend: bool = False
    shared_hover: bool = False
    highlight_on_legend: bool = True
    add_hover_highlighting: bool = False
    add_brush: bool = False
    replace_0_1_with_did: bool = False
    add_regression_line: RegressionEnum = None
    add_statistics: bool = False
    statistic_config: StatisticConfig = StatisticConfig()
    overide_theme_colors: bool = False
    plot_colors: list[str] = None
    y2_color: str = "#5AD8A6"
    y2_line_dash: bool = True
    hidden_values: list[str] = None

    # INTERNAL ONLY
    limit_rows: int | None
    cluster_x_values: bool = False
    add_animation: bool = False
    animation_duration: int = 1000


class PlotDefinition(BaseModel):
    columns: SelectedColumn = SelectedColumn()
    axes: Axis | None = None
    annotations: list[Annotation] = Field(default_factory=list)
    question: str = None


class TabPlot(BaseModel):
    name: str
    slug: str
    config: PlotDefinition


class ColumnUI(TableColumnContext):
    id: str


class TabUI(BaseModel):
    columns: list[ColumnUI] = Field(default_factory=list)

    def column(self, column_id: str) -> ColumnUI:
        return next((c for c in self.columns if c.id == column_id), None)


class Tab(BaseModel):
    kind: TabKindEnum
    slug: str
    label: str

    data_mode: GroupModeEnum | None = None

    # only for TableKind Parent
    parent_filters: ParentFilterExpression | None = None
    order: list[Order] = Field(default_factory=list)

    # only for TableKind Parent
    hide_show: HideShow | None = None

    # Only if TabKind is Group
    columns: list[GroupColumn] = Field(default_factory=list)
    aggregate_dims: list[AggregateDimension] = Field(default_factory=list)

    plots: list[TabPlot] = Field(default_factory=list)
    tab_ui: TabUI | None = None
    _parent_columns: list[ParentColumn] = PrivateAttr(default=None)

    def set_data_mode(self):
        group_columns = self.get_columns(DetailKindEnum.group)
        if len(group_columns) == 0:
            self.data_mode = GroupModeEnum.metrics
        elif len(group_columns) == 1:
            if group_columns[0].type == ColumnTypeEnum.timestamp:
                self.data_mode = GroupModeEnum.over_time
            elif group_columns[0].type == ColumnTypeEnum.number:
                self.data_mode = GroupModeEnum.numeric
            else:
                self.data_mode = GroupModeEnum.values
        elif len(group_columns) > 1 and any(col.type == ColumnTypeEnum.timestamp for col in group_columns):
            self.data_mode = GroupModeEnum.multi_over_time
        else:
            self.data_mode = GroupModeEnum.values

    @property
    def output_columns(self) -> list[GroupColumn | ParentColumn]:
        all_cols = []
        columns_to_use = self._parent_columns if self.kind == TabKindEnum.parent else self.columns
        for c in columns_to_use:
            # Check if the column should be excluded from output
            if (
                not c.output
                or (c.details.kind == DetailKindEnum.group and c.details.pivoted)
                or (
                    self.hide_show
                    and (
                        (self.hide_show.mode == HideShowEnum.hide and c.id in self.hide_show.column_ids)
                        or (self.hide_show.mode == HideShowEnum.show and c.id not in self.hide_show.column_ids)
                    )
                )
            ):
                continue

            all_cols.append(c)
        return all_cols

    @property
    def possible_columns(self):
        return self._parent_columns if self.kind == TabKindEnum.parent else self.columns

    def column(self, column_id) -> GroupColumn | ParentColumn:
        if self.kind == TabKindEnum.parent:
            return next(
                (column for column in self._parent_columns if column.id == column_id),
                None,
            )
        else:
            return next((column for column in self.columns if column.id == column_id), None)

    def get_columns(self, kind: DetailKindEnum, output: bool = False) -> list[GroupColumn]:
        use_cols = self.output_columns if output else self.columns
        return [column for column in use_cols if column.details.kind == kind]

    def plot(self, plot_slug) -> TabPlot:
        return next((plot for plot in self.plots if plot.slug == plot_slug), None)

    def aggregate_dim(self, aggregate_dim_id: str) -> AggregateDimension:
        return next((ad for ad in self.aggregate_dims if ad.id == aggregate_dim_id), None)

    def remove_parent_filter_column(self, column_id: str):
        if self.parent_filters:
            if self.parent_filters.remove_operand_column(column_id):
                self.parent_filters = None

    def add_parent_filter(self, column_id: str, filter: list[AnyFilter], is_not: bool = False):
        for f in filter:
            parent_filter = ParentFilter(column_id=column_id, filter=f)
            if is_not or self.parent_filters is None or self.parent_filters.logical_operator == LogicalOperatorEnum.OR:
                parent_filter = ParentFilterExpression(
                    logical_operator=LogicalOperatorEnum.AND, operands=[parent_filter], is_not=is_not
                )

            if self.parent_filters is None:
                self.parent_filters = parent_filter
            else:
                self.parent_filters.operands.append(parent_filter)

    class Config:
        underscore_attrs_are_private = True


class Table(BaseModel):
    id: str
    table_name: str
    schema_name: str


class DatasetConfig(BaseModel):
    kind: DatasetKindEnum = DatasetKindEnum.activity

    # If SQL
    sql_query: str = None

    # if table:
    table: Table | None = None

    # if Time
    cohort_time: CohortTime | None = None

    # needed for the table
    table_id: str | None = None
    # If Activity
    cohort_activity: CohortActivity | None = None
    # if activity or Time
    append_activities: list[AppendActivity] = Field(default_factory=list)


class DatasetObject(DatasetConfig):
    columns: list[ParentColumn] = Field(default_factory=list)
    order: list[Order] = Field(default_factory=list)

    # All the tabs available
    all_tabs: list[Tab] = Field(default_factory=list)
    tab_ui: TabUI | None = None

    version: int = 2
    name: str = "New Dataset"

    # Additional values for easier use
    version_id: str | None = None
    id: str | None = None
    created_at: str | None = None
    description: str | None = None

    def __init__(self, **data):
        super().__init__(**data)
        for tab in self.all_tabs:
            tab._parent_columns = self.columns
            tab.set_data_mode()

    def set_data_mode(self):
        for tab in self.all_tabs:
            tab.set_data_mode()

    @property
    def activities(self) -> list[Union[CohortActivity, AppendActivity]]:
        activities = []
        if self.cohort_activity is not None:
            activities.append(self.cohort_activity)
        activities.extend(self.append_activities)
        return activities

    def activity_columns(self, activity_id: str, include_additional: bool = False) -> list[ParentColumn]:
        return [
            column
            for column in self.columns
            if column.details.kind == DetailKindEnum.activity and column.details.activity_id == activity_id
        ] + self.activity(activity_id)._additional_columns

    def clean_names(self):
        clean_names(self.columns)
        for tab in self.all_tabs:
            if tab.kind == TabKindEnum.group:
                clean_names(tab.columns)

    def get_activity_column(self, activity_id: str, name: str) -> ParentColumn | None:
        return next(
            (
                column
                for column in self.columns
                if column.details.kind == DetailKindEnum.activity
                and column.details.name == name
                and column.details.activity_id == activity_id
            ),
            None,
        )

    def new_tab(self, kind: TabKindEnum, label: str):
        tab = Tab(
            kind=kind,
            slug=slugify(label) + get_uuid()[:8],
            label=label,
        )
        tab._parent_columns = self.columns
        self.all_tabs.append(tab)
        return tab

    def add_group(self, column_ids: list[str] = None, label: str = "New Group"):
        tab = self.new_tab(TabKindEnum.group, label)
        for c in column_ids or []:
            col = self.column(c)
            if col is None:
                raise SilenceError(f"Could not find column for id: {c}")
            tab.columns.append(
                GroupColumn(
                    label=col.label,
                    type=col.type,
                    details=GroupDetails(
                        column_id=c,
                    ),
                )
            )
        tab.columns.append(
            GroupColumn(
                label="Total Rows",
                type=ColumnTypeEnum.number,
                details=MetricsDetails(agg_function=AggregateFunctionEnum.count_all),
            )
        )
        tab.order.append(Order(column_id=tab.columns[-1].id, asc=False))
        return tab

    @property
    def cohort_activity_id(self) -> str:
        return self.cohort_activity.id if self.cohort_activity else None

    @property
    def time_columns(self) -> list[ParentColumn]:
        return [column for column in self.columns if column.details.kind == DetailKindEnum.time]

    def activity_column_names(self, activity_id) -> list[str]:
        return [c.details.name for c in self.activity_columns(activity_id)]

    @property
    def activity_ids(self) -> list[str]:
        return list(set(item for a in self.activities for item in a.activity_ids))

    @property
    def output_columns(self) -> list[ParentColumn]:
        return [column for column in self.columns if column.output]

    @property
    def dim_tables(self) -> list[str]:
        dim_tables = set()
        for a in self.activities:
            for d in a.dims:
                dim_tables.add(d.table)
        for t in self.all_tabs:
            for d in t.aggregate_dims:
                dim_tables.add(d.table)
        return list(dim_tables)

    @property
    def require_custom_functions(self) -> bool:
        return any(
            SpecialDetailsEnum.custom_functions in (c.details.special_data or [])
            for c in self.columns
            if c.details.kind == DetailKindEnum.computed
        )

    @property
    def require_timeline_dates(self) -> bool:
        return any(
            SpecialDetailsEnum.timeline in (c.details.special_data or [])
            for c in self.columns
            if c.details.kind == DetailKindEnum.computed
        )

    def column(self, column_id) -> ParentColumn:
        return next((column for column in self.columns if column.id == column_id), None)

    def add_column(self, column: ParentColumn):
        if column in self.columns:
            return
        self.columns.append(column)

    def activity(self, activity_id) -> Union[CohortActivity, AppendActivity]:
        return next(
            (activity for activity in self.activities if activity.id == activity_id),
            None,
        )

    def get_columns(self, detail_type: DetailKindEnum) -> list[ParentColumn]:
        return [column for column in self.columns if column.details.kind == detail_type]

    def tab(self, tab_slug) -> Tab:
        tab = next((tab for tab in self.all_tabs if tab.slug == tab_slug), None)
        if tab is None:
            raise SilenceError(f"Could not find tab for slug: {tab_slug}")
        return tab

    def get_all_columns(self, tab_slug: str | None, output: bool = False) -> list[ParentColumn | GroupColumn]:
        if tab_slug is None:
            return self.output_columns if output else self.columns
        else:
            return self.tab(tab_slug).output_columns if output else self.tab(tab_slug).columns

    def get_ui(self, tab_slug: str | None = None) -> TabUI:
        if tab_slug:
            return self.tab(tab_slug).tab_ui
        else:
            return self.tab_ui

    def plot(self, tab_slug: str, plot_slug: str) -> TabPlot:
        tab = self.tab(tab_slug)
        if tab is None or tab.kind == TabKindEnum.group:
            raise SilenceError(f"Could not find group for slug: {tab_slug}")

        plot = tab.plot(plot_slug)

        if plot is None:
            raise SilenceError(f"Could not find plot for slug: {plot_slug}")
        return plot

    @property
    def all_plots(self) -> list[tuple[Tab, TabPlot]]:
        all_plots = []
        for g in self.all_plots:
            if g.kind == TabKindEnum.group:
                for p in g.plots:
                    all_plots.append((g, p))
        return all_plots

    def default_label(self, column: ParentColumn) -> str:
        if isinstance(column.details, ActivitySourceDetails):
            activity = self.activity(column.details.activity_id)
            if activity.is_cohort:
                return self._generate_cohort_label(column, activity)
            else:
                return self._generate_append_label(column, activity)

        # For other types of columns, return the original label
        return column.label

    def _generate_cohort_label(self, column: ParentColumn, activity: CohortActivity) -> str:
        if column.apply_quick_function:
            if column.details.name == ActivityColumns.ts:
                return column.apply_quick_function.capitalize()
            else:
                return column.apply_quick_function.capitalize() + " of " + column.label
        return column.label

    def _generate_append_label(self, column: ParentColumn, activity: AppendActivity) -> str:
        cohort_activity = self.cohort_activity
        is_same_activity = cohort_activity is not None and activity.activity_ids == cohort_activity.activity_ids

        if activity.fetch_type == AppendFetchTypeEnum.first and activity.relation in [
            RelationTypeEnum.in_between,
            RelationTypeEnum.after,
        ]:
            if is_same_activity:
                if column.details.name == ActivityColumns.ts:
                    return f"Next {activity.display_name} At"
                elif column.apply_quick_function == QuickFunctionEnum.exists:
                    return f"Did Repeat {activity.display_name}"
                elif column.apply_quick_function in RESOLUTIONS:
                    return f"{column.apply_quick_function.capitalize()} of Next {activity.display_name}"
                else:
                    return f"Next {column.label}"
            else:
                lab = (
                    "After" if cohort_activity.fetch_type == CohortFetchTypeEnum.all else title(RelationTypeEnum.value)
                )
                if column.details.name == ActivityColumns.ts:
                    return f"First {activity.display_name} {lab} At"
                elif column.apply_quick_function == QuickFunctionEnum.exists:
                    return f"Did {activity.display_name} {lab}"
                elif column.apply_quick_function in [QuickFunctionEnum.week, QuickFunctionEnum.month]:
                    return f"{column.apply_quick_function.capitalize()} of First {activity.display_name} {lab}"
                else:
                    return f"First {activity.display_name} {column.label} {lab}"

        elif activity.fetch_type == AppendFetchTypeEnum.last and activity.relation == RelationTypeEnum.before:
            prefix = "Last" if is_same_activity else "Last Before"
            if column.details.name == ActivityColumns.ts:
                return f"{prefix} {activity.display_name} At"
            elif column.apply_quick_function == QuickFunctionEnum.exists:
                return f"Did {'previously' if is_same_activity else ''} {activity.display_name}"
            elif column.apply_quick_function in [QuickFunctionEnum.week, QuickFunctionEnum.month]:
                return f"{column.apply_quick_function.capitalize()} of {prefix} {activity.display_name}"
            else:
                return f"{prefix} {activity.display_name} {column.label}"

        # Default case: return the original label
        return column.label

    def default_metric_label(self, column: GroupColumn) -> str:
        if isinstance(column.details, MetricsDetails):
            if column.details.agg_function == AggregateFunctionEnum.count_all:
                if self.kind == DatasetKindEnum.activity:
                    if self.cohort_activity.fetch_type == CohortFetchTypeEnum.all:
                        return "Total Events"
                    else:
                        return "Total Unique Customers"
                return "Total Rows"
            else:
                col = self.column(column.details.column_id)
                if isinstance(col.details, ActivitySourceDetails):
                    activity = self.activity(col.details.activity_id)
                    if self.kind == DatasetKindEnum.activity:
                        if activity.id == self.cohort_activity_id:
                            if column.details.agg_function == AggregateFunctionEnum.average:
                                return f"Likelihood to Repeat {activity.display_name}"
                            elif column.details.agg_function == AggregateFunctionEnum.sum:
                                return f"Total Repeated {activity.display_name}"
                        else:
                            if column.details.agg_function == AggregateFunctionEnum.average:
                                return f"Conversion Rate to {activity.display_name}"
                            elif column.details.agg_function == AggregateFunctionEnum.sum:
                                return f"Total {activity.display_name}"

            if column.details.agg_function == AggregateFunctionEnum.sum and column.type == ColumnTypeEnum.number:
                return f"Total {column.label}"
            elif column.details.agg_function == AggregateFunctionEnum.count and column.type == ColumnTypeEnum.number:
                return f"Total Non-Null {column.label}"
            elif column.details.agg_function == AggregateFunctionEnum.count_distinct:
                return f"Total Unique {column.label}"
            return f"{column.details.agg_function.capitalize()} of {column.label}"
        else:
            return column.label

    def drill_into(self, tab_slug: str, row: dict, select_column_id: str) -> Tab:
        original_tab = self.tab(tab_slug)
        tab = self.new_tab(TabKindEnum.parent, "Drill Into:")
        tab.parent_filters = original_tab.parent_filters
        labels = []
        # add the group filters
        for c in original_tab.get_columns(kind=DetailKindEnum.group):
            tab.add_parent_filter(c.details.column_id, [c.quick_filter("equal", row[c.clean_label])])
            labels.append(row[c.clean_label])

        selected_col = original_tab.column(select_column_id)

        if selected_col.details.kind == DetailKindEnum.metric:
            if selected_col.details.agg_function in (AggregateFunctionEnum.sum, AggregateFunctionEnum.average):
                labels.append(f"Non-Zero {selected_col.label}")
                tab.add_parent_filter(selected_col.details.column_id, [selected_col.quick_filter("not_equal", 0)])
            elif selected_col.details.agg_function == AggregateFunctionEnum.count:
                labels.append(f"Not NULL {selected_col.label}")
                tab.add_parent_filter(selected_col.details.column_id, [selected_col.quick_filter("not_is_null", None)])

        tab.label += f":{'& '.join(labels)}"
        return tab
