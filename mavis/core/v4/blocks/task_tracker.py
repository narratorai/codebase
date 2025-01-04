from collections import defaultdict

from core import utils
from core.graph import graph_client
from core.util.opentelemetry import tracer
from core.v4.blocks.shared_ui_elements import (
    _checkbox,
    _date_picker,
    _drop_down,
    _hide_properties,
    _input,
    _make_array,
    _make_ui,
    _object,
    _space,
)
from core.v4.mavis import Mavis

TITLE = "Task Tracker"
DESCRIPTION = "A way to visualize your task"
VERSION = 1

TASK_DESCRIPTIONS = dict(
    run_transformations="\n\n".join(
        [
            "This is the main process of your data.",
            "This manages all your transformations including Enrichment, Customer Attribute and the Activity Stream",
            "Each time it runs it will grab all the new data (based on your update type) and insert it.",
            "At the end of the run, it will apply the *Identity Resolution* and recompute the cache columns",
            "Once a night it will diff the data based on what in production (over the last 15 days) and make sure your data is up-to-date.  This is trying to handle the case where you backfilled data or EL was delayed",
        ]
    ),
    indexing_customers="\n\n".join(
        [
            "This looks for all new customers in the activity stream and indexes them to make sure the autocomplete in Customer Journey Works"
        ]
    ),
    exchange_rates="\n\n".join(
        ["This uses an exchange rate api at the end of every day to fill your exchange_rates table"]
    ),
    vacuum_tables="Runs a Vacuum Command on your tables",
)


@tracer.start_as_current_span("get_schema")
def get_schema(mavis: Mavis, internal_cache: dict):
    current_tasks = graph_client.get_company_tasks(company_id=mavis.company.id).company_task

    schema = _object(
        dict(
            batch_halt=_input(),
            refresh=_input("Refresh 🔄"),
            current_tasks=_make_array(
                dict(task_info=_input(), run_now=_checkbox("Run Now")),
                title="Current Tasks",
            ),
            found_tasks=_make_array(dict(task_info=_input())),
            from_date=_date_picker(
                "Tasks from",
                include_time=True,
                default=utils.date_add(utils.utcnow(), "hour", -1),
            ),
            to_date=_date_picker("Tasks To", include_time=True, default=utils.utcnow()),
            tasks=_drop_down(
                [t.task_slug for t in current_tasks],
                title="available_tasks",
                is_multi=True,
                default=["run_transformations"],
            ),
            run=_input("Run🙏"),
            clear=_input("🧼clear"),
            resolution=_drop_down(["day", "week", "month"], default="week", title="Plot Date Part"),
        ),
        title=TITLE,
        description=DESCRIPTION,
    )

    _hide_properties(
        schema,
        ["from_date", "to_date", "tasks", "run", "clear", "found_tasks"],
        "find_specific_task",
    )

    schema_ui = dict(
        **_make_ui(
            options=dict(process_data_on_load=True, submit_on_load=True),
            order=[
                "refresh",
                "batch_halt",
                "current_tasks",
                "find_specific_task",
                "from_date",
                "to_date",
                "tasks",
                "run",
                "clear",
                "found_tasks",
                "resolution",
            ],
        ),
        batch_halt=_make_ui(
            hidden=not mavis.company.batch_halt,
            widget="MarkdownRenderWidget",
            options=_space(70, mb=0),
        ),
        refresh=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(process_data=True, submit_form=True, **_space(30, inline_button=False)),
        ),
        current_tasks=dict(
            **_make_ui(options=dict(**_space(mb=0), orderable=False, addable=False, removable=False)),
            items=dict(
                task_info=_make_ui(widget="MarkdownRenderWidget", options=_space(70, mb=0)),
                run_now=_make_ui(
                    widget="BooleanButtonWidget",
                    options=dict(process_data=True, **_space(30, mb=0, inline_button=True)),
                ),
            ),
        ),
        find_specific_task=_make_ui(widget="BooleanToggleWidget"),
        from_date=_make_ui(options=_space(20)),
        to_date=_make_ui(options=_space(20)),
        tasks=_make_ui(options=_space(30)),
        run=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(process_data=True, **_space(15, inline_button=True)),
        ),
        clear=_make_ui(
            widget="BooleanButtonWidget",
            options=dict(
                process_data=True,
                button_type="tertiary",
                **_space(15, inline_button=True),
            ),
        ),
        found_tasks=dict(
            **_make_ui(options=dict(**_space(mb=0), orderable=False, addable=False, removable=False)),
            items=dict(task_info=_make_ui(widget="MarkdownRenderWidget", options=dict(**_space(mb=0)))),
        ),
        resolution=_make_ui(options=_space(30)),
    )

    return (schema, schema_ui)


