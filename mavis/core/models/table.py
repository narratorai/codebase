import re
from enum import StrEnum
from typing import Literal

from babel.numbers import format_currency, format_percent
from pydantic import BaseModel, Field, validator
from casefy import casefy

from core.models.text import title
from core.models.time import make_local, pretty_diff, todt, utcnow
from core.v4.utils import query_results


class ColumnTypeEnum(StrEnum):
    json = "json"
    string = "string"
    timestamp = "timestamp"
    number = "number"
    boolean = "boolean"


class DisplayFormatEnum(StrEnum):
    percent = "percent"
    currency = "currency"
    decimal = "decimal"
    short_decimal = "short_decimal"  # 1K, 1.23M - Not more than 3 digits. If less than 1 then we should have it be min precision so 0.0001 not 1ms
    month = "month"  # February 2024
    quarter = "quarter"  # Q2 2024
    year = "year"  # 2024
    short_date = "short_date"  # 04/13/2024
    short_time = "short_time"  # 13:30
    short_date_time = "short_date_time"  # 04/13/2024 13:30 PM
    # some long form
    date = "date"  # Jan 1, 2024
    date_time = "date_time"  # Jan 1 2024, 1:30 PM
    distance_to_now = "distance_to_now"  # 1 day ago [can be few seconds ago, 1 hour ago, etc.]
    short_date_time_distance_to_now = "short_date_time_distance_to_now"  # 04/13/2024 13:30 (1 day ago)
    short_date_distance_to_now = "short_date_distance_to_now"  # 4/13/2024 (1 day ago) [Only has the date]
    duration_seconds = "duration_seconds"  # 5 minutes and 3 seconds
    duration_days = "duration_days"  # 1 month, 4 days and 2 hours
    duration_hours = "duration_hours"  # 1 month, 4 days and 2 hours
    duration_minutes = "duration_minutes"  # 1 month, 4 days and 2 hours
    duration_months = "duration_months"  # 1 month, 4 days and 2 hours
    string = "string"
    boolean = "boolean"
    boolean_action = "boolean_action"  # Did if 1, Did Not if 0

    # used for styling and formatting (ONLY USE IN TABLE)
    text = "text"  # wrapped # Change to 'wrapped_string'

    # ticker
    ticker_decimal = "ticker_decimal"
    ticker_percent = "ticker_percent"
    ticker_currency = "ticker_currency"
    ticker_short_decimal = "ticker_short_decimal"


class ComparatorEnum(StrEnum):
    always = "always"
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
    is_null = "is_null"
    not_is_null = "not_is_null"
    is_empty = "is_empty"
    not_is_empty = "not_is_empty"


class CellStyle(BaseModel):
    background_color: str | None = None
    color: str | None = None  # hex color
    font_style: Literal["normal", "italic"] | None = None
    font_weight: Literal["normal", "bold"] | None = None
    border_style: Literal["none", "solid"] | None = None
    border_width: str | None = None  # ex. 1px
    border_top_color: str | None = None
    border_bottom_color: str | None = None
    border_left_color: str | None = None
    border_right_color: str | None = None


class ColumnCondition(BaseModel):
    comparator: ComparatorEnum = ComparatorEnum.equal
    threshold_value: int | float | str | bool | None = None


class ConditionalFormat(ColumnCondition):
    format: DisplayFormatEnum | None = None


class ConditionalStyles(ColumnCondition):
    cell_style: CellStyle


class TableColumnContext(BaseModel):
    format: DisplayFormatEnum | None = None
    width: int | None = None
    wrap_text: bool = False
    auto_height: bool = True
    flex: int | None = 1
    pinned: Literal["left", "right"] | None = None
    format_conditions: list[ConditionalFormat] = Field(default_factory=list)
    style_conditions: list[ConditionalStyles] = Field(default_factory=list)
    align_text: Literal["left", "center", "right"] | None = None
    order: int = 1000
    is_customer: bool = False
    customer_table_id: str | None = None

    @validator("format", pre=True)
    def validate_format(cls, v):
        if v is None:
            return None
        try:
            return DisplayFormatEnum(v)
        except ValueError:
            return None


class TableColumn(BaseModel):
    id: str
    field: str
    header_name: str
    raw_type: str
    type: ColumnTypeEnum
    parent: str | None = None
    context: TableColumnContext | None = None

    @property
    def lower_name(self) -> str:
        return self.field.lower()


