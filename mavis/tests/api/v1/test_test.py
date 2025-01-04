"""
Sanity tests.
Calls the test endpoints to verify very basic functionality
"""

import json

import pytest
from fastapi import status
from httpx import AsyncClient

from core.errors import WrappedError

pytestmark = pytest.mark.skip()  # TODO: broken due to removal of lambda_context. Needs to be updated


@pytest.mark.asyncio
async def test_get_ping(company, test_app: AsyncClient):
    response = await test_app.get("/v1/test/ping")
    assert response.status_code == status.HTTP_200_OK
    assert response.headers.get("request-id") is not None

    assert response.json().get("ping") == "pong"
    assert response.json().get("company") == company.slug


@pytest.mark.asyncio
async def test_get_ping_with_query(company, test_app: AsyncClient):
    response = await test_app.get("/v1/test/ping?pong=test")
    assert response.status_code == status.HTTP_200_OK
    assert response.headers.get("request-id") is not None

    assert response.json().get("ping") == "test"
    assert response.json().get("company") == company.slug


@pytest.mark.asyncio
async def test_get_ping_with_path(company, test_app: AsyncClient):
    response = await test_app.get("/v1/test/ping/test")
    assert response.status_code == status.HTTP_200_OK
    assert response.headers.get("request-id") is not None

    assert response.json().get("ping") == "test"
    assert response.json().get("company") == company.slug


@pytest.mark.asyncio
async def test_post_ping(company, test_app: AsyncClient):
    response = await test_app.post("/v1/test/ping", content=json.dumps({"ping": "test"}))
    assert response.status_code == status.HTTP_200_OK
    assert response.headers.get("request-id") is not None

    assert response.json().get("ping") == "test"
    assert response.json().get("company") == company.slug


@pytest.mark.asyncio
async def test_get_app_error(test_app):
    # It looks like in tests the app error gets raised instead of making it through as an actual error response
    with pytest.raises(WrappedError):
        await test_app.get("/v1/test/app_error")


@pytest.mark.asyncio
async def test_get_app_error_with_status(test_app):
    # It looks like in tests the app error gets raised instead of making it through as an actual error response
    with pytest.raises(WrappedError) as excinfo:
        await test_app.get("/v1/test/app_error?with_status=true")

    assert excinfo.value.status_code == status.HTTP_418_IM_A_TEAPOT


@pytest.mark.asyncio
async def test_get_http_error(test_app):
    response = await test_app.get("/v1/test/http_error")
    assert response.status_code == status.HTTP_418_IM_A_TEAPOT
    assert response.json() is not None


@pytest.mark.asyncio
async def test_get_output_validation_error(test_app):
    response = await test_app.get("/v1/test/output_validation_error")
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert response.json() is not None


@pytest.mark.asyncio
async def test_get_user(test_app):
    response = await test_app.get("/v1/test/user")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() is not None
