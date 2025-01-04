from croniter import croniter

from core import utils
from core.graph import graph_client
from core.v4.blocks.shared_ui_elements import _drop_down, _input
from core.v4.mavis import Mavis

TITLE = "Task Custom Cron"
DESCRIPTION = "Update any task with a cron schedule. For more Cron help use https://crontab.guru/"
VERSION = 1


def get_schema(mavis: Mavis, internal_cache: dict):
    all_tasks = [
        dict(id=t.id, name=f"{utils.title(t.task_slug[2:])} ({t.category.value})")
        for t in graph_client.get_company_tasks(company_id=mavis.company.id).company_task
    ]
    schema = dict(
        title=TITLE,
        description=DESCRIPTION,
        type="object",
        properties=dict(
            task=_drop_down(
                all_tasks,
                "id",
                "name",
                is_multi=True,
                title="Tasks",
            ),
            cron=_input("Cron Schedule", default="0 0 * * *"),
        ),
    )

    schema_ui = dict()

    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    return internal


def process_data(mavis: Mavis, data, update_field_slug):
    return data


def run_data(mavis: Mavis, data: dict):
    content = []

    cron_schedule = data["cron"]
    if croniter.is_valid(cron_schedule):
        for t_id in data["task"]:
            # Update using graph_client
            graph_client.update_task_schedule(id=t_id, schedule=cron_schedule)
        content.append("Task(s) updated successfully")
    else:
        content.append("Invalid cron schedule")

    return [dict(type="markdown", value="\n".join(content))]
