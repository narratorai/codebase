from enum import StrEnum

from casefy import camelcase
from pydantic import BaseModel

from core import utils
from core.errors import MissingPlotSlug, SilenceError
from core.graph import graph_client
from core.logger import get_logger
from core.models.math import (
    analyze_trend,
    bucket_data,
    data_with_mass,
    impact,
    significance,
    simple_average,
    simple_max,
    weighted_average,
)
from core.models.table import ColumnTypeEnum, DisplayFormatEnum, TableData, _default_format, format_to_old, human_format
from core.util.opentelemetry import tracer
from core.util.tracking import fivetran_track
from core.v4.dataset_comp.query.model import (
    AggregateFunctionEnum,
    Axis,
    Column,
    DetailKindEnum,
    GroupColumn,
    PlotDefinition,
    PlotKindEnum,
)
from core.v4.dataset_comp.query.util import Dataset
from core.v4.query_mapping.config import RESOLUTIONS

logger = get_logger()

TRACE_RIGHT_LIMIT = 5
TRACE_HIDE_LIMIT = 30
X_TRACE_LIMIT = 10
PX_PER_ROW = 10
PX_TEXT_WIDTH = 60


class AntVChartEnum(StrEnum):
    line = "line"
    column = "column"
    bar = "bar"
    pie = "pie"
    scatter = "scatter"
    funnel = "funnel"
    area = "area"
    rose = "rose"
    dual_axes = "dual-axes"


CIRCLE_PLOTS = (
    PlotKindEnum.pie,
    PlotKindEnum.donut,
    PlotKindEnum.rose,
    PlotKindEnum.funnel,
)

BAR_PLOTS = (
    PlotKindEnum.bar,
    PlotKindEnum.horizontal_bar,
    PlotKindEnum.horizontal_bar_stack,
    PlotKindEnum.stack,
)


COMPUTED_Y2_COLUMNS = [
    Column(id="none", label="No Y2", type=ColumnTypeEnum.string),
    Column(
        id="compute-count_record_percent",
        label="Computed % of Rows",
        type=ColumnTypeEnum.number,
        display_format=DisplayFormatEnum.percent,
    ),
    Column(
        id="compute-percent",
        label="Computed % of Total",
        type=ColumnTypeEnum.number,
        display_format=DisplayFormatEnum.percent,
    ),
    Column(
        id="compute-first_percent",
        label="Computed % of First Metric",
        type=ColumnTypeEnum.number,
        display_format=DisplayFormatEnum.percent,
    ),
]

COMPUTED_X_COLUMNS = [
    Column(id="y_metric", label="Y Metric", type=ColumnTypeEnum.string),
]

MAPPING = {0: "Did Not", 1: "Did", None: "NULL"}


class DatasetDefinition(BaseModel):
    tab_slug: str
    plot_slug: str | None


class SelectedColumn(BaseModel):
    y2_available: bool = False
    ys: list[str] = []
    xs: list[str] = []
    color_bys: list[str] = []
    y2: str | None


# keep some of the attributes
KEEP_ATTRIBUTES = [
    "add_hover_highlighting",
    "plot_colors",
    "overide_theme_colors",
    "plot_kind",
    "add_conversion",
    "show_labels",
    "add_statistics",
]


class PlotConfig(PlotDefinition):
    dataset: DatasetDefinition
    revision: int = 0


class OutputConfig(BaseModel):
    dataset_name: str | None
    dataset_id: str | None
    version_id: str | None
    tab_slug: str | None
    plot_slug: str | None
    question: str | None
    group_name: str | None
    snapshot_time: str | None
    x_type: ColumnTypeEnum | None
    is_all: bool = False
    applied_filters: list | None = None


class AntVPlot(BaseModel):
    chart_type: AntVChartEnum
    plot_config: dict
    config: OutputConfig
    retrieved_at: str = None
    height: int = 480


FIVETRAN_TRACKING_URL = "https://webhooks.fivetran.com/webhooks/2d4573fe-e2d8-4c2c-8d61-b62b84cbe952"


def add_timeline(
    timeline,
    config,
    color="#48494B",
):
    if not config["annotations"]:
        config["annotations"] = []
    for t in timeline:
        config["annotations"].append(
            dict(
                type="dataMarker",
                position=[t.happened_at + "T00:00:00", "max"],
                point=dict(style=dict(stroke=color, opacity=0.8)),
                text=dict(
                    content=t.name,
                    maxLength=120,
                    autoEllipsis=True,
                    autoAdjust=True,
                    autoRotate=True,
                    background=dict(
                        style=dict(
                            fill="white",
                            fillOpacity=0.8,
                        )
                    ),
                ),
            )
        )


class DatasetReferenceCols(BaseModel):
    xs: list[GroupColumn]
    ys: list[GroupColumn]
    y2: list[GroupColumn]
    color_bys: list[GroupColumn]
    computed_y2: list[Column]


