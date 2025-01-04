from fastapi import Depends

from core.api.auth import get_current_user
from core.models.user import AuthenticatedUser

from .models import GetTrainingOutput, QueryParams
from .router import router
from .utils import TrainingQueryBuilder


@router.get(
    "",
    response_model=GetTrainingOutput,
    name="Get all Trainings",
    description="Get all Trainings of the current company.",
)
async def get_all(
    params: QueryParams = Depends(QueryParams),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    query_builder = TrainingQueryBuilder(**params.dict(), user=current_user)
    return query_builder.get_results()
