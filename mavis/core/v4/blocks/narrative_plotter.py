from core.api.customer_facing.datasets.utils import DatasetManager
from core.errors import MissingPlotSlug, SilenceError
from core.graph import graph_client
from core.util.opentelemetry import tracer
from core.v4.analysisGenerator import _fetch_dataset, _get_cache, fields_to_autocomplete
from core.v4.block import rec_dd_dict
from core.v4.blocks.shared_ui_elements import (
    _add_dependency,
    _drop_down,
    _hide_properties,
    _input,
    _make_array,
    _make_ui,
    _number,
    _object,
    _space,
)
from core.v4.dataset_comp.query.model import AnnotationKindEnum, TabKindEnum
from core.v4.dataset_comp.query.util import Dataset
from core.v4.datasetPlotter import DatasetPlot
from core.v4.mavis import Mavis

TITLE = "Custom Plot"
DESCRIPTION = "A simple visualization of a dataset group"
VERSION = 1


LINE_TYPES = [
    dict(id="solid", label="____"),
    dict(id="dot", label="...."),
    dict(id="dash", label="-----"),
    dict(id="longdash", label="___ ___"),
    dict(id="dashdot", label="-.-._"),
    dict(id="longdashdot", label="___.___"),
]
FORMATS = [
    dict(id="number", label="#"),
    dict(id="revenue", label="$"),
    dict(id="percent", label="%"),
]


@tracer.start_as_current_span("get_schema")
def get_schema(mavis: Mavis, internal_cache: dict):
    autocomplete = internal_cache["autocomplete"] or []
    trend_fields = internal_cache["trend_fields"] or []

    # made an input so we can use fields
    x_location = _input("x Location")

    # define the full schema
    schema = _object(
        dict(
            slug=_drop_down([], title="Select Dataset"),
            plot_slug=_drop_down([], title="Load Saved Plot"),
            axes=_object(
                dict(
                    slider_start=_input("Limit X From (% percent)"),
                    slider_end=_input("Limit X To (% percent)"),
                    y_start=_input("Limit Y From"),
                    y_end=_input("Limit Y To"),
                ),
                title="Axes",
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
            # refresh_plot=_checkbox("Update Plot"),
            fits=_object(
                dict(
                    trends=_make_array(
                        dict(
                            field=_drop_down(trend_fields, "slug", "label", title="Trend Field"),
                            color=_input("Color", default="#FF5733"),
                            name=_input("Name", default="trend"),
                            project_pts=_number(title="Project Pts", default=0),
                        )
                    )
                ),
                title="Add Fits",
            ),
        ),
        title=TITLE,
        description=DESCRIPTION,
    )

    # I use a string because of fields

    _add_dependency(
        schema["properties"]["annotations"]["items"],
        "kind",
        "point",
        dict(
            x_location=_input("X Location"),
            y_location=_number("Y value"),
            content=_input("Annotation"),
        ),
    )

    _add_dependency(
        schema["properties"]["annotations"]["items"],
        "kind",
        "vertical_line",
        dict(
            x_location=_input("X Location"),
            content=_input("Annotation"),
            color=_input("line_color", default="#F4664A"),
        ),
    )

    _add_dependency(
        schema["properties"]["annotations"]["items"],
        "kind",
        "horizontal_line",
        dict(
            y_location=_input("Y Location"),
            content=_input("Annotation"),
            color=_input("line_color", default="#F4664A"),
        ),
    )

    _add_dependency(
        schema["properties"]["annotations"]["items"],
        "kind",
        "color_x_right",
        dict(
            x_location=_input("X Location"),
            color=_input("line_color", default="#F4664A"),
        ),
    )

    _add_dependency(
        schema["properties"]["annotations"]["items"],
        "kind",
        "color_y_above",
        dict(
            y_location=_input("Y Location"),
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
            y_location=_input("Y Location"),
            color=_input("line_color", default="#F4664A"),
        ),
    )

    # hide everything until it is needed
    _hide_properties(
        schema,
        [
            "axes",
        ],
        "edit_zoom",
    )

    _hide_properties(schema, ["annotations"], "add_annotations")

    # If there is a fit then allow the user to choose it
    _hide_properties(schema["properties"]["fits"], ["trends"], "trend_fit")

    # Create the UI
    schema_ui = dict(
        **_make_ui(
            order=[
                "slug",
                "plot_slug",
                "add_annotations",
                "annotations",
                "edit_zoom",
                "axes",
                "*",
            ],
            options=dict(
                hide_output=True,
                # hide_submit=True,
                title=False,
                flex_direction="row",
                flex_wrap="wrap",
            ),
        ),
        edit_zoom=_make_ui(widget="BooleanToggleWidget"),
        add_annotations=_make_ui(widget="BooleanToggleWidget"),
        slug=_make_ui(options=dict(load_values=True, **_space(100))),
        plot_slug=_make_ui(options=dict(load_values=True, submit_form=True, **_space(100))),
        axes=dict(
            **_make_ui(
                order=[
                    "slider_start",
                    "slider_end",
                    "y_start",
                    "y_end",
                    "y2_selected",
                    "*",
                ],
                options=dict(title=False, **_space(pl=16)),
            ),
            slider_start=_make_ui(options=dict(**_space(50), data_public=True)),
            slider_end=_make_ui(options=dict(**_space(50), data_public=True)),
            y_start=_make_ui(options=dict(**_space(50), data_public=True)),
            y_end=_make_ui(options=dict(**_space(50), data_public=True)),
        ),
        annotations=dict(
            **_make_ui(options=dict(title=False, orderable=False, **_space(pl=16))),
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
                kind=_make_ui(options=dict(**_space(50, mb=0), data_public=True)),
                x_location=_make_ui(
                    widget="MarkdownWidget",
                    options=dict(autocomplete=autocomplete, default_height=40),
                    data_public=True,
                ),
                y_location=_make_ui(
                    widget="MarkdownWidget",
                    options=dict(autocomplete=autocomplete, default_height=40),
                    data_public=True,
                ),
                content=_make_ui(
                    widget="MarkdownWidget",
                    options=dict(autocomplete=autocomplete, default_height=100),
                ),
                color=_make_ui(widget="color", options=_space(50)),
            ),
        ),
        fits=dict(
            trends=dict(
                **_make_ui(
                    options=dict(
                        title=False,
                        addable=True,
                        orderable=False,
                        removable=True,
                    )
                ),
                items=dict(
                    **_make_ui(order=["field", "color", "name", "project_pts"]),
                    field=_make_ui(options=dict(submit_form=True, **_space(100, mb=0))),
                    name=_make_ui(options=_space(50, mb=0)),
                    color=_make_ui(
                        widget="color",
                        options=dict(submit_form=True, data_public=True, **_space(25, mb=0)),
                    ),
                    project_pts=_make_ui(options=_space(25, mb=0)),
                ),
            ),
        ),
    )

    return (schema, schema_ui)


