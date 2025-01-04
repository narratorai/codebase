from enum import StrEnum

from core.graph.sync_client.enums import company_task_category_enum, task_execution_status_enum
from core.models.ids import UUIDStr

from ..utils.pydantic import CamelModel, SearchParams


class caetgory_type_enum(StrEnum):
    data_processing = "data_processing"
    integration = "integration"
    reports = "reports"
    alerts = "alerts"


CATEGORY_MAP = {
    company_task_category_enum.processing: caetgory_type_enum.data_processing,
    company_task_category_enum.materializations: caetgory_type_enum.integration,
    company_task_category_enum.narratives: caetgory_type_enum.reports,
    company_task_category_enum.alerts: caetgory_type_enum.alerts,
}


class task_kind_enum(StrEnum):
    transformation_updates = "transformation_updates"
    data_quality = "data_quality"
    dashboard = "dashboard"
    doc = "doc"
    other = "other"
    google_sheets = "google_sheets"
    materialized_view = "materialized_view"
    incremental_materialized_view = "incremental_materialized_view"
    webhook = "webhook"
    view = "view"
    postmark = "postmark"
    send_text = "send_text"
    klaviyo_or_sendgrid = "klaviyo_or_sendgrid"
    email_csv = "email_csv"


MAT_KIND_MAPPING = {
    "gsheets": task_kind_enum.google_sheets,
    "webhook": task_kind_enum.webhook,
    "view": task_kind_enum.view,
    "postmark": task_kind_enum.postmark,
    "text": task_kind_enum.send_text,
    "klaviyo": task_kind_enum.klaviyo_or_sendgrid,
    "email": task_kind_enum.email_csv,
}


class status_enum(StrEnum):
    success = "success"
    failed = "failed"
    running = "running"
    cancelled = "cancelled"
    cancelling = "cancelling"
    never_run = "never_run"


STATUS_MAP = {
    task_execution_status_enum.complete: status_enum.success,
    task_execution_status_enum.failed: status_enum.failed,
    task_execution_status_enum.pending: status_enum.running,
    task_execution_status_enum.cancelled: status_enum.cancelled,
    task_execution_status_enum.cancelling: status_enum.cancelling,
}


class warning_enum(StrEnum):
    normal = "normal"
    slow = "slow"
    alarm = "alarm"


class QueryParams(SearchParams):
    category: caetgory_type_enum | None = None
    last_run_failed: bool | None = None


class TaskScheduleInput(CamelModel):
    label: str
    schedule: str


class GetTaskDebugDetails(CamelModel):
    task_id: str
    execution_id: str
    function_name: str
    function_path: str
    used_args: str
    orchestration_id: str
    error: str | None
    trace_id: str | None
    honycomb_link: str | None


class RecentRun(CamelModel):
    id: UUIDStr
    status: status_enum
    duration_seconds: float
    created_at: str
    completed_at: str | None
    error: str | None


class RunningQuery(CamelModel):
    sql: str
    warning: warning_enum
    duration_seconds: float


class TaskOutput(CamelModel):
    id: UUIDStr
    slug: str
    name: str
    category: caetgory_type_enum
    kind: task_kind_enum
    schedule: str
    external_link: str | None
    internal_link: str | None

    recent_runs: list[RecentRun]
    success_rate: float | None
    avg_duration_seconds: float | None
    last_run_status: status_enum
    running_query: RunningQuery | None


class GetTaskOutput(CamelModel):
    total_count: int
    page: int
    per_page: int
    data: list[TaskOutput]

    class Config:
        schema_extra = {
            "examples": [
                {
                    "totalCount": 1,
                    "page": 1,
                    "perPage": 1,
                    "data": [
                        {
                            "id": "db0daaa9-e7bf-4e62-9c5e-392cb193036d",
                            "name": "Run Transformations",
                            "slug": "run_transformations",
                            "category": "data_processing",
                            "kind": "transformation_updates",
                            "schedule": "5 1 * * *",
                            "external_link": "https://app.mode.com/...",
                            "internal_link": "/tasks/run_transformations",
                            "recentRuns": [
                                {
                                    "id": "db0daaa9-e7bf-4e62-9c5e-392cb193036d",
                                    "status": "success",
                                    "durationSeconds": 10,
                                    "createdAt": "2021-09-28T00:00:00Z",
                                    "CompletedAt": "2021-09-28T00:00:00Z",
                                }
                            ],
                            "SuccessRate": 0.34,
                            "AvgDurationSeconds": 10,
                            "last_run_status": "success",
                            "running_query": None,
                        }
                    ],
                }
            ]
        }
