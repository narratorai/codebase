"""
This is the entrypoint for the heartbeat worker. The heartbeat worker is responsible for running
tasks on a schedule. It doesn't run the tasks itself, but sends a message to the background worker.
"""

import asyncio
import functools
import signal

import boto3

from batch_jobs.monitor import sentry_monitor
from core.errors import SilenceError
from core.graph import graph_client
from core.logger import configure_logging, get_logger
from core.models.settings import settings
from core.util.opentelemetry import configure as configure_opentelemetry
from core.util.sentry import configure as configure_sentry

from .scheduler import local_scheduler, restore_task
from .sqs_consumer import consume_messages

sqs = boto3.client("sqs")
logger = get_logger()


def start_scheduler():
    """
    Starts the scheduler and adds all the tasks to it.
    The scheduler has in-memory state, so tasks need to be restored.
    """
    # IMPORTANT: Add the sentry monitor task to be notified if dramatiq stops processing tasks.
    local_scheduler.add_job(sentry_monitor.send, "interval", minutes=5)

    company_tasks = graph_client.get_all_company_tasks(datacenter_region=settings.datacenter_region).company

    for company in company_tasks:
        for task in company.tasks:
            restore_task(task, company.slug, company.timezone)

    local_scheduler.start()
    logger.info("Scheduler started", job_count=len(local_scheduler.get_jobs()))


def stop_scheduler():
    if local_scheduler.running:
        logger.info("Stopping scheduler", job_count=len(local_scheduler.get_jobs()))
        local_scheduler.shutdown(wait=False)


def stop(loop: asyncio.AbstractEventLoop):
    stop_scheduler()
    loop.stop()


async def main():
    loop = asyncio.get_running_loop()
    loop.add_signal_handler(signal.SIGINT, functools.partial(stop, loop))
    loop.add_signal_handler(signal.SIGTERM, functools.partial(stop, loop))

    start_scheduler()

    while True:
        try:
            consume_messages()
            await asyncio.sleep(5)
        except Exception as e:
            logger.exception(e)


if __name__ == "__main__":
    configure_logging()
    configure_sentry(ignore_errors=[SilenceError])
    configure_opentelemetry(settings.worker_otel_service_name)

    asyncio.run(main())
