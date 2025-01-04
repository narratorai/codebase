from core import utils
from core.api.customer_facing.datasets.utils import DatasetManager
from core.errors import SilenceError
from core.graph import graph_client
from core.util.opentelemetry import tracer
from core.v4.analysisGenerator import (
    fields_to_autocomplete,
    preview_value,
)
from core.v4.blocks.shared_ui_elements import (
    _checkbox,
    _drop_down,
    _hide_properties,
    _input,
    _make_ui,
    _number,
    _object,
    _space,
)
from core.v4.dataset_comp.query.util import Dataset
from core.v4.mavis import Mavis
from core.v4.narrative.helpers import get_required_fields

TITLE = "Trend Finder"
DESCRIPTION = "A way to find out the trend of a plot"
VERSION = 1
ADVANCED_ONLY = True

ROW_HEIGHT = 32

FORMATS = [f for f in utils.HUMAN_FORMATS if f["id"] not in ("time", "table")]


@tracer.start_as_current_span("get_schema")
def get_schema(mavis: Mavis, internal_cache: dict):
    # cached datasets
    all_datasets = [
        dict(slug=d.slug, name=d.name) for d in graph_client.dataset_index(company_id=mavis.company.id).dataset
    ]

    autocomplete = internal_cache["autocomplete"] or []

    # used in dataset metrics and all those

    # define the full schema
    schema = _object(
        dict(
            # Dataset Metric
            dataset_slug=_drop_down(all_datasets, "slug", "name", title="Dataset"),
            group_slug=_drop_down([], title="Groups"),
            metric_id=_drop_down([], title="Metric Column"),
            count_id=_drop_down([], title="Row Count Column (for weights)"),
            threshold=_number("Max allowed Residual Lift", default=0.2),
            min_points=_number("Min Points", default=3),
            only_trace=_input("Only Trace (Optional)"),
            max_date=_input("Max Date for Trend(Optional)"),
            refresh_preview=_checkbox("Refresh Preview 📸"),
            preview=_input("preview"),
            name=_input("Field Name", default="Trend"),
            format=_drop_down(
                FORMATS,
                "id",
                "label",
                default="number",
                title="Format",
            ),
            explanation=_input("explanation"),
        ),
        title=DESCRIPTION,
    )

    # hide properties
    _hide_properties(
        schema,
        [
            "max_date",
        ],
        "advanced_options",
    )

    schema_ui = dict(
        **_make_ui(
            options=dict(hide_output=True),
            order=[
                "dataset_slug",
                "group_slug",
                "threshold",
                "min_points",
                "metric_id",
                "count_id",
                "only_trace",
                "advanced_options",
                "max_date",
                "name",
                "format",
                "explanation",
                "refresh_preview",
                "preview",
            ],
        ),
        # Dataset Metric
        dataset_slug=_make_ui(options=dict(**_space(40))),
        group_slug=_make_ui(options=dict(load_values=True, **_space(30))),
        threshold=_make_ui(options=dict(**_space(15))),
        min_points=_make_ui(options=dict(**_space(15))),
        metric_id=_make_ui(options=dict(load_values=True, **_space(50))),
        count_id=_make_ui(options=dict(load_values=True, **_space(25))),
        only_trace=_make_ui(
            widget="MarkdownWidget",
            options=dict(autocomplete=autocomplete, default_height=ROW_HEIGHT, **_space(25)),
        ),
        advanced_options=_make_ui(widget="BooleanToggleWidget"),
        max_date=_make_ui(options=_space(50)),
        name=_make_ui(options=_space(70)),
        format=_make_ui(options=dict(allows_new_items=True, **_space(30))),
        refresh_preview=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(process_data=True, button_type="tertiary"),
        ),
        preview=_make_ui(widget="MarkdownRenderWidget"),
    )

    return schema, schema_ui


