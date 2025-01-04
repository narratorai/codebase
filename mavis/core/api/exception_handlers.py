"""
FastAPI exception handlers.
See https://fastapi.tiangolo.com/tutorial/handling-errors/
"""

from enum import StrEnum

import sentry_sdk
from fastapi import status
from fastapi.exceptions import HTTPException, ResponseValidationError
from fastapi.requests import Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from core.errors import InternalError, SilenceError
from core.graph.sync_client import GraphQlClientInvalidResponseError
from core.logger import get_logger

logger = get_logger()


class ErrorCode(StrEnum):
    INTERNAL_ERROR = "InternalError"
    INVALID_REQUEST = "InvalidRequest"


def _get_exception_notes(exc: Exception):
    return getattr(exc, "__notes__", [])


async def handle_exception(request: Request, exc: Exception):
    # TODO: Use sentry's ingore_errors that were already set instead
    if not isinstance(exc, SilenceError):
        sentry_sdk.capture_exception(exc)

    message = getattr(exc, "detail", str(exc))
    message = getattr(exc, "message", message)
    notes = _get_exception_notes(exc)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "type": ErrorCode.INTERNAL_ERROR,
            "code": type(exc).__name__,
            "message": message,
            "description": notes,
        },
    )


async def handle_http_exception(request, exc: HTTPException):
    logger.exception(exc)

    notes = _get_exception_notes(exc)
    return JSONResponse(
        status_code=exc.status_code,
        headers=exc.headers,
        content={
            "type": ErrorCode.INVALID_REQUEST if exc.status_code < 500 else ErrorCode.INTERNAL_ERROR,
            "code": exc.__class__.__name__,
            "message": exc.detail,
            "description": notes,
        },
    )


async def handle_internal_error(request, exc: InternalError):
    logger.exception(exc)

    notes = _get_exception_notes(exc)
    return JSONResponse(
        status_code=exc.http_status_code,
        content={
            "type": ErrorCode.INTERNAL_ERROR,
            "code": exc.code,
            "message": exc.message,
            "description": notes,
        },
    )


async def handle_response_validation_exception(request, exc: ResponseValidationError):
    logger.exception(exc)

    return JSONResponse(
        status_code=500,
        content={
            "type": ErrorCode.INTERNAL_ERROR,
            "code": "ResponseValidationError",
            "message": "Response is invalid. Please contact support@narrator.ai.",
            "description": exc.errors(),
        },
    )


async def handle_validation_error_exception(request, exc: ValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "type": ErrorCode.INVALID_REQUEST,
            "code": exc.__class__.__name__,
            "message": str(exc),
            "description": exc.errors(),
        },
    )


async def handle_value_error_exception(request, exc: ValueError | TypeError):
    logger.exception(exc)

    notes = _get_exception_notes(exc)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "type": ErrorCode.INVALID_REQUEST,
            "code": ValidationError.__name__,
            "message": str(exc),
            "description": notes,
        },
    )


async def handle_graphql_response_exception(request, exc: GraphQlClientInvalidResponseError):
    logger.exception(exc)

    errors = exc.response.json()["errors"]
    message = ". ".join(e["message"] for e in errors)
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "type": ErrorCode.INVALID_REQUEST,
            "code": "GraphqlInvalidResponse",
            "message": message,
            "description": errors,
        },
    )