class Metadata(BaseModel):
    is_cache: bool = False
    name: str | None = None
    timezone: str | None = None
    locale: str | None = None
    currency: str | None = None
    data_scanned: int | None = None
    # For downloading
    table_id: str | None = None
    snapshot_time: str | None = None
    dataset_name: str | None = None
    dataset_id: str | None = None
    version_id: str | None = None
    tab_slug: str | None = None
    group_name: str | None = None
    can_drill_into: bool = False
    is_all: bool = False
    applied_filters: list | None = None


class TableData(BaseModel):
    columns: list[TableColumn]
    rows: list[dict]
    retrieved_at: str = Field(default_factory=utcnow)
    context: Metadata = Field(default_factory=Metadata)

    @property
    def total_rows(self):
        return len(self.rows)

    def external_dict(self, *args, **kwargs):
        data = _external_dict(self.__dict__, camel_case=True)

        data["columns"] = _reverse_children(data["columns"])
        for column in data["columns"]:
            # we need to move format to type
            column["field"] = casefy.camelcase(column["field"])
            column["type"] = column["context"]["format"]
            if not column["children"]:
                del column["children"]

            for k in ("autoHeight", "wrapText", "flex", "pinned", "width"):
                if column["context"][k] is not None:
                    column[k] = column["context"][k]
                del column["context"][k]

        return data

    def to_old(self) -> dict:
        return dict(
            columns=[
                dict(name=c.field, friendly_name=c.header_name, type=c.type, is_customer=c.context.is_customer)
                for c in self.columns
            ],
            rows=self.rows,
            retrieved_at=self.retrieved_at,
            metadata=dict(
                title=self.context.name,
                customer_column=next((c.field for c in self.columns if c.context.is_customer), None),
                customer_kind="customer",
                table_id=self.context.table_id,
            ),
        )

    def to_csv(self, delimiter=",", skip_header: bool = False):
        return query_results.serialize_query_result_to_dsv(self.to_old(), delimiter, skip_header=skip_header)

    def to_xls(self, skip_header: bool = False) -> str:
        return query_results.serialize_query_result_to_xlsx(self.to_old(), ",", skip_header=skip_header)

    def to_markdown(self) -> str:
        return self.pretty()

    def to_html(self) -> str:
        # Convert table to html
        output_str = []

        # create the table
        output_str.append('<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">')

        # create the header
        output_str.append("<thead>")
        output_str.append('<tr style="background-color: #f2f2f2;">')
        for c in self.columns:
            if c.context and c.context.align_text:
                align_text = c.context.align_text
            else:
                align_text = "left"  # default
            output_str.append(
                f'<th style="padding: 12px; border: 1px solid #dddddd; text-align: {align_text};">{c.header_name}</th>'
            )
        output_str.append("</tr>")
        output_str.append("</thead>")

        # create the body
        output_str.append("<tbody>")
        for r in self.rows:
            output_str.append("<tr>")
            for c in self.columns:
                if c.context and c.context.align_text:
                    align_text = c.context.align_text
                else:
                    align_text = "left"  # default
                output_str.append(
                    f'<td style="padding: 12px; border: 1px solid #dddddd; text-align: {align_text};">{r[c.field]}</td>'
                )
            output_str.append("</tr>")
        output_str.append("</tbody>")

        output_str.append("</table>")

        return "\n".join(output_str)

    def pretty(self) -> str:
        output_str = ["| " + " |".join([c.header_name for c in self.columns]) + " |"]

        # create the line underneath
        row_str = ["|"]
        # go through all the columns
        for c in self.columns:
            row_str.extend([":", "-" * len(c.header_name), "|"])

        output_str.append("".join(row_str))

        # create the body
        for r in self.rows:
            # create the row of values
            output_str.append(
                "| "
                + " |".join(
                    [
                        (self.format_value(r.get(c.field), c).replace("|", " ").replace("\n", "<br>"))
                        for c in self.columns
                    ]
                )
                + " |"
            )

        return "\n".join(output_str)

    def column(self, id: str | None = None, field: str | None = None, raise_error: bool = True) -> TableColumn:
        c = next((c for c in self.columns if c.id == id or c.field == field), None)
        if not c and raise_error:
            raise ValueError("Could not find column in table")
        return c

    def column_values(self, c: TableColumn) -> list[any]:
        return [r[c.field] for r in self.rows]

    def unique_column_values(self, c: TableColumn) -> list[any]:
        return list(set(self.column_values(c)))

    def limit(self, limit: int | None = None):
        self.rows = self.rows[:limit]

    def format_value(self, value: any, column_id: str | TableColumn):
        if isinstance(column_id, TableColumn):
            col = column_id
        else:
            col = self.column(column_id)
        return human_format(
            value,
            col.context.format or guess_format(col.header_name, col.type),
            self.context.timezone,
            self.context.locale,
            self.context.currency,
        )


