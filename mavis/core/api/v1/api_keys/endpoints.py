from fastapi import APIRouter, Depends, HTTPException

from core.api.auth import get_current_company, get_current_user
from core.graph import graph_client
from core.models.company import Company
from core.models.user import AuthenticatedUser, UserCompany

from .helpers import create_api_key
from .models import ActiveAPIKey, CreateKeyInput, CreateKeyOutput

router = APIRouter(prefix="/api_keys")


async def require_admin_role(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="You are not allowed to access this resource")


@router.get(
    "",
    response_model=list[ActiveAPIKey],
    dependencies=[Depends(require_admin_role)],
    description="Get all the active API keys for the current company",
)
async def get_keys(current_company: Company = Depends(get_current_company)):
    data = graph_client.get_all_company_api_keys(company_id=current_company.id).dict()
    api_keys = data["api_keys"]

    for key in api_keys:
        key["user"] = key["company_user"]["user"]

    return api_keys


@router.post(
    "",
    response_model=CreateKeyOutput,
    dependencies=[Depends(require_admin_role)],
    description="Create an API key to authenticate with the API",
)
async def create_key(input: CreateKeyInput, current_user: AuthenticatedUser = Depends(get_current_user)):
    result = _create_key_for_user(
        input.user.id,
        current_user.company,
        label=input.label,
        ttl=input.ttl,
    )
    if not result:
        raise HTTPException(status_code=400, detail="Unable to create API key")

    meta, api_key = result
    return {
        "id": meta.id,
        "api_key": api_key,
        "label": meta.label,
        "user": meta.company_user.user,
        "created_at": meta.created_at,
    }


@router.delete(
    "/{id}",
    status_code=204,
    dependencies=[Depends(require_admin_role)],
    description="Revoke an API key. The key is expired immediately.",
)
async def revoke_key(id: str):
    graph_client.revoke_company_user_api_key(id=id)
    return None


def _create_key_for_user(
    user_id: str,
    company: UserCompany,
    label: str | None = None,
    ttl: int | None = None,
):
    relationships = graph_client.get_all_companies_for_user(user_id=user_id).company_user

    try:
        company_user = next(filter(lambda x: x.company_id == company.id, relationships))
        data = graph_client.create_company_user_api_key(company_user_id=company_user.id, label=label).inserted_api_key

        if data:
            key_id = data.id
            api_key = create_api_key(key_id=key_id, user_id=user_id, company=company, ttl=ttl)

            return data, api_key
    except StopIteration:
        return None
