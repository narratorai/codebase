"""
This is the entrypoint for the FastAPI app.
"""

import logging
import os

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError, ResponseValidationError
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from uvicorn.protocols.utils import ClientDisconnected

from core.errors import AuthenticationError, InternalError, SilenceError
from core.graph.sync_client import GraphQlClientInvalidResponseError
from core.logger import configure_logging, reset_contextvars, set_contextvars
from core.models.settings import settings
from core.util.sentry import configure as configure_sentry

from .customer_facing.router import router as api_router
from .exception_handlers import (
    handle_exception,
    handle_graphql_response_exception,
    handle_http_exception,
    handle_internal_error,
    handle_response_validation_exception,
    handle_validation_error_exception,
    handle_value_error_exception,
)
from .observability import PrometheusMiddleware, metrics
from .v1.router import admin_router as admin_api_v1_router
from .v1.router import router as api_v1_router
from .v2.router import router as api_v2_router

configure_logging()
configure_sentry(ignore_errors=[SilenceError, RequestValidationError, ClientDisconnected, AuthenticationError])


app = FastAPI(
    title="Narrator",
    description="Narrator API",
    version="1.0",
    openapi_url="/api/openapi.json",
    servers=[{"url": "https://mavis.us.narrator.ai"}],
    docs_url="/api/docs",
    redoc_url=None,
    exception_handlers={
        ResponseValidationError: handle_response_validation_exception,
        HTTPException: handle_http_exception,
        InternalError: handle_internal_error,
        ValidationError: handle_validation_error_exception,
        GraphQlClientInvalidResponseError: handle_graphql_response_exception,
        ValueError: handle_value_error_exception,
        TypeError: handle_value_error_exception,
        Exception: handle_exception,
    },
)

# Add middlewares
app.add_middleware(PrometheusMiddleware, app_name="mavis")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Mount the routes
# /v1 and /admin/v1 are considered internal whereas /api is customer facing
# TODO: Rename packages names to reflect this
app.include_router(api_v1_router, prefix="/v1", include_in_schema=False)
app.include_router(api_v2_router, prefix="/v2", include_in_schema=False)
app.include_router(admin_api_v1_router, prefix="/admin/v1", include_in_schema=False)
app.include_router(api_router, prefix="/api")


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    reset_contextvars()
    set_contextvars(
        method=request.method,
        path=request.url.path,
        query_params=dict(request.query_params),
        datacenter_region=settings.datacenter_region,
    )

    response: Response = await call_next(request)

    level = logging.INFO if response.status_code < 400 else logging.ERROR
    logging.log(
        level,
        f"{request.method} {request.url.path}",
        extra={"response": {"status_code": response.status_code}},
    )

    return response


@app.get("/health", include_in_schema=False)
@app.get("/healthz", include_in_schema=False)
async def health():
    """
    Health check endpoint for k8s.
    """
    build_revision = os.getenv("BUILD_REVISION", "unknown")
    return {"status": "OK", "version": build_revision}


app.add_route("/metrics", metrics)
