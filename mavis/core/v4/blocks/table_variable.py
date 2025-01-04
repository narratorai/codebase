import json

from core import utils
from core.api.customer_facing.datasets.utils import DatasetManager
from core.models.table import TableColumn, TableColumnContext
from core.v4.analysisGenerator import _fetch_dataset
from core.v4.blocks.shared_ui_elements import (
    _basic_field_block,
    _clean_name,
    _create_autocomplete,
    _create_content,
    _drop_down,
    _get_config,
    _get_dataset,
    _hide_properties,
    _input,
    _make_array,
    _make_ui,
    _object,
    _space,
)
from core.v4.dataset_comp.query.util import Dataset
from core.v4.mavis import Mavis
from core.v4.narrative.helpers import (
    create_aeval,
    fill_in_template,
    get_required_fields,
)

TITLE = "Table"
DESCRIPTION = ""
VERSION = 1
UI_RENDER = 1000

HELPFUL_TIPS = "\n\n".join(
    [
        "Tables are really help ful when you want to use an entire table:",
        " - Display the table as using `{#TABLE_NAME}`",
        " - Get unique values `{unique(TABLE_NAME_COLUMN_NAME)}`",
        " - Get First Row `{TABLE_NAME['row'][0]}`",
        " - Get Last value of a column `{TABLE_NAME_COLUMN[-1]}`",
        " - Get the value of a column `{TABLE_NAME_COLUMN_NAME}`",
        "",
        "<details><summary>Advanced Ussage</summary>",
        " - Get some random customer examples: `{ ', '.join(TABLE_COLUMNS_customer[:3])}`",
        "</details>",
    ]
)


def get_schema(mavis: Mavis, internal_cache: dict):
    all_datasets = _get_dataset(mavis)
    # get all the groups
    all_groups = internal_cache["all_groups"] or []
    all_cols = internal_cache["all_cols"] or []

    main_obj = _object(
        dict(
            dataset_slug=_drop_down(all_datasets, "slug", "name", title="Select Dataset"),
            group_slug=_drop_down(all_groups, "slug", "name", title="Select Group"),
            add_cols=_make_array(
                obj=dict(
                    definition=_input("Definition"),
                    name=_input("Column Name", default="new_column_name"),
                )
            ),
        )
    )

    _hide_properties(main_obj, ["add_cols"], "add_computed_columns")

    main_ui = dict(
        dataset_slug=_make_ui(options=dict(update_schema=True)),
        group_slug=_make_ui(options=dict(update_schema=True)),
        add_cols=dict(
            **_make_ui(
                options=dict(
                    title=False,
                    addable=True,
                    orderable=True,
                    removable=True,
                ),
                order=["definition", "name"],
            ),
            items=dict(
                definition=_make_ui(
                    widget="MarkdownWidget",
                    options=dict(
                        autocomplete=_create_autocomplete(
                            mavis,
                            dict(
                                **internal_cache["fields"],
                                **{"_" + c: "ROW_VALUE" for c in all_cols},
                            ),
                        ),
                        default_height=32,
                        **_space(70),
                    ),
                ),
                name=_make_ui(options=_space(30)),
            ),
        ),
        add_computed_columns=_make_ui(widget="BooleanToggleWidget"),
    )
    override_content = _create_content("You will see a preview here once you click `Run`", HELPFUL_TIPS)

    (schema, schema_ui) = _basic_field_block(
        main_obj,
        main_ui,
        override_content=override_content,
        fields=internal_cache["fields"],
        hide_format=True,
    )

    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    # create the config
    config = data["left"]

    # get the groups
    if slug := config["value"]["dataset_slug"]:
        dataset_id = DatasetManager(mavis=mavis)._slug_to_id(slug)
        d_obj = Dataset(mavis, dataset_id)
        internal["all_groups"] = [{"slug": g.slug, "name": g.label} for g in d_obj.model.all_tabs]

        # get all the columns
        if config["value"]["group_slug"]:
            all_cols = d_obj.model.tab(config["value"]["group_slug"]).output_columns

            # add the columns
            internal["all_cols"] = [c.clean_label for c in all_cols]

    if not internal["fields"]:
        internal["fields"] = data["_raw_fields"]

    return internal


