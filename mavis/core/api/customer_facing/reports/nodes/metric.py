from dataclasses import dataclass
from datetime import datetime
from typing import Any

from core.api.customer_facing.reports.models import DatasetNodeDetails, MetricData, MetricNodeConfig
from core.api.customer_facing.reports.nodes import ReportNode
from core.utils import date_add, date_trunc
from core.v4.createDataset import TimeFilter
from core.v4.dataset_comp.query.model import (
    BooleanFilter,
    ColumnToColumnFilter,
    LogicalOperatorEnum,
    NullFilter,
    NumberArrayFilter,
    NumberFilter,
    ParentFilter,
    ParentFilterExpression,
    StringArrayFilter,
    StringFilter,
    TimeCondition,
    VariableFilter,
)
from core.v4.utils import utcnow


@dataclass
class MetricNode(ReportNode):
    config: MetricNodeConfig

    @property
    def output_model(self):
        return MetricData

    def _run(self) -> MetricData:
        ds = self.get_dataset(self.config.dataset.id)
        data = ds.run(self.config.dataset.tab.slug)

        metric_col = data.column(self.config.dataset.tab.column.id)
        if self.config.title is None:
            self.config.title = metric_col.header_name

        if self.config.filters:
            columns = {column.id: column for column in data.columns}
            row = apply_parent_filter(self.config.filters, data.rows, columns)
            current_value = row.get(metric_col.field)
        else:
            current_value = data.rows[0].get(metric_col.field)

        if self.config.comparison_filter:
            columns = {column.id: column for column in data.columns}
            row = apply_parent_filter(self.config.comparison_filter, data.rows, columns)
            comparison_value = row.get(metric_col.field)
        else:
            comparison_value = None

        if self.config.show_plot:
            plot_data = dict(
                chart_type="tiny-area",
                use_antv=True,
                plot_config=dict(
                    data=[r[metric_col.field] for r in data.rows],
                    smooth=True,
                    areaStyle=dict(
                        fill=f"l(270) 0.2:#ffffff 1:{self.config.plot_color}",
                    ),
                    line=dict(size=2, color=self.config.plot_color),
                    tooltip=dict(narrator_format=metric_col.context.format),
                ),
            )
        else:
            plot_data = None

        return MetricData(
            title=self.config.title,
            format=metric_col.context.format,
            color=self.config.color,
            show_ticker=self.config.show_ticker,
            current_value=current_value,
            comparison_value=comparison_value,
            plot_data=plot_data,
            context=DatasetNodeDetails(
                **{k: v for k, v in data.context.dict().items() if k != "applied_filters"},
                applied_filters=self.run_details.applied_filters,
            ),
        )

    def _get_datasets(self) -> list[tuple[str, str]]:
        return [(self.config.dataset.id, self.config.dataset.tab.slug)]


def apply_parent_filter(filter_expr: ParentFilterExpression, rows: list[dict], columns: dict) -> dict:
    return next((row for row in rows if evaluate_expression(filter_expr, row, columns)), {})


def apply_filter(filter: ParentFilter, row: dict, columns: dict) -> bool:
    column = columns[filter.column_id]
    value = row[column.field]

    if isinstance(filter.filter, ColumnToColumnFilter):
        other_column = columns[filter.filter.column_id]
        other_value = row[other_column.field]
        return compare_values(value, other_value, filter.filter.operator)
    else:
        operator = filter.filter.operator
        if isinstance(filter.filter, NumberFilter):
            filter_value = filter.filter.number
        elif isinstance(filter.filter, StringFilter):
            filter_value = filter.filter.value
        elif isinstance(filter.filter, BooleanFilter):
            filter_value = filter.filter.is_true
        elif isinstance(filter.filter, VariableFilter):
            # ToDO:
            filter_value = filter.filter.variable_value
        elif isinstance(filter.filter, NullFilter):
            filter_value = None
        elif isinstance(filter.filter, StringArrayFilter):
            filter_value = filter.filter.values
        elif isinstance(filter.filter, NumberArrayFilter):
            filter_value = filter.filter.values
        elif isinstance(filter.filter, TimeFilter) and filter.filter.operator != "time_range":
            filter_value = filter.filter.time_value
        else:
            return compare_time_condition(value, filter.filter)

        filter_value = filter.filter.number if hasattr(filter.filter, "number") else filter.filter.value
        return compare_values(value, filter_value, operator)


def evaluate_expression(expr: ParentFilterExpression, row: dict, columns: dict) -> bool:
    results = [
        evaluate_expression(operand, row, columns)
        if isinstance(operand, ParentFilterExpression)
        else apply_filter(operand, row, columns)
        for operand in expr.operands
    ]

    if expr.logical_operator == LogicalOperatorEnum.AND:
        return all(results)
    elif expr.logical_operator == LogicalOperatorEnum.OR:
        return any(results)
    else:
        raise ValueError(f"Unknown logical operator: {expr.logical_operator}")


def compare_time_condition(value: Any, filter: TimeFilter) -> bool:
    from_condition = filter.from_condition
    to_condition = filter.to_condition
    now = utcnow()

    if from_condition:
        from_date = get_date_from_condition(from_condition, now)
        if value < from_date:
            return False

    if to_condition:
        to_date = get_date_from_condition(to_condition, now)
        if value > to_date:
            return False

    return True


def get_date_from_condition(condition: TimeCondition, now: datetime) -> datetime:
    if condition.reference == "relative":
        return date_add(now, condition.details.resolution, condition.details.value)
    elif condition.reference == "absolute":
        return condition.details.date_time
    elif condition.reference == "start_of":
        return date_trunc(now, condition.details.resolution)
    else:
        raise ValueError(f"Unknown time reference: {condition.reference}")


def _clean_time_value(value: str) -> str:
    if isinstance(value, str):
        if value.endswith("+00:00"):
            value = value[:-6]
    if value.endswith("00:00:00"):
        value = value[:10]
    return value


def compare_values(value1: Any, value2: Any, operator: str) -> bool:
    if operator == "equal":
        return _clean_time_value(value1) == _clean_time_value(value2)
    elif operator == "not_equal":
        return _clean_time_value(value1) != _clean_time_value(value2)
    elif operator == "greater_than":
        return value1 > value2
    elif operator == "less_than":
        return value1 < value2
    elif operator == "greater_than_equal":
        return value1 >= value2
    elif operator == "less_than_equal":
        return value1 <= value2
    elif operator == "contains":
        return value2 in value1
    elif operator == "not_contains":
        return value2 not in value1
    elif operator == "starts_with":
        return value1.startswith(value2)
    elif operator == "ends_with":
        return value1.endswith(value2)
    elif operator == "contains_any":
        return any(value2 in value1)
    elif operator == "not_contains_any":
        return not any(value2 in value1)
    elif operator == "not_starts_with":
        return not value1.startswith(value2)
    elif operator == "not_ends_with":
        return not value1.endswith(value2)
    elif operator == "is_in":
        return value1 in value2
    elif operator == "not_is_in":
        return value1 not in value2
    elif operator == "is_empty":
        return value1 == "" or value1 is None
    elif operator == "not_is_empty":
        return value1 != "" and value1 is not None
    elif operator == "is_null":
        return value1 is None
    elif operator == "not_is_null":
        return value1 is not None

    else:
        raise ValueError(f"Unknown operator: {operator}")
