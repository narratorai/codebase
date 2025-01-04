from fastapi import APIRouter, Depends, status

from core.api.auth import get_current_company, get_current_user
from core.api.customer_facing.tables.utils import TableManager
from core.api.customer_facing.utils.pydantic import PaginationParams, ShareInput
from core.models.company import Company
from core.models.ids import UUIDStr
from core.models.user import AuthenticatedUser

from .models import (
    GetTableOutput,
)

router = APIRouter(prefix="/tables", tags=["table"])


@router.get(
    "",
    response_model=GetTableOutput,
    name="Get all Tables",
    description="Get all the tables needed",
)
async def get_all(
    params: PaginationParams = Depends(PaginationParams),
    company: Company = Depends(get_current_company),
):
    tables = [t for t in company.tables if set(t.team_ids).intersection(set(company.current_user.team_ids))]
    return dict(
        totalCount=len(tables),
        page=1,
        perPage=params.per_page,
        data=[t.dict() for t in tables],
    )


@router.patch(
    "/{table_id}/share",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Update a table with the teams you now want to share with",
    description="Update a table with the teams you now want to share with",
)
async def share_with_teams(
    table_id: UUIDStr,
    input: ShareInput,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    TableManager(current_user).update_permissions(
        table_id, input.permissions, share_with_everyone=input.share_with_everyone
    )