@tracer.start_as_current_span("get_internal_cache")
def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    # load the fields
    if not internal["autocomplete"] and data["_raw_fields"]:
        internal["autocomplete"] = [
            fields_to_autocomplete(
                mavis,
                data["_raw_fields"],
                include_pretty=False,
            )
        ]
    return internal


@tracer.start_as_current_span("get_values")
def get_values(mavis: Mavis, data: dict, updated_field_slug: str | None = None):
    values = []

    if data["dataset_slug"]:
        dataset_id = DatasetManager(mavis=mavis)._slug_to_id(data["dataset_slug"])
        d_obj = Dataset(mavis, dataset_id)
    else:
        raise SilenceError("Please load datataset to get the groups or plots")

    if updated_field_slug == "root_group_slug":
        values = [
            dict(value=g.slug, label=g.label)
            for g in d_obj.model.all_tabs
            if any(c for c in g.columns if c.type == "timestamp")
        ]

    elif updated_field_slug in ("root_metric_id", "root_count_id"):
        values = [
            dict(value=c.id, label=c.label)
            for c in d_obj.model.get_all_columns(data["group_slug"], True)
            if c.type == "number"
        ]

    return dict(values=values)


@tracer.start_as_current_span("process_data")
def process_data(mavis: Mavis, data: dict, updated_field_slug: str | None = None):
    # reset the preview
    if updated_field_slug == "root_refresh_preview":
        configs = [r["value"] for r in run_data(mavis, data)]

        # after all the configs
        data["preview"] = preview_value(mavis, configs, data["_raw_fields"])

    elif updated_field_slug is None and data["value"]:
        data = dict(
            _raw_fields=data["_raw_fields"],
            requester=data["requester"],
            previous_names=data["previous_names"] or [],
            explanation=data["explanation"] or "",
            unused=data["unused"] or False,
            name=data["name"],
            format=data["format"],
            dataset_slug=data["value"]["dataset_slug"],
            group_slug=data["value"].get("group_slug"),
            metric_id=data["value"].get("metric_id"),
            count_id=data["value"].get("count_id") or None,
            only_trace=data["value"].get("only_trace") or None,
            threshold=data["value"]["threshold"],
            min_points=data["value"]["min_points"],
            max_date=data["value"].get("max_date") or None,
        )
    return data


@tracer.start_as_current_span("run_data")
def run_data(mavis: Mavis, data: dict):
    output_column = dict(
        name=_make_name(data["name"], data["_raw_fields"]),
        previous_names=data["previous_names"] or [],
        format=data["format"],
        explanation=data["explanation"] or "",
        unused=data["unused"] or False,
        kind="trend",
        value=dict(
            dataset_slug=data["dataset_slug"],
            group_slug=data.get("group_slug"),
            metric_id=data.get("metric_id"),
            count_id=data.get("count_id") or None,
            only_trace=data.get("only_trace") or None,
            threshold=data["threshold"],
            min_points=data["min_points"],
            max_date=data["max_date"] or None,
        ),
    )

    # create the config object
    configs = [output_column]

    # add the dependence
    for c in configs:
        c["field_depends_on"] = list({f for f in get_required_fields(c) if f in data["_raw_fields"].keys()})

        # initialize the name
        if not c["previous_names"]:
            c["previous_names"] = []

        # add all the previous names to the field config
        if c["name"] not in c["previous_names"]:
            c["previous_names"].append(str(c["name"]))

    # return the field configs
    return [dict(type="json", value=c) for c in configs]


@tracer.start_as_current_span("_make_name")
def _make_name(name: str, fields):
    name = utils.slugify(name)

    # override variable name cause we cannot start with number
    if name[0].isdigit():
        name = f"v_{name}"

    # fix the input names
    if name not in fields.keys():
        return name

    np = name.split("_")
    while name in fields.keys():
        if np[-1].isdigit():
            np[-1] = str(int(np[-1] + 1))
            name = "_".join(np)
        else:
            name += "_1"
    return name
