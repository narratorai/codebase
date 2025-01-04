from core import utils
from core.util.opentelemetry import tracer
from core.v4.analysisGenerator import (
    fields_to_autocomplete,
    get_required_fields,
    preview_value,
)
from core.v4.blocks.shared_ui_elements import (
    _checkbox,
    _drop_down,
    _input,
    _make_array,
    _make_ui,
    _object,
    _space,
)
from core.v4.mavis import Mavis

TITLE = "Conditional Value"
DESCRIPTION = "A way map text to values"
VERSION = 1

ROW_HEIGHT = 42
TEMP_NAME = "Labeled Field"
FORMATS = [f for f in utils.HUMAN_FORMATS if f["id"] not in ("time", "table")]


@tracer.start_as_current_span("get_schema")
def get_schema(mavis: Mavis, internal_cache: dict):
    autocomplete = internal_cache["autocomplete"] or []

    # define the full schema
    schema = _object(
        dict(
            # Labeled Field
            conditions=_make_array(
                dict(
                    condition=_input("Condition"),
                    text=_input("text"),
                )
            ),
            else_value=_input("Else Value"),
            name=_input("Field Name", default=TEMP_NAME),
            format=_drop_down(
                FORMATS,
                "id",
                "label",
                default="number",
                title="Format",
            ),
            explanation=_input("Explanation"),
            refresh_preview=_checkbox("Refresh Preview 📸"),
            preview=_input("preview"),
        ),
        title="Map a value of a field to some text",
        required=["name"],
    )

    schema_ui = dict(
        **_make_ui(
            options=dict(hide_output=True),
            order=[
                "conditions",
                "else_value",
                # final data
                "name",
                "format",
                "explanation",
                "refresh_preview",
                "preview",
            ],
        ),
        # Labeled Field
        conditions=dict(
            **_make_ui(options=dict(orderable=True), order=["condition", "text"]),
            items=dict(
                condition=_make_ui(
                    widget="MarkdownWidget",
                    options=dict(
                        autocomplete=autocomplete,
                        default_height=ROW_HEIGHT * 4,
                        **_space(50),
                    ),
                ),
                text=_make_ui(
                    widget="MarkdownWidget",
                    options=dict(
                        autocomplete=autocomplete,
                        default_height=ROW_HEIGHT * 4,
                        **_space(50),
                    ),
                ),
            ),
        ),
        else_value=_make_ui(options=dict(autocomplete=autocomplete, default_height=ROW_HEIGHT * 4, **_space(50))),
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

    elif updated_field_slug is None and data["value"]:
        data = dict(
            _raw_fields=data["_raw_fields"],
            requester=data["requester"],
            previous_names=data["previous_names"] or [],
            name=data["name"],
            format=data["format"],
            explanation=data["explanation"] or "",
            unused=data["unused"] or False,
            conditions=data["value"]["conditions"] or [],
            else_value=data["value"]["else_value"] or None,
        )

    _fill_in_names(mavis, data)
    return data


@tracer.start_as_current_span("run_data")
def run_data(mavis: Mavis, data: dict):
    # create the config object
    configs = [
        dict(
            name=_make_name(data["name"], data["_raw_fields"]),
            previous_names=data["previous_names"],
            format=data["format"],
            explanation=data["explanation"] or "",
            unused=data["unused"] or False,
            kind="labeled_field",
            value=dict(
                conditions=data["conditions"],
                else_value=data["else_value"],
            ),
        )
    ]

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


@tracer.start_as_current_span("_fill_in_names")
def _fill_in_names(mavis, data):
    # first_row_filled
    if data["name"] == TEMP_NAME or not data["name"]:
        data["name"] = TEMP_NAME


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