class DatasetPlot:
    def __init__(
        self,
        config: dict,
        dataset: Dataset,
        show_timeline=True,
        color_override=None,
        version=1,
        height=480,
    ):
        self.config = PlotConfig(**config)
        self.config.revision += 1
        self.version = version
        # ensure type is correct
        if isinstance(height, int):
            self.height = height
        else:
            self.height = 480

        self.tracking = False
        self.retrieved_at = None
        # add the dataset object
        self.dataset: Dataset = dataset
        self.load_dataset()

        # add the timeline
        self.show_timeline = show_timeline

        # add the color overrides
        if color_override:
            self.config.axes.plot_colors = color_override

        self.generate_cols()

    @property
    def table_data(self) -> TableData:
        return self.dataset.run(self.config.dataset.tab_slug)

    @property
    def count_record_col(self):
        return next(
            (
                c.id
                for c in self.tab.output_columns
                if c.details.kind == DetailKindEnum.metric and c.details.agg_function == AggregateFunctionEnum.count_all
            ),
            None,
        )

    @property
    def x_type(self) -> ColumnTypeEnum:
        return self.cols.xs[0].type if len(self.cols.xs) == 1 else ColumnTypeEnum.string

    def track(self, action, **kwargs):
        if self.tracking:
            fivetran_track(
                self.dataset.mavis.user,
                FIVETRAN_TRACKING_URL,
                dict(action=action, **kwargs),
            )

    def get_config(self) -> dict:
        self.config.columns.xs = [c.id for c in self.cols.xs]
        self.config.columns.ys = [c.id for c in self.cols.ys]
        self.config.columns.color_bys = [c.id for c in self.cols.color_bys]

        if self.cols.computed_y2:
            self.config.columns.y2 = self.cols.computed_y2[0].id
        elif self.cols.y2:
            self.config.columns.y2 = self.cols.y2[0].id

        return self.config.dict()

    def generate_cols(self):
        cm = {c.id: c for c in self.tab.output_columns}
        self.cols: DatasetReferenceCols = DatasetReferenceCols(
            xs=[cm[c] for c in self.config.columns.xs if c in cm],
            ys=[cm[c] for c in self.config.columns.ys if c in cm],
            color_bys=[cm[c] for c in self.config.columns.color_bys if c in cm],
            computed_y2=[
                c
                for c in COMPUTED_Y2_COLUMNS[1:]
                if c.id == self.config.columns.y2 and (c.id != "compute-count_record_percent" or self.count_record_col)
            ],
            y2=[c for c in self.tab.output_columns if c.id == self.config.columns.y2],
        )

    def load_dataset(self):
        self.tab = self.dataset.model.tab(self.config.dataset.tab_slug)
        # if the plot exists then load it
        if self.config.dataset.plot_slug:
            # self.track("loaded_saved_plot", plot_slug=self.config.dataset.plot_slug)

            plot_config = self.tab.plot(self.config.dataset.plot_slug)

            if not plot_config:
                raise MissingPlotSlug(
                    "A dependence on a plot that no longer exists",
                    plot_slug=self.config.dataset.plot_slug,
                )

            # copy the fields
            self.config.columns = plot_config.config.columns
            self.config.axes = plot_config.config.axes
            self.config.question = plot_config.config.question
            self.config.annotations = plot_config.config.annotations + self.config.annotations

        self.generate_columns()

    def load_data(self, run_live: bool = False, use_last_available: bool = False):
        table_data = self.dataset.run(
            self.config.dataset.tab_slug, run_live=run_live, use_last_available=use_last_available
        )

        self.retrieved_at = table_data.retrieved_at
        # deal with limiting the plot
        if self.config.axes and self.config.axes.limit_rows and self.x_type == ColumnTypeEnum.string:
            table_data.rows = table_data.rows[: self.config.axes.limit_rows]

        # if it is a string only try to plot 300
        if self.x_type == ColumnTypeEnum.string:
            table_data.rows = table_data.rows[:500]
            table_data.context.is_all = False

        for col in self.cols.xs:
            x_col = table_data.column(col.id)
            if x_col.type in (ColumnTypeEnum.timestamp, ColumnTypeEnum.number):
                table_data.rows = sorted(
                    table_data.rows,
                    key=lambda i: (
                        i[x_col.field] is not None,
                        i[x_col.field],
                    ),
                )
                break

        # sort circle plots by the metric first
        if self.config.axes and self.config.axes.plot_kind in CIRCLE_PLOTS:
            col = table_data.column(self.cols.ys[0].id)
            table_data.rows = sorted(
                table_data.rows,
                key=lambda i: (i[col.field] is None, i[col.field]),
                reverse=True,
            )

        return table_data

    def get_all_plot_columns(self, for_reset: bool = True) -> list[str]:
        cols = self.config.columns
        all_cols = cols.xs + cols.color_bys + cols.ys
        if not for_reset:
            if cols.y2:
                all_cols.append(cols.y2)
        return all_cols

    def get_col_format(self, cols: list[Column], ignore_version: bool = False):
        if len(cols) == 1:
            format = cols[0].display_format or _default_format(cols[0].type)
        elif len(cols) == 0 or all(c.display_format == DisplayFormatEnum.string for c in cols):
            format = DisplayFormatEnum.string
        else:
            format = None

        if not ignore_version and self.version == 1:
            return format_to_old(format)
        else:
            return format

    @tracer.start_as_current_span("generate_columns")
    def generate_columns(self) -> bool:
        updated = False
        # If we are missing a group column
        group_cols = [c for c in self.tab.get_columns(DetailKindEnum.group, output=True)]
        # alias the cols
        pcols = self.config.columns
        if (len(pcols.xs) + len(pcols.color_bys)) != len(group_cols):
            if not pcols.xs:
                pcols.xs = [
                    next(
                        (c.id for c in group_cols if c.type == ColumnTypeEnum.timestamp),
                        group_cols[0].id,
                    )
                ]
                updated = True

            # Make sure the color_bys are good
            for c in group_cols:
                if c.id not in self.config.columns.color_bys and c.id not in pcols.xs:
                    pcols.color_bys.append(c.id)
                    updated = True

        if updated:
            self.generate_cols()

        # if we are missing a metric
        if not pcols.ys:
            updated = True
            if len(pcols.xs) == 0:
                pcols.ys = [
                    c.id
                    for c in self.tab.output_columns
                    if c.details.kind == DetailKindEnum.metric
                    and c.details.agg_function in (AggregateFunctionEnum.sum, AggregateFunctionEnum.count_all)
                ]
            else:
                pcols.ys = [next(c.id for c in self.tab.output_columns if c.details.kind == DetailKindEnum.metric)]

            self.generate_cols()

            # if y2 is available then default it to the count % of total
            if (
                self.x_type != ColumnTypeEnum.timestamp
                and self.count_record_col
                and len(pcols.ys) == 1
                and pcols.xs
                and not pcols.y2
            ):
                self.cols.computed_y2 = [COMPUTED_Y2_COLUMNS[1].id]

        return updated

    def _get_combined_name(self, ys) -> str:
        names = [self.tab.column(y.id).label for y in ys]

        if len(ys) == 1:
            return names[0]
        else:
            # if we see  some of th common words then use them
            reused_words = ["Conversion Rate", "Total", "Revenue", "Percent"]
            reused_words.extend(["Average " + r.title() for r in RESOLUTIONS])
            reused_words.extend(["Median " + r.title() for r in RESOLUTIONS])
            reused_words.extend([r.title() for r in RESOLUTIONS])

            for c in reused_words:
                if all(c in name for name in names):
                    return c

            return "Multiple Metrics"

    @tracer.start_as_current_span("reset_axis")
    def reset_axis(self, override_title=None):
        if (
            override_title is None
            and self.config.axes
            and self.config.axes.autogen_title
            and self.config.axes.autogen_title != self.config.axes.title
        ):
            override_title = self.config.axes.title

        if self.config.axes:
            keep_axies = {k: getattr(self.config.axes, k) for k in KEEP_ATTRIBUTES if getattr(self.config.axes, k)}
        else:
            keep_axies = {}

        # decise to make stack or not
        y_col = self.cols.ys[0]
        can_stack = (
            len(self.cols.ys) == 1
            and y_col.details.kind == DetailKindEnum.metric
            and y_col.details.agg_function in (AggregateFunctionEnum.sum, AggregateFunctionEnum.count_all)
        )

        # check if there are any groups
        if len(self.cols.xs) == 0:
            if can_stack:
                self.config.axes = Axis(
                    title=override_title or y_col.label,
                    plot_kind="donut",
                    hide_legend=True,
                )
            else:
                # fill in the rest of the inputs
                self.config.axes = Axis(
                    title=override_title or "Funnel",
                    y_axis="Totals",
                    x_axis="Stages in Funnel",
                    y2_axis=next((y.label for y in self.cols.y2 + self.cols.computed_y2), ""),
                    plot_kind="bar",
                    add_conversion=True,
                )
        else:
            axis = self.config.axes = Axis(
                title=override_title,
                y_axis=self._get_combined_name(self.cols.ys),
                x_axis=self.cols.xs[0].label,
                y2_axis=next((y.label for y in self.cols.y2 + self.cols.computed_y2), ""),
            )

            if self.config.axes and self.config.axes.plot_kind:
                plot_kind = self.config.axes.plot_kind

            elif not any(c for c in self.cols.xs if c.details.kind == DetailKindEnum.group):
                plot_kind = "scatter"

            elif self.x_type == ColumnTypeEnum.timestamp:
                if self.cols.xs[0].display_format == "year":
                    plot_kind = "bar"
                else:
                    plot_kind = "line"
                    axis.add_sliders = True
                    axis.slider_start = 0
                    axis.slider_end = 100

                # add stacking for line
                if self.cols.color_bys and can_stack:
                    if plot_kind == "bar":
                        plot_kind = "stack"
                    else:
                        plot_kind = "area"
            else:
                if self.cols.color_bys and can_stack:
                    plot_kind = "stack"
                    axis.add_hover_highlighting = True
                    axis.add_sliders = True
                    axis.slider_start = 0
                    axis.slider_end = 100

                elif can_stack and self.x_type == ColumnTypeEnum.string:
                    plot_kind = "pie"
                    axis.show_labels = True
                else:
                    plot_kind = "bar"
                    axis.show_labels = True

            # save the plot kind
            axis.plot_kind = PlotKindEnum(plot_kind)

            # handle defaulting 1/0 for did
            for c in self.cols.xs + self.cols.color_bys:
                if (
                    c.clean_label.startswith("did")
                    and c.type == ColumnTypeEnum.number
                    and all(
                        v in (1, 0, None) for v in self.table_data.unique_column_values(self.table_data.column(c.id))
                    )
                ):
                    self.config.axes.replace_0_1_with_did = True

            # create a good type
            if not override_title:
                axis.title = f"{axis.y_axis} by {axis.x_axis}"
                if len(self.cols.color_bys) > 0:
                    axis.title += " (by: {})".format(", ".join(c.label for c in self.cols.color_bys))

                # Save the autogen title
                self.config.axes.autogen_title = axis.title

        self.config.axes.add_statistics = False
        # copy some of the values
        for k, v in keep_axies.items():
            setattr(self.config.axes, k, v)

    @tracer.start_as_current_span("get_data_and_fields")
    def get_data_and_fields(self):
        # get the data
        cols = self.cols
        axes = self.config.axes
        data = self.table_data
        # Handle the case where the y columns are all not numbers
        for y in cols.ys:
            col = data.column(y.id)
            if y.type == ColumnTypeEnum.number:
                for r in data.rows:
                    if isinstance(r[col.field], str):
                        r[col.field] = float(r[col.field])

        x_cols = [data.column(c.id) for c in cols.xs]
        y_cols = [data.column(c.id) for c in cols.ys]
        color_cols = [data.column(c.id) for c in cols.color_bys]
        meta = dict()
        x_field = None
        y_field = None
        group_field = None
        y2_field = None

        output_rows = data.rows

        # handle the data if the column is 1/0
        if self.config.axes.replace_0_1_with_did:
            for raw_col in cols.xs + cols.ys + cols.color_bys:
                col = data.column(raw_col.id)
                if all(v in (0, 1, None) for v in data.unique_column_values(col)):
                    raw_col.display_format = DisplayFormatEnum.string
                    raw_col.type = ColumnTypeEnum.string

                    # update the values for readability
                    for r in data.rows:
                        r[col.field] = MAPPING[r[col.field]]

        # Update the data and create the fields
        if len(cols.xs) == 0:
            if data.total_rows > 0:
                output_rows = [dict(metric=ty.field, value=data.rows[0][ty.field]) for ty in y_cols]
            else:
                output_rows = []
            x_field = "metric"
            y_field = "value"
            meta[y_field] = dict(narrator_format=self.get_col_format(cols.ys[:1]))

        # Multipel Xs and multiple Ys
        else:
            if len(cols.ys) > 1:
                temp_rows = []
                for ty in y_cols:
                    temp_rows.extend([dict(**r, metric=ty.header_name, value=r[ty.field]) for r in data.rows])
                output_rows = temp_rows
                y_field = "value"

                # ignore the group field if it is a metric
                if cols.xs:
                    group_field = "metric"

                meta[y_field] = dict(narrator_format=self.get_col_format(cols.ys[:1]))
            else:
                # add the single y value
                y_field = y_cols[0].field
                meta[y_cols[0].field] = dict(
                    alias=cols.ys[0].label,
                    narrator_format=self.get_col_format(cols.ys[:1]),
                )
                output_rows = [dict(**r, metric=cols.ys[0].label) for r in data.rows]

            # if multiple xs, then concat them
            if len(cols.xs) > 1:
                output_rows = [
                    dict(
                        **r,
                        multix=" | ".join([str(r[tx.field]) for tx in x_cols]),
                    )
                    for r in output_rows
                ]
                x_field = "multix"
                meta[x_field] = dict(alias=" | ".join([tx.header_name for tx in x_cols]))
            else:
                x_field = x_cols[0].field
                meta[x_field] = dict(
                    alias=x_cols[0].header_name,
                    narrator_format=(self.get_col_format(cols.xs[:1])),
                )

        # handle creating the data for the colors
        if len(cols.color_bys) > 0:
            keys = [cb.field for cb in color_cols]
            labels = [cb.header_name for cb in color_cols]

            if group_field:
                keys.append(group_field)
                labels.append(" - Multi Metric")

            # handle the basic case
            if len(keys) == 1:
                group_field = keys[0]
                meta[group_field] = dict(alias=labels[0], narrator_format=cols.color_bys[0].display_format)

            else:
                output_rows = [dict(**r, multiGroup=" | ".join([str(r[k]) for k in keys])) for r in output_rows]
                # define the multi group
                group_field = "multiGroup"
                meta[group_field] = dict(alias=" | ".join(labels))

        # handle None columns
        if group_field in ("metric", x_field) or axes.plot_kind not in (
            PlotKindEnum.bar,
            PlotKindEnum.line,
            PlotKindEnum.scatter,
        ):
            cols.y2 = []

        if cols.y2:
            y2_field = data.column(cols.y2[0].id).field
            meta[y2_field] = dict(alias=cols.y2[0].label, narrator_format=cols.y2[0].display_format)

        elif y2 := cols.computed_y2:
            y2 = y2[0]
            if y2.id == "compute-count_record_percent":
                table_col = data.column(self.count_record_col)
                total = utils.sum_values([r.get(table_col.field) for r in output_rows])
                apply_col = table_col.field

            elif y2.id == "compute-first_percent":
                total = data.rows[0][y_field]
                apply_col = y_field
            elif y2.id == "compute-percent":
                total = utils.sum_values([r[y_field] for r in output_rows])
                apply_col = y_field

            # add the y2 field
            y2_field = "computed"
            for r in output_rows:
                if total == 0 or r.get(apply_col) is None:
                    r[y2_field] = None
                else:
                    r[y2_field] = r[apply_col] / total

            meta[y2_field] = dict(
                alias=cols.computed_y2[0].label,
                narrator_format=cols.computed_y2[0].display_format,
            )

        # only keep the data you need
        keep_fields = [x_field, y_field, y2_field, group_field]
        if self.count_record_col:
            count_field = data.column(self.count_record_col).field
            keep_fields.append(count_field)
        else:
            count_field = None

        rows = utils.filter_dict(output_rows, keep_fields)

        # clean up values
        group_format = None
        if len(cols.color_bys) == 1 and cols.color_bys[0].type == ColumnTypeEnum.timestamp:
            group_format = cols.color_bys[0].display_format

        for r in rows:
            if group_field:
                r[group_field] = str(r[group_field]) if r[group_field] is not None else "NULL"

                # handle formatting dates so the numbers don't look all the same
                if group_format:
                    r[group_field] = utils.human_format(r[group_field], group_format)

            r[x_field] = (
                str(r[x_field])
                if r[x_field] is not None
                else ("NULL" if self.x_type == ColumnTypeEnum.string else None)
            )

        return (rows, x_field, y_field, y2_field, group_field, count_field, meta)

    @tracer.start_as_current_span("get_plot_config")
    def get_plot_config(self):
        # get the metadata
        (
            data,
            x_field,
            y_field,
            y2_field,
            group_field,
            count_field,
            meta,
        ) = self.get_data_and_fields()

        # convert the model to camelcase
        data = [{camelcase(k): v for k, v in r.items()} for r in data]
        x_field = camelcase(x_field)
        y_field = camelcase(y_field)
        y2_field = camelcase(y2_field) if y2_field else y2_field
        group_field = camelcase(group_field) if group_field else group_field
        count_field = camelcase(count_field) if count_field else count_field
        meta = {camelcase(k): v for k, v in meta.items()}

        grid_style = dict(line=dict(style=dict(color="#E4E3E8", lineDash=[7, 7], opacity=0.7)))

        label_style = dict(
            # fontFamily="Poppins",
            fontSize=12,
            fill="#9B9A9E",
        )
        title_sytle = dict(
            # fontFamily="Poppins",
            fontSize=14,
            fill="#0A0519",
        )
        axis_style = dict(
            # fontFamily="Poppins",
            fontSize=12,
            fill="#000000A6",
        )

        axes = self.config.axes

        # flip the plot for horizontal bar charts
        if axes.plot_kind in (
            PlotKindEnum.horizontal_bar_stack,
            PlotKindEnum.horizontal_bar,
        ):
            old_y_field = y_field
            y_field = x_field
            x_field = old_y_field

            old_y_axis = axes.y_axis
            axes.y_axis = axes.x_axis
            axes.x_axis = old_y_axis

        # initialize the plot config
        plot_config = utils.rec_dd()
        plot_config.update(
            data=data,
            xField=x_field,
            yField=y_field,
            seriesField=group_field,
            meta=meta,
        )

        interactions = [
            dict(
                type="active-region",
            ),
            dict(
                type="element-active",
            ),
        ]
        # Add legend highlighting
        if axes.highlight_on_legend:
            interactions.append(
                dict(
                    type="legend-highlight",
                )
            )

        x_type = self.x_type

        if axes.plot_kind in CIRCLE_PLOTS:
            interactions.extend(
                [
                    dict(
                        type="element-selected",
                    )
                ]
            )

        if axes.plot_kind in BAR_PLOTS:
            interactions.extend(
                [
                    dict(
                        type="element-selected",
                    ),
                ]
            )
            if axes.plot_kind == PlotKindEnum.bar:
                plot_config["columnStyle"] = dict(radius=[10, 10, 0, 0])
            elif axes.plot_kind == PlotKindEnum.horizontal_bar:
                plot_config["barStyle"] = dict(radius=[10, 10, 0, 0])

        if axes.plot_kind == PlotKindEnum.bar:
            chart_type = AntVChartEnum.column

        elif axes.plot_kind == PlotKindEnum.funnel:
            chart_type = AntVChartEnum.funnel
            plot_config["legend"] = False

        elif axes.plot_kind == PlotKindEnum.horizontal_bar:
            chart_type = AntVChartEnum.bar

        elif axes.plot_kind == PlotKindEnum.horizontal_bar_stack:
            chart_type = AntVChartEnum.bar

        # support pie charts
        elif axes.plot_kind in (PlotKindEnum.pie, PlotKindEnum.donut):
            chart_type = AntVChartEnum.pie
            plot_config.update(angleField=y_field, colorField=x_field, appendPadding=10, radius=0.75)

            # add the title as the centers
            if axes.plot_kind == PlotKindEnum.donut:
                if not group_field and len(data) == 1:
                    plot_config["innerRadius"] = 0.6
                    plot_config.update(
                        statistic=dict(
                            title=False,
                            content=dict(
                                style=dict(
                                    textAlign="center",
                                    fontSize=60,
                                ),
                            ),
                        ),
                        innerRadius=0.9,
                    )

        elif axes.plot_kind == PlotKindEnum.rose:
            chart_type = AntVChartEnum.rose
            plot_config["radius"] = 0.9
            # plot_config["label"]["offset"] = -15

        elif axes.plot_kind == PlotKindEnum.line:
            chart_type = AntVChartEnum.line

        elif axes.plot_kind == PlotKindEnum.area:
            chart_type = AntVChartEnum.area

        elif axes.plot_kind == PlotKindEnum.stack:
            chart_type = AntVChartEnum.column

        elif axes.plot_kind == PlotKindEnum.scatter:
            chart_type = AntVChartEnum.scatter

            # handle the colors
            plot_config["pointStyle"] = dict(
                stroke="#777777",
                lineWidth=1,
                fill="#5B8FF9",
            )

        if chart_type == AntVChartEnum.line:
            plot_config["state"] = dict(
                active=dict(
                    animate=dict(duration=100, easing="easeLinear"),
                    style=dict(
                        lineWidth=2,
                        stroke="#000",
                    ),
                )
            )

        if axes.hide_legend:
            plot_config["legend"] = False  # dict(visible=False)

        if y2_field:
            # handle multiple metrics and a y2
            if group_field == "metric" and data:
                sub_data = [r for r in data if r["metric"] == data[0]["metric"]]
                plot_config["data"] = [data, sub_data]
            else:
                plot_config["data"] = [data, data]

            plot_config["yField"] = [plot_config["yField"], y2_field]
            plot_config["geometryOptions"] = [
                dict(geometry=chart_type),
                dict(geometry="line", smooth=True, color="#5AD8A6"),
            ]

            # add the y2 dash
            # if axes.y2_line_dash:

            plot_config["geometryOptions"][-1]["lineStyle"] = dict(lineDash=[2, 6])

            # reset the chart type
            chart_type = "dual-axes"
            use_config = plot_config["geometryOptions"][0]

            # need to add it to be the split
            if axes.plot_kind == PlotKindEnum.bar:
                use_config["columnStyle"] = dict(radius=[10, 10, 0, 0])
            elif axes.plot_kind == PlotKindEnum.horizontal_bar:
                use_config["barStyle"] = dict(radius=[10, 10, 0, 0])

            # add the group field
            use_config["seriesField"] = group_field
            plot_config.pop("seriesField", None)
        else:
            use_config = plot_config

        # convert numbers to strings
        if x_type == ColumnTypeEnum.number and chart_type in (
            AntVChartEnum.line,
            AntVChartEnum.bar,
            AntVChartEnum.column,
            AntVChartEnum.area,
        ):
            for r in data:
                r[x_field] = str(r[x_field])

        # handle the stack
        if group_field:
            if axes.plot_kind == PlotKindEnum.scatter:
                plot_config["colorField"] = group_field

                # Delete it if it doesn't exist
                plot_config.pop("seriesField", None)

            elif axes.plot_kind in (
                PlotKindEnum.stack,
                PlotKindEnum.horizontal_bar_stack,
            ):
                use_config["isStack"] = True

                # added the percent
                if axes.is_percent:
                    use_config["isPercent"] = True

            elif axes.plot_kind in (PlotKindEnum.bar, PlotKindEnum.horizontal_bar):
                use_config["isGroup"] = True

            if isinstance(plot_config["legend"], dict):
                plot_config["legend"].update(
                    flipPage=True,
                    maxRow=2,
                    position=("bottom" if axes.plot_kind == PlotKindEnum.rose else "top"),
                )

        # ALL THE SPECIAL stuff
        if axes.add_brush:
            plot_config["brush"] = dict(
                enabled=True,
                mask=dict(
                    style=dict(
                        fill="rgba(255,0,0,0.15)",
                    ),
                ),
            )

        if axes.add_regression_line:
            plot_config["regressionLine"] = dict(type=axes.add_regression_line.value)

        if axes.add_hover_highlighting:
            if group_field:
                interactions.extend(
                    [
                        dict(type="element-highlight-by-color"),
                        dict(type="element-link"),
                    ]
                )
            elif axes.plot_kind in BAR_PLOTS:
                interactions.append(
                    dict(
                        type="element-highlight",
                    ),
                )

        # add the label format
        if chart_type != AntVChartEnum.bar:
            format_field = y_field
        else:
            format_field = x_field

        # add the link as a config
        plot_config["tooltip"]["shared"] = self.config.axes.shared_hover

        # Show the labels
        if axes.show_labels:
            use_config["label"] = dict(
                position=(
                    "middle"
                    if plot_config.get("isStack") and chart_type in (AntVChartEnum.bar, AntVChartEnum.column)
                    else "top"
                ),
                format_field=format_field,
                layout=[
                    dict(
                        type="interval-adjust-position",
                    ),
                    dict(
                        type="interval-hide-overlap",
                    ),
                    dict(
                        type="adjust-color",
                    ),
                ],
            )

            if axes.plot_kind in (PlotKindEnum.pie, PlotKindEnum.donut):
                use_config["label"] = dict(type="spider", labelHeight=28, content="{name}\n{percentage}")
                use_config["legend"].update(
                    flipPage=True,
                    maxRow=2,
                    position="bottom",
                )

            # handle the plot kind
            if axes.plot_kind == PlotKindEnum.donut:
                use_config["label"].update(
                    statistic=dict(
                        title=False,
                        content=dict(
                            style=dict(
                                textAlign="center",
                                fontSize=30,
                            ),
                        ),
                    ),
                )
                use_config["innerRadius"] = 0.6
        # add the timestamp
        # cat、time-cat、 wilkinson-extended、r-pretty、time、time-pretty、log、pow、quantile、d3-linear。
        if axes.plot_kind not in CIRCLE_PLOTS:
            if x_type == ColumnTypeEnum.timestamp:
                # for line plots then let time be used
                if axes.plot_kind in (
                    AntVChartEnum.line,
                    AntVChartEnum.area,
                    AntVChartEnum.scatter,
                ):
                    plot_config["xAxis"]["type"] = "time"
                else:
                    plot_config["xAxis"]["tickMethod"] = "time-cat"

            elif x_type == ColumnTypeEnum.number:
                plot_config["xAxis"]["tickMethod"] = "cat"

        # if smooth
        plot_config["smooth"] = axes.smooth

        # handle the colors
        axes.plot_colors = axes.plot_colors or []
        use_config["color"] = axes.plot_colors + [
            c for c in self.dataset.mavis.company.plot_colors if c not in axes.plot_colors
        ]

        if not group_field and axes.plot_kind not in CIRCLE_PLOTS:
            use_config["color"] = use_config["color"][0]

        if axes.add_conversion:
            plot_config["conversionTag"] = dict()

        if axes.add_sliders:
            plot_config["slider"] = dict(
                start=round(axes.slider_start / 100, 2),
                end=round(axes.slider_end / 100, 2),
            )

        if axes.title:
            plot_config["title"]["text"] = axes.title
            plot_config["title"]["visible"] = True
            plot_config["title"]["style"] = title_sytle

        if axes.plot_kind not in CIRCLE_PLOTS:
            # handle the y2 axis
            if y2_field:
                temp_config = plot_config["yAxis"][y_field]
            else:
                temp_config = plot_config["yAxis"]

            if axes.plot_kind in (
                PlotKindEnum.line,
                PlotKindEnum.area,
                PlotKindEnum.bar,
                PlotKindEnum.stack,
            ):
                temp_config["grid"] = grid_style

            if axes.y_start is not None:
                temp_config["min"] = axes.y_start

            if axes.y_end is not None:
                temp_config["max"] = axes.y_end

            if axes.y_axis:
                temp_config["title"]["text"] = axes.y_axis
                temp_config["title"]["style"] = axis_style

                if self.get_col_format(self.cols.ys[:1]) == DisplayFormatEnum.decimal:
                    temp_config["label"]["narrator_format"] = DisplayFormatEnum.short_decimal

            temp_config["connectNulls"] = False
        if y2_field:
            tem_config = plot_config["yAxis"][y2_field]
            tem_config["label"]["style"] = label_style
            # add the y2 axis
            if axes.y2_axis:
                tem_config["title"]["text"] = axes.y2_axis
                tem_config["title"]["style"] = axis_style

            tem_config["min"] = 0

            # save the format
            if not meta.get(y2_field, {}).get("narrator_format"):
                tem_config["label"]["narrator_format"] = (
                    self.get_col_format(self.cols.y2) if not axes.is_percent else "percent"
                )

        plot_config["xAxis"]["label"]["style"] = label_style
        plot_config["xAxis"]["tickLine"] = None
        plot_config["xAxis"]["line"] = None
        if axes.plot_kind in (
            PlotKindEnum.horizontal_bar,
            PlotKindEnum.horizontal_bar_stack,
        ):
            plot_config["xAxis"]["grid"] = grid_style

        if axes.x_axis and axes.plot_kind not in CIRCLE_PLOTS:
            plot_config["xAxis"]["title"]["text"] = axes.x_axis
            plot_config["xAxis"]["title"]["style"] = axis_style

            if not meta.get(x_field, {}).get("narrator_format"):
                plot_config["xAxis"]["label"]["narrator_format"] = self.get_col_format(self.cols.xs)

        if interactions:
            plot_config["interactions"] = interactions

        # added the filter for the selected values
        for hv in self.config.axes.hidden_values or []:
            plot_config["legend"]["selected"][hv] = False

        # Add the annotations
        use_config["annotations"] = self.add_statistics(
            plot_config["data"][0] if y2_field else plot_config["data"], x_field, y_field, group_field, count_field
        )
        for aa in self.config.annotations or []:
            if aa.kind == aa.kind.point:
                annon = dict(
                    type="dataMarker",
                    position=[aa.x_location, aa.y_location],
                    text=dict(
                        content=aa.content,
                        background=dict(
                            style=dict(
                                fill="white",
                                fillOpacity=0.8,
                            )
                        ),
                    ),
                )
            else:
                start = ["min", "min"]
                end = ["max", "max"]

                if aa.kind in (
                    aa.kind.horizontal_line,
                    aa.kind.color_y_below,
                    aa.kind.color_y_above,
                ):
                    # either way it should be max
                    end[1] = aa.y_location

                    # handle the region
                    if aa.kind == aa.kind.horizontal_line:
                        start[1] = aa.y_location

                    if aa.kind == aa.kind.color_y_above:
                        start[1] = "max"

                else:
                    end[0] = aa.x_location
                    # handle the region
                    if aa.kind == aa.kind.vertical_line:
                        start[0] = aa.x_location
                    if aa.kind == aa.kind.color_x_right:
                        start[0] = "max"

                annon = dict(
                    start=start,
                    end=end,
                    style=dict(
                        stroke=aa.color,
                        lineDash=[2, 2],
                    ),
                )

                # if it is a vertical line and havs content
                if aa.kind in (aa.kind.horizontal_line, aa.kind.vertical_line):
                    annon["type"] = "line"
                    if aa.content:
                        annon["text"] = dict(
                            content=aa.content,
                            background=dict(
                                style=dict(
                                    fill="white",
                                    fillOpacity=0.8,
                                )
                            ),
                        )
                else:
                    annon["type"] = "regionFilter"
                    annon["color"] = aa.color

            use_config["annotations"].append(annon)

        if self.show_timeline and self.x_type == ColumnTypeEnum.timestamp:
            timeline = graph_client.get_timeline(
                timeline_ids=self.dataset.model.activity_ids + [self.dataset.mavis.company.id]
            ).company_timeline
            add_timeline(timeline, use_config)

        # add the aliasing
        return (chart_type, plot_config)

    def _get_dataset_config(self) -> OutputConfig:
        # define the config
        return OutputConfig(
            dataset_name=self.dataset.model.name,
            dataset_id=self.dataset.id,
            version_id=self.dataset.version_id,
            tab_slug=self.config.dataset.tab_slug,
            plot_slug=self.config.dataset.plot_slug,
            question=self.config.question,
            group_name=self.dataset.model.tab(self.config.dataset.tab_slug).label,
            snapshot_time=self.retrieved_at,
            x_type=self.x_type,
            is_all=self.load_data().context.is_all,
        )

    def add_statistics(
        self, rws: list[dict], x_field: str, y_field: str, group_field: str | None, count_field: str | None
    ):
        if not self.config.axes.add_statistics:
            return []

        sconfig = self.config.axes.statistic_config

        is_rate = simple_max(rws, y_field, abs_val=True) <= 1
        annotations = []
        # Add the statistically significant annotations
        if (
            group_field is None
            and self.config.axes.plot_kind == PlotKindEnum.bar
            and count_field
            and y_field != count_field
            and is_rate
            and len(rws) == 2
        ):
            significance_value = significance(
                rws[0][count_field], rws[0][y_field], rws[1][count_field], rws[1][y_field]
            )
            logger.debug("Get significance", significance=significance_value)
            if significance_value >= 0.8:
                impact_val, use_ii = impact(rws[0][y_field], rws[1][y_field])

                annotations.append(
                    dict(
                        type="dataMarker",
                        position=[rws[use_ii][x_field], rws[use_ii][y_field]],
                        text=dict(
                            content=f"✓ Stat Sig({significance_value * 100}%)\n{round(impact_val * 100)}% Greater",
                            style=dict(
                                textAlign="center",
                                fontWeight=500,  # Make text bolder
                                fontSize=14,  # Make text larger
                            ),
                        ),
                        point=dict(style=dict(opacity=0)),
                        line=dict(style=dict(opacity=0)),
                        offsetY=15,
                    )
                )
        elif (
            group_field is None
            and self.config.axes.plot_kind == PlotKindEnum.bar
            and count_field
            and y_field != count_field
            and is_rate
            and len(data_with_mass(rws, count_field)) < 8
        ):
            res = bucket_data(rws, y_field, count_field, pick_best=True)
            if res and res.best_split:
                annotations.append(
                    dict(
                        type="dataMarker",
                        position=[rws[res.best_split][x_field], "max"],
                        text=dict(
                            content=f"Best Option!\n{human_format(res.max_impact, DisplayFormatEnum.percent)} than others",
                            style=dict(fill=sconfig.color, fontSize=12),
                            background=dict(
                                style=dict(
                                    fill="white",
                                    fillOpacity=0.8,
                                )
                            ),
                        ),
                        offsetX=4,
                    ),
                )

        elif (
            group_field is None
            and self.config.axes.plot_kind in (PlotKindEnum.bar, PlotKindEnum.line)
            and is_rate
            and len(self.cols.xs) == 1
            and self.cols.xs[0].type == ColumnTypeEnum.number
        ):
            res = bucket_data(rws, y_field, count_field)

            if res and res.best_split:
                annotations.extend(
                    [
                        dict(
                            type="line",
                            start=[rws[res.best_split][x_field], "min"],
                            end=[rws[res.best_split][x_field], "max"],
                            style=dict(
                                stroke=sconfig.color,
                                lineDash=[2, 2],
                            ),
                        ),
                        dict(
                            type="dataMarker",
                            position=[rws[res.best_split][x_field], "max"],
                            text=dict(
                                content=f"Max Significant Impact!\n{human_format(res.max_impact, DisplayFormatEnum.percent)} greater",
                                style=dict(fill=sconfig.color, fontSize=12),
                                background=dict(
                                    style=dict(
                                        fill="white",
                                        fillOpacity=0.8,
                                    )
                                ),
                            ),
                            point=dict(style=dict(opacity=0)),
                            line=dict(style=dict(opacity=0)),
                            offsetX=4,
                        ),
                        dict(
                            type="line",
                            start=["min", res.max_left_avg],
                            end=[rws[res.best_split][x_field], res.max_left_avg],
                            style=dict(
                                stroke="red" if res.right_is_better else "green",
                                lineDash=[2, 2],
                            ),
                        ),
                        dict(
                            type="dataMarker",
                            position=[rws[res.best_split][x_field], res.max_left_avg],
                            text=dict(
                                content=f"{human_format(res.max_left_avg, DisplayFormatEnum.percent)} (N: {human_format(res.left_total, DisplayFormatEnum.short_decimal)})",
                                style=dict(
                                    fill="red" if res.right_is_better else "green", fontSize=12, textAlign="right"
                                ),
                                background=dict(
                                    style=dict(
                                        fill="white",
                                        fillOpacity=0.8,
                                    )
                                ),
                            ),
                            point=dict(style=dict(opacity=0)),
                            line=dict(style=dict(opacity=0)),
                            offsetX=-2,
                            offsetY=12,
                        ),
                        dict(
                            type="line",
                            start=[rws[res.best_split][x_field], res.max_right_avg],
                            end=["max", res.max_right_avg],
                            style=dict(
                                stroke="green" if res.right_is_better else "red",
                                lineDash=[2, 2],
                            ),
                        ),
                        dict(
                            type="dataMarker",
                            position=[rws[res.best_split][x_field], res.max_right_avg],
                            text=dict(
                                content=f"{human_format(res.max_right_avg, DisplayFormatEnum.percent)} (N: {human_format(res.right_total, DisplayFormatEnum.short_decimal)})",
                                style=dict(
                                    fill="green" if res.right_is_better else "red", fontSize=12, textAlign="left"
                                ),
                                background=dict(
                                    style=dict(
                                        fill="white",
                                        fillOpacity=0.8,
                                    )
                                ),
                            ),
                            point=dict(style=dict(opacity=0)),
                            line=dict(style=dict(opacity=0)),
                            offsetX=2,
                            offsetY=12,
                        ),
                    ]
                )

        elif group_field is None and self.config.axes.plot_kind == PlotKindEnum.bar:
            if count_field:
                avg = simple_average(rws, y_field)
            else:
                # do a weighted average using the count_field for each row as the weight
                avg = weighted_average(rws, y_field, count_field)

            annotations.extend(
                [
                    dict(
                        type="line",
                        start=["min", avg],
                        end=["max", avg],
                        style=dict(
                            stroke=self.config.axes.statistic_config.color,
                            lineDash=[2, 2],
                        ),
                    ),
                    dict(
                        type="dataMarker",
                        position=["max", avg],
                        text=dict(
                            content=f"Average: {human_format(avg, self.get_col_format(self.cols.ys[:1], ignore_version=True))}",
                            style=dict(fill=self.config.axes.statistic_config.color, fontSize=12),
                        ),
                        point=dict(style=dict(opacity=0)),
                        line=dict(style=dict(opacity=0)),
                    ),
                ]
            )

        elif group_field is None and len(self.cols.xs) == 1 and self.cols.xs[0].type == ColumnTypeEnum.timestamp:
            if self.get_col_format(self.cols.xs, ignore_version=True) == DisplayFormatEnum.date:
                min_points = 8
            else:
                min_points = 4

            # add the average line
            right_segment, slope, intercept = analyze_trend(
                rws, y_field, weight_field=count_field if is_rate else None, min_points=min_points
            )

            if len(right_segment) == 0:
                logger.debug("No trend found")
                return None

            logger.debug("found trend", first_pt=right_segment[0], intercept=intercept, slope=slope)
            st_pt = intercept
            final_pt = len(right_segment) * slope + intercept
            annotations.extend(
                [
                    dict(
                        type="line",
                        start=[right_segment[0][x_field], st_pt],
                        end=[right_segment[-1][x_field], final_pt],
                        style=dict(stroke=self.config.axes.statistic_config.color, lineDash=[2, 2]),
                    ),
                    dict(
                        type="dataMarker",
                        position=[rws[-1][x_field], final_pt],
                        text=dict(
                            content=f"▵{human_format(slope,DisplayFormatEnum.percent if is_rate else DisplayFormatEnum.short_decimal)} per {self.cols.xs[0].label}\nTrending to {human_format(final_pt, self.get_col_format(self.cols.ys[:1], ignore_version=True))}",
                            style=dict(fill=self.config.axes.statistic_config.color, fontSize=12),
                        ),
                        point=dict(style=dict(opacity=0)),
                        line=dict(style=dict(opacity=0)),
                        offsetX=4,
                    ),
                ]
            )

        return annotations

    @tracer.start_as_current_span("run_plot")
    def run_plot(self, run_live=False, use_last_available=False) -> AntVPlot:
        # load the data
        self.load_data(run_live=run_live, use_last_available=use_last_available)

        if len(self.config.columns.ys) == 0 or len(self.config.columns.xs) == 0:
            self.generate_columns()

        if self.config.axes is None:
            self.reset_axis()

        # define the config
        config = self._get_dataset_config()

        (chart_type, plot_config) = self.get_plot_config()

        return AntVPlot(
            chart_type=chart_type,
            plot_config=plot_config,
            config=config,
            retrieved_at=self.retrieved_at,
            height=round(self.height or 480),
        )


