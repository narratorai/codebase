from core.errors import MissingDatasetGroupSlug, MissingPlotSlug
from core.logger import get_logger
from core.util.opentelemetry import tracer
from core.v4.block import rec_dd_dict
from core.v4.blocks.shared_ui_elements import (
    _add_dependency,
    _checkbox,
    _date_picker,
    _drop_down,
    _hide_properties,
    _input,
    _make_array,
    _make_ui,
    _number,
    _object,
    _space,
)
from core.v4.dataset_comp.query.model import (
    AnnotationKindEnum,
    PlotKindEnum,
    RegressionEnum,
)
from core.v4.dataset_comp.query.util import Dataset
from core.v4.datasetPlotter import COMPUTED_Y2_COLUMNS, DatasetPlot
from core.v4.documentation import get_doc
from core.v4.mavis import Mavis

logger = get_logger()

TITLE = "Dataset Plotter"
DESCRIPTION = "A way to visualize your datasets"
VERSION = 1


def _initialize(mavis, data):
    data = rec_dd_dict(data)
    # deal with copying the data over for the UI
    if not data.get("axes"):
        data["axes"] = dict()

    if not data["axes"].get("y_start"):
        data["axes"]["y_start"] = None

    if data.get("title"):
        data["axes"]["title"] = data["title"]

    if data.get("plot_kind"):
        data["axes"]["plot_kind"] = data["plot_kind"]

    # initialize empty
    data["axes"]["hidden_values"] = data["axes"].get("hidden_values") or []

    plot = DatasetPlot(data, Dataset(mavis, obj=data["obj"]))
    return plot


