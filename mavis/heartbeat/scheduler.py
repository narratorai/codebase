import json
from collections.abc import Callable

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from pytz import UnknownTimeZoneError

from core.graph.sync_client import GetAllCompanyTasksCompanyTasks
from core.logger import get_logger
from core.models.settings import settings

from .helpers import get_tz_adjusted_cron, import_function

local_scheduler = BackgroundScheduler(timezone="UTC")
"""
DO NOT IMPORT. It should run in the heartbeat process only.
APScheduler does not coordinate state between multiple processes.
"""

logger = get_logger()


def restore_task(task: GetAllCompanyTasksCompanyTasks, company_slug: str, tz: str):
    """
    Restores a task from the database. Injects the task_id and company_slug into the kwargs.
    """
    if not task.function_name or not task.function_path:
        logger.warning(
            "Missing function or path",
            task_id=task.id,
            company_slug=company_slug,
            fn=task.function_name,
        )
        return False
    if settings.is_local:
        logger.debug(
            "Task skipped",
            task_id=task.id,
            company_slug=company_slug,
            fn=task.function_name,
        )
        return False

    try:
        function = import_function(task.function_name, task.function_path)
        trigger = get_tz_adjusted_cron(task.schedule, tz, task.created_at)
        kwargs = dict(company_slug=company_slug) | (json.loads(task.kwargs or "{}"))

        add_job(task.id, trigger, fn=function.send, kwargs=kwargs)

    except UnknownTimeZoneError:
        logger.error("Invalid timezone", task_id=task.id, tz=tz)
    except Exception as e:
        logger.exception(e)


def add_job(id: str, trigger: CronTrigger, fn: Callable, kwargs: dict):
    """
    Adds a job to the scheduler. If the job already exists, it will be updated.
    """
    kwargs = {"task_id": id} | kwargs

    try:
        if job := local_scheduler.get_job(id):
            job.modify(func=fn, trigger=trigger, kwargs=kwargs)
            logger.debug("Job updated", task_id=id, kwargs=kwargs, trigger=trigger)
        else:
            job = local_scheduler.add_job(id=id, func=fn, trigger=trigger, kwargs=kwargs, replace_existing=True)
            logger.debug("Job added", task_id=id, kwargs=kwargs, trigger=trigger)

        return job
    except Exception as e:
        logger.exception(e)