@tracer.start_as_current_span("get_internal_cache")
def get_internal_cache(mavis: Mavis, data: dict, internal: dict):
    return internal


@tracer.start_as_current_span("process_data")
def process_data(mavis, data, update_field_slug=None):
    if update_field_slug in ("root_refresh", "task_tracker"):
        data["batch_halt"] = "# All Transformations are currently halted"
        data["current_tasks"] = get_current_data(mavis)

    elif update_field_slug == "root_run":
        data["found_tasks"] = find_data(mavis, data["from_date"], data["to_date"], data["tasks"])

    elif update_field_slug == "root_clear":
        data["found_tasks"] = []

    elif update_field_slug and update_field_slug.startswith("root_current_tasks"):
        data["current_tasks"] = get_current_data(mavis)

    return data


@tracer.start_as_current_span("run_data")
def run_data(mavis: Mavis, data: dict):
    last_week = utils.date_add(utils.utcnow(), data["resolution"] or "week", -1)

    # create the overall running plot
    task_executions = graph_client.get_last_executed_tasks(
        company_id=mavis.company.id,
        from_date=last_week,
        to_date=utils.utcnow(),
        category="processing",
    ).task_execution

    # get the queries
    all_query_updates = graph_client.get_transformation_query_updates(
        company_id=mavis.company.id,
        from_date=last_week,
        to_date=utils.utcnow(),
    ).query_updates

    res = [
        dict(type="block_plot", value=_make_task_execution_plot(mavis, task_executions)),
        dict(
            type="block_plot",
            value=_make_table_over_time_updates(mavis, task_executions, all_query_updates),
        ),
        dict(
            type="block_plot",
            value=_make_transformation_over_time_updates(mavis, all_query_updates),
        ),
    ]
    return res


@tracer.start_as_current_span("get_current_data")
def get_current_data(mavis):
    current_tasks = graph_client.get_company_tasks(company_id=mavis.company.id).company_task
    tz = mavis.company.timezone
    cts = []

    # add the transformation task
    trans_t = next((t for t in current_tasks if t.task_slug == "run_transformations"), None)
    if trans_t:
        cts.append(
            dict(
                task_info=_pretty_task(
                    trans_t.executions[0] if len(trans_t.executions) > 0 else None,
                    trans_t,
                    tz,
                    log_format=False,
                ),
                id=trans_t.id,
            )
        )

    # add all the other tasks
    cts.extend(
        [
            dict(
                task_info=_pretty_task(
                    t.executions[0] if len(t.executions) > 0 else None,
                    t,
                    tz,
                    log_format=False,
                ),
                id=t.id,
            )
            for t in current_tasks
            if t.task_slug != "run_transformations"
        ]
    )
    return cts


@tracer.start_as_current_span("find_data")
def find_data(mavis, from_date=None, to_date=None, tasks=None):
    # if not tasks then get all
    last_week = utils.date_add(utils.utcnow(), "week", -1)

    task_executions = graph_client.get_last_executed_tasks(
        company_id=mavis.company.id,
        from_date=from_date or last_week,
        to_date=to_date or utils.utcnow(),
        category="processing",
    ).task_execution
    tz = mavis.company.timezone

    found_tasks = []

    for t in task_executions:
        if tasks is None or t.task.task_slug in tasks:
            found_tasks.append(dict(task_info=_pretty_task(t, t.task, tz)))

    return found_tasks


@tracer.start_as_current_span("_make_table_over_time_updates")
def _make_table_over_time_updates(mavis, task_executions, all_query_updates):
    # time zone
    tz = mavis.company.timezone
    traces = defaultdict(new_trace)
    for t in task_executions:
        if t.completed_at:
            count = defaultdict(list)
            # Get the toal Rows
            for q in all_query_updates:
                if t.started_at <= q.processed_at <= t.completed_at:
                    count[q.transformation.table].append(q)

            for k, qs in count.items():
                total_rows = sum([q.rows_inserted for q in qs])
                min_p = min([q.processed_at for q in qs])
                max_p = max([q.processed_at for q in qs])

                traces[k]["x"].append(utils.make_local(t.completed_at, tz))
                traces[k]["y"].append(total_rows)
                traces[k]["customdata"].append(dict(task_id=t.id))

                # add some text about it
                traces[k]["text"].append(
                    "<b>{}</b><br><b>Rows: {}</b><br><b>Duration: {}</b><br>Started At: {}<br>Completed At: {}<br>Task:{}".format(
                        k,
                        utils.human_format(total_rows),
                        utils.pretty_diff(min_p, max_p, "abs"),
                        utils.make_local(min_p, tz),
                        utils.make_local(max_p, tz),
                        utils.title(t.task.task_slug),
                    )
                )

                # traces[k]["visible"] = (
                #     qs[0].transformation.update_type.value != "materialized_view"
                # )
                traces[k]["text"][-1] += "<br>type: " + qs[0].transformation.update_type.value

            # for the zeros
            for k in traces.keys():
                if k not in count.keys():
                    traces[k]["x"].append(utils.make_local(t.completed_at, tz))
                    traces[k]["y"].append(0)
                    traces[k]["customdata"].append(dict(task_id=t.id))

                    traces[k]["text"].append(
                        "<b>{}</b><br><b>Rows: 0</b><br><b>{}</b>".format(
                            k,
                            ("Was Fully Up-to-date" if t.status == t.status.complete else "Failed Transformation"),
                        )
                    )

    # SORT THE X axis
    for k in traces.keys():
        (
            traces[k]["x"],
            traces[k]["y"],
            traces[k]["customdata"],
            traces[k]["text"],
        ) = zip(
            *sorted(
                zip(
                    traces[k]["x"],
                    traces[k]["y"],
                    traces[k]["customdata"],
                    traces[k]["text"],
                ),
                key=lambda pair: pair[0],
            )
        )

    task_plot = _make_plot(traces, "Rows Inserted by Table", "Rows Inserted", "Local Time", linewidth=1.5)
    return task_plot


