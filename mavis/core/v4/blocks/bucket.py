from core import utils
from core.api.customer_facing.datasets.utils import DatasetManager
from core.errors import SilenceError
from core.graph import graph_client
from core.util.opentelemetry import tracer
from core.v4.analysisGenerator import preview_value
from core.v4.blocks.shared_ui_elements import (
    _checkbox,
    _drop_down,
    _input,
    _make_ui,
    _number,
    _object,
    _space,
)
from core.v4.dataset_comp.query.util import Dataset
from core.v4.mavis import Mavis
from core.v4.narrative.helpers import get_required_fields

TITLE = "Bucket Generator"
DESCRIPTION = "A way to combine groups into a bucket"
VERSION = 1
ADVANCED_ONLY = True

FORMATS = ["percent", "number"]
AVAILABLE_VERSIONS = [1, 2]


@tracer.start_as_current_span("get_schema")
def get_schema(mavis: Mavis, internal_cache: dict):
    # cached datasets
    all_datasets = [
        dict(slug=d.slug, name=d.name) for d in graph_client.dataset_index(company_id=mavis.company.id).dataset
    ]

    # used in dataset metrics and all those

    # define the full schema
    schema = _object(
        dict(
            version=_drop_down(AVAILABLE_VERSIONS, title="version", default=2),
            # Dataset Metric
            dataset_slug=_drop_down(all_datasets, "slug", "name", title="Dataset"),
            group_slug=_drop_down([], title="Groups"),
            metric_id=_drop_down([], title="Metric Column"),
            count_id=_drop_down([], title="Size Column"),
            std_id=_drop_down([], title="STD Column"),
            number_of_buckets=_number("# of Buckets", default=2),
            direction=_input("direction (increase/decrease)", default="increase"),
            refresh_preview=_checkbox("Refresh Preview 📸"),
            preview=_input("preview"),
            name=_input("Field Name", default="Buckets"),
            format=_drop_down(
                FORMATS,
                default="percent",
                title="Format",
            ),
            explanation=_input("Explanation"),
        ),
        title=DESCRIPTION,
    )

    schema_ui = dict(
        **_make_ui(
            options=dict(hide_output=True),
            order=[
                "version",
                "dataset_slug",
                "group_slug",
                "number_of_buckets",
                "metric_id",
                "count_id",
                "std_id",
                "direction",
                "name",
                "format",
                "explanation",
                "refresh_preview",
                "preview",
            ],
        ),
        # Dataset Metric
        version=_make_ui(options=dict(**_space(10))),
        dataset_slug=_make_ui(options=dict(**_space(30))),
        group_slug=_make_ui(options=dict(load_values=True, **_space(30))),
        number_of_buckets=_make_ui(options=dict(**_space(20))),
        metric_id=_make_ui(options=dict(load_values=True, **_space(40))),
        count_id=_make_ui(options=dict(load_values=True, **_space(30))),
        std_id=_make_ui(
            options=dict(load_values=True, **_space(30)),
            # help_text="This can be ignored for conversion columns",
        ),
        direction=_make_ui(options=_space(31)),
        name=_make_ui(options=_space(70)),
        format=_make_ui(options=dict(allows_new_items=True, **_space(30))),
        refresh_preview=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(process_data=True, button_type="tertiary"),
        ),
        preview=_make_ui(widget="MarkdownRenderWidget"),
    )

    return (schema, schema_ui)


@tracer.start_as_current_span("get_internal_cache")
def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
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
        values = [dict(value=g.slug, label=g.label) for g in d_obj.model.all_tabs]

    elif updated_field_slug in ("root_metric_id", "root_count_id", "root_std_id"):
        values = [
            dict(value=c.id, label=c.label)
            for c in d_obj.model.tab(data["group_slug"]).output_columns
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
            name=data["name"],
            format=data.get("format", "percent"),
            explanation=data["explanation"] or "",
            unused=data["unused"] or False,
            version=data["value"].get("version", 1),
            dataset_slug=data["value"]["dataset_slug"],
            group_slug=data["value"].get("group_slug"),
            metric_id=data["value"]["metric_id"],
            count_id=data["value"]["count_id"],
            std_id=data["value"].get("std_id") or None,
            number_of_buckets=data["value"]["number_of_buckets"],
            direction=data["value"].get("direction") or "increase",
        )
    return data


@tracer.start_as_current_span("run_data")
def run_data(mavis: Mavis, data: dict):
    # create the config object
    configs = [
        dict(
            name=_make_name(data["name"], data["_raw_fields"]),
            previous_names=data["previous_names"] or [],
            explanation=data["explanation"] or "",
            format=data.get("format", "percent"),
            unused=data["unused"] or False,
            kind="bucket",
            value=dict(
                version=data["version"],
                dataset_slug=data["dataset_slug"],
                group_slug=data.get("group_slug"),
                metric_id=data["metric_id"],
                count_id=data["count_id"],
                std_id=data["std_id"],
                number_of_buckets=data["number_of_buckets"],
                direction=data.get("direction") or "increase",
            ),
        )
    ]
    # remove the additional output columns

    # add the dependence
    for c in configs:
        c["field_depends_on"] = list(set(f for f in get_required_fields(c) if f in data["_raw_fields"].keys()))

        # initialize the name
        if not c["previous_names"]:
            c["previous_names"] = []

        # add all the previous names to the field config
        if c["name"] not in c["previous_names"]:
            c["previous_names"].append(str(c["name"]))

    # return the field configs
    return [dict(type="json", value=c) for c in configs]


@tracer.start_as_current_span("_make_name")
def _make_name(name, fields):
    name = utils.slugify(name)

    # override variable name cause we cannot start with number
    if name[0].isdigit():
        name = "v_" + name

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
