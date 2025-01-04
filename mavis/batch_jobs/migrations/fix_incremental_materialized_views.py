from core.api.customer_facing.datasets.utils import DatasetManager
from core.decorators import with_mavis
from core.graph import graph_client
from core.logger import get_logger
from core.v4.dataset_comp.integrations.model import (
    MaterializationTypeEnum,
)
from core.v4.dataset_comp.integrations.processors.materialize_view import (
    MaterializeView,
)
from core.v4.mavis import Mavis

logger = get_logger()


# def fix_mat_overlap(mavis, mat, mat_att):
#     qm = mavis.qm
#     if not mat_att.get("column_id"):
#         return None

#     # (dataset_obj, name) = prepare_dataset(mavis, mat)
#     dataset_obj = None
#     name = None
#     dataset.ds.generate_query(dataset_obj["query"], mat.group_slug, limit=None)
#     table = mavis.qm.Table(
#         schema=mavis.company.materialize_schema, table="mv_" + name, alias="k"
#     )
#     ts_col = dataset.ds.column_mapper[mat_att.get("column_id")]

#     # run the delete
#     delete_query = qm.get_delete_query(
#         table,
#         qm.Condition(
#             operator="greater_than",
#             left=qm.Column(table_column=ts_col),
#             right=qm.Column(value=utils.date_add(utils.utcnow(), "day", -14)),
#         ),
#     )

#     mavis.run_query(delete_query)

#     # this give the underlying table
#     raw_query = qm.get_count_query(
#         table, by_column=["_run_at"], extra_functions=[f"max.{ts_col}", f"min.{ts_col}"]
#     )

#     new_query = qm.wrap_query(raw_query)
#     new_query.add_column(
#         qm.Column(
#             function="lag_all",
#             fields=dict(
#                 column=qm.Column(table_column=f"max_{ts_col}"),
#                 order=qm.Column(table_column="_run_at"),
#             ),
#             name_alias=f"last_max_{ts_col}",
#         )
#     )
#     new_query = qm.wrap_query(new_query)
#     new_query.add_filter(
#         qm.Condition(
#             operator="less_than_equal",
#             left=qm.Column(table_column=f"min_{ts_col}"),
#             right=qm.Column(table_column=f"last_max_{ts_col}"),
#         )
#     )

#     # check if it is even worth to run it
#     data = mavis.run_query(new_query.to_query())

#     if not data["rows"]:
#         return None

#     final_query = qm.Query()
#     final_query.make_distinct()
#     final_query.set_from(table)
#     final_query.add_column(
#         qm.Column(
#             function="concat",
#             fields=dict(
#                 first_column=qm.Column(table_column="_run_at", table_alias="k"),
#                 second_column=qm.Column(table_column=ts_col, table_alias="k"),
#             ),
#         )
#     )
#     final_query.add_join(
#         qm.Join(
#             table=qm.Table(query=new_query, alias="r"),
#             kind="INNER",
#             condition=qm.Filter(
#                 filters=[
#                     qm.Condition(
#                         operator="equal",
#                         left=qm.Column(table_column="_run_at", table_alias="k"),
#                         right=qm.Column(table_column="_run_at", table_alias="r"),
#                     ),
#                     "AND",
#                     qm.Condition(
#                         operator="greater_than_equal",
#                         left=qm.Column(table_column=ts_col, table_alias="k"),
#                         right=qm.Column(table_column=f"min_{ts_col}", table_alias="r"),
#                     ),
#                     "AND",
#                     qm.Condition(
#                         operator="less_than_equal",
#                         left=qm.Column(table_column=ts_col, table_alias="k"),
#                         right=qm.Column(
#                             table_column=f"last_max_{ts_col}", table_alias="r"
#                         ),
#                     ),
#                 ]
#             ),
#         )
#     )

#     second_delete_query = qm.get_delete_query(
#         table,
#         qm.Condition(
#             operator="is_in",
#             left=qm.Column(
#                 function="concat",
#                 fields=dict(
#                     first_column=qm.Column(table_column="_run_at"),
#                     second_column=qm.Column(table_column=ts_col),
#                 ),
#             ),
#             right=final_query,
#         ),
#     )

#     mavis.run_query(second_delete_query)


# def find_duplicated_mv(mavis, mat, mat_att):
#     qm = mavis.qm
#     if not mat_att.get("column_id"):
#         return None

#     # (dataset_obj, name) = prepare_dataset(mavis, mat)
#     dataset_obj = None
#     name = None
#     dataset.ds.generate_query(dataset_obj["query"], mat.group_slug, limit=None)
#     table = mavis.qm.Table(
#         schema=mavis.company.materialize_schema, table="mv_" + name, alias="k"
#     )
#     ts_col = dataset.ds.column_mapper[mat_att.get("column_id")]

#     # this give the underlying table
#     raw_query = qm.get_count_query(
#         table, by_column=["_run_at"], extra_functions=[f"max.{ts_col}", f"min.{ts_col}"]
#     )

#     new_query = qm.wrap_query(raw_query)
#     new_query.add_column(
#         qm.Column(
#             function="lag_all",
#             fields=dict(
#                 column=qm.Column(table_column=f"max_{ts_col}"),
#                 order=qm.Column(table_column="_run_at"),
#             ),
#             name_alias=f"last_max_{ts_col}",
#         )
#     )
#     new_query = qm.wrap_query(new_query)
#     new_query.add_filter(
#         qm.Condition(
#             operator="less_than_equal",
#             left=qm.Column(table_column=f"min_{ts_col}"),
#             right=qm.Column(table_column=f"last_max_{ts_col}"),
#         )
#     )

#     # check if it is even worth to run it
#     data = mavis.run_query(new_query.to_query())

#     if not data["rows"]:
#         return None

#     first_duplication = min([row[f"min_{ts_col}"] for row in data["rows"]])

#     # run the delete
#     delete_query = qm.get_delete_query(
#         table,
#         qm.Condition(
#             operator="greater_than_equal",
#             left=qm.Column(table_column=ts_col),
#             right=qm.Column(value=first_duplication),
#         ),
#     )

#     mavis.run_query(delete_query)

#     print(f"\n\nDELETED {mat.label}\n\n")

#     return None


# def delete_recent_days():
#     date = "2024-08-09"


@with_mavis
def fix_incremental_materialized_views(mavis: Mavis, **kwargs):
    """
    Gets the path of the company
    """
    company = mavis.company
    all_ids = [m for m in graph_client.get_all_materializations(company.id, "materialized_view").materializations]

    dataset_updator = DatasetManager(mavis=mavis)
    for mm in all_ids:
        materialization_id = mm.id
        materialization = dataset_updator.get_materialization(materialization_id)

        if materialization.type == MaterializationTypeEnum.materialized_view and materialization.details.column_id:
            mv = MaterializeView(mavis, materialization)
            mv.custom_task().add_task("override_days_to_resync", days_to_resync=max(90, mv.details.days_to_resync + 10))