@tracer.start_as_current_span("_make_transformation_over_time_updates")
def _make_transformation_over_time_updates(mavis, all_query_updates, is_duration=False):
    # time zone
    tz = mavis.company.timezone
    traces = defaultdict(new_trace)

    for q in all_query_updates:
        name = q.transformation.name

        if q.rows_inserted == 0 and len(traces[name]["y"]) > 0:
            if traces[name]["y"][-1] is not None:
                traces[name]["x"].append(utils.make_local(q.processed_at, tz))
                traces[name]["y"].append(None)
                traces[name]["text"].append(None)
        else:
            traces[name]["x"].append(utils.make_local(q.processed_at, tz))
            traces[name]["y"].append(q.rows_inserted if not is_duration else q.update_duration)
            traces[name]["visible"] = q.transformation.update_type.value != "materialized_view"
            # add some text about it
            traces[name]["text"].append(
                "<b>{}</b><br><b>Rows: {}</b><br><b>Synced Data</b><br>From: {} UTC<br>To: {}UTC<br><br>Update Duration: {}s".format(
                    name,
                    utils.human_format(q.rows_inserted),
                    q.from_sync_time[:19],
                    q.to_sync_time[:19],
                    utils.human_format(q.update_duration),
                )
            )

    # SORT THE X axis
    for k in traces.keys():
        (
            traces[k]["x"],
            traces[k]["y"],
            traces[k]["text"],
        ) = zip(
            *sorted(
                zip(
                    traces[k]["x"],
                    traces[k]["y"],
                    traces[k]["text"],
                ),
                key=lambda pair: pair[0],
            )
        )

    task_plot = _make_plot(
        traces,
        ("Rows Inserted by Transformation" if not is_duration else "Transformation Durations"),
        "Rows Inserted" if not is_duration else "Time to Update (Seconds)",
        "Local Time",
        linewidth=1.5,
    )
    return task_plot


@tracer.start_as_current_span("_make_task_execution_plot")
def _make_task_execution_plot(mavis, task_executions, name="Task Executions"):
    # time zone
    tz = mavis.company.timezone
    traces = defaultdict(new_trace)

    # get all the narratives
    narratives = graph_client.narrative_index(company_id=mavis.company.id)
    narrative_slugs = {n.slug: n.name for n in narratives.narrative}

    extra_lines = 0
    seen = []

    for t in task_executions:
        traces[t.status.value]["x"].extend(
            [
                utils.make_local(t.started_at, tz),
                utils.make_local(t.completed_at or utils.utcnow(), tz),
                None,
            ]
        )

        # remove the extra name
        if t.task.category == t.task.category.narratives:
            name = utils.title(narrative_slugs.get(t.task.task_slug[2:]) or "Deleted Narrative")

        elif t.task.category == t.task.category.materializations:
            name = utils.title(t.task.task_slug[2:])

        else:
            name = utils.title(t.task.task_slug)

        # properly space out the text
        short_name = utils.space_text(name, 25)
        if name not in seen:
            extra_lines += int(len(name) / 25)
            seen.append(name)

        traces[t.status.value]["y"].extend([short_name] * 3)
        traces[t.status.value]["customdata"].extend([dict(task_id=t.id)] * 3)
        traces[t.status.value]["text"].extend(
            [
                "<b>{}: {}</b><br>({})".format(
                    name,
                    t.status.value,
                    utils.pretty_diff(t.started_at, t.completed_at or utils.utcnow(), kind="abs"),
                )
            ]
            * 3
        )
    # color mapping
    colors = dict(complete="#008000", failed="#FF0000", running="#298dcc", cancelled="#ffb025")
    # update the trace colors
    for trace_name, t in traces.items():
        t["color"] = colors.get(trace_name)

    task_plot = _make_plot(traces, None, None, "Local Time", linewidth=5)
    task_plot["layout"]["yaxis"]["tickmode"] = "linear"
    task_plot["layout"]["height"] = max(
        240,
        120 + 16 * (extra_lines + len(set(t.task.task_slug for t in task_executions))),
    )
    return task_plot


