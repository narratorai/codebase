"""
Test the /v1/flags endpoints
"""

import pytest
from httpx import AsyncClient


class TestGET:
    @pytest.mark.asyncio
    async def test_no_auth_token(company, test_app: AsyncClient):
        response = await test_app.get("/v1/flags")

        assert response.status_code == 401
        assert response.json() == {
            "type": "InternalError",
            "code": "Unauthorized",
            "message": "The provided credentials are invalid",
            "description": [],
        }

    @pytest.mark.asyncio
    async def test_trailing_slash(company, test_app: AsyncClient):
        response = await test_app.get("/v1/flags/")

        assert response.status_code == 307
        assert "test/v1/flags?company=test-company" in response.headers["location"]
