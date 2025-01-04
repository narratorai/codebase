import pytest
from fastapi import status
from httpx import AsyncClient

NULL_UUID = "00000000-0000-0000-0000-000000000000"


@pytest.mark.asyncio
async def test_no_admin_transformation_redirect(company, test_app: AsyncClient):
    response = await test_app.get(f"/v1/transformation/{NULL_UUID}/fake-bad-endpoint-for-test")
    assert response.status_code == status.HTTP_404_NOT_FOUND