@tracer.start_as_current_span("get_schema")
def get_schema(mavis: Mavis, internal_cache: dict):
    x_columns = internal_cache["x_columns"] or []
    y_columns = internal_cache["y_columns"] or []
    y2_columns = internal_cache["y2_columns"] or []
    kind = internal_cache["kind"] or "string"
    plot_kind = internal_cache["plot_kind"] or "string"

    # define the full schema
    schema = _object(
        dict(
            dataset=_object(
                dict(
                    slug=_input(),
                    group_slug=_input(),
                )
            ),
            title=_input("Title"),
            question=_input("What Question is this plot answering?"),
            plot_kind=_drop_down([p.value for p in PlotKindEnum], title="Plot kind"),
            save_plot=_checkbox("Save"),
            plot_data=_input(),
            columns=_object(
                dict(
                    ys=_drop_down(y_columns, "id", "label", is_multi=True, title="Y Columns"),
                    xs=_drop_down(x_columns, "id", "label", is_multi=True, title="X Columns"),
                    color_bys=_drop_down(
                        x_columns,
                        "id",
                        "label",
                        is_multi=True,
                        title="Color By Columns",
                    ),
                    y2=_drop_down(
                        y2_columns,
                        "id",
                        "label",
                        default=y2_columns[0]["id"],
                        title="Y2 Columns",
                    ),
                    refresh_plot=_checkbox("Refresh"),
                ),
                title="Plot Configuration",
            ),
            axes=_object(
                dict(
                    x_axis=_input("X Axis"),
                    y_axis=_input("Y Axis"),
                    y2_axis=_input("Y2 Axis"),
                    # configuration (CONDITION LATER)
                    plot_colors=_drop_down([], is_multi=True, default=[], title=" "),
                    # ),
                    smooth=_checkbox("Smooth line"),
                    add_conversion=_checkbox("Add Conversion between bars"),
                    is_percent=_checkbox("Convert to Percent"),
                    show_labels=_checkbox("Show values in plot"),
                    shared_hover=_checkbox("Show all X values on hover"),
                    highlight_on_legend=_checkbox("Highlight values on legend hover"),
                    hidden_values=_drop_down([], title="Hidden Traces", is_multi=True, default=[]),
                    y_start=_number("Start Y axis at", default=0),
                    y_end=_number("End Y axis at"),
                    # add_sliders=_checkbox("Add a x axis slider"),
                    slider_start=_number("Default Start %", default=50),
                    slider_end=_number("Default End %", default=100),
                    replace_0_1_with_did=_checkbox("Replace 1/0 with Column Name"),
                    add_hover_highlighting=_checkbox("Add hover highlighting"),
                    add_brush=_checkbox("Add click & Drag highlighting w Zoom"),
                    add_regression_line=_drop_down([rg.value for rg in RegressionEnum], title="Add regression line"),
                    add_statistics=_checkbox("Add Statistics", default=True),
                ),
            ),
            annotations=_make_array(
                dict(
                    kind=_drop_down(
                        [aa.value for aa in AnnotationKindEnum],
                        default="point",
                        title="kind",
                    ),
                ),
                title="Annotation",
            ),
        ),
        title=TITLE,
        description=DESCRIPTION,
    )

    if kind == "timestamp":
        x_location = _date_picker("X Location")
    elif kind == "number":
        x_location = _number("X Location")
    else:
        x_location = _input("X Location")

    _add_dependency(
        schema["properties"]["annotations"]["items"],
        "kind",
        "point",
        dict(
            x_location=x_location,
            y_location=_number("Y value"),
            content=_input("Annotation"),
        ),
    )
    _add_dependency(
        schema["properties"]["annotations"]["items"],
        "kind",
        "vertical_line",
        dict(
            x_location=x_location,
            content=_input("Annotation"),
            color=_input("line_color", default="#F4664A"),
        ),
    )

    _add_dependency(
        schema["properties"]["annotations"]["items"],
        "kind",
        "horizontal_line",
        dict(
            y_location=_number("Y Location"),
            content=_input("Annotation"),
            color=_input("line_color", default="#F4664A"),
        ),
    )

    _add_dependency(
        schema["properties"]["annotations"]["items"],
        "kind",
        "color_x_right",
        dict(
            x_location=x_location,
            color=_input("line_color", default="#F4664A"),
        ),
    )

    _add_dependency(
        schema["properties"]["annotations"]["items"],
        "kind",
        "color_y_above",
        dict(
            y_location=_number("Y Location"),
            color=_input("line_color", default="#F4664A"),
        ),
    )
    _add_dependency(
        schema["properties"]["annotations"]["items"],
        "kind",
        "color_x_left",
        dict(
            x_location=x_location,
            color=_input("line_color", default="#F4664A"),
        ),
    )

    _add_dependency(
        schema["properties"]["annotations"]["items"],
        "kind",
        "color_y_below",
        dict(
            y_location=_number("Y Location"),
            color=_input("line_color", default="#F4664A"),
        ),
    )

    _hide_properties(schema["properties"]["axes"], ["y_start", "y_end"], "limit_y")
    _hide_properties(schema["properties"]["axes"], ["slider_start", "slider_end"], "add_sliders")
    _hide_properties(schema["properties"]["axes"], ["hidden_values"], "hide_traces")
    _hide_properties(schema["properties"]["axes"], ["plot_colors"], "override_theme_colors")

    _hide_properties(schema, ["axes", "annotations"], "advanced_editing")

    bar_kind = ("horizontal_bar", "bar", "stack", "horizontal_bar_stack")
    special_kinds = ("rose", "pie", "donut", "funnel")
    # Create the UI
    schema_ui = dict(
        **_make_ui(
            order=[
                "dataset",
                "title",
                "plot_kind",
                "save_plot",
                "question",
                "columns",
                "plot_data",
                "questions",
                "advanced_editing",
                "axes",
                "annotations",
            ],
            options=dict(
                hide_output=True,
                hide_submit=True,
                title=False,
                flex_direction="row",
                flex_wrap="wrap",
            ),
        ),
        title=_make_ui(options=dict(size="large", **_space(70))),
        question=_make_ui(
            info_modal=get_doc(
                mavis.company,
                "plot/question",
            ),
        ),
        plot_kind=_make_ui(
            options=dict(
                **_space(20),
                process_data=True,
                update_schema=True,
                data_public=True,
            )
        ),
        save_plot=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(
                button_type="primary",
                submit_form=True,
                **_space(10, mb=0, align_right=True),
            ),
        ),
        dataset=dict(**_make_ui(hidden=True, options=dict(title=False))),
        plot_data=_make_ui(widget="PlotRenderWidget", options=_space(80)),
        columns=dict(
            **_make_ui(
                order=["ys", "xs", "color_bys", "y2", "refresh_plot"],
                options=dict(**_space(20)),
            ),
            y2=_make_ui(hidden=plot_kind not in ("horizontal_bar", "bar"), options=_space(mb=48)),
            color_bys=_make_ui(options=_space(mb=48)),
            refresh_plot=_make_ui(
                widget="BooleanButtonWidget",
                options=dict(
                    button_type="secondary",
                    process_data=True,
                    **_space(80),
                ),
            ),
        ),
        advanced_editing=_make_ui(widget="BooleanToggleWidget"),
        annotations=dict(
            **_make_ui(options=dict(orderable=False, **_space(50))),
            items=dict(
                _make_ui(
                    order=[
                        "kind",
                        "color",
                        "x_location",
                        "y_location",
                        "content",
                    ]
                ),
                kind=_make_ui(options=_space(50)),
                color=_make_ui(widget="color", options=_space(50)),
                x_location=_make_ui(options=_space(50)),
                y_location=_make_ui(options=_space(50)),
                content=_make_ui(widget="textarea", options=dict(rows=2, **_space(100, mb=0))),
            ),
        ),
        axes=dict(
            **_make_ui(
                order=[
                    "x_axis",
                    "y_axis",
                    "y2_axis",
                    "override_theme_colors",
                    "plot_colors",
                    "limit_y",
                    "y_start",
                    "y_end",
                    "smooth",
                    "is_percent",
                    "add_sliders",
                    "slider_start",
                    "slider_end",
                    "hide_traces",
                    "hidden_values",
                    "show_labels",
                    "add_conversion",
                    "add_hover_highlighting",
                    "highlight_on_legend",
                    "shared_hover",
                    "add_brush",
                    "add_regression_line",
                    "add_statistics",
                    "replace_0_1_with_did",
                ],
                options=dict(
                    hide_output=True,
                    hide_submit=True,
                    title=False,
                    flex_direction="row",
                    flex_wrap="wrap",
                    **_space(50),
                ),
            ),
            x_axis=_make_ui(options=_space(100)),
            y_axis=_make_ui(options=_space(100)),
            y2_axis=_make_ui(hidden=plot_kind not in ("bar", "horizontal_bar"), options=_space(100)),
            # configuration (CONDITION LATER)
            plot_colors=_make_ui(widget="ColorsWidget"),
            smooth=_make_ui(hidden=plot_kind not in ("line",)),
            add_sliders=_make_ui(hidden=kind == "string" or plot_kind in special_kinds),
            y_start=_make_ui(options=_space(40)),
            y_end=_make_ui(options=_space(40)),
            slider_start=_make_ui(options=_space(40)),
            slider_end=_make_ui(options=_space(40)),
            add_conversion=_make_ui(hidden=plot_kind not in ("bar", "horizontal_bar")),
            show_labels=_make_ui(hidden=plot_kind in ("rose", "funnel")),
            replace_0_1_with_did=_make_ui(
                hidden=not (plot_kind in ("stack", "horizontal_bar_stack") or kind == "number")
            ),
            hidden_values=_make_ui(options=dict(load_values=True)),
            is_percent=_make_ui(hidden=plot_kind not in ("stack", "horizontal_bar_stack")),
            add_hover_highlighting=_make_ui(hidden=plot_kind not in bar_kind),
            shared_hover=_make_ui(help_text="Drilldown on shared hover will show first value always"),
            highlight_on_legend=_make_ui(),
            add_brush=_make_ui(hidden=plot_kind not in bar_kind),
            add_regression_line=_make_ui(
                hidden=not (plot_kind == "scatter" and kind == "number"),
                options=_space(60),
            ),
        ),
    )

    return (schema, schema_ui)