def process_data(mavis: Mavis, data: dict, update_field_slug: str | None):
    # begin defining a new way of doing fields
    # there is no left if it is being loaded
    config, data = _get_config(data, "table_variable")

    config["format"] = "table"

    if update_field_slug in (None, "root_right_run"):
        config["name"] = name = _clean_name(config["name"] or "new table", data["_raw_fields"])

        try:
            var = convert_to_fields(mavis, config, data["_raw_fields"])
        except Exception:
            var = None

        if var:
            lines = [
                "### Raw data",
                "The raw data is a dict with the fields columns, rows, metadata",
                f"You can call any of these variables by using `{name}_COLUMN_NAME`.",
                "<br>",
                "### Columns",
            ]

            # add all the columns
            for c in var[name]["columns"]:
                lines.append(f" - {c['friendly_name']}")

            # add an example row
            lines.extend(
                [
                    "<br>",
                    f'### Rows ({len(var[name]["rows"])})',
                    "Each row is a dict with the following attributes:",
                    "```json",
                    json.dumps(
                        var[name]["rows"][0] if len(var[name]["rows"]) > 0 else {},
                        indent=4,
                    ),
                    "```",
                    "<br>",
                    # add some rows
                    f"### Pretty Display ( `#{name}`)",
                    "*We are only displaying 5 rows for examples*",
                    mavis.human_format(
                        dict(columns=var[name]["columns"], rows=var[name]["rows"][:5]),
                        "table",
                    ),
                ]
            )

            preview = "\n\n".join(lines)
        else:
            preview = "..run to see preview "

        data["right"]["content"] = _create_content(preview, HELPFUL_TIPS)

        # get all the fields that this variable users
        if data["_raw_fields"]:
            config["field_depends_on"] = [
                r for r in list(set(get_required_fields(config))) if r in data["_raw_fields"].keys() and r != name
            ]

    # add the config back
    data["left"] = config
    return data


def run_data(mavis: Mavis, data: dict):
    # return the data
    data["left"]["format"] = "table"

    # add the additional columns
    for c in data["left"]["value"].get("add_cols") or []:
        data["left"]["value"]["column_mapping"][utils.slugify(c["name"])] = c["name"]

    data["left"]["other_names"] = [
        f'{data["left"]["name"]}_{c}' for c in data["left"]["value"]["column_mapping"].keys()
    ]

    return [dict(type="json", value=data["left"])]


def convert_to_fields(mavis: Mavis, config, fields, cache_minutes=None, local_cache=None, aeval=None):
    if config["name"] and config.get("value"):
        name = _clean_name(config["name"], fields)

        # better fetch of datasets
        d_obj = _fetch_dataset(
            mavis,
            config["value"]["dataset_slug"],
            local_cache or dict(_datasets=dict()),
        )

        raw_data = d_obj.run(config["value"]["group_slug"])

        # only render the last 1000
        raw_data.limit(UI_RENDER)

        if aeval is None:
            aeval = create_aeval(fields)

        for col in config["value"].get("add_cols") or []:
            raw_data.columns.append(
                TableColumn(
                    header_name=utils.slugify(col["name"]),
                    field=col["name"],
                    id=col["name"],
                    context=TableColumnContext(
                        format=utils.guess_format(col["name"]),
                    ),
                )
            )
            # process the row
            for r in raw_data.rows:
                if aeval:
                    for k, val in r.items():
                        aeval.symtable["_" + k] = val

                r[utils.slugify(col["name"])] = fill_in_template(
                    col["definition"],
                    dict(**fields, **{"_" + k: v for k, v in r.items()}),
                    mavis=mavis,
                    aeval=aeval,
                )

        # CONSIDER ADDING THE COLUMNS
        variable = {
            f"{name}": {k: v for k, v in raw_data.items() if k in ["rows", "columns", "metadata"]},
            f"#{name}": mavis.human_format(raw_data, "table"),
            f"__{name}": config.get("explanation") or "",
        }

        # get all the values
        for c in raw_data.columns:
            variable[f"{name}_{c['name']}"] = [r[c["name"]] for r in raw_data.rows]
            variable[f"#{name}_{c['name']}"] = [mavis.human_format(r[c["name"]], c["format"]) for r in raw_data.rows]

        return variable

    else:
        return dict()
