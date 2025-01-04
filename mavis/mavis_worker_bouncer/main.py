from datetime import datetime, timedelta
from typing import List

import pytz
from croniter import croniter
from sentry_sdk import capture_message

from core.graph import graph_client
from core.graph.sync_client.get_all_tasks_processing_no_batch_halt import (
    GetAllTasksProcessingNoBatchHaltTasks,
    GetAllTasksProcessingNoBatchHaltTasksExecutions,
)
from core.logger import get_logger
from core.models.settings import settings
from core.util.opentelemetry import configure as configure_opentelemetry
from core.util.sentry import configure as configure_sentry
from core.utils import _fix_cron
from kubernetes import client, config

logger = get_logger()


def local_time(d: datetime):
    if d.tzinfo:
        return d
    timezone = "US/Eastern" if settings.datacenter_region == "US" else "Europe/Paris"
    return pytz.timezone(timezone).localize(d)


def last_supposed_schedule_time_min(tasks: List[GetAllTasksProcessingNoBatchHaltTasks], base: datetime):
    def get_created_at(
        executions: list[GetAllTasksProcessingNoBatchHaltTasksExecutions],
    ):
        for e in executions:
            try:
                return datetime.fromisoformat(e.created_at)
            except:  # noqa: E722, S110, B001
                pass
        raise ValueError(f"No valid schedule or created_at found for task {task.id}")

    res = local_time(datetime.max - timedelta(days=1))
    for task in tasks:
        schedule = task.schedule
        if not croniter.is_valid(task.schedule):
            created_at = get_created_at(task.executions)
            schedule = _fix_cron(task.schedule, created_at)
        last_supposed_scheduled = last_supposed_schedule_time(schedule, base)
        res = min(res, last_supposed_scheduled)
    return res


def last_supposed_schedule_time(cron_schedule, base):
    return local_time(croniter(cron_schedule, base).get_prev(datetime))


def worker_is_stuck(
    tasks: List[GetAllTasksProcessingNoBatchHaltTasks],
    last_supposed_scheduled_min: datetime,
    now=local_time(datetime.now()),
):
    thirty_minutes_ago = local_time(now - timedelta(minutes=30))
    for task in tasks:
        for execution in task.executions:
            started_at = local_time(datetime.fromisoformat(execution.started_at))
            if started_at > last_supposed_scheduled_min or started_at > thirty_minutes_ago:
                return False
    return True


def delete_mavis_worker():
    try:
        config.load_incluster_config()
        v1 = client.CoreV1Api()
        namespace = "backend"
        ret = v1.list_namespaced_pod(watch=False, namespace=namespace)
        for i in ret.items:
            if "mavis-worker-deployment" in i.metadata.name:
                logger.info(f"deleting {i.metadata.name}")
                capture_message(f"mavis-worker-bouncer deleting worker pod {i.metadata.name}")
                v1.delete_namespaced_pod(name=i.metadata.name, namespace=namespace)
    except client.exceptions.ApiException as e:
        if e.reason != "Not Found":
            raise e


def main():
    try:
        now = local_time(datetime.now())
        tasks = graph_client.get_all_tasks_processing_no_batch_halt(datacenter_region=settings.datacenter_region).tasks

        max_datetime = local_time(datetime.max - timedelta(days=1))
        last_supposed_scheduled_min = local_time(last_supposed_schedule_time_min(tasks, now))

        if worker_is_stuck(tasks, last_supposed_scheduled_min) and last_supposed_scheduled_min != max_datetime:
            delete_mavis_worker()
        else:
            logger.info("worker operating as expected")
    except Exception as e:
        logger.error(e)


if __name__ == "__main__":
    configure_opentelemetry("mavis-worker-bouncer")
    configure_sentry()
    main()
