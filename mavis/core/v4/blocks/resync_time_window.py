from batch_jobs.custom_task import CustomTask, TaskKindEnum
from core.graph import graph_client
from core.v4.blocks.shared_ui_elements import (
    _checkbox,
    _date_picker,
    _drop_down,
    _input,
    _make_ui,
    _space,
)
from core.v4.mavis import Mavis

TITLE = "Resync Time Window"
DESCRIPTION = "Allows you to resync a time window of the activity stream"
VERSION = 1


def get_schema(mavis: Mavis, internal_cache):
    tasks_scheduled = []
    all_transformations = [
        t
        for t in graph_client.transformation_index(company_id=mavis.company.id).all_transformations
        if t.production_queries_aggregate.aggregate.count > 0
    ]

    # selected table
    selected_table = internal_cache.get("table") or mavis.company.tables[0].activity_stream

    # share the current tasks
    tasks = CustomTask(mavis.company.s3, kind=TaskKindEnum.run_transformation)

    task = [t for t in tasks.tasks if t.task == "resync_part" and t.details.get("table") == selected_table]

    for t in task:
        tasks_scheduled.append("## Task is already Scheduled")
        tasks_scheduled.extend([f"{k}: {v}" for k, v in t.items()])

    all_transforms = [t.dict() for t in all_transformations if t.table == selected_table]

    # load from cache
    schema = dict(
        title=TITLE,
        description=DESCRIPTION,
        type="object",
        properties=dict(
            table=_drop_down(
                list(set(t.table for t in all_transformations)),
                default=mavis.company.tables[0].activity_stream,
                title="Table",
            ),
            all_transformations=_drop_down(
                all_transforms,
                "id",
                "name",
                is_multi=True,
                title="Resynced Transformations",
            ),
            select_all=_checkbox("Select All"),
            from_resync_time=_date_picker(title="From Resync Time"),
            to_resync_time=_date_picker(title="To Resync Time"),
            delete_data=_checkbox("Delete the data from the stream", default=False),
            details=_input(
                default="\n\n".join(
                    tasks_scheduled
                    + [
                        "<br>",
                        "**When will this run?**",
                        "Now.  We will trigger a `Run Transformation` and you can monitor it in the processing tab ",
                        "<br>",
                        "**How will this work?**",
                        "We will DELETE the data directly via SQL on to the table (only if you have the box checked)",
                        "We will then run a `Insert Missing Data only` (diff the data based on the activity_id)",
                        "<br>",
                        "**Will I see the update?**",
                        "Yes, You will see in each transformation's page, and in the processing page" "<br>",
                    ]
                )
            ),
        ),
    )

    schema_ui = dict(
        **_make_ui(
            options=dict(
                title=False,
                flex_direction="row",
                flex_wrap="wrap",
            ),
        ),
        table=_make_ui(options=dict(update_schema=True)),
        all_transformations=_make_ui(options=_space(80)),
        select_all=_make_ui(options=dict(process_data=True, **_space(20, inline_button=True))),
        from_resync_time=_make_ui(options=_space(50)),
        to_resync_time=_make_ui(options=_space(50)),
        details=_make_ui(widget="MarkdownRenderWidget"),
    )

    return (schema, schema_ui)


def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    internal["table"] = data["table"]
    return internal


def process_data(mavis: Mavis, data, update_field_slug):
    if update_field_slug == "root_select_all":
        if data["select_all"]:
            all_transformations = graph_client.transformation_index(company_id=mavis.company.id).all_transformations

            data["all_transformations"] = [
                t.id
                for t in all_transformations
                if t.production_queries_aggregate.aggregate.count > 0 and t.table == data["table"]
            ]
        else:
            data["all_transformations"] = []

    return data


def run_data(mavis: Mavis, data):
    tasks = CustomTask(mavis.company.s3, kind=TaskKindEnum.run_transformation)

    tasks.tasks = [t for t in tasks.tasks if t.task != "resync_part" or t.details.get("table") != data["table"]]

    keys = (
        "table",
        "from_resync_time",
        "to_resync_time",
        "delete_data",
        "all_transformations",
    )
    for key in keys:
        if not data[key] and data[key] is not False:
            raise ValueError(f"Missing input {key}")

    # create the task
    tasks.add_task("resync_part", **{k: data[k] for k in keys})

    # upload the task
    tasks.update()

    content = [
        "# Changes will apply in next run",
        "Do not worry, the data will be deleted when the transformation runs, feel free to trigger that now from the processing page",
    ]
    return [dict(type="markdown", value="\n".join(content))]
