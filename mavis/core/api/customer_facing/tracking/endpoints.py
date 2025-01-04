from fastapi import APIRouter, Depends, Request, status
from user_agents import parse

from core.api.auth import get_current_user

# from core.api.customer_facing.datasets.utils import DatasetUpdator
# from core.api.customer_facing.reports.utils import NarrativeUpdator
from core.api.customer_facing.tracking.models import TrackView
from core.constants import VIEW_TRACKING_URL
from core.models.user import AuthenticatedUser
from core.util.tracking import fivetran_track

router = APIRouter(prefix="/track", tags=["track"])


@router.post(
    "/view",
    status_code=status.HTTP_204_NO_CONTENT,
    name="Track a view",
    description="Track a view",
)
async def quick_track_page(
    payload: TrackView,
    current_user: AuthenticatedUser = Depends(get_current_user),
    request: Request = None,
):
    if request:
        user_agent = request.headers.get("User-Agent")

    data = dict(
        action="view",
        path=payload.path,
    )
    if request and user_agent:
        user_agent = parse(user_agent)
        data.update(
            user_agent=user_agent,
            # Device info
            is_mobile=user_agent.is_mobile,
            is_tablet=user_agent.is_tablet,
            is_pc=user_agent.is_pc,
            device_family=user_agent.device.family,
            # OS info
            os_family=user_agent.os.family,
            os_version=user_agent.os.version_string,
            # Browser info
            browser_family=user_agent.browser.family,
            browser_version=user_agent.browser.version_string,
        )
    # track the data
    fivetran_track(current_user, VIEW_TRACKING_URL, data)

    # if payload.path.startswith("/datasets/"):
    #     DatasetUpdator(user=current_user).log_view(payload.id)
    # elif payload.path.startswith("/narratives/"):
    #     NarrativeUpdator(user=current_user).log_view(payload.id)
