from auth0.authentication import GetToken
from auth0.management import Auth0
from cachetools import TTLCache, cached

from core.logger import get_logger
from core.models.settings import settings

logger = get_logger()


@cached(cache=TTLCache(maxsize=1, ttl=1_209_000))
def get_m2m_auth0_token(
    refreshed_at: int | None = None,
    domain: str | None = None,
    audience: str | None = None,
):
    """
    Gets a machine-to-machine token from auth0 for the Narrator Graph API.
    The token is valid for 14 days. The TTL can be configured at Auth0's dashboard.
    See this API's configuration at https://manage.auth0.com/dashboard/us/narrator/apis/5e24c8d3d83e9907d3da3adc
    """
    endpoint = GetToken(
        settings.auth0_domain,
        client_id=settings.auth0_client_id,
        client_secret=settings.auth0_client_secret.get_secret_value(),
    )
    credentials = endpoint.client_credentials(settings.auth0_audience)
    return credentials["access_token"]


def get_api_client():
    endpoint = GetToken(
        "narrator.auth0.com",
        client_id=settings.auth0_client_id,
        client_secret=settings.auth0_client_secret.get_secret_value(),
    )
    credentials = endpoint.client_credentials("https://narrator.auth0.com/api/v2/")
    return Auth0("narrator.auth0.com", credentials["access_token"])
