from fastapi import APIRouter, Depends

from core.api.auth import get_current_user
from core.api.customer_facing.utils.pydantic import PaginationParams
from core.graph import graph_client
from core.models.user import AuthenticatedUser, ROLE_DETAILS
from core.graph.sync_client.enums import access_role_enum

from .helpers import _update_internal_access
from .models import (
    GetRoleOutput,
    InternalAccess,
)

router = APIRouter(prefix="/accesses", tags=["access"])


@router.get(
    "",
    response_model=GetRoleOutput,
    name="Get all access roles",
    description="Get all access roles associated with the company",
)
async def get_all(
    params: PaginationParams = Depends(PaginationParams),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    roles = []
    for r in access_role_enum:
        roles.append(dict(role=r.value, **ROLE_DETAILS.get(r)))

    return dict(
        totalCount=len(roles),
        page=1,
        perPage=params.per_page,
        data=roles,
    )


@router.patch(
    "/toggle_access",
    name="Allows support to access your data for debugging",
    description="Allows support to access your data for debugging",
)
async def toggle_internal_admin_access(
    input: InternalAccess,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    _update_internal_access(current_user, input.allow_internal_access)
    graph_client.execute(
        """
        mutation UpdateCompany(
            $id: uuid!
            $allow_narrator_employee_access: Boolean!
        ) {
            update_company_by_pk(
                pk_columns: { id: $id }
                _set: {
                    allow_narrator_employee_access: $allow_narrator_employee_access
                }
            ) {
                id
            }
        }
        """,
        dict(
            id=current_user.company.id,
            allow_narrator_employee_access=input.allow_narrator_employee_access,
        ),
    )
