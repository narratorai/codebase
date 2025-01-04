from collections.abc import Callable

from batch_jobs.task_manager import task_manager
from core.api.customer_facing.utils.decorator import ensure_company, require_admin
from core.api.customer_facing.utils.pydantic import GraphTask
from core.errors import TaskPendingError
from core.graph import graph_client
from core.graph.sync_client.enums import task_execution_status_enum
from core.models.company import query_graph_company
from core.models.ids import UUIDStr
from core.models.time import second_diff, unix_time, utcnow
from core.utils import _fix_cron, average

from ..utils import BasicHandler, QueryBuilder, Updator
from .models import CATEGORY_MAP, MAT_KIND_MAPPING, STATUS_MAP, status_enum, task_kind_enum, warning_enum


class BasicTaskHandler(BasicHandler):
    @property
    def related_key(self):
        return "task"

    @property
    def index_name(self):
        return "task"

    @property
    def index_properties(self):
        return {
            "id": {"type": "keyword"},
            # permission fields
            "company_slug": {"type": "keyword"},
            # Fields Used for Search
            "slug": {"type": "keyword"},
            "name": {"type": "text"},
            "type": {"type": "keyword"},
            "category": {"type": "keyword"},
            "related_details": {"type": "text"},
            "internal_only": {"type": "boolean"},
        }


class TaskQueryBuilder(BasicTaskHandler, QueryBuilder):
    @property
    def search_fields(self):
        return ["name^2", "*related_details", "external_link"]

    @property
    def filter_fields(self):
        return ["type", "category", "last_run_failed", "internal_only"]

    @property
    def sort_by(self) -> list[tuple]:
        return [("category", "asc"), ("slug", "asc")]

    def pre_process_filters(self):
        if self.filters.get("last_run_failed"):
            self.filters["ids"] = [
                r.id
                for r in graph_client.get_company_tasks(company_id=self.user.company_id).company_task
                if r.executions and r.executions[0].status == task_execution_status_enum.failed
            ]
            self.filters.pop("last_run_failed")

        if not self.user.is_internal_admin:
            self.filters["internal_only"] = True

    def get_graph_data(self, ids: list[UUIDStr]) -> list[dict]:
        return [t.dict() for t in graph_client.get_tasks(ids=ids).company_task]

    def combine_search_and_graph_data(self, search_result: dict, graph_data: list[dict] | None):
        row = next((g for g in graph_data if g.get("id") == search_result["id"]), None)
        if not row:
            return None

        (kind, _, internal_link) = _get_details(row)
        output = dict(
            id=row["id"],
            slug=row["task_slug"],
            name=row["label"],
            schedule=row["schedule"],
            category=CATEGORY_MAP[row["category"]],
            kind=kind,
            internal_link=internal_link,
            external_link=(
                row["dataset_materializations"][0]["external_link"] if row["dataset_materializations"] else None
            ),
            recent_runs=[
                dict(
                    id=e["id"],
                    status=STATUS_MAP[e["status"]],
                    duration_seconds=second_diff(e["started_at"], e["completed_at"]),
                    created_at=e["started_at"],
                    completed_at=e["completed_at"],
                    error=e["details"].get("error"),
                )
                for e in row["executions"]
            ],
            success_rate=(
                (len([e for e in row["executions"] if e["status"] == "success"]) / len(row["executions"]))
                if row["executions"]
                else None
            ),
            avg_duration_seconds=average(
                [second_diff(e["started_at"], e["completed_at"]) for e in row["executions"] if e["status"] == "success"]
            ),
            last_run_status=(
                STATUS_MAP[row["executions"][0]["status"]] if row["executions"] else status_enum.never_run
            ),
        )
        if (
            row["executions"]
            and row["executions"][0]["status"] == status_enum.running
            and row["executions"][0]["details"].get("running_query")
        ):
            details = row["executions"][0]["details"]
            duration_seconds = second_diff(details.get("ran_at"))

            if duration_seconds > 60 * 60:
                warning = warning_enum.alarm
            elif duration_seconds > max((output["avg_duration_seconds"] or 0) / 10, 60 * 10):
                warning = warning_enum.slow
            else:
                warning = warning_enum.normal

            output["running_query"] = dict(
                sql=details["running_query"],
                warning=warning,
                duration_seconds=duration_seconds,
            )
        return output