@tracer.start_as_current_span("get_internal_cache")
def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    plot = _initialize(mavis, data)

    internal["x_columns"] = [{"id": c.id, "label": c.label} for c in plot.tab.output_columns]
    internal["y_columns"] = [{"id": c.id, "label": c.label} for c in plot.tab.output_columns if c.type == "number"]
    internal["y2_columns"] = [{"id": c.id, "label": c.label} for c in COMPUTED_Y2_COLUMNS] + internal["y_columns"]

    internal["kind"] = plot.x_type
    internal["plot_kind"] = data["plot_kind"]
    return internal


@tracer.start_as_current_span("process_data")
def process_data(mavis, data, update_field_slug=None):
    advanced_editing = data["advanced_editing"]

    plot = _initialize(mavis, data)

    # only track stuff the user did
    if update_field_slug:
        plot.tracking = True

    # initialize the data
    if update_field_slug is None:
        try:
            plot.load_data()
            plot.generate_columns()
            plot.reset_axis()
        except (MissingDatasetGroupSlug, MissingPlotSlug):
            pass

    elif update_field_slug == "root_columns_refresh_plot":
        plot.load_data()

        # handle updating the columns if there is an issue
        if data["col_ids"] != ",".join(plot.get_all_plot_columns()):
            plot.reset_axis()

    elif update_field_slug == "root_plot_kind":
        plot.load_data()

    data = dict(**plot.get_config(), obj=data["obj"])
    # copy the data back
    data["title"] = data["axes"]["title"]
    data["plot_kind"] = data["axes"]["plot_kind"]

    # add the y2 selected
    if plot.config.columns.y2:
        data["axes"]["y2_selected"] = True

    # update the plot
    data["plot_data"] = (plot.run_plot()).json()
    data["advanced_editing"] = advanced_editing
    data["col_ids"] = ",".join(plot.get_all_plot_columns())
    data["annotations"] = data["annotations"] or []
    data["columns"]["y2"] = plot.config.columns.y2
    data["columns"]["color_bys"] = plot.config.columns.color_bys
    data["axes"]["limit_y"] = (plot.config.axes.y_start or plot.config.axes.y_end) is not None
    data["axes"]["hide_traces"] = len(plot.config.axes.hidden_values or []) > 0
    return data


# get the values that are allowed
def get_values(mavis: Mavis, data: dict, updated_field_slug: str | None = None):
    if updated_field_slug.endswith("hidden_values"):
        plot = _initialize(mavis, data)
        plot.load_data()
        (
            data,
            _,
            _,
            _,
            group_field,
            _,
        ) = plot.get_data_and_fields()

        rows = set(r[group_field] for r in data)
        return dict(values=[dict(value=r, label=r) for r in rows])
    return None


@tracer.start_as_current_span("run_data")
def run_data(mavis: Mavis, data: dict):
    plot = _initialize(mavis, data)

    # handle updating the columns if there is an issue
    if data["col_ids"] != ",".join(plot.get_all_plot_columns()):
        plot.reset_axis()

    return [dict(kind="json", value=plot.get_config())]
