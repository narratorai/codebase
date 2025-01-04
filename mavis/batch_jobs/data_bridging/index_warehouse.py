import datetime as dt

from core.decorators import mutex_task, with_mavis
from core.logger import get_logger
from core.v4.mavis import Mavis

logger = get_logger()


def valid_column(c):
    return c["type"] in ("string", "boolean", None, "text") and not (
        c["name"] in ("id", "uuid", "link")
        or c["name"].endswith("_id")
        or c["name"].endswith("_ts")
        or c["name"].endswith("_at")
    )


def create_feature_array(data, col):
    # null it out of there is no data
    if len(data["rows"]) == 0:
        return None

    # creates the feature array from the dataset
    total = max(sum(row["total_rows"] for row in data["rows"]), 1)
    return [
        dict(
            value=row[col],
            total_rows=row["total_rows"],
            percent_of_total=row["total_rows"] / total,
        )
        for row in data["rows"]
    ]


def get_top_table_column_query(company, mavis, col, schema, table, is_valid=True):
    # created a query
    qm = mavis.qm
    query = qm.Query()

    if is_valid:
        query.add_column(qm.Column(table_column=col, table_alias="s"))
    else:
        query.add_column(
            qm.Column(
                case=dict(
                    cases=[
                        dict(
                            when=qm.Condition(
                                operator="is_null",
                                left=qm.Column(table_column=col, table_alias="s"),
                            ),
                            then=qm.Column(value="is_null"),
                        )
                    ],
                    else_value=qm.Column(value="not_null"),
                ),
                name_alias=col,
            )
        )

    query.add_column(qm.Column(function="count_all", fields=dict(), name_alias="total_rows"))
    query.set_from(qm.Table(schema=schema, table=table, alias="s"))
    query.add_group_by([1])
    query.add_order_by(2, asc=False)

    query.set_limit(mavis.config.index_warehouse_count or 100)

    return query


def index_table(company, mavis, schema, table):
    """
    Index a table
    """
    qm = mavis.qm
    obj_path = ["indexes", "warehouse", schema, f"{table}.json"]
    table_obj = dict(schema=schema, table=table, columns=[])

    # get a sample of the data for type
    sample_query = qm.Query()
    sample_query.add_column(qm.Column(all_columns=True))
    sample_query.set_from(qm.Table(schema=schema, table=table))
    sample_query.set_limit(100)

    # run the data
    try:
        sample_data = mavis.run_query(sample_query.to_query(), within_minutes=60 * 6)
    except Exception as e:
        logger.error("Failed to access", schema=schema, table=table, exc_info=e)
        return None

    # process the columns
    for c in sample_data["columns"]:
        logger.debug("Indexing ", schema=schema, table=table, column=c["name"], type=c["type"])

        # get the query
        top_value_query = get_top_table_column_query(company, mavis, c["name"], schema, table, valid_column(c))

        try:
            # kept he cache for 60 minutes
            data = mavis.run_query(top_value_query.to_query(), within_minutes=60 * 6)
            # add the object
            c["values"] = create_feature_array(data, c["name"])
        except Exception:
            logger.exception("Failed to run query")
            c["values"] = []

        # columns
        table_obj["columns"].append(c)

    logger.info("Uploading object")
    mavis.upload_object(table_obj, obj_path)


def check_valid_table(schema, t):
    valid_schema = schema not in ("looker_scratch")
    valid_table = all(a not in t for a in ("_deprecated", "_old"))
    return valid_schema and valid_table


def clean_old_tables(mavis: Mavis, warehouse_schema: str):
    all_tables = mavis.get_all_tables(warehouse_schema)
    for t in all_tables:
        if t.startswith("temp_"):
            mavis.run_query(mavis.qm.get_drop_table_query(mavis.qm.Table(schema=warehouse_schema, table=t)))


@mutex_task()
@with_mavis
def index_warehouse(mavis: Mavis, reindex_all=False, **kwargs):
    """
    UPDATE_ACTIVITY_STREAM: updates the data for the activity stream
    """
    company = mavis.company
    clean_old_tables(mavis, company.warehouse_schema)

    # kill all long running queries
    # mavis.kill_query(all_queries=True, max_minutes=180)

    # create an object that is indexted
    indexed_objects = {}
    for a in mavis.list_all_files(["indexes", "warehouse"]):
        if a["last_modified_at"] > (dt.datetime.now(dt.UTC) - dt.timedelta(days=60)).isoformat():
            parts = a["key"].split("/")
            s = indexed_objects[parts[-2]] = indexed_objects.get(parts[-2], [])
            s.append(parts[-1][:-5])

    # index tables
    warehouse_schema = mavis.get_warehouse_schema(nested=True)
    for schema, tables in warehouse_schema.items():
        # index the table
        for t in tables:
            if check_valid_table(schema, t) and reindex_all or t not in indexed_objects.get(schema, []):
                index_table(company, mavis, schema, t)
