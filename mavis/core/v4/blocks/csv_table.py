from core.v4.analysisGenerator import fields_to_autocomplete
from core.v4.blocks.shared_ui_elements import _checkbox, _input, _make_ui, _object
from core.v4.mavis import Mavis

TITLE = "CSV Table"
DESCRIPTION = ""
VERSION = 1


def get_schema(mavis: Mavis, internal_cache: dict):
    autocomplete = internal_cache["autocomplete"] or []

    schema = _object(
        dict(
            csv=_input(
                "Enter CSV (Delimiter `|` )",
                default="\n".join(
                    [
                        ":Left Align| :Center Align:| Right:",
                        "first_row| second | 3rd val",
                        "first_row| second | 3rd val",
                    ]
                ),
            ),
            use_data_table=_checkbox("Use Data Table"),
        ),
        title=TITLE,
        description=DESCRIPTION,
    )

    schema_ui = dict(
        **_make_ui(options=dict(hide_output=True)),
        csv=_make_ui(
            widget="MarkdownWidget",
            options=dict(autocomplete=autocomplete, default_height=500),
        ),
        use_data_table=_make_ui(options=dict(submit_form=True)),
    )
    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    if not internal["autocomplete"] and data["_raw_fields"]:
        internal["autocomplete"] = [
            fields_to_autocomplete(
                mavis,
                data["_raw_fields"],
                include_pretty=True,
            )
        ]

    return internal


def process_data(mavis: Mavis, data: dict, update_field_slug: str | None):
    return data


def run_data(mavis: Mavis, data: dict):
    rows = data["csv"].split("\n")
    cols = []
    all_rows = []

    for ii, r in enumerate(rows[0].split("|")):
        r = r.strip(" ")
        align = "left"
        if r[0] == r[-1] == ":":
            align = "center"
        elif r[0] == ":":
            align = "left"
        elif r[-1] == ":":
            align = "right"

        cols.append(dict(name=str(ii), friendly_name=r.strip(":"), align=align))

    # add all the rows
    for row in rows[1:]:
        all_rows.append({str(ii): r.strip(" ") for ii, r in enumerate(row.split("|"))})

    table = dict(columns=cols, rows=all_rows)

    if data["use_data_table"]:
        return [dict(type="table", value=table)]
    return [
        dict(
            type="markdown",
            value="\n\n{}\n\n".format(mavis.human_format(table, "table")),
        )
    ]
