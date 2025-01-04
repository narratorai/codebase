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
    _make_array,
    _make_ui,
    _object,
    _space,
)
from core.v4.dataset_comp.query.model import GroupColumn
from core.v4.dataset_comp.query.util import Dataset
from core.v4.mavis import Mavis
from core.v4.narrative.helpers import get_required_fields

TITLE = "Dataset Value (Deprecated)"
DESCRIPTION = "A way to save a value from a dataset as a field"
VERSION = 1

ROW_HEIGHT = 42
TEMP_NAME = "New Dataset Metric"

FORMATS = [f for f in utils.HUMAN_FORMATS if f["id"] not in ("time", "table")]


@tracer.start_as_current_span("get_schema")
def get_schema(mavis: Mavis, internal_cache: dict):
    # cached datasets
    # all_narratives = internal_cache["all_narratives"] or []
    all_datasets = [
        dict(slug=d.slug, name=d.name) for d in graph_client.dataset_index(company_id=mavis.company.id).dataset
    ]

    columns = internal_cache["columns"] or []
    autocomplete = internal_cache["autocomplete"] or []
    conditions = ["==", ">=", "<=", "!=", "is_not_null", "is_null"]

    # used in dataset metrics and all those

    # define the full schema
    schema = _object(
        dict(
            # Dataset Metric
            dataset_slug=_drop_down(all_datasets, "slug", "name", title="Select Dataset"),
            group_slug=_drop_down([], title="Select Group"),
            function=_drop_down(utils.supported_function, default="first_record", title="Aggregation"),
            column_id=_drop_down(columns, "value", "label", title="Column to Aggregate"),
            lookups=_make_array(
                dict(
                    lookup_column_id=_drop_down(columns, "value", "label", title="Column to filter"),
                    condition=_drop_down(conditions, default=conditions[0], title="Condition"),
                    value=_input("value: ex. {date_add(..)} | 2019-01-01 | {field_name} "),
                ),
                title="Filters",
            ),
            additional_output_columns=_drop_down(
                columns,
                "value",
                "label",
                is_multi=True,
                title="additional Columns",
                description="Choose columns based on the row of the applied function",
            ),
            refresh_preview=_checkbox("Refresh Preview 📸"),
            preview=_input("preview"),
            output_names=_make_array(
                dict(
                    name=_input("Field Name"),
                    format=_drop_down(
                        FORMATS,
                        "id",
                        "label",
                        default="number",
                        title="Format",
                    ),
                    explanation=_input("explanation"),
                ),
                default=[dict(name=TEMP_NAME, format="number")],
                title="Field Names",
            ),
        ),
        title="Choose a value from a dataset",
        required=["kind", "name"],
    )

    _hide_properties(
        schema,
        ["additional_output_columns"],
        "add_additional_columns_based_on_this_row",
    )

    needs_cols = False if columns else True

    schema_ui = dict(
        **_make_ui(
            options=dict(hide_output=True),
            order=[
                "dataset_slug",
                "group_slug",
                "function",
                "column_id",
                "lookups",
                "add_additional_columns_based_on_this_row",
                "additional_output_columns",
                # final data
                "output_names",
                "refresh_preview",
                "preview",
            ],
        ),
        # Dataset Metric
        dataset_slug=_make_ui(options=dict(**_space(50))),
        group_slug=_make_ui(options=dict(load_values=True, update_schema=True, **_space(30))),
        function=_make_ui(options=dict(load_values=needs_cols, **_space(25))),
        column_id=_make_ui(options=dict(load_values=needs_cols, process_data=True, **_space(50))),
        lookups=dict(
            **_make_ui(options=dict(orderable=True)),
            items=dict(
                lookup_column_id=_make_ui(load_values=needs_cols, options=_space(35)),
                condition=_make_ui(options=_space(15)),
                value=_make_ui(
                    widget="MarkdownWidget",
                    options=dict(
                        autocomplete=autocomplete,
                        default_height=ROW_HEIGHT,
                        **_space(50),
                    ),
                ),
            ),
        ),
        add_additional_columns_based_on_this_row=_make_ui(widget="BooleanToggleWidget"),
        additional_output_columns=_make_ui(options=dict(load_values=needs_cols, process_data=True)),
        refresh_preview=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(process_data=True, button_type="tertiary"),
        ),
        preview=_make_ui(widget="MarkdownRenderWidget"),
        output_names=dict(
            **_make_ui(options=dict(orderable=False, addable=False, removable=False)),
            items=dict(
                name=_make_ui(options=_space(70)),
                format=_make_ui(options=dict(allows_new_items=True, **_space(30))),
                explanation=_make_ui(options=_space(100)),
            ),
        ),
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

    if data["dataset_slug"]:
        dataset_id = DatasetManager(mavis=mavis)._slug_to_id(data["dataset_slug"])
        d_obj = Dataset(mavis, dataset_id)

        internal["columns"] = [
            dict(value=c.id, label=c.label) for c in d_obj.model.tab(data["group_slug"]).output_columns
        ]
    return internal


