from batch_jobs.task_manager import task_manager
from core.api.customer_facing.tasks.utils import TaskManager
from core.graph import graph_client
from core.utils import title
from core.v4.blocks.shared_ui_elements import (
    _checkbox,
    _drop_down,
    _input,
    _make_ui,
    _space,
)
from core.v4.mavis import Mavis

TITLE = "Batch Task Updates"
DESCRIPTION = "This allows you to update, delete all the integrations and alerts."
VERSION = 1


def get_schema(mavis: Mavis, internal_cache: dict):
    # load from cache
    all_tasks = [
        dict(id=d.id, name=title(d.task_slug))
        for d in graph_client.task_index(company_id=mavis.company.id).company_task
        if d.category in (d.category.ALERTS, d.category.MATERIALIZATIONS)
    ]

    schema = dict(
        title=TITLE,
        description=DESCRIPTION,
        type="object",
        properties=dict(
            tasks=_drop_down(
                all_tasks,
                "id",
                "name",
                is_multi=True,
                title="Tasks",
            ),
            all_tasks=_checkbox("Select All"),
            new_cron=_input("New Cron Schedule"),
            update_schedule=_checkbox("Update Cron"),
            run_all=_checkbox("Run All"),
            delete_all=_checkbox("Delete All"),
        ),
    )

    schema_ui = dict(
        **_make_ui(
            options=dict(
                hide_submit=True,
                hide_output=True,
                title=False,
                flex_direction="row",
                flex_wrap="wrap",
            ),
        ),
        tasks=_make_ui(options=dict(data_public=True, **_space(80))),
        all_tasks=_make_ui(options=dict(process_data=True, **_space(20, inline_button=True))),
        new_cron=_make_ui(
            widget="CronSelectFormItemWidget",
            options=dict(**_space(60), data_public=True),
            help_text="Schedule is in Local Timezone! If custom, then just add the cron '0 4 * * *'",
        ),
        update_schedule=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(
                button_type="primary",
                process_data=True,
                **_space(30, inline_button=True),
            ),
        ),
        run_all=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(button_type="primary", process_data=True, **_space(50)),
        ),
        delete_all=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(
                button_type="primary",
                process_data=True,
                danger=True,
                popconfirm=True,
                popconfirm_text="Are you sure you want to delete all these tasks.",
                **_space(50),
            ),
        ),
    )

    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    return internal


def process_data(mavis: Mavis, data: dict, update_field_slug: str | None):
    if update_field_slug == "root_all_tasks":
        if data["all_tasks"]:
            data["tasks"] = [
                d.id
                for d in graph_client.task_index(company_id=mavis.company.id).company_task
                if d.category in (d.category.ALERTS, d.category.MATERIALIZATIONS)
            ]
        else:
            data["tasks"] = []

    elif update_field_slug == "root_run_all":
        # run the tasks
        for id in data["tasks"]:
            task_manager.run(id)

        data["_redirect_url"] = "/manage/tasks?category=materializations"

    elif update_field_slug == "root_delete_all":
        # delete the tasks
        graph_client.execute(
            """
            mutation DeleteCompanyTask($ids: [uuid!]!) {
                delete_company_task(where: { id: { _in: $ids }}) {
                    returning {
                        task_slug
                    }
                }
            }
            """,
            dict(ids=data["tasks"]),
        )

        data["_redirect_url"] = "/manage/tasks?category=materializations"

    elif update_field_slug == "root_update_schedule":
        # replace if it is a 00
        if data["new_cron"][0][0]:
            data["new_cron"] = "?" + data["new_cron"][1:]

        # update all the task schedules
        for t_id in data["tasks"]:
            TaskManager(mavis=mavis).update_properties(t_id, schedule=data["new_cron"])

        data["_redirect_url"] = "/manage/tasks?category=materializations"

    return data


def run_data(mavis: Mavis, data: dict):
    content = []
    return [dict(type="markdown", value="\n".join(content))]
