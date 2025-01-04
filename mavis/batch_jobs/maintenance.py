from datetime import UTC, datetime, timedelta

from core.constants import MAX_TASK_EXECUTION_SECONDS
from core.graph import graph_client
from core.logger import get_logger
from core.util.opentelemetry import set_current_span_attributes

logger = get_logger()


# @periodic_task(crontab(day="*"))
def cleanup():
    """
    Runs daily and cleans up execution history older than 90 days old
    """
    before = datetime.now(UTC) - timedelta(days=90)
    result = cleanup_execution_history(before)

    logger.info("Cleaned up execution history", before=before, result=result)
    set_current_span_attributes(before=before, result=result)


# @periodic_task(crontab(minute="*/10"))
def check_stuck():
    """
    Runs every 10 minutes, checks for stuck tasks and marks them as failed
    """
    # Query for jobs that were created X hours ago and are not in a completed or failed state
    before = datetime.now(UTC) - timedelta(seconds=MAX_TASK_EXECUTION_SECONDS)
    set_current_span_attributes(before=before)

    result = mark_tasks_stuck(before)
    execution_ids = [t.id for t in result.returning]

    logger.info(
        "Recorded stuck task executions",
        before=before,
        affected=result.affected_rows,
        task_execution_ids=execution_ids,
    )
    set_current_span_attributes(before=before, stuck_tasks_recorded=result.affected_rows)


def query_running_tasks():
    return graph_client.get_active_task_executions().task_execution


def cleanup_execution_history(before: datetime):
    result = graph_client.archive_execution_history(before=before.isoformat())
    tasks_archived = result.delete_task_execution.affected_rows

    return {"tasks_archived": tasks_archived}


def mark_tasks_stuck(before: datetime):
    return graph_client.record_tasks_stuck(before=before.isoformat()).update
