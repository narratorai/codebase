from datetime import timedelta
from functools import cache
from typing import Annotated

import jwt
import sentry_sdk
from fastapi import Depends, Security
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from jwt.exceptions import ExpiredSignatureError
from paseto.exceptions import PasetoException

from core.errors import AuthenticationError
from core.graph import graph_client
from core.logger import get_logger, set_contextvars
from core.models.company import Company, query_graph_company
from core.models.settings import settings
from core.models.user import AuthenticatedUser
from core.util.opentelemetry import set_current_span_attributes
from core.util.paseto import decode_token
from core.v4.mavis import Mavis

logger = get_logger()
header_scheme = APIKeyHeader(name="X-API-KEY", auto_error=False)
bearer_token_scheme = HTTPBearer(auto_error=False)


@cache
def get_jwks_client():
    """
    Fetch the set of keys containing the public keys used to verify any JWT issued by auth0.
    Multiple keys can be found in the JWKS when rotating application signing keys.

    See https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets.
    """
    lifespan = int(timedelta(weeks=1).total_seconds())
    return PyJWKClient(
        "https://narrator.auth0.com/.well-known/jwks.json",
        cache_keys=True,
        lifespan=lifespan,
    )


async def decode_auth0_jwt_token(token: str):
    """
    Decode the JWT token issued by auth0.
    """
    jwks_client = get_jwks_client()

    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        return jwt.decode(
            token,
            key=signing_key.key,
            algorithms=["RS256"],
            audience=settings.auth0_audience,
            issuer=settings.auth0_issuer,
        )
    except ExpiredSignatureError:
        raise AuthenticationError("Obtain a new token and try again", code="TokenExpired")
    except Exception:
        raise AuthenticationError()


async def decode_header_key(x_api_key: Annotated[str | None, Security(header_scheme)] = None):
    """
    Get the user from the X-API-KEY header. The headers expects a PASETO token.
    See https://github.com/paseto-standard/paseto-rfc.
    """
    if x_api_key is None:
        return None

    try:
        payload = decode_token(
            x_api_key,
            required_claims=["key_id", "org_id", "https://graph.narrator.ai/claims"],
        )
        try:
            api_key = graph_client.get_company_user_api_key(payload["key_id"]).api_key
        except Exception:
            logger.exception("Failed to get user api key")
            raise AuthenticationError()
        else:
            # Accept keys that are not stored in the database as long as the user ID is present
            if api_key is None:
                assert payload["https://graph.narrator.ai/claims"]["x-hasura-user-id"] is not None
            elif api_key.revoked_at is not None:
                raise AuthenticationError()
            else:
                # The key is transferable, set the user ID to the current user that owns the key.
                payload["https://graph.narrator.ai/claims"]["x-hasura-user-id"] = api_key.company_user.user.id

        # TODO: Get a valid token from auth0 to fetch graph as a user.
        return payload, None
    except (PasetoException, AssertionError) as e:
        raise AuthenticationError() from e


async def decode_bearer_token(
    token: HTTPAuthorizationCredentials = Depends(bearer_token_scheme),
):
    """
    Get the user from the Bearer token in the Authorization header. The header expects a JWT token issued by auth0.
    """
    if token is None:
        return None

    payload = await decode_auth0_jwt_token(token.credentials)
    return payload, token.credentials


async def get_current_user(
    bearer_payload: tuple[dict, str] | None = Depends(decode_bearer_token),
    header_payload: tuple[dict, str] | None = Depends(decode_header_key),
):
    """
    Get the current user from one of the authentication methods.
    """
    if bearer_payload:
        payload, token = bearer_payload
    elif header_payload:
        payload, token = header_payload
    else:
        raise AuthenticationError()

    org_id = payload.get("org_id", "")
    claims = payload.get("https://graph.narrator.ai/claims", {})
    user_id = claims.get("x-hasura-user-id", "")
    user = AuthenticatedUser.create(user_id, org_id, token)
    set_contextvars(user_id=user.id)
    set_current_span_attributes(user_id=user.id)
    sentry_sdk.set_user({"id": user.id, "email": user.email})

    return user


async def get_current_company(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    company = get_current_company_for_user(current_user)
    yield company

    # TODO: Streaming requires the company to be in memory while the connection is open.
    # Remove S3 session from memory. See https://github.com/boto/boto3/issues/1670.
    # del company.s3
    # gc.collect()


async def get_mavis(current_company: Company = Depends(get_current_company)):
    return Mavis(company=current_company)


def get_current_company_for_user(current_user: AuthenticatedUser):
    graph_company = query_graph_company(current_user.company.slug)
    company = Company(**graph_company.dict(), current_user=current_user)

    set_contextvars(company_id=company.id, company_slug=company.slug)
    set_current_span_attributes(company_id=company.id, company_slug=company.slug)
    sentry_sdk.set_tag("company.id", company.id)
    sentry_sdk.set_tag("company.slug", company.slug)
    return company
