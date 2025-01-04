import datetime as dt
import os

from core.decorators import mutex_task, with_mavis
from core.errors import ForbiddenError
from core.graph import graph_client
from core.v4.mavis import Mavis


@mutex_task()
@with_mavis
def clear_old_query_updates(mavis: Mavis, **kwargs):
    if mavis.company.slug != "narrator":
        raise ForbiddenError("This batch job is only for the narrator instance")

    days = os.getenv("ARCHIVE_AFTER_DAYS", "30")
    before = dt.datetime.now(dt.UTC) - dt.timedelta(days=int(days))
    before = before.isoformat()

    graph_client.archive_query_updates(before=before)
