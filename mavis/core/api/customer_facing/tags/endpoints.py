from fastapi import APIRouter, Depends, status

from core.api.auth import get_current_company, get_current_user
from core.api.customer_facing.utils.pydantic import PaginationParams
from core.graph import graph_client
from core.graph.sync_client.enums import access_role_enum
from core.models.company import Company, query_graph_company
from core.models.ids import UUIDStr
from core.models.user import AuthenticatedUser

from .models import GetTagOutput, TagCreated, TagUpdate

router = APIRouter(prefix="/tags", tags=["tag"])


@router.get(
    "",
    response_model=GetTagOutput,
    name="Get all tags",
    description="Get all tags associated with the company",
)
async def get_all(
    params: PaginationParams = Depends(PaginationParams),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    tags = graph_client.get_all_tags(current_user.company.id).company_tags
    return dict(
        totalCount=len(tags),
        page=1,
        perPage=params.per_page,
        data=[t.dict() for t in tags if t.tag != "popular"],
    )


@router.post(
    "",
    response_model=TagCreated,
    status_code=status.HTTP_200_OK,
    name="Create a tag",
    description="Creates a tag with color and name",
)
async def create_tag(
    input: TagUpdate,
    current_company: Company = Depends(get_current_company),
):
    current_company.user.require_role(access_role_enum.manage_tags)
    id = graph_client.insert_tag(**input.dict(), company_id=current_company.id).inserted_tag.id
    query_graph_company(current_company.slug, refresh_cache=True)
    return dict(id=id)


@router.patch(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Update a tag",
    description="Update a tag with color and name",
)
async def update_tag(id: UUIDStr, input: TagUpdate, current_user: AuthenticatedUser = Depends(get_current_user)):
    current_user.require_role(access_role_enum.manage_tags)
    graph_client.update_tag(id=id, tag=input.tag, color=input.color, description=input.description)
    query_graph_company(current_user.company.slug, refresh_cache=True)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Deletes a tag",
    description="Deletes a tag from the company",
)
async def delete_tag(id: UUIDStr, current_user: AuthenticatedUser = Depends(get_current_user)):
    current_user.require_role(access_role_enum.manage_tags)
    graph_client.delete_tag(id=id)
    query_graph_company(current_user.company.slug, refresh_cache=True)
