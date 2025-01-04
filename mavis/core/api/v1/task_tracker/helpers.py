import json

from core.api.customer_facing.tasks.utils import TaskManager
from core.graph import graph_client
from core.logger import get_logger
from core.models.ids import UUIDStr
from core.utils import slugify
from core.v4.mavis import Mavis

logger = get_logger()


def delete_task(mavis: Mavis, task_id: UUIDStr):
    task = graph_client.get_single_task(id=task_id).company_task_by_pk

    if task is None:
        return False

    if task.category == task.category.materializations:
        try:
            mat_args = json.loads(task.kwargs or "{}")
        except json.JSONDecodeError as e:
            raise ValueError(
                "Failed to parse the materialization arguments. Therefore, the task is removed but the materialization was not deleted"
            ) from e

        if mat_args.get("materialization_id"):
            delete_materialization(mavis, mat_args["materialization_id"])

    TaskManager(mavis=mavis).delete(id=task_id)
    return True


def delete_materialization(mavis: Mavis, id: UUIDStr):
    try:
        materialization = graph_client.get_dataset_materialization(id=id).materialization

        table = mavis.qm.Table(
            schema=mavis.company.materialize_schema,
            table=f"mv_{slugify(materialization.label)}",
        )
        query = mavis.qm.get_drop_materialize_view_query(table)

        mavis.run_query(query)
    except Exception:
        logger.exception("Failed to delete the table")

    graph_client.execute(
        """
        mutation DeleteDatasetMaterialization($id: uuid!) {
            delete_dataset_materialization_by_pk(id: $id) {
                id
            }
        }
        """,
        dict(id=id),
    )