def _quick_column(field: str, type: str, **kwargs) -> TableColumn:
    return TableColumn(
        id=field,
        field=field,
        header_name=title(field),
        raw_type=type,
        type=convert_type(type),
        context=TableColumnContext(**kwargs),
    )


def _reverse_children(columns: list[dict]):
    return_cols = []
    has_parent = False
    for c in columns:
        c["children"] = c.get("children") or []
        if pc_name := c["parent"]:
            # use the old pc if it already exists with the same id
            pc = next(
                (p for p in return_cols if p["id"] == pc_name),
                TableColumn(
                    id=pc_name,
                    field="",
                    header_name=pc_name,
                    raw_type="",
                    type=ColumnTypeEnum.string,
                ),
            )
            pc["children"].append(c)
            return_cols.append(pc)
            has_parent = True
        else:
            return_cols.append(c)

    return _reverse_children(return_cols) if has_parent else return_cols


def _external_dict(data: any, camel_case: bool = False):
    if isinstance(data, BaseModel):
        if hasattr(data, "external_dict"):
            return data.external_dict(camel_case=camel_case)
        else:
            return {
                casefy.camelcase(k) if camel_case else k: _external_dict(v, camel_case)
                for k, v in data.__dict__.items()
            }
    elif isinstance(data, dict):
        return {casefy.camelcase(k) if camel_case else k: _external_dict(v, camel_case) for k, v in data.items()}
    elif isinstance(data, list):
        return [_external_dict(item, camel_case) for item in data]
    else:
        return data


PERCENT_WORDS = set(("%", "rate", "likelihood", "percent"))
REVENUE_WORDS = set(
    (
        "$",
        "usd",
        "revenue",
        "rev",
        "price",
        "gmv",
        "mrr",
        "arr",
        "cpc",
        "cpi",
        "tax",
        "cost",
        "ltv",
        "cac",
        "aov",
        "spent",
        "spend",
        "amount",
        "equity",
        "arpu",
        "rpc",
    )
)
NUMBER_WORDS = set(("total", "rows", "count", "sum"))
ID_WORDS = set(("id", "link", "url", "identifier", "customer", "email", "slug"))


def guess_format(name: str, type: ColumnTypeEnum) -> DisplayFormatEnum | None:
    if not name:
        return None
    name = name.lower()
    pieces = set(re.findall(r"[a-z$]+", name))

    # Percent format
    if type == ColumnTypeEnum.number:
        if PERCENT_WORDS.intersection(pieces) and not {"top", "row"}.intersection(pieces):
            return DisplayFormatEnum.percent
        # Revenue format
        elif REVENUE_WORDS.intersection(pieces):
            return DisplayFormatEnum.currency
        elif ID_WORDS.intersection(pieces):
            return DisplayFormatEnum.string
        elif {"to", "since", "from"}.intersection(pieces):
            if {"day", "days"}.intersection(pieces):
                return DisplayFormatEnum.duration_days
            elif {"hour", "hours"}.intersection(pieces):
                return DisplayFormatEnum.duration_hours
            elif {"minute", "minutes"}.intersection(pieces):
                return DisplayFormatEnum.duration_minutes
            elif {"month", "months"}.intersection(pieces):
                return DisplayFormatEnum.duration_months
            elif {"second", "seconds"}.intersection(pieces):
                return DisplayFormatEnum.duration_seconds
            else:
                return DisplayFormatEnum.decimal
        elif "diff" in pieces or {"percent increase", "percent decrease", "% diff", "lift"}.intersection(
            set(name.split())
        ):
            return DisplayFormatEnum.ticker_percent
        else:
            return DisplayFormatEnum.decimal

    # Date and time formats
    elif type == ColumnTypeEnum.timestamp:
        if "month" in pieces:
            return DisplayFormatEnum.month
        elif "quarter" in pieces and "offset" not in pieces:
            return DisplayFormatEnum.quarter
        elif "year" in pieces:
            return DisplayFormatEnum.year
        elif any(word in pieces for word in ("day", "week")):
            return DisplayFormatEnum.short_date
        else:
            return DisplayFormatEnum.short_date_time
    elif type == ColumnTypeEnum.string:
        if name.startswith("did"):
            return DisplayFormatEnum.boolean_action
        return DisplayFormatEnum.string
    elif type == ColumnTypeEnum.boolean:
        return DisplayFormatEnum.boolean
    return None