class TaskUpdator(BasicTaskHandler, Updator):
    def get(self, id: UUIDStr):
        return graph_client.get_full_task(id=id).company_task_by_pk

    def get_search_data(self, id: UUIDStr):
        task = self.get(id).dict()
        (kind, related_details, _) = _get_details(task)
        return dict(
            id=task["id"],
            slug=task["task_slug"],
            name=task["label"],
            schedule=task["schedule"],
            category=CATEGORY_MAP[task["category"]],
            internal_only=task["internal_only"],
            type=kind,
            related_details=related_details,
        )


class TaskManager(TaskUpdator):
    @ensure_company
    def create(
        self,
        batch_function: Callable,
        schedule: str,
        task_slug: str,
        label: str | None = None,
        category=None,
        description=None,
        update_db_table=None,
        update_db_id=None,
        internal_only=False,
        task_fields=None,
    ):
        """
        Schedules executions of the materialize_dataset task.
        It will schedule the task to run in the company's timezone.
        """
        task_id = task_manager.create(
            company_id=self.company.id,
            slug=task_slug,
            category=category,
            label=label,
            description=description,
            fn=batch_function,
            kwargs=dict(company_slug=self.company.slug) | (task_fields or {}),
            schedule=_fix_cron(schedule),
            timezone=self.company.timezone,
            internal_only=internal_only,
        )

        # Update the graph object with the task
        if update_db_table and update_db_id:
            graph_client.execute(
                """
                mutation UpdateObjWithTask( $id: uuid! $task_id: uuid!) {
                    update_%s_by_pk(
                        pk_columns: { id: $id }
                        _set: { task_id: $task_id }
                    ) {
                        id
                    }
                }
                """
                % update_db_table,
                dict(id=update_db_id, task_id=task_id),
            )

        self.resync_id(task_id)
        return GraphTask(id=task_id, label=label or task_slug, schedule=schedule)

    def delete(self, id: str):
        task_manager.delete(id)
        self.delete_id(id)

    @require_admin
    def cancel_task_execution(self, id: str):
        graph_client.update_execution_status(id, status=task_execution_status_enum.cancelling)

        orchestration_id = task_manager.cancel(id, self.user.id)
        if not orchestration_id:
            raise TaskPendingError(
                message="Task is not running.",
                code="TaskNotFound",
                http_status_code=404,
            )

    @require_admin
    def update_batch_halt(self, batch_halt: bool):
        graph_client.update_company_batch_halt(
            id=self.user.company.id,
            user_id=self.user.id,
            batch_halt=batch_halt,
        )
        query_graph_company(self.user.company_slug, refresh_cache=True)

    @ensure_company
    def update_properties(self, id: UUIDStr, schedule: str, label: str | None = None):
        task_manager.update_schedule(id, _fix_cron(schedule), self.company.timezone)
        self.update_search_data(id, dict(schedule=schedule))


def _get_details(row: dict) -> tuple[task_kind_enum, list[str], str | None]:
    internal_link = None
    kind = task_kind_enum.other
    related_details = []

    if row["narratives"]:
        n = row["narratives"][0]
        if n["type"] == "dashboard":
            kind = task_kind_enum.dashboard
            internal_link = f"/dashboards/{n['id']}"
        else:
            internal_link = f"/docs/{n['id']}"
            kind = task_kind_enum.doc
        related_details.extend([n["name"], n["id"]])

    if row["dataset_materializations"]:
        d = row["dataset_materializations"][0]
        internal_link = f"/datasets/edit/{d['dataset']['slug']}"
        if d["type"] == "materialized_view":
            if d["column_id"]:
                kind = task_kind_enum.incremental_materialized_view
            else:
                kind = task_kind_enum.materialized_view

        if d["type"] in MAT_KIND_MAPPING:
            kind = MAT_KIND_MAPPING[d["type"]]

        related_details.extend([d["label"], d["external_link"], d["dataset"]["name"], d["dataset"]["id"]])

    # if row["company_query_alerts"]:
    #     d = row["company_query_alerts"][0]
    #     internal_link = f"/transformations/edit/{d['sql_query']['related_transformation']['id']}/validations"
    #     related_details.append(d["sql_query"]["related_transformation"]["name"])

    if row["task_slug"].startswith("run_transformation") or row["task_slug"] == "reconcile_stream_processing":
        kind = task_kind_enum.transformation_updates
    elif row["task_slug"] in ("run_data_diagnostics", "vacuum_tables"):
        kind = task_kind_enum.data_quality

    return (kind, related_details, internal_link)


def trace_time(time, seconds):
    return int(unix_time(time or utcnow()) + seconds)
