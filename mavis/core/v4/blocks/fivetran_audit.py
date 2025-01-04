from core import utils
from core.api.customer_facing.sql.utils import WarehouseManager
from core.graph import graph_client
from core.v4.blocks.shared_ui_elements import _make_ui
from core.v4.mavis import Mavis

TITLE = "Fivetran Audit"
DESCRIPTION = "Hit submit to get the analysis of fivetrans syncing"
VERSION = 1


def get_schema(mavis: Mavis, internal_cache: dict):
    schema = dict(
        title=TITLE,
        description=DESCRIPTION,
        type="object",
        properties=dict(),
    )

    schema_ui = dict(
        **_make_ui(
            options=dict(hide_submit=False),
        )
    )

    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    return internal


def process_data(mavis: Mavis, data: dict, update_field_slug: str | None):
    return data


def run_data(mavis: Mavis, data: dict):
    transformations = graph_client.transformation_index(company_id=mavis.company.id).all_transformations

    sql_queries = []
    for t in transformations:
        pq = graph_client.get_transformation_for_production(id=t.id).transformation.production_queries

        if pq:
            sql_queries.append(pq[0].sql.replace('"', "").replace("'", "").replace("`", "").lower())

    query_str = "\n".join(sql_queries)

    last_week = utils.date_add(utils.utcnow(), "day", -7)
    warehouse_tables = WarehouseManager(mavis=mavis).get_schema(include_columns=True)

    mk = []
    for table in warehouse_tables.tables:
        # check the data
        if "fivetran_audit" != table.lower_name:
            continue

        mk.append(f"# {table.schema_name}")

        remove_list = []
        used_list = []
        add_list = []

        save_rows = 0

        raw_data = get_audit_table(mavis, table.schema_name)
        # updates = {r["table_name"].lower(): r for r in raw_data.rows}

        for r in raw_data.rows:
            t = r["table_name"].lower()

            if t == "fivetran_audit":
                continue

            is_in_narrator = f" {table.schema_name}.{t} ".lower() in query_str

            if is_in_narrator and (r["last_updated"] < last_week):
                add_list.append(f' - {t} (Last updated: {mavis.human_format(r["last_updated"], "time")})')

            elif not is_in_narrator and r["last_updated"] > last_week:
                remove_list.append(f" - {t} (save {mavis.human_format(r['rows_upserted'])})")

                save_rows += r["rows_upserted"]

            else:
                used_list.append(f" - {t} (FYI {mavis.human_format(r['rows_upserted'])})")

        # handle the missing table
        audit_tables = [r["table_name"].lower() for r in raw_data.rows]
        for t in table.column_names:
            if f" {table.schema_name}.{t} ".lower() in query_str and t not in audit_tables:
                used_list.append(f" - {t} (HAS NOT UPDATED IN LAST 30 DAYS)")

        mk.extend(
            [
                f"SAVE {mavis.human_format(save_rows)} rows",
                "### Stop Syncing",
                "\n".join(remove_list),
                "",
                "### MISSING",
                "\n".join(add_list),
                "\n<br>\n",
                "",
                "### USED",
                "\n".join(used_list),
                "\n<br>\n",
            ]
        )

    return [dict(type="markdown", value="\n\n".join(mk))]


def get_audit_table(mavis: Mavis, s):
    qm = mavis.qm
    query = qm.Query()
    query.add_column(qm.Column(table_column="table", table_alias="s", name_alias="table_name"))
    query.add_column(
        qm.Column(
            function="max",
            fields=dict(column=qm.Column(table_column="done", table_alias="s")),
            name_alias="last_updated",
        )
    )
    query.add_column(
        qm.Column(
            function="sum",
            fields=dict(column=qm.Column(table_column="rows_updated_or_inserted", table_alias="s")),
            name_alias="rows_upserted",
        )
    )

    query.set_from(qm.Table(schema=s, table="fivetran_audit", alias="s"))
    query.set_where(
        qm.Condition(
            operator="greater_than",
            left=qm.Column(table_column="update_started", table_alias="s"),
            right=qm.Column(
                function="date_add",
                fields=dict(
                    datepart="day",
                    number=-30,
                    column=qm.Column(function="now", fields=dict()),
                ),
            ),
        )
    )

    query.add_group_by(1)
    query.add_order_by(query.columns[-1], asc=False)

    return mavis.run_query(query.to_query(), within_minutes=None)
