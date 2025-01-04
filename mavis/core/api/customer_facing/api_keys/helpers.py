from core.models.user import UserCompany
from core.util.paseto import create_token


def create_api_key(key_id: str, user_id: str, company: UserCompany, ttl: int | None = None):
    """
    Create a PASETO access token for the user. It contains a payload defined by Auth0 hooks and never expires
    by default. The id of the key is embedded in the token so that it can be revoked.
    """
    payload = {
        "key_id": key_id,
        "org_id": company.auth0_org_id,
        "https://graph.narrator.ai/claims": {
            "x-hasura-company-id": company.id,
            "x-hasura-user-id": user_id,
        },
    }

    return create_token(payload, ttl=ttl)