def convert_type(raw_type: str | None) -> ColumnTypeEnum | None:
    if raw_type is None:
        return None
    raw_type = raw_type.lower()

    type_mapping = {
        ColumnTypeEnum.string: {"character varying", "character", "text", "string"},
        ColumnTypeEnum.timestamp: {
            "timestamp without time zone",
            "timestamp with time zone",
            "date",
            "datetime",
            "time",
            "timestamp",
            "timestamptz",
        },
        ColumnTypeEnum.number: {
            "bigint",
            "integer",
            "float",
            "double precision",
            "numeric",
            "smallint",
            "number",
            "decimal",
            "int64",
        },
        ColumnTypeEnum.boolean: {"boolean", "bool"},
        ColumnTypeEnum.json: {"json"},
    }

    for column_type, type_set in type_mapping.items():
        if raw_type in type_set:
            return column_type

    return ColumnTypeEnum.string  # Default to string for unknown types


def _default_format(type: ColumnTypeEnum) -> DisplayFormatEnum:
    if type == ColumnTypeEnum.string:
        return DisplayFormatEnum.string
    elif type == ColumnTypeEnum.number:
        return DisplayFormatEnum.decimal
    elif type == ColumnTypeEnum.timestamp:
        return DisplayFormatEnum.short_date_time
    elif type == ColumnTypeEnum.boolean:
        return DisplayFormatEnum.boolean


def format_to_old(format: DisplayFormatEnum | None) -> str:
    if format is None:
        return None
    elif format == DisplayFormatEnum.currency:
        return "revenue"
    elif format == DisplayFormatEnum.short_decimal:
        return "number"
    elif format == DisplayFormatEnum.decimal:
        return "number"
    elif format == DisplayFormatEnum.short_date:
        return "date"
    elif format == DisplayFormatEnum.short_date_time:
        return "time"
    elif format == DisplayFormatEnum.duration_days:
        return "number"
    elif format == DisplayFormatEnum.duration_hours:
        return "number"
    elif format == DisplayFormatEnum.duration_minutes:
        return "number"
    elif format == DisplayFormatEnum.duration_months:
        return "number"
    elif format == DisplayFormatEnum.duration_seconds:
        return "number"
    return format.value


def format_value(value: any, format: DisplayFormatEnum | None) -> str:
    return human_format(value, format)


