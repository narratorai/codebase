from requests import post

from batch_jobs.data_management.async_actions import async_post
from core.constants import FIVETRAN_TRACKING_URL
from core.logger import get_logger
from core.models.time import utcnow

logger = get_logger()


def fivetran_track(user, url=FIVETRAN_TRACKING_URL, data=None, run_async: bool = True):
    """
    Emits tracking events via SNS. These are queued up and processed by a lambda.
    """
    if data is None:
        data = dict()

    body = dict(
        utc_time=utcnow(),
        **data,
    )
    body["user_id"] = user.id
    body["company_id"] = user.company.id
    body["slug"] = user.company.slug
    body["user_email"] = user.email
    if run_async:
        async_post.send(url, body)
    else:
        post(url=url, data=body, timeout=30)
