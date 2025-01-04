import functools

import backoff
import httpx
from backoff import on_exception

from core.graph.sync_client import Client as SyncClient
from core.logger import get_logger
from core.models.settings import settings
from core.util.auth0 import get_m2m_auth0_token

logger = get_logger()


@on_exception(backoff.expo, (httpx.NetworkError, httpx.LocalProtocolError), max_time=30, logger=logger)
@functools.lru_cache
def make_sync_client(token: str | None = None):
    return SyncClient(
        url=f"https://{settings.graph_domain}/v1/graphql",
        headers={
            "Content-type": "application/json",
            "Authorization": f"Bearer {token}",
        },
    )


m2m_token = None if settings.is_test else get_m2m_auth0_token()
sync_client = make_sync_client(m2m_token)
graph_client = sync_client
