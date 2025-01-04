from sentry_sdk.crons.decorator import monitor

from core.decorators.task import task
from core.logger import get_logger

logger = get_logger()


@task()
@monitor(monitor_slug="dramatiq-monitor")
def sentry_monitor(**kwargs):
    """
    This is a task that is run by the heartbeat every 5 minutes. Sentry will send an alert if it doesn't run.
    """
    logger.debug("Notifying sentry", fn="sentry_monitor", kwargs=kwargs)
