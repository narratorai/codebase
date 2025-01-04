from core import utils
from core.errors import (
    ForbiddenError,
    SilenceError,
)
from core.graph import graph_client
from core.graph.sync_client.get_dataset import GetDatasetDatasetByPk
from core.models.ids import UUIDStr
from core.models.table import TableColumn, TableData
from core.v4.mavis import Mavis


def create_column_metric(data: TableData, col: TableColumn):
    vec = data.column_values(col)
    if col == "timestamp":
        return (
            "min_max",
            [
                dict(
                    name="Min Date",
                    value=utils.apply_function("min", vec),
                    format="date",
                ),
                dict(
                    name="Max Date",
                    value=utils.apply_function("max", vec),
                    format="date",
                ),
            ],
        )

    elif col.type in ("string", "boolean") or (
        col.type == "number" and data and all(v in (0, 1, 0.0, 1.0, None) for v in vec)
    ):
        values = dict()
        for r in data.rows:
            if r[col.field] not in values.keys():
                values[r[col.field]] = 1
            else:
                values[r[col.field]] += 1

        unique_vals = len(values.keys())
        if unique_vals <= 30:
            return (
                "distribution",
                [
                    dict(
                        name=str(a) if a is not None else "NULL",
                        value=v * 1.0 / max(1, len(data["rows"])),
                        format="percent",
                    )
                    for a, v in sorted(values.items(), key=lambda kv: kv[1], reverse=True)
                ],
            )
        else:
            return (
                "duplicates",
                [
                    dict(name=a, value=v, format="number")
                    for a, v in sorted(values.items(), key=lambda kv: kv[1], reverse=True)
                    if v > 1
                ][:200],
            )

    elif col.type == "number":
        vec.sort()

        # get the proper data for computing the data
        return (
            "percentile",
            [
                dict(
                    name="Median",
                    value=utils.apply_function("median", vec),
                    format=col.context.format,
                ),
                dict(
                    name="Average",
                    value=utils.apply_function(
                        (
                            "harmonic_mean"
                            if utils.apply_function("max", vec) <= 1 and utils.apply_function("min", vec) >= 0
                            else "average"
                        ),
                        vec,
                    ),
                    format=col.context.format,
                ),
                dict(
                    name="Total / Sum",
                    value=utils.apply_function("sum", vec),
                    format=col.context.format,
                ),
            ],
        )


def user_can_delete_dataset(mavis: Mavis, dataset):
    return (
        mavis.user.email is not None
        and dataset.user is not None
        and mavis.user.id != dataset.user.id
        and not mavis.user.is_admin
    )


def archive_dataset(mavis: Mavis, id: UUIDStr):
    """Archive a dataset and deletes its materializations."""
    d: GetDatasetDatasetByPk = graph_client.get_dataset(id=id).dataset_by_pk

    if d is None:
        return False

    if d.locked:
        raise SilenceError("This dataset cannot be deleted since it is locked, please unlock to delete")

    if user_can_delete_dataset(mavis, d):
        raise ForbiddenError(
            f"You cannot delete this dataset because you are not the owner. Please contact {d.user.email} to delete this or submit a ticket"
        )

    # Check dataset dependencies
    for n in d.dependent_narratives:
        narrative = n.narrative
        if narrative.template_id is None:
            raise SilenceError(
                f"The Narrative {narrative.name} (created by {narrative.user.email}) is using this dataset. Please delete that before deleting the dataset"
            )

    from core.api.v1.task_tracker.helpers import delete_task

    for mat in d.materializations:
        task_id = mat.company_task.id

        delete_task(mavis, task_id)

    graph_client.update_datasetstatus(id=id, status="archived")
    return True


def get_function_example(fn: dict):
    name = fn["name"]
    columns = ", ".join(__make_col(c) for c in fn["input_fields"])

    return f"{name}({columns})"


def __make_col(col: dict):
    if col["kind"] == "column":
        if len(col["data"]) == 1:
            return f"Insert {col['data'][0]} Column Name"
        else:
            return "Insert Column Name"
    elif col["kind"] == "string":
        return "'some_string'"
    elif col["kind"] == "condition":
        return "greater_than(1, 2)"
    elif col["kind"] == "constraint_list":
        return "'America/New_York'" if len(col["data"]) > 20 else "'day'"
    elif col["kind"] == "list_column":
        return "[ Column1, Column2]"
    elif col["kind"] == "float":
        return "23.2"
    elif col["kind"] == "integer":
        return "5"
    elif col["kind"] == "list":
        return "['single', 2, 4]"
    else:
        return "variable"
