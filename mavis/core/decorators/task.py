import threading
from contextlib import contextmanager
from functools import wraps

import dramatiq
import sentry_sdk
from dramatiq import Retry
from dramatiq.middleware import CurrentMessage, Shutdown, TimeLimitExceeded
from dramatiq_abort.abort_manager import Abort
from opentelemetry.trace import Span, get_current_span
from portalocker import AlreadyLocked

from core.constants import TASK_FAILURE_EMAIL_TEMPLATE, TASK_SUCCESS_EMAIL_TEMPLATE
from core.errors import MissingCompanyError
from core.graph import graph_client
from core.graph.sync_client import GraphQlClientInvalidResponseError
from core.graph.sync_client.enums import task_execution_status_enum
from core.graph.sync_client.get_last_executions import GetLastExecutionsTaskExecution
from core.logger import (
    get_logger,
    reset_contextvars,
    set_contextvars,
)
from core.models.company import query_graph_company
from core.models.ids import get_uuid
from core.models.settings import settings
from core.util.email import send_task_notification_email
from core.util.mutex import MutexFactory, create_mutex_key
from core.util.opentelemetry import (
    serialize_span_context,
    set_current_span_attributes,
    tracer,
)
from core.utils import human_format, utcnow

logger = get_logger()


class TaskExecutionNotFoundError(Exception):
    pass


def task(**kwargs):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            message_id = _get_message_id()
            thread_id = threading.get_native_id()

            reset_contextvars()

            set_contextvars(
                message_id=message_id,
                fn=fn.__name__,
                thread_id=thread_id,
                datacenter_region=settings.datacenter_region,
            )

            set_current_span_attributes(
                message_id=message_id,
                fn=fn.__name__,
                thread_id=thread_id,
                datacenter_region=settings.datacenter_region,
            )

            try:
                logger.info("Task started")
                return fn(*args, **kwargs)
            except Exception:
                logger.exception("Task failed")
                raise
            finally:
                logger.info("Task completed")

        return dramatiq.actor(wrapper, **kwargs)

    return decorator


def mutex_task(check_args=True, retry_delay: int | None = None, **kwargs):
    """
    Decorator that ensures only `limit` number of instances of a dramatiq task are running at a time.
    Subsequent calls to the task will be dropped.

    :param check_args: Whether to check the args to block future calls of the task or not
    :param limit: The number of instances of the task that can be running at a time
    :param retry_delay: The number of milliseconds to wait before retrying the task
    :return: The dramatiq actor
    :raises KeyError: If `company_slug` is not set in the kwargs

    Example usage:
    @mutex_task(check_args=True)
    def my_task(company_slug: str):
        pass
    """

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            message_id = _get_message_id()
            thread_id = threading.get_native_id()

            reset_contextvars()
            set_contextvars(
                message_id=message_id,
                fn=fn.__name__,
                thread_id=thread_id,
                datacenter_region=settings.datacenter_region,
            )
            set_current_span_attributes(
                reset=True,
                message_id=message_id,
                fn=fn.__name__,
                thread_id=thread_id,
                datacenter_region=settings.datacenter_region,
            )

            if "company_slug" not in kwargs:
                raise KeyError("company not set, call with company_slug=...")

            company = get_company(kwargs["company_slug"])
            if company is None:
                return

            key = create_mutex_key(company.slug, fn, kwargs, check_args)
            mutex = MutexFactory.create(key)
            set_contextvars(mutex_key=key)
            set_current_span_attributes(mutex_key=key)
            try:
                with mutex:
                    logger.info("Lock acquired", mutex_key=key)
                    run_task(fn, args, kwargs, company, retry_delay=retry_delay)
            except AlreadyLocked:
                logger.info(
                    "Another instance of this task is already running",
                    retry_delay=retry_delay,
                )
                raise Retry(f"rate limit exceeded for key {key}", delay=retry_delay)
            finally:
                logger.info("Lock released", mutex_key=key)

        return dramatiq.actor(wrapper, **kwargs)

    return decorator


def get_company(company_slug: str):
    set_contextvars(company_slug=company_slug)
    set_current_span_attributes(company_slug=company_slug)

    try:
        company = query_graph_company(company_slug)

        set_contextvars(company_id=company.id, warehouse_language=company.warehouse_language)
        set_current_span_attributes(company_id=company.id, warehouse_language=company.warehouse_language)
        sentry_sdk.set_context(
            "company",
            {"slug": company_slug, "warehouse_language": company.warehouse_language},
        )
    except MissingCompanyError:
        logger.warn("Company is not found")
        return None

    if not settings.is_local and company.batch_halt:
        logger.warn("Company is halted")
        return None

    if not settings.is_local and company.datacenter_region != settings.datacenter_region:
        logger.warn("Not the right region")
        return None

    return company


@tracer.start_as_current_span("batch_job")
def run_task(fn, args, kwargs, company, *, retry_delay: int | None = 30_000):
    span = get_current_span()
    message_id = _get_message_id()

    try:
        if task_id := kwargs.get("task_id"):
            set_contextvars(task_id=task_id)
            set_current_span_attributes(task_id=task_id)
            sentry_sdk.set_context("task", {"id": task_id})

            with task_execution_log(task_id, company, span):
                fn(*args, **kwargs, message_id=message_id)
        else:
            fn(*args, **kwargs, message_id=message_id)

        logger.info("Task completed")
    except Shutdown as error:
        logger.warning("Task interrupted", error=error)
        span.add_event("task_interrupted")

        # Retry the task in `retry_delay` milliseconds
        raise Retry("Task interrupted", delay=retry_delay) from error
    except Exception as error:
        logger.exception("Task failed")
        span.record_exception(error)
        raise