@tracer.start_as_current_span("get_values")
def get_values(mavis: Mavis, data: dict, updated_field_slug: str | None = None):
    values = []

    if updated_field_slug == "root_function":
        if data["group_slug"]:
            values = [dict(value=v, label=utils.title(v)) for v in utils.supported_function]
        else:
            values = [dict(value="first_record", label="First Record")]
    else:
        if data["dataset_slug"]:
            dataset_id = DatasetManager(mavis=mavis)._slug_to_id(data["dataset_slug"])
            d_obj = Dataset(mavis, dataset_id)
        else:
            raise SilenceError("Please load datataset to get the groups or plots")

        if updated_field_slug == "root_group_slug":
            values = [dict(value=g.slug, label=g.label) for g in d_obj.model.all_tabs] + [
                dict(value="none", label="Parent")
            ]

        elif updated_field_slug in (
            "root_column_id",
            "root_additional_output_columns",
        ):
            (d_obj.model.tab(data["group_slug"]).output_columns if data["group_slug"] else d_obj.model.output_columns)
            values = [
                dict(value=c.id, label=c.label)
                for c in d_obj.model.get_all_columns(data["group_slug"] or None, output=True)
            ]

    return dict(values=values)


@tracer.start_as_current_span("process_data")
def process_data(mavis: Mavis, data: dict, updated_field_slug: str | None = None):
    if updated_field_slug == "root_column_id":
        _fill_in_names(mavis, data, data["output_names"][0]["name"] == TEMP_NAME)

    # reset the preview
    elif updated_field_slug == "root_refresh_preview":
        configs = [r["value"] for r in run_data(mavis, data)]

        # after all the configs
        data["preview"] = preview_value(mavis, configs, data["_raw_fields"])

    elif updated_field_slug is None and data["value"]:
        data = dict(
            _raw_fields=data["_raw_fields"],
            requester=data["requester"],
            unused=data["unused"] or False,
            previous_names=data["previous_names"] or [],
            output_names=[
                dict(
                    name=data["name"],
                    format=data["format"],
                    explanation=data["explanation"],
                )
            ],
            dataset_slug=data["value"]["dataset_slug"],
            group_slug=data["value"]["group_slug"] or None,
            function=data["value"]["function"],
            column_id=data["value"]["column_id"],
            lookups=data["value"]["lookups"] or [],
        )

    else:
        _fill_in_names(mavis, data)

    return data


