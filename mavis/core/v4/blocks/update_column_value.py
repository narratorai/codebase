from core.api.customer_facing.sql.utils import WarehouseManager
from core.logger import get_logger
from core.models.ids import get_uuid
from core.v4.blocks.shared_ui_elements import (
    _checkbox,
    _drop_down,
    _input,
    _make_ui,
    _space,
)
from core.v4.mavis import Mavis

logger = get_logger()

TITLE = "Warehouse Column Mass Update"
DESCRIPTION = "Searches every column with a match to any of your `Column Names` and will find any match to the `Column Value` then you can update all the instances with the new value"
VERSION = 1


def get_schema(mavis: Mavis, internal_cache):
    all_schemas = mavis.get_all_schemas()
    schema = dict(
        title=TITLE,
        description=DESCRIPTION,
        type="object",
        properties=dict(
            column_value=_input("Column Value"),
            schemas=_drop_down(all_schemas, is_multi=True, default=all_schemas),
            column_names=_drop_down(["customer"], is_multi=True, title="Column Names"),
            new_value=_input("new_value", default=f"ANONYMOUS{get_uuid()[:8]}"),
            process=_checkbox("Find Matches"),
            preview=_input("Delete Output"),
            run_update=_checkbox("Run Update"),
        ),
    )

    schema_ui = dict(
        column_names=_make_ui(options=dict(**_space(70), allows_new_items=True, data_public=True)),
        process=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(
                process_data=True,
                button_type="secondary",
            ),
        ),
        preview=_make_ui(widget="MarkdownRenderWidget", options=dict(data_public=False)),
    )

    return schema, schema_ui


def get_internal_cache(mavis: Mavis, data, internal):
    return internal


def test_column(mavis: Mavis, found_tbl, value):
    qm = mavis.qm

    test_query = qm.Query()
    test_query.add_column(qm.Column(function="count_all", fields={}, name_alias="total_rows"))
    test_query.set_from(qm.Table(schema=found_tbl["schema"], table=found_tbl["table"]))
    test_query.add_filter(
        qm.Condition(
            operator="contains",
            left=qm.Column(table_column=found_tbl["column"], casting="string"),
            right=qm.Column(value=value.lower()),
        )
    )

    try:
        data = mavis.run_query(test_query.to_query(), within_minutes=12 * 60)
        return data["rows"][0]["total_rows"] > 0
    except Exception:
        return False


def update_column(mavis: Mavis, found_tbl, value, new_value):
    qm = mavis.qm

    # add the table
    if found_tbl["table"].startswith("v_"):
        return None

    update_query = qm.get_update_query(
        qm.Table(schema=found_tbl["schema"], table=found_tbl["table"]),
        [
            qm.Condition(
                operator="equal",
                left=qm.Column(table_column=found_tbl["column"]),
                right=qm.Column(
                    function="replace",
                    fields=dict(
                        column=qm.Column(table_column=found_tbl["column"]),
                        remove_string=value.lower(),
                        add_string=new_value,
                    ),
                ),
            )
        ],
        qm.Filter(
            filters=[
                qm.Condition(
                    operator="contains",
                    left=qm.Column(table_column=found_tbl["column"], casting="string"),
                    right=qm.Column(value=value.lower()),
                )
            ]
        ),
    )
    mavis.run_query(
        update_query,
        within_minutes=12 * 60,
        as_admin=True,
    )

    return None


def dstr(f):
    return f"{f['schema']}.{f['table']}.{f['column']}-{f['value']}"


def process_data(mavis: Mavis, data, update_field_slug):
    if not data["column_value"]:
        return data

    logger.debug("Process data", data=data)

    found_columns = data["found_columns"] or []
    searched_columns = data["searched_columns"] or []

    # get all the tables in the warehouse
    warehouse_tables = WarehouseManager(mavis=mavis).get_schema(include_columns=True)

    fd = [dstr(s) for s in searched_columns]

    for c in data["column_names"]:
        # process all the data
        for tb in warehouse_tables.tables:
            # ignore some schemas
            if tb.schema_name not in data["schemas"]:
                continue

            for tbl_column in tb.lower_column_names:
                # check if the column piece is in the column name
                if c.lower() in tbl_column:
                    f_table = dict(
                        schema=tb.schema_name,
                        table=tb.table_name,
                        column=tbl_column,
                        value=data["column_value"],
                    )

                    # check if we already processed it
                    if dstr(f_table) not in fd:
                        found = test_column(mavis, f_table, data["column_value"])
                        searched_columns.append(f_table)

                        # log the found columns
                        if found:
                            found_columns.append(f_table)

    return final_run(mavis, data, found_columns, searched_columns, True)


def final_run(mavis: Mavis, data, found_columns, searched_columns, is_done):
    # log the found columns
    data["found_columns"] = found_columns
    data["searched_columns"] = searched_columns
    content = []

    if is_done:
        content.append("# All Done!!!")
    else:
        content.append("# Keep Running ")

    # display the content
    content.append(f"## Found value in the following ({len(found_columns)})")
    for f in found_columns:
        content.append(f"- {f['schema']}.{f['table']}.{f['column']}")

    # display the content
    content.append(f"\n\n## We Searched in the following ({len(searched_columns)})")
    for f in searched_columns:
        content.append(f"- {f['schema']}.{f['table']}.{f['column']}")

    data["preview"] = "\n\n".join(content)
    return data


def run_data(mavis: Mavis, data: dict):
    content = []
    if data["run_update"]:
        content.append("# Updated the following columns")
        for f in data["found_columns"]:
            update_column(mavis, f, data["column_value"], data["new_value"])
            content.append(f"UPDATED: {f['schema']}.{f['table']}.{f['column']}")
    else:
        # display he content
        content.append("# Confirm by selecting the run delete")

    return [dict(type="markdown", value=content)]
