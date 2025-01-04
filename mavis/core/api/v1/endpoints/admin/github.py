from fastapi import APIRouter, Depends
from pydantic import BaseModel

from core.api.auth import get_mavis
from core.v4.mavis import Mavis

router = APIRouter(prefix="/github", tags=["admin", "github"])


class GetInstallationReposResponse(BaseModel):
    installation_id: int | None
    repos: list[str]


@router.get("/installation/repos", response_model=GetInstallationReposResponse)
async def get_installation_repos(mavis: Mavis = Depends(get_mavis)):
    """
    Gets all the repos available to a company's github app installation
    """
    if mavis.company.github is None:
        return {"installation_id": None, "repos": []}
    return {
        "installation_id": mavis.company.github.installation_id,
        "repos": [repo.full_name for repo in mavis.company.github.installation_repos],
    }