@tracer.start_as_current_span("run_data")
def run_data(mavis: Mavis, data: dict):
    output_column = dict(
        name=_make_name(data["output_names"][0]["name"] or "New Name", data["_raw_fields"]),
        previous_names=data["previous_names"] or [],
        format=data["output_names"][0]["format"],
        explanation=data["output_names"][0]["explanation"] or "",
        unused=data["unused"] or False,
        kind="dataset_metric",
        value=dict(
            dataset_slug=data["dataset_slug"],
            group_slug=data["group_slug"] or None,
            function=data["function"],
            column_id=data["column_id"],
            lookups=data["lookups"] or [],
        ),
    )

    # create the config object
    configs = [output_column]

    # append all the output columns
    for ii, col_id in enumerate(data["additional_output_columns"] or []):
        configs.append(
            dict(
                name=_make_name(data["output_names"][ii + 1]["name"], data["_raw_fields"]),
                previous_names=[],
                format=data["output_names"][ii + 1]["format"],
                explanation=data["output_names"][ii + 1]["explanation"] or "",
                unused=data["unused"] or False,
                kind="dataset_metric",
                value=dict(
                    dataset_slug=data["dataset_slug"],
                    group_slug=data["group_slug"] or None,
                    function=data["function"],
                    column_id=col_id,
                    lookups=(data["lookups"] or [])
                    + [
                        dict(
                            lookup_column_id=configs[0]["value"]["column_id"],
                            condition="==",
                            value="{{{}}}".format(configs[0]["name"]),
                        )
                    ],
                ),
            )
        )

    # add the dependence
    for c in configs:
        # add the field depends on
        c["field_depends_on"] = list(
            set(
                f
                for f in get_required_fields(c)
                if (f in data["_raw_fields"].keys()) or (f in [tc["name"] for tc in configs])
            )
        )

        # make sure it is the right type
        if not c["previous_names"]:
            c["previous_names"] = []

        # add all the previous names to the field config
        if c["name"] not in c["previous_names"]:
            c["previous_names"].append(str(c["name"]))

    # return the field configs
    return [dict(type="json", value=c) for c in configs]


@tracer.start_as_current_span("_fill_in_names")
def _fill_in_names(mavis, data, reset=False):
    # first_row_filled
    fill_in = reset or len(data["output_names"] or []) == 0

    if data["dataset_slug"]:
        dataset_id = DatasetManager(mavis=mavis)._slug_to_id(data["dataset_slug"])
        d_obj = Dataset(mavis, dataset_id)

        tab = d_obj.model.tab(data["group_slug"])

        # create the column
        if not fill_in and data["output_names"]:
            data["output_names"] = data["output_names"][:1]
        else:
            # create a name that makes sense based on the lookups and the data
            name_pieces = []
            if data["function"] in utils.supported_function[2:]:
                name_pieces.append(data["function"])

            # add any equal statements
            for lookup in data["look_ups"]:
                if lookup["condition"] == "==":
                    if "{" in lookup["value"]:
                        for k in data["_raw_fields"].keys():
                            if not k.startswith("#") and k in lookup["value"]:
                                name_pieces.append(k)
                                break

            dcol = tab.column(data["column_id"])
            name_pieces.append(dcol.label)

            data["output_names"] = [
                dict(
                    name=" ".join(name_pieces),
                    format=_guess_col_format(dcol),
                )
            ]

        # Always reset the columns
        for col in data["additional_output_columns"] or []:
            dcol = tab.column(col)
            data["output_names"].append(
                dict(
                    name="{} Based on {}".format(dcol.label, data["output_names"][0]["name"]),
                    format=_guess_col_format(dcol),
                )
            )

    # make the names pretty
    for name in data["output_names"]:
        name["name"] = utils.title(name["name"])


@tracer.start_as_current_span("_guess_col_format")
def _guess_col_format(column: GroupColumn):
    if column.type == "string":
        return "text"

    elif column.type == "timestamp":
        if any(r in column.label for r in ["day", "week", "month", "quarter", "year"]):
            return "date"
        else:
            return "time"

    else:
        return utils.guess_format(column["label"]) or "number"


@tracer.start_as_current_span("_make_name")
def _make_name(name, fields):
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
            np[-1] = str(int(np[-1]) + 1)
            name = "_".join(np)
        else:
            name += "_1"
    return name
