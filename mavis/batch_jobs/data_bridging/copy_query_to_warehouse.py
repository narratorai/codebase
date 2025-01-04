# # FOR REFERENCE ONLY

# from datetime import datetime
# import json
# import inflect

# from core.decorators import mutex_task, with_mavis
# from core.logger import get_logger
# from core.v4.mavis import Mavis

# VALID_COLS = ["updated_at", "updatedat"]
# p = inflect.engine()

# logger = get_logger()


# def find_id(table, columns):
#     tns = table.split("_")

#     col_options = [
#         "id",
#         "uuid",
#         "slug",
#         "_id",
#         tns[-1] + "_id",
#         (p.singular_noun(tns[-1]) or "") + "_id",
#         "_".join(tns) + "_id",
#         "_".join([p.singular_noun(t) or t for t in tns]) + "_id",
#         "".join([t[0] for t in tns]) + "_id",
#         "".join([t[0] for t in tns[:-1]]) + "_" + (p.singular_noun(tns[-1]) or tns[-1]) + "_id",
#         "unique_slug",
#         "zip",
#     ]

#     for c in col_options:
#         for col_name in columns:
#             if c == col_name:
#                 return c


# def copy_table(
#     mavis: Mavis,
#     data_source_id: str | None,
#     query_id: str | None,
#     to_schema: str | None,
#     to_table: str | None,
#     update_limit: int,
# ):
#     """
#     copies a query from one system to another
#     """
#     qm = mavis.qm

#     # set the table
#     qm_to_table = qm.Table(schema=to_schema, table=to_table)
#     from_query_sql = mavis.get_query(query_id)["query"]

#     # get the query columns
#     query = qm.Query()
#     query.add_column(qm.Column(all_columns=True))
#     query.set_from(qm.Table(sql=from_query_sql))
#     query.set_limit(100)
#     data = mavis.run_query(query.to_query(), within_minutes=10000, data_source_id=data_source_id)

#     # finds the updated column
#     id_column = find_id(to_table, [c["name"] for c in data["columns"]])

#     for c in data["columns"]:
#         if "updated_at" in c["name"]:
#             time_col = c["name"]
#             order_col = c["name"]
#             break
#     else:
#         order_col = id_column
#         time_col = None

#     # update the data
#     update_kind = None if id_column else "truncate"
#     min_date = None

#     logger.info(
#         "processing table",
#         table_name=to_table,
#         time_column=time_col,
#         id_column=id_column,
#         all_columns=data["columns"],
#     )

#     try:
#         redshift_query = qm.Query()
#         redshift_query.add_column(
#             qm.Column(
#                 function="max",
#                 fields=dict(column=qm.Column(table_column=time_col)),
#                 name_alias="min_date",
#             )
#         )
#         redshift_query.set_from(qm_to_table)

#         # get the max data
#         result = mavis.run_query(redshift_query.to_query())
#         min_date = result["rows"][0]["min_date"]
#     except Exception:
#         update_kind = "drop_and_create"

#         # get the table
#         query = qm.Query()
#         query.add_column(qm.Column(all_columns=True))
#         query.set_from(qm.Table(sql=from_query_sql))

#         if min_date:
#             # add filter
#             query.set_where(
#                 qm.Condition(
#                     operator="greater_than",
#                     left=qm.Column(table_column=time_col),
#                     right=qm.Column(value=min_date),
#                 )
#             )

#         # deal with the order
#         query.add_order_by(qm.Column(table_column=order_col))
#         query.set_limit(update_limit)

#         # get the data from the table
#         data = mavis.run_query(query.to_query(), data_source_id=data_source_id)

#         # sync the data
#         sync_data_to_table(mavis, data, qm_to_table, update_kind=update_kind, incremental_id=id_column)

#         new_limit = update_limit
#         offset = update_limit

#         # if the rows are at limit then insert it in order
#         while len(data["rows"]) == new_limit:
#             query.set_limit(new_limit)

#             # add filter
#             query.set_where(
#                 qm.Condition(
#                     operator="greater_than",
#                     left=qm.Column(table_column=order_col),
#                     right=qm.Column(value=data["rows"][-1][order_col]),
#                 )
#             )

#             # get the data from the table
#             data = mavis.run_query(query.to_query(), data_source_id=data_source_id, within_minutes=None)

#             # sync the data
#             sync_data_to_table(mavis, data, qm_to_table, update_kind=None, incremental_id=id_column)

#             # create an offset
#             offset += new_limit


# def sync_data_to_table(mavis, data, table, update_kind=None, incremental_id=None, add_ons=None):
#     """
#     Get the data to be synced
#     """
#     add_ons = add_ons or {}

#     # check for data
#     if len(data["rows"]) == 0:
#         logger.info("No Rows for table", table=table.table)
#         return None

#     # ensure size is correct
#     for c in data["columns"]:
#         if c["type"] == "string":
#             all_values = [len(r[c["name"]]) for r in data["rows"][:1000] if r[c["name"]]]
#             if len(all_values) > 0:
#                 val = max(all_values)
#                 if val > 250:
#                     c["type"] = "text"

#     logger.debug("Creating file")

#     # convert the data to a csv
#     if mavis.company.warehouse_language == "snowflake":
#         data_output = "\n".join(["|".join([str(row[c["name"]]) for c in data["columns"]]) for row in data["rows"]])
#         ext = ".csv"
#     else:
#         data_output = "\n".join([json.dumps(row) for row in data["rows"]])
#         ext = ".json"

#     # upload it to s3
#     upload_to = mavis.company.s3.upload_object(
#         data_output,
#         [
#             "configs",
#             "datadumps",
#             table.schema,
#             table.table,
#             datetime.now(datetime.UTC).isoformat() + ext,
#         ],
#     )

#     # initialize the query
#     copy_query = []

#     if incremental_id and update_kind not in (
#         "drop_and_create",
#         "truncate",
#     ):
#         where_filter = mavis.qm.Condition(
#             operator="is_in",
#             left=mavis.qm.Column(table_column=incremental_id),
#             right=[mavis.qm.Column(value=r[incremental_id]) for r in data["rows"]],
#         )

#         # add the column to the delete query
#         copy_query.append(mavis.qm.get_delete_query(table, where_filter))

#     # create a copy query
#     # TODO update to company.resources.s3_bucket and ensure company role has the necessary permission for a copy operation
#     copy_query.append(mavis.qm.get_copy_query(table, f"{mavis.company.resources.s3_bucket}/{upload_to}"))

#     # get the create table query
#     create_query = mavis.qm.get_create_table_query(
#         table,
#         column_dicts=data["columns"],
#         add_ons=dict(diststyle="EVEN", **add_ons),
#     )

#     # update the data
#     if update_kind == "truncate":
#         mavis.run_query([f"TRUNCATE {table.to_query()}"] + copy_query)
#     elif update_kind == "drop_and_create":
#         mavis.run_query([mavis.qm.get_drop_table_query(table), create_query] + copy_query)
#     else:
#         mavis.run_query(copy_query)


# @mutex_task()
# @with_mavis
# def copy_query_to_warehouse(
#     mavis: Mavis,
#     data_source_id: str | None = None,
#     query_id: str | None = None,
#     to_schema: str | None = None,
#     to_table: str | None = None,
#     update_limit: int = 5000,
#     **kwargs,
# ):
#     copy_table(
#         mavis,
#         data_source_id,
#         query_id,
#         to_schema,
#         to_table,
#         update_limit,
#     )