def human_format(
    value: any,
    format: DisplayFormatEnum | None,
    timezone: str | None = None,
    locale: str | None = None,
    currency: str | None = None,
) -> str:
    """Format a value according to the specified DisplayFormatEnum format

    Args:
        value: The value to format
        format: The DisplayFormatEnum format to use
        timezone: Optional timezone for datetime formatting
        locale: Optional locale for number/currency formatting
        currency: Optional currency code for currency formatting

    Returns:
        Formatted string representation of the value
    """
    if value is None:
        return " - "

    if format is None:
        return str(value)

    # Handle timestamp formats
    if format in {
        DisplayFormatEnum.date,
        DisplayFormatEnum.date_time,
        DisplayFormatEnum.month,
        DisplayFormatEnum.quarter,
        DisplayFormatEnum.year,
        DisplayFormatEnum.short_date,
        DisplayFormatEnum.short_time,
        DisplayFormatEnum.short_date_time,
        DisplayFormatEnum.distance_to_now,
        DisplayFormatEnum.short_date_time_distance_to_now,
        DisplayFormatEnum.short_date_distance_to_now,
    }:
        try:
            dt = todt(value) if isinstance(value, str) else value
            if timezone:
                dt = make_local(dt, timezone)

            if format == DisplayFormatEnum.month:
                return dt.strftime("%B %Y")
            elif format == DisplayFormatEnum.quarter:
                return f"Q{(dt.month-1)//3 + 1} {dt.year}"
            elif format == DisplayFormatEnum.year:
                return str(dt.year)
            elif format == DisplayFormatEnum.short_date:
                return dt.strftime("%m/%d/%Y" if not timezone or "europe" not in timezone.lower() else "%d/%m/%Y")
            elif format == DisplayFormatEnum.short_time:
                return dt.strftime("%H:%M")
            elif format == DisplayFormatEnum.short_date_time:
                return dt.strftime("%m/%d/%Y %H:%M")
            elif format == DisplayFormatEnum.distance_to_now:
                return pretty_diff(dt, utcnow())
            elif format == DisplayFormatEnum.short_date_time_distance_to_now:
                return f"{dt.strftime('%m/%d/%Y %H:%M')} ({pretty_diff(dt, utcnow())})"
            elif format == DisplayFormatEnum.short_date_distance_to_now:
                return f"{dt.strftime('%m/%d/%Y')} ({pretty_diff(dt, utcnow())})"
            elif format == DisplayFormatEnum.date:
                return dt.strftime("%b %d, %Y")
            else:  # date_time
                return dt.strftime("%b %d %Y, %I:%M %p")
        except Exception:
            return str(value)

    # Handle duration formats
    if format in {
        DisplayFormatEnum.duration_seconds,
        DisplayFormatEnum.duration_minutes,
        DisplayFormatEnum.duration_hours,
        DisplayFormatEnum.duration_days,
        DisplayFormatEnum.duration_months,
    }:
        try:
            seconds = float(value)

            # Convert to appropriate units based on format
            if format == DisplayFormatEnum.duration_seconds:
                if seconds < 60:
                    return f"{int(seconds)} seconds"
                minutes = seconds / 60
                if minutes < 60:
                    return f"{int(minutes)} minutes and {int(seconds % 60)} seconds"
                hours = minutes / 60
                if hours < 24:
                    return f"{int(hours)} hours, {int(minutes % 60)} minutes"
                days = hours / 24
                return f"{int(days)} days, {int(hours % 24)} hours"

            elif format == DisplayFormatEnum.duration_minutes:
                minutes = seconds / 60
                if minutes < 60:
                    return f"{int(minutes)} minutes"
                hours = minutes / 60
                if hours < 24:
                    return f"{int(hours)} hours, {int(minutes % 60)} minutes"
                days = hours / 24
                return f"{int(days)} days, {int(hours % 24)} hours"

            elif format == DisplayFormatEnum.duration_hours:
                hours = seconds / 3600
                if hours < 24:
                    return f"{int(hours)} hours"
                days = hours / 24
                return f"{int(days)} days, {int(hours % 24)} hours"

            elif format == DisplayFormatEnum.duration_days:
                days = seconds / 86400
                return f"{int(days)} days"

            elif format == DisplayFormatEnum.duration_months:
                months = seconds / (86400 * 30)  # Approximate
                return f"{int(months)} months"

        except (ValueError, TypeError):
            return str(value)

    # Handle numeric formats
    try:
        num = float(value)

        if format == DisplayFormatEnum.percent:
            # if abs(num) < 0.01:
            #     return format_percent(num, locale=locale or "en_US", decimal_quantization=True)
            return format_percent(num, locale=locale or "en_US")

        elif format == DisplayFormatEnum.currency:
            return format_currency(num, currency or "USD", locale=locale or "en_US")

        elif format == DisplayFormatEnum.ticker_decimal:
            prefix = "+" if num > 0 else ""
            return f"{prefix}{num:+.1f}%"

        elif format == DisplayFormatEnum.decimal:
            return f"{num:,.2f}"

        elif format == DisplayFormatEnum.short_decimal:
            for suffix in ["", "K", "M", "B", "T"]:
                if abs(num) < 1000:
                    return f"{num:.1f}{suffix}" if num % 1 else f"{int(num)}{suffix}"
                num /= 1000
            return f"{num:.1f}T"
    except (ValueError, TypeError):
        pass

    # Handle boolean formats
    if format in {DisplayFormatEnum.boolean, DisplayFormatEnum.boolean_action}:
        if isinstance(value, (bool, int)):
            if format == DisplayFormatEnum.boolean_action:
                return "Did" if value else "Did Not"
            return "Yes" if value else "No"
        return str(value)

    # Default string formatting
    if format in {DisplayFormatEnum.string, DisplayFormatEnum.text}:
        return title(str(value))

    return str(value)