@contextmanager
def task_execution_log(task_id: str, company, span: Span):
    """
    Context manager that records the start and end of a task execution in the graph.
    """
    try:
        message_id = _get_message_id()
        execution = _get_task_execution(task_id, message_id=message_id)
        execution_id = execution.id

        set_contextvars(task_execution_id=execution_id)
        set_current_span_attributes(task_execution_id=execution_id)
    except (TaskExecutionNotFoundError, GraphQlClientInvalidResponseError):
        logger.critical("Task execution not found")
        raise

    try:
        yield
    except Shutdown:
        # Re-raise the error to avoid marking the task as failed when it is interrupted
        raise
    except (Abort, TimeLimitExceeded):
        logger.info("Task cancelled")
        span.add_event("task_cancelled")

        graph_client.record_task_cancelled(
            task_execution_id=execution_id,
            details={"trace_context": serialize_span_context(span)},
        )
    except Exception as error:
        graph_client.record_task_failed(
            task_execution_id=execution_id,
            details={
                "trace_context": serialize_span_context(span),
                "error": str(error),
            },
        )
        notify_task_failure(task_id, company, error, execution_id)
        raise
    else:
        graph_client.record_task_complete(
            task_execution_id=execution_id,
            details={"trace_context": serialize_span_context(span)},
        )
        notify_task_success(task_id, company, execution_id)


def _is_flipped(
    executions: list[GetLastExecutionsTaskExecution],
    current_status: task_execution_status_enum,
    execution_id: str,
) -> GetLastExecutionsTaskExecution | None:
    last_exec = next(
        (
            execution
            for execution in executions
            if execution.status in (task_execution_status_enum.failed, task_execution_status_enum.complete)
            and execution.id != execution_id
        ),
        None,
    )

    return last_exec if last_exec and last_exec.status != current_status else None


@tracer.start_as_current_span("notify_task_failure")
def notify_task_failure(task_id, company, error, execution_id):
    executions = graph_client.get_last_executions(task_id).task_execution

    if last_exec := _is_flipped(executions, task_execution_status_enum.failed, execution_id):
        # notify everyone watching this task
        all_watchers = graph_client.get_task_watchers(task_id).watcher
        task = graph_client.get_single_task(task_id).company_task_by_pk

        for watcher in all_watchers:
            template_values = {
                "task_id": task_id,
                "task_name": task.task_slug,
                "first_name": (watcher.user.company_users[0].first_name if watcher.user.company_users else None),
                "task_error": str(error),
                "task_pretty_completed_at": human_format(last_exec.completed_at, "time", company.timezone),
            }
            try:
                # TODO: Send email in the background
                send_task_notification_email(
                    TASK_FAILURE_EMAIL_TEMPLATE,
                    company,
                    template_values,
                    watcher.user.email,
                )
            except Exception:
                logger.exception("Error in notify_task_failure")


@tracer.start_as_current_span("notify_task_success")
def notify_task_success(task_id, company, execution_id):
    executions = graph_client.get_last_executions(task_id).task_execution

    if last_exec := _is_flipped(executions, task_execution_status_enum.complete, execution_id):
        # notify everyone watching this task
        all_watchers = graph_client.get_task_watchers(task_id).watcher
        task = graph_client.get_single_task(task_id).company_task_by_pk

        for watcher in all_watchers:
            template_values = {
                "task_id": task_id,
                "task_name": task.task_slug,
                "first_name": (watcher.user.company_users[0].first_name if watcher.user.company_users else None),
                "task_error": last_exec.details.get("error"),
                "task_pretty_completed_at": human_format(utcnow(), "time", company.timezone),
            }
            try:
                # TODO: Send email in the background
                send_task_notification_email(
                    TASK_SUCCESS_EMAIL_TEMPLATE,
                    company,
                    template_values,
                    watcher.user.email,
                )
            except Exception:
                logger.exception("Error in notify_task_success")


@tracer.start_as_current_span("_get_task_execution")
def _get_task_execution(task_id: str, message_id: str):
    """
    Insert a task execution in graph and return the id. It instantly records the task as running.
    If the task was interrupted, as during deployments, returns that execution instead.
    """
    execution = graph_client.insert_task_execution(
        task_id=task_id, task_orchestration_id=message_id
    ).inserted_task_execution

    if execution is not None:
        return execution
    elif running_executions := graph_client.get_running_executions(task_id).task_executions:
        current_execution = running_executions[0]
        graph_client.update_task_orchestration_id(id=current_execution.id, task_orchestration_id=message_id)
        return current_execution

    raise TaskExecutionNotFoundError


def _get_message_id():
    """
    Get the current message id from dramatiq. If the task is not running in dramatiq, return a local id.
    """
    if message := CurrentMessage.get_current_message():
        return str(message._message.message_id)
    else:
        return f"local:{get_uuid()}"