@tracer.start_as_current_span("get_internal_cache")
def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    internal["trend_fields"] = [
        dict(slug="{%s}" % k, label=k)
        for k, v in data["_raw_fields"].items()
        if isinstance(v, dict) and v.get("all_lines")
    ]

    # get the autocomplete for the plots
    if not internal["autocomplete"] and data["_raw_fields"]:
        internal["autocomplete"] = [
            fields_to_autocomplete(
                mavis,
                data["_raw_fields"],
                include_pretty=True,
            )
        ]
    return internal


@tracer.start_as_current_span("get_values")
def get_values(mavis: Mavis, data: dict, updated_field_slug: str | None = None):
    values = []

    if updated_field_slug == "root_slug":
        values = [
            dict(value=d.slug, label=d.name) for d in graph_client.dataset_index(company_id=mavis.company.id).dataset
        ]

    elif updated_field_slug in ("root_group_slug", "root_plot_slug"):
        if data["slug"]:
            dataset_id = DatasetManager(mavis=mavis)._slug_to_id(data["slug"])
            d_obj = Dataset(mavis, dataset_id)
        else:
            raise SilenceError("Please load datataset to get the groups or plots")

        if updated_field_slug == "root_group_slug":
            values = [dict(value=g.slug, label=g.label) for g in d_obj.model.all_tabs if g.kind == TabKindEnum.group]

        elif updated_field_slug == "root_plot_slug":
            values = []
            # go through group
            for g, p in d_obj.model.all_plots:
                values.append(dict(value=f"{g.slug}^^{p.slug}", label=f"{p.name} ({g.label})"))

    return dict(values=values)


def _initialize(mavis: Mavis, data):
    plot = None
    local_cache = _get_cache(data.get("local_cache"), mavis.company.cache_minutes)

    # only if the plot slug and group exists
    if data["slug"]:
        d_obj = _fetch_dataset(mavis, local_cache, data["slug"])
        if data.get("plot_slug"):
            (data["group_slug"], plot_slug) = data["plot_slug"].split("^^")
        elif data["group_slug"]:
            plot_slug = None
        else:
            return None

        # create the object
        data["dataset"] = dict(
            slug=data["slug"],
            tab_slug=data["group_slug"],
            plot_slug=plot_slug,
        )
        if data["slider_start"] or data["slider_end"]:
            data["add_sliders"] = True

        data = rec_dd_dict(data)
        plot = DatasetPlot(data, d_obj)

    return plot


@tracer.start_as_current_span("process_data")
def process_data(mavis: Mavis, data, update_field_slug=None):
    # reset the form
    if update_field_slug == "root_slug":
        data = dict(
            _raw_fields=data["_raw_fields"],
            slug=data["slug"],
            local_cache=data["local_cache"],
        )

    # make sure you have the right data
    try:
        plot = _initialize(mavis, data)
    except MissingPlotSlug:
        plot = None

    # initialize the plot
    if not plot:
        return data

    # only track stuff the user did
    if update_field_slug:
        plot.tracking = True

    # initialize the data
    if update_field_slug is None:
        data["define_plot"] = True
        data["edit_layout"] = True
        plot.load_data()
        plot.generate_columns()
        plot.reset_axis()

    data.update(**{k: v for k, v in plot.get_config().items() if k not in ("dataset",)})

    if plot.config.columns.y2:
        data["axes"]["y2_selected"] = True

    # always delete the stupid dataset cache
    if "dataset" in data.keys():
        del data["dataset"]
    return data


@tracer.start_as_current_span("run_data")
def run_data(mavis: Mavis, data: dict):
    plot = _initialize(mavis, data)

    if not plot:
        return []

    # run the plot
    plot_data = plot.run_plot()

    return [dict(type="block_plot", value=plot_data.dict())]
