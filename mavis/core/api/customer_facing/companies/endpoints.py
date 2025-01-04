from typing import Literal

from fastapi import APIRouter, Depends, status

from core import utils
from core.api.auth import get_current_company, get_current_user
from core.graph import graph_client
from core.errors import ForbiddenError
from core.models.company import Company
from core.models.ids import UUIDStr
from core.models.user import AuthenticatedUser

from .helpers import archive_company, create_company, create_key_for_user, get_connections, update_connections
from .models import (
    CompanyOutput,
    ConnectionOptions,
    ConnectionOutput,
    ConnectionUpdates,
    CreateCompanyInput,
    CreateCompanyOutput,
    TagCreate,
    TagOutput,
    UsedConnection,
)

router = APIRouter(prefix="/companies", tags=["Companies"])


def verify_company_access(current_company: Company = Depends(get_current_company)):
    if current_company.slug not in ("fivex-internal", "narrator"):
        raise ForbiddenError("This is a special endpoint. Please contact support@narrator.ai to use it.")


@router.post(
    "",
    response_model=CreateCompanyOutput,
    status_code=201,
    dependencies=[Depends(verify_company_access)],
    name="Create new company",
    description="Create a new company. The response includes an API key that won't be shown again.",
)
async def create(
    input: CreateCompanyInput,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    slug = utils.slugify(input.name).replace("_", "-")
    admin_user = create_company(
        current_user.id,
        slug=slug,
        email=current_user.email,
        payment_handled=True,
        region=input.region,
    )

    try:
        result = create_key_for_user(admin_user, "Default API key")
        if result:
            new_company = admin_user.company
            return {
                "id": new_company.id,
                "slug": new_company.slug,
                "api_key": result[1],
            }
    except Exception as e:
        raise ValueError("Unable to create API key") from e


@router.delete(
    "/current",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Delete the current company",
)
async def delete(current_user: AuthenticatedUser = Depends(get_current_user)):
    if not current_user.is_admin:
        raise ForbiddenError("You must be an admin to perform this action")

    archive_company(current_user.company)


@router.get("/{id}", response_model=CompanyOutput, name="Get a company")
async def get(
    id: UUIDStr | Literal["current"],
    current_company: Company = Depends(get_current_company),
):
    if id == "current":
        return CompanyOutput(
            id=current_company.id,
            name=current_company.name,
            slug=current_company.slug,
            created_at=current_company.created_at,
            updated_at=current_company.updated_at,
            production_schema=current_company.production_schema,
            warehouse_language=current_company.warehouse_language,
            status=current_company.status,
            locale=current_company.locale,
            batch_halt=current_company.batch_halt,
            logo_url=current_company.logo_url,
            timezone=current_company.timezone or "UTC",
            datacenter_region=current_company.datacenter_region,
            currency=current_company.currency_used or "USD",
            teams=current_company.teams,
            tags=current_company.tags,
            users=current_company.users,
        )

    # TODO: Implement company lookup by ID
    raise ForbiddenError()


@router.post("/tags", response_model=TagOutput, name="Create a tag")
async def create_tag(
    tag: TagCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    new_tag = graph_client.insert_tag(company_id=current_user.company.id, tag=tag.name, color=tag.color)
    return TagOutput(
        id=new_tag.id,
        name=new_tag.tag,
        color=new_tag.color,
        created_at=new_tag.created_at,
        updated_at=new_tag.updated_at,
    )


@router.delete("/tags/{id}", status_code=status.HTTP_204_NO_CONTENT, name="Delete a tag")
async def delete_tag(
    id: UUIDStr,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    graph_client.delete_tag(id=id)


@router.put("/connections", response_model=ConnectionOutput, name="Update company connections")
async def update_company_connections(
    connections: ConnectionUpdates,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise ForbiddenError("You must be an admin to perform this action")

    update_connections(current_user.company.auth0_org_id, connections.connection_ids)
    return get_connections(current_user.company.auth0_org_id)


@router.get("/connections", response_model=ConnectionOutput, name="Get company connection options")
async def get_company_connections(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    cons = get_connections(current_user.company.auth0_org_id)
    options = [
        dict(id=ConnectionOptions.AUTH0_USER_PASSWORD, name="Auth0 User Password"),
        dict(id=ConnectionOptions.AUTH0_GOOGLE, name="Google Auth"),
        dict(id=ConnectionOptions.AUTH0_MICROSOFT, name="Microsoft Live"),
    ]
    return dict(connections=[UsedConnection(id=c["id"], name=c["connection"]["name"]) for c in cons], options=options)
