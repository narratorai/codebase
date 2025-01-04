from core import utils
from core.api.customer_facing.sql.utils import WarehouseManager
from core.constants import FIVETRAN_AUDIT_EMAIL_TEMPLATE
from core.decorators import mutex_task, with_mavis
from core.graph import graph_client
from core.models.settings import settings
from core.util.email import send_email
from core.v4.mavis import Mavis

NOTIFY_ROWS = 2000


def check_fivetran(mavis: Mavis):
    transformations = graph_client.transformation_index(company_id=mavis.company.id).all_transformations

    sql_queries = []
    for t in transformations:
        pq = graph_client.get_transformation_for_production(id=t.id).transformation.production_queries

        if pq:
            sql_queries.append(pq[0].sql.replace('"', "").replace("'", "").replace("`", "").lower())

    query_str = "\n".join(sql_queries)

    last_week = utils.date_add(utils.utcnow(), "day", -7)
    warehouse_tables = WarehouseManager(mavis=mavis).get_schema(include_columns=False)

    output = []
    for schema in warehouse_tables.schemas:
        tables = warehouse_tables.tables_for(schema_name=schema)

        if not any(t for t in tables if t.lower_name == "fivetran_audit"):
            return None

        remove_list = []
        add_list = []

        save_rows = 0

        raw_data = get_audit_table(mavis, schema)

        for r in raw_data.rows:
            t = r["table_name"].lower()

            if t == "fivetran_audit":
                continue

            is_in_narrator = f" {schema}.{t} ".lower() in query_str

            if is_in_narrator and (r["last_updated"] < last_week):
                add_list.append(f' - {t} (Last updated: {mavis.human_format(r["last_updated"], "time")})')

            elif not is_in_narrator and r["last_updated"] > last_week:
                if r["rows_upserted"] > NOTIFY_ROWS:
                    remove_list.append(f" - {t} (save {mavis.human_format(r['rows_upserted'])})")
                    save_rows += r["rows_upserted"]

        # handle the missing table
        audit_tables = [r["table_name"].lower() for r in raw_data.rows]
        for t in tables:
            if f" {schema}.{t} ".lower() in query_str and t not in audit_tables:
                add_list.append(f" - {t} (HAS NOT UPDATED IN LAST 30 DAYS)")

        if remove_list or add_list:
            output.append(
                dict(
                    schema_name=schema,
                    missing=[dict(text=m) for m in add_list],
                    turn_off=[dict(text=m) for m in remove_list],
                )
            )

    # check for all the syncing
    if output:
        send_email(
            mavis.company,
            settings.data_alert_recipients,
            FIVETRAN_AUDIT_EMAIL_TEMPLATE,
            dict(output=output),
            tag="internal_email",
        )


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
                    column=qm.Column(function="now", fields={}),
                ),
            ),
        )
    )

    query.add_group_by(1)
    query.add_order_by(query.columns[-1], asc=False)

    return mavis.run_query(query.to_query(), within_minutes=None)


@mutex_task()
@with_mavis
def check_fivetran_sync(mavis: Mavis, **kwargs):
    """
    Check for fivetran syncing
    """
    # check fivetran for optimization
    check_fivetran(mavis)
