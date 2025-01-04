from datetime import UTC
from datetime import datetime as dt

from fastapi import APIRouter, Depends, status

from core import utils
from core.api.auth import get_mavis
from core.constants import STATUS_COLORS
from core.graph import graph_client
from core.logger import get_logger
from core.models.ids import UUIDStr
from core.v4.datasetPlotter import AntVPlot
from core.v4.mavis import Mavis

from .helpers import delete_task
from .models import BlockPlot, PlotSlugEnum

router = APIRouter(prefix="/task_tracker", tags=["task_tracker"])
logger = get_logger()


@router.get("/plot", response_model=BlockPlot)
async def get_plot(
    plot_slug: PlotSlugEnum,
    start_date: str | None = None,
    resolution: str | None = None,
    duration: int | None = None,
    mavis: Mavis = Depends(get_mavis),
):
    """Create one of the supported plots for the task tracker."""
    # define the start data
    if resolution and duration:
        start_date = utils.date_add(utils.utcnow(), resolution, -duration)

    # get the from date
    from_time = (start_date or utils.date_add(utils.utcnow(), "day", -3))[:19]

    dt_start_date = utils.todt(from_time)
    utc_now = dt.now(UTC)

    # simplified formatting
    if dt_start_date.month == utc_now.month:
        use_format = "time_day_local"
    else:
        use_format = "time_day_month_local"

    if plot_slug in (
        PlotSlugEnum.PROCESSING,
        PlotSlugEnum.MATERIALIZATION,
        PlotSlugEnum.NARRATIVES,
        PlotSlugEnum.PROCESSING,
        PlotSlugEnum.ALERTS,
    ):
        task_executions = graph_client.get_last_executed_tasks(
            mavis.company.id, from_time, plot_slug.value
        ).task_execution

        data = []
        colors = {}
        unique_slugs = set()

        for t in task_executions:
            unique_slugs.add(t.task.task_slug)

            r = dict(
                process=utils.title(t.task.task_slug),
                color_field=f"{t.task.task_slug} - {t.status.value}",
                status=f"<b>{t.status.value}</b>",
                duration=(
                    utils.pretty_diff(t.started_at, t.completed_at, "second")
                    if t.completed_at
                    else f'running since {utils.pretty_diff(t.started_at, utils.utcnow(), "second")}'
                ),
                error=t.details["error"] if t.details.get("error") else "-",
                trace=(
                    f'<a href="http://ui.honeycomb.io/narrator-ai/datasets/mavis-worker/trace?trace_id={t.details["trace_context"].get("trace_id")}&trace_start_ts={int(utils.unix_time(t.started_at)-10)}&trace_end_ts={int(utils.unix_time(t.completed_at or utils.utcnow()) +5)}"  target="_blank">link</a>'
                    if t.details.get("trace_context")
                    else "-"
                ),
            )

            data.append(r | {"date": t.started_at})
            data.extend(
                (
                    r | {"date": t.completed_at or utils.utcnow()},
                    r
                    | dict(
                        date=t.completed_at or utils.utcnow(),
                        process=None,
                    ),
                )
            )

            # Add the data as needed
            if colors.get(r["color_field"]) is None:
                colors[r["color_field"]] = STATUS_COLORS[t.status.value]

        # Add the tool tip fields
        tooltip_fields = ["process", "duration"]
        if mavis.user.is_internal_admin:
            tooltip_fields.append("trace")

        plot_config = AntVPlot(
            chart_type="line",
            config=dict(),  # For dataset
            plot_config=dict(
                data=data,
                xField="date",
                yField="process",
                seriesField="color_field",
                meta=dict(
                    date=dict(alias="Time", narrator_format="time_relative_local"),
                    process=dict(alias="Process"),
                    status=dict(alias="Status"),
                    duration=dict(alias="Duration"),
                    started_at=dict(alias="Start Time", narrator_format="time_local"),
                    completed_at=dict(alias="Complete Time", narrator_format="time_local"),
                ),
                color=list(colors.values()),
                lineStyle=dict(lineWidth=5),
                xAxis=dict(type="time"),
                yAxis=dict(label=dict(narrator_format="short_string")),
                tooltip=dict(
                    fields=tooltip_fields,
                    enterable=mavis.user.is_internal_admin,
                    position="bottom",
                    showMarkers=False,
                    shared=False,
                ),
                legend=False,
                point=dict(size=2, shape="circle"),
                slider=dict(start=0, end=1, narrator_format=use_format),
            ),
            height=max(300, 50 + 25 * len(unique_slugs)),
        )

    elif plot_slug in (
        PlotSlugEnum.TRANSFORMATION_DURATIONS,
        PlotSlugEnum.TRANSFORMATION_UPDATES,
    ):
        all_query_updates = graph_client.get_transformation_query_updates(mavis.company.id, from_time).query_updates
        data = [
            dict(
                processed_at=q.processed_at,
                rows_inserted=q.rows_inserted if q.rows_inserted else None,
                update_duration=q.update_duration,
                pretty_duration=q.update_duration,
                transformation=q.transformation.name,
                update_type=q.transformation.update_type,
            )
            for q in all_query_updates
            if q.rows_inserted != 0
        ]

        plot_config = AntVPlot(
            chart_type="scatter",
            config=dict(),  # For dataset
            plot_config=dict(
                data=data,
                xField="processed_at",
                yField=("rows_inserted" if plot_slug == PlotSlugEnum.TRANSFORMATION_UPDATES else "update_duration"),
                colorField="transformation",
                meta=dict(
                    rows_inserted=dict(alias="Rows Inserted"),
                    processed_at=dict(alias="Updated At", narrator_format="time_relative_local"),
                    update_duration=dict(alias="Duration"),
                    pretty_duration=dict(alias="Duration", narrator_format="duration"),
                    transformation=dict(alias="transformation"),
                    update_type=dict(alias="Update Type"),
                ),
                title=dict(
                    visible=True,
                    text=(
                        "Rows Inserted by Transformation over Time"
                        if plot_slug == PlotSlugEnum.TRANSFORMATION_UPDATES
                        else "Update Duration by Transformation over Time"
                    ),
                ),
                shape="circle",
                legend=dict(
                    layout="horizontal",
                    position="right",
                    maxRow=17,
                ),
                tooltip=dict(
                    fields=[
                        "transformation",
                        "update_type",
                        "processed_at",
                        "rows_inserted",
                        "pretty_duration",
                    ],
                ),
                colors=mavis.company.plot_colors,
                xAxis=dict(type="time", autoHide=True),
                yAxis=dict(tickMethod="r-pretty", label=dict(narrator_format="number")),
                slider=dict(start=0, end=1, narrator_format=use_format),
                interactions=[
                    dict(type="element-highlight-by-color"),
                    dict(type="element-link"),
                ],
            ),
            height=400,
        )
    else:
        raise ValueError("Plot not supported")

    return dict(
        type="block_plot",
        value=plot_config.dict(),
    )


@router.delete("/task/{task_id}", status_code=status.HTTP_200_OK)
async def delete(task_id: UUIDStr, mavis: Mavis = Depends(get_mavis)):
    delete_task(mavis, task_id)
