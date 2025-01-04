from random import SystemRandom

import structlog

from core.constants import MV_TRANSFORMATION_PROCESS, NORMAL_TRANSFORMATION_PROCESS
from core.decorators import mutex_task, with_mavis
from core.graph import graph_client
from core.models.company import Company
from core.v4.mavis import Mavis

logger = structlog.get_logger()


def update_async_tasks(company: Company):
    cryptogen = SystemRandom()

    async_task = graph_client.get_task_by_slug(company_id=company.id, slug=MV_TRANSFORMATION_PROCESS).company_task[0]

    normal_task = graph_client.get_task_by_slug(company_id=company.id, slug=NORMAL_TRANSFORMATION_PROCESS).company_task[
        0
    ]

    if async_task and normal_task and async_task.schedule == normal_task.schedule:
        task_s3_name = "last_async_task_schedule"
        try:
            old_task = company.load_secret(task_s3_name)
            sched = old_task["schedule"]
        except Exception:
            sched = f"{cryptogen.randrange(59)} 4 * * *"

        graph_client.update_task_schedule(id=async_task.id, schedule=sched)


def update_all_task():
    all_tasks = graph_client.execute(
        """
        query CompanyTasks {
            company_task(where: {task_slug: {_eq: "compute_popular_items"}}) {
                id
                schedule
                task_slug
            }
        }
        """
    ).json()["data"]

    # loop through and fix them all
    for t in all_tasks["company_task"]:
        graph_client.update_task_schedule(id=t["id"], schedule=t["schedule"].replace("* 1", " * *"))


@mutex_task()
@with_mavis
def update_task_schedules(mavis: Mavis, **kwargs):
    try:
        update_async_tasks(mavis.company)
    except Exception:
        logger.exception("Failed to update async tasks")
