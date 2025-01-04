import contextlib
import logging

import sentry_sdk
import structlog
from structlog.contextvars import merge_contextvars
from structlog.dev import ConsoleRenderer
from structlog.processors import (
    CallsiteParameterAdder,
    JSONRenderer,
    StackInfoRenderer,
    TimeStamper,
    UnicodeDecoder,
    dict_tracebacks,
)
from structlog.stdlib import (
    ExtraAdder,
    PositionalArgumentsFormatter,
    ProcessorFormatter,
    add_log_level,
)
from structlog.types import EventDict

from core.models.settings import settings
from core.utils import TRACE_FIELDS, sanitize_event, without_keys


def sanitize_log_event(_logger, method_name, event_dict):
    return sanitize_event(event_dict)


def drop_color_message_key(_, __, event_dict: EventDict) -> EventDict:
    """
    Uvicorn logs the message a second time in the extra `color_message`, but we don't
    need it. This processor drops the key from the event dict if it exists.
    """
    event_dict.pop("color_message", None)
    return event_dict


def record_sentry_breadcrumb(_logger, method_name, event_dict):
    initial_logger_keys = set()

    with contextlib.suppress(Exception):
        initial_logger_keys = structlog.get_context(_logger).keys()

    sentry_sdk.add_breadcrumb(
        category="logger",
        message=event_dict.get("event"),
        level=method_name,
        data=without_keys(
            event_dict,
            ({"event", "level", "timestamp"} | TRACE_FIELDS | initial_logger_keys),
        ),
    )

    return event_dict


def configure_logging():
    use_console_renderer = settings.is_local
    render_processor = get_render_processor(use_console_renderer)

    # Using INFO for less verbose logging in all environments, the root logger will handle filtering
    reset_logging_loggers(logging.INFO)

    shared_processors = [
        add_log_level,
        merge_contextvars,
        ExtraAdder(),
        TimeStamper(fmt="iso"),
        UnicodeDecoder(),  # convert bytes to str
        sanitize_log_event,
        drop_color_message_key,
        (CallsiteParameterAdder({}) if use_console_renderer else dict_tracebacks),
    ]

    structlog.configure(
        cache_logger_on_first_use=True,
        processors=(
            *shared_processors,
            StackInfoRenderer(),
            PositionalArgumentsFormatter(),
            record_sentry_breadcrumb,
            render_processor,
        ),
        wrapper_class=structlog.make_filtering_bound_logger(settings.log_level),
    )

    # Enable structlog-based formatters within the logging module
    struclog_formatter = ProcessorFormatter(
        foreign_pre_chain=shared_processors,
        processors=[
            ProcessorFormatter.remove_processors_meta,
            render_processor,
        ],
    )
    handler = logging.StreamHandler()
    handler.setFormatter(struclog_formatter)

    # Set the root logger to use the structlog handler
    root_logger = logging.getLogger()
    root_logger.addHandler(handler)
    root_logger.setLevel(settings.log_level)

    # Set unloaded loggers to use the structlog handler
    logging.basicConfig(level=settings.log_level, handlers=[handler])


def reset_logging_loggers(log_level: int):
    """
    Reset the logging handlers for uvicorn, httpx and others to control the flow of log messages.

    Some loggers are set to propagate, meaning their log messages will be caught by the root logger
    and formatted correctly.

    Others are set to not propagate, preventing its log messages from being caught by the root logger.
    This effectively silences the log.
    """
    for logger_name in logging.Logger.manager.loggerDict.keys() | ["httpx"]:
        propagate = logger_name not in {"uvicorn.access"}

        logger = logging.getLogger(logger_name)
        logger.handlers.clear()
        logger.setLevel(log_level)
        logger.propagate = propagate


def get_render_processor(use_console_renderer: bool):
    exception_formatter = structlog.dev.RichTracebackFormatter(show_locals=False, max_frames=8)
    return (
        ConsoleRenderer(colors=True, exception_formatter=exception_formatter)
        if use_console_renderer
        else JSONRenderer()
    )


def set_contextvars(**kwargs):
    """
    Put keys and values into the structlog context-local context.
    """

    return structlog.contextvars.bind_contextvars(**kwargs)


def reset_contextvars():
    """
    Clear the structlog context-local context.
    """
    structlog.contextvars.clear_contextvars()


# convenience
get_logger = structlog.get_logger
