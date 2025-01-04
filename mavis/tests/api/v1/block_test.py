import json

import pytest
import starlette.status
from httpx import AsyncClient

from core.constants import REDIRECT_ADMIN_BLOCKS

pytestmark = pytest.mark.skip()  # TODO: broken due to removal of lambda_context. Needs to be updated


@pytest.mark.parametrize("slug", REDIRECT_ADMIN_BLOCKS)
@pytest.mark.asyncio
async def test_admin_block_redirect(company, test_app: AsyncClient, slug):
    response = await test_app.post(f"/v1/block/{slug}?test=true", content=json.dumps({"data": {}}))
    assert response.status_code == starlette.status.HTTP_307_TEMPORARY_REDIRECT
    assert (
        response.headers.get("location")
        == f"{test_app.base_url}/admin/v1/block/{slug}?test=true&company={test_app.params.get('company')}"
    )


# @pytest.mark.asyncio
# async def test_admin_block_no_redirect(company, test_app: AsyncClient):
#     response = await test_app.post(
#         "/v1/block/task_tracker?test=true", content=json.dumps({"data": {}})
#     )
#     assert response.status_code == starlette.status.HTTP_200_OK
