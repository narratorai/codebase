from core import utils
from core.util.opentelemetry import tracer
from core.v4.analysisGenerator import (
    fields_to_autocomplete,
    preview_value,
)
from core.v4.blocks.shared_ui_elements import (
    _checkbox,
    _drop_down,
    _input,
    _make_ui,
    _object,
    _space,
)
from core.v4.mavis import Mavis
from core.v4.narrative.helpers import get_required_fields

TITLE = "Input or Equation (Deprecated)"
DESCRIPTION = "A way to create a field using equations"
VERSION = 1

ROW_HEIGHT = 42
TEMP_NAME = "Temporary Name"
FORMATS = [f for f in utils.HUMAN_FORMATS if f["id"] not in ("time", "table")]


@tracer.start_as_current_span("get_schema")
def get_schema(mavis: Mavis, internal_cache: dict):
    autocomplete = internal_cache["autocomplete"] or []

    # define the full schema
    schema = _object(
        dict(
            # metric
            content=_input("Equation"),
            refresh_preview=_checkbox("Refresh Preview 📸"),
            preview=_input("preview"),
            name=_input("Field Name", default=TEMP_NAME),
            format=_drop_down(
                FORMATS,
                "id",
                "label",
                default="number",
                title="Format",
            ),
            explanation=_input("explanation"),
        ),
        title="Define your Input equation",
        required=["kind", "name"],
    )

    schema_ui = dict(
        **_make_ui(
            options=dict(hide_output=True),
            order=[
                "content",
                "output_names",
                "name",
                "format",
                "explanation",
                "refresh_preview",
                "preview",
            ],
        ),
        # INPUT KIND
        content=_make_ui(
            widget="MarkdownWidget",
            options=dict(autocomplete=autocomplete, default_height=ROW_HEIGHT, **_space(70)),
        ),
        refresh_preview=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(process_data=True, button_type="tertiary"),
        ),
        preview=_make_ui(widget="MarkdownRenderWidget"),
        name=_make_ui(options=_space(70)),
        format=_make_ui(options=dict(allows_new_items=True, **_space(30))),
    )

    return (schema, schema_ui)


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


@tracer.start_as_current_span("process_data")
def process_data(mavis: Mavis, data: dict, updated_field_slug: str | None = None):
    if updated_field_slug == "root_refresh_preview":
        result = run_data(mavis, data)
        configs = [r["value"] for r in result]

        # after all the configs
        data["preview"] = preview_value(mavis, configs, data["_raw_fields"])

    elif updated_field_slug is None and data["name"]:
        data = dict(
            _raw_fields=data["_raw_fields"],
            requester=data["requester"],
            previous_names=data["previous_names"] or [],
            explanation=data["explanation"] or None,
            name=data["name"],
            format=data["format"],
            content=(
                data.get("value") or None if isinstance(data["value"], str) else data["value"].get("content") or None
            ),
        )
    return data


@tracer.start_as_current_span("run_data")
def run_data(mavis: Mavis, data: dict):
    output_column = dict(
        name=_make_name(data["name"], data["_raw_fields"]),
        previous_names=data["previous_names"],
        explanation=data["explanation"] or "",
        unused=data["unused"] or False,
        format=data["format"],
        kind="value_field",
        value=dict(content=data["content"]),
    )

    # create the config object
    configs = [output_column]

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
    elif name in fields.get("_default_fields", []):
        return name

    np = name.split("_")
    while name in fields.keys():
        if np[-1].isdigit():
            np[-1] = str(int(np[-1] + 1))
            name = "_".join(np)
        else:
            name += "_1"
    return name
