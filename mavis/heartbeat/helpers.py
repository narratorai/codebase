import importlib
from datetime import datetime as dt

from apscheduler.triggers.cron import CronTrigger
from pytz import timezone

from core.utils import _fix_cron


def import_function(function_name: str, function_path: str):
    module = importlib.import_module(function_path)
    return getattr(module, function_name)


def get_tz_adjusted_cron(schedule: str, tz: str, created_at: str | None = None):
    """
    Returns a CronTrigger with the provided schedule adjusted to the provided timezone.
    """
    if created_at:
        cron_expr = _fix_cron(schedule, dt.fromisoformat(created_at))
    else:
        cron_expr = _fix_cron(schedule)

    return CronTrigger.from_crontab(cron_expr, timezone(tz))
