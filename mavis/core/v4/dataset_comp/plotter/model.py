from enum import StrEnum
from typing import Literal
from pydantic import Field
from core.api.customer_facing.utils.pydantic import CamelModel
from core.models.ids import UUIDStr
from core.v4.dataset_comp.query.model import AggregateFunctionEnum


class PlotTypeEnum(StrEnum):
    metric = "metric"
    line = "line"
    column = "column"
    bar = "bar"
    pie = "pie"
    scatter = "scatter"


class StatisticTypeEnum(StrEnum):
    average_line = "average_line"
    max_line = "max_line"
    min_line = "min_line"
    sum_line = "sum_line"
    recent_trend = "recent_trend"
    median_line = "median_line"
    greatest_change = "greatest_change"
    left_right_change_value = "left_right_change_value"
    best_option = "best_option"
    poly_fit = "poly_fit"
    log_fit = "log_fit"
    linear_fit = "linear_fit"
    exponential_fit = "exponential_fit"
    power_fit = "power_fit"


class TimeFilterTypeEnum(StrEnum):
    last_30_days = "last_30_days"
    last_90_days = "last_90_days"
    last_180_days = "last_180_days"
    last_365_days = "last_365_days"
    last_year = "last_year"
    ytd = "ytd"
    mtd = "mtd"
    qtd = "qtd"
    yesterday = "yesterday"
    last_week = "last_week"
    last_month = "last_month"
    last_quarter = "last_quarter"
    today = "today"
    this_week = "this_week"
    this_month = "this_month"
    this_quarter = "this_quarter"
    this_year = "this_year"


class TimeSegmentTypeEnum(StrEnum):
    day = "day"
    week = "week"
    month = "month"
    quarter = "quarter"
    year = "year"


class MetricSelectValueEnum(StrEnum):
    first_value = "first_value"
    second_value = "second_value"
    last_value = "last_value"
    second_last_value = "second_last_value"
    min_value = "min_value"
    max_value = "max_value"
    average_value = "average_value"
    sum_value = "sum_value"
    median_value = "median_value"


class AppliedLogicEnum(StrEnum):
    percent_of_total = "percent_of_total"
    cumulative_total = "cumulative_total"


class BasicActivity(CamelModel):
    id: UUIDStr
    name: str


class BasicColumn(CamelModel):
    column_id: str
    label: str
    from_parent: bool = Field(default=False)


class BasicMetricColumn(BasicColumn):
    aggregate_function: AggregateFunctionEnum | None = None  # if is_parent is true


class MetricColumn(CamelModel):
    column: BasicMetricColumn

    # allows the user to
    from_parent: bool = Field(default=False)
    aggregate_function: AggregateFunctionEnum | None = None  # if is_parent is true

    # allows additional logic to be applied to the metric
    applied_logic: AppliedLogicEnum | None = None


class Metric(CamelModel):
    columns: list[MetricColumn] = Field(default_factory=list)
    y2_column: MetricColumn | None = None

    # if metric
    select_value: MetricSelectValueEnum | None = None  # if no time segment is set
    compare_value: MetricSelectValueEnum | None = (
        None  # if compare_to_last_period or compare_to_last_year -> this cannot be set
    )

    # if line, column, bar
    stack: bool = Field(default=False)

    # if bar, column & stack is true
    out_of_100_percent: bool = Field(default=False)

    # if pie
    donut: bool = Field(default=False)


class Segment(CamelModel):
    columns: list[BasicColumn] = Field(default_factory=list)
    activities: list[BasicActivity] = Field(default_factory=list)


class TimeFilter(CamelModel):
    type: TimeFilterTypeEnum
    compare_to_last_period: bool = Field(default=False)
    compare_to_last_year: bool = Field(default=False)


class Define(CamelModel):
    type: PlotTypeEnum
    metrics: list[Metric]
    segments: list[Segment]
    time_segment: TimeSegmentTypeEnum | None = None
    time_filter: TimeFilter | None = None
    statistics: list[StatisticTypeEnum] = Field(default_factory=list)


class ColorOverride(CamelModel):
    metric_id: str
    value: str | None = None
    color: str
    line_type: Literal["solid", "dashed", "dotted"] = Field(default="solid")
    show_dots: bool = Field(default=False)


class Annotation(CamelModel):
    type: Literal["point", "line", "area"]
    color: str
    x: str | float | None = None
    y: str | float | None = None
    content: str | None = None
    color_above: bool = Field(default=False)


class Axis(CamelModel):
    subtitle: str | None = None
    y: str | None = None
    x: str | None = None
    y2: str | None = None
    # all the filters
    dash_current_time_period: bool = Field(default=False)
    y_log_scale: bool = Field(default=False)
    show_labels: bool = Field(default=True)
    hide_legend: bool = Field(default=False)
    show_combined_tooltip: bool = Field(default=False)
    show_x_slider: bool = Field(default=False)  # if time_segment is set
    align: Literal["left", "center", "right"] = Field(default="left")  # if metric
    override_colors: list[ColorOverride] = Field(default_factory=list)


class Plot(CamelModel):
    title: str | None = None
    define: Define
    axis: Axis = Field(default_factory=Axis)
    annotations: list[Annotation] = Field(default_factory=list)