@tracer.start_as_current_span("_pretty_task")
def _pretty_task(execution, task, tz, log_format=True):
    if execution is None:
        status = "👀 (Not Run Yet)"
    elif execution.status == execution.status.running:
        status = "🟡(Running)"
    elif execution.status == execution.status.complete:
        status = "🟢 (Success)"
    elif execution.status == execution.status.failed:
        status = "❌ (failed)"
    elif execution.status == execution.status.pending:
        status = "⏳ (pending)"

    if log_format:
        s_template = ["### {status} {slug}"]
    else:
        s_template = [
            "## {slug}",
            TASK_DESCRIPTIONS.get(task.task_slug) or "",
            "### Last Run: {status}",
        ]

    # create the row
    s_template = "\n\n".join(
        s_template
        + [
            " - *Completed:* {completed_at}",
            " - *started:* {started_at}",
            " - *Duration:* {duration}",
            " - *next run:* {next_run})",
        ]
    )

    format_data = dict(
        status=status,
        slug=utils.title(task.task_slug),
        next_run=utils.pretty_diff(utils.localnow(tz), utils.next_run(tz, task.schedule).isoformat(), "future"),
        completed_at="Not Run Yet",
        started_at="Not Run Yet",
        duration="Not Run Yet",
    )

    # if there is an execution
    if execution:
        format_data.update(
            completed_at=utils.human_format(execution.completed_at, "time", tz) or "RUNNING",
            started_at=utils.human_format(execution.started_at, "time", tz),
            duration=utils.pretty_diff(
                execution.started_at or utils.utcnow(),
                execution.completed_at or utils.utcnow(),
                None,
            ),
        )
    return s_template.format(**format_data)


@tracer.start_as_current_span("_make_plot")
def _make_plot(traces, title, y_axis, x_axis, linewidth=1.5):
    # handle showing all the transformations
    percent_hidden = len([v for v in traces.values() if not v.get("visible")]) * 1.0 / max(1, len(traces))

    if percent_hidden > 0.10:
        for v in traces.values():
            v["visible"] = True

    data = []
    for name, t in traces.items():
        data.append(
            dict(
                x=t["x"],
                y=t["y"],
                customdata=t.get("customdata"),
                hovertext=t.get("text"),
                hoverinfo="x+text",
                type="line",
                mode="markers" if t.get("marker") else "lines+markers",
                visible="legendonly" if not t.get("visible", True) else True,
                name=utils.title(name),
                line=dict(color=t.get("color"), width=linewidth),
                hoverlabel=dict(namelength=-1),
            )
        )

        if t.get("marker"):
            data[-1]["marker"] = t["marker"]

        if t.get("is_dash"):
            data[-1]["line"]["dash"] = "dash"
    y_char = 30
    plot = dict(
        data=data,
        layout=dict(
            height=480,
            title=(
                dict(
                    text=title,
                    standoff=30,
                    x=0.5,
                    yanchor="bottom",
                    font=dict(
                        color="#6c6c6c",
                        size=20,
                    ),
                )
                if title
                else False
            ),
            yaxis=dict(
                automargin=True,
                rangemode="tozero",
                zeroline=True,
                showline=True,
                showgrid=True,
                showticklabels=True,
                title=dict(
                    standoff=30,
                    text=y_axis,
                    font=dict(size=18),
                ),
            ),
            xaxis=dict(
                showspikes=True,
                spikethickness=0.5,
                spikemode="across",
                spikecolor="#5F6368",
                rangemode="tozero",
                showline=True,
                showgrid=True,
                showticklabels=True,
                title=dict(
                    text=x_axis,
                    font=dict(size=18),
                ),
            ),
            font=dict(family="Source Sans Pro", color="#878f9f", size=15),
            margin=dict(
                # FOR 16
                l=50 + 27 * len(utils.space_text(y_axis or "", y_char).split("<br>")),
                r=70,
                t=100 + 27 * len(utils.space_text(title or "", 140).split("<br>")),
            ),
            autosize=True,
            hovermode="closest",
        ),
    )

    # null out the top margin
    if title is None:
        plot["layout"]["margin"]["t"] = 24

    return plot


def new_trace():
    return dict(x=[], y=[], customdata=[], text=[])