def _map_data(plot_row: dict, cols: DatasetReferenceCols, data: TableData):
    len_x = len(cols.xs)
    len_color = len(cols.color_bys)
    len_y = len(cols.ys)
    row = {}

    if len_x == 0:
        select_column_id = next((y.id for y in cols.ys if y.label == plot_row["metric"]), None)
        row = data.rows[0]

    elif len_x == 1 and len_y == 1 and len_color == 0:
        x_col = data.column(cols.xs[0].id)
        select_column_id = cols.ys[0].id
        row = next((r for r in data.rows if plot_row[camelcase(x_col.field)] == r[x_col.field]), None)

    elif len_x == 1 and len_y > 1 and len_color == 0:
        x_col = data.column(cols.xs[0].id)
        select_column_id = next((y.id for y in cols.ys if y.label == plot_row["metric"]), None)
        row = next((r for r in data.rows if plot_row[camelcase(x_col.field)] == r[x_col.field]), None)

    elif len_x == 1 and len_y == 1 and len_color == 1:
        x_col = data.column(cols.xs[0].id)
        color_col = data.column(cols.color_bys[0].id)
        select_column_id = cols.ys[0].id
        row = next(
            (
                r
                for r in data.rows
                if plot_row[camelcase(x_col.field)] == r[x_col.field]
                and plot_row[camelcase(color_col.field)] == r[color_col.field]
            ),
            None,
        )

    elif len_x == 1 and len_y == 1 and len_color > 1:
        x_col = data.column(cols.xs[0].id)
        select_column_id = cols.ys[0].id
        row = next(
            (
                r
                for r in data.rows
                if plot_row[camelcase(x_col.field)] == r[x_col.field]
                and plot_row["multiGroup"] == " | ".join([str(r[data.column(k.id).field]) for k in cols.color_bys])
            ),
            None,
        )

    elif len_x == 1 and len_y > 1 and len_color >= 1:
        x_col = data.column(cols.xs[0].id)
        select_column_id = next((y.id for y in cols.ys if y.label in plot_row["multiGroup"]), None)

        # deal with creating the key
        for r in data.rows:
            if plot_row[camelcase(x_col.field)] == r[x_col.field]:
                keys = [str(r[data.column(k.id).field]) for k in cols.color_bys]
                for y in cols.ys:
                    keys.append(y.label)
                    if plot_row["multiGroup"] == " | ".join(keys):
                        row = r
                        break

            if row:
                break

    else:
        raise SilenceError("Not supported")

    return (row, select_column_id)
