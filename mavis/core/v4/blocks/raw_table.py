from core.v4.analysisGenerator import fields_to_autocomplete
from core.v4.blocks.shared_ui_elements import (
    _checkbox,
    _input,
    _make_array,
    _make_ui,
    _number,
    _object,
    _space,
)
from core.v4.mavis import Mavis

TITLE = "Table (SuperAdmin Only)"
DESCRIPTION = "Creates a table"
VERSION = 1


def make_row(col_count):
    return _object({str(ii): _input() for ii in range(col_count)})


def make_row_ui(col_count, autocomplete, hide_title=False):
    raw = {
        str(ii): _make_ui(
            options=dict(
                **_space(int(100 / col_count)),
            ),
        )
        for ii in range(col_count)
    }

    raw.update(
        **_make_ui(
            options=dict(title=not hide_title),
        ),
    )

    return raw


def get_schema(mavis: Mavis, internal_cache: dict):
    col_count = internal_cache["col_count"] or 4
    autocomplete = internal_cache["autocomplete"] or []

    schema = _object(
        dict(
            column_count=_number(title="Number of Columns", default=4),
            refresh=_checkbox("Update Table"),
            titles=make_row(col_count),
            rows=_make_array(dict(each_row=make_row(col_count)), title="Rows"),
        ),
        title=TITLE,
        description=DESCRIPTION,
    )

    schema_ui = dict(
        **_make_ui(options=dict(hide_output=True)),
        column_count=_make_ui(options=dict(**_space(50))),
        refresh=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(update_schema=True, **_space(50, inline_button=True)),
        ),
        titles=make_row_ui(col_count, autocomplete),
        rows=dict(
            **_make_ui(
                options=dict(
                    hide_output=True,
                    addable=True,
                    orderable=True,
                    removable=True,
                    # **_space(mb=0)
                )
            ),
            items=dict(
                each_row=make_row_ui(col_count, autocomplete, hide_title=True),
            ),
        ),
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

    # handle datasets
    internal["col_count"] = data["column_count"]

    return internal


def process_data(mavis: Mavis, data: dict, update_field_slug: str | None):
    return data


def run_data(mavis: Mavis, data: dict):
    table_data = dict(
        columns=[dict(friendly_name=title, name=name, format="id") for name, title in data["titles"].items()],
        rows=[r["each_row"] for r in data["rows"]],
    )

    return [
        dict(
            type="markdown",
            value=f'\n\n{mavis.human_format(table_data, "table")}\n\n',
        )
    ]
