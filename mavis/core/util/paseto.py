import paseto
from paseto.keys.symmetric_key import SymmetricKey
from paseto.protocols.v4 import ProtocolVersion4

from core.models.settings import settings

symmetric_key = SymmetricKey(
    settings.api_token_secret_key.get_secret_value().encode("UTF-8"),
    protocol=ProtocolVersion4,
)


def create_token(claims: dict, ttl: int | None = None, strip_prefix=True):
    """
    Creates a local v4 PASETO token with the given claims. By default it never expires.
    The token prefix, "v4.local.", is stripped by default.

    See https://github.com/paseto-standard/paseto-spec for more information.
    """
    token = paseto.create(symmetric_key, claims, purpose="local", exp_seconds=ttl)
    return token.replace("v4.local.", "") if strip_prefix else token


def decode_token(token: str, required_claims: list[str] | None = None, default_prefix="v4.local."):
    """
    Decodes a local v4 PASETO token and returns the claims. If the token does not have the
    required prefix, "v4.local.", it is added.
    """
    token = token if token.startswith(default_prefix) else f"{default_prefix}{token}"
    payload = paseto.parse(symmetric_key, token, required_claims=required_claims)

    return payload["message"]
