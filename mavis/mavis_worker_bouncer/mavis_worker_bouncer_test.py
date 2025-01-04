from datetime import datetime
from typing import List

import pytest

from core.graph.sync_client.get_all_tasks_processing_no_batch_halt import (
    GetAllTasksProcessingNoBatchHaltTasks,
)

from .main import (
    last_supposed_schedule_time,
    last_supposed_schedule_time_min,
    local_time,
    worker_is_stuck,
)

# cron schedule
# |------------------------------- Minute (0-59)
# |     |------------------------- Hour (0-23)
# |     |     |------------------- Day of the month (1-31)
# |     |     |     |------------- Month (1-12; or JAN to DEC)
# |     |     |     |     |------- Day of the week (0-6; or SUN to SAT; or 7 for Sunday)
# |     |     |     |     |
# |     |     |     |     |
# *     *     *     *     *


def test_last_supposed_schedule_time():
    cron_schedule = "*/5 * * * *"
    base = datetime(2024, 5, 10, 6, 10)
    res = last_supposed_schedule_time(cron_schedule, base)
    assert res == local_time(datetime(2024, 5, 10, 6, 5)), "should be 2024-05-10 06:05:00"

    cron_schedule = "0 1 5 * *"
    base = datetime(2024, 5, 10, 6, 10)
    res = last_supposed_schedule_time(cron_schedule, base)
    assert res == local_time(datetime(2024, 5, 5, 1)), "should be 2024-05-05 01:00:00"


def test_last_supposed_schedule_time_min():
    base = local_time(datetime(2024, 5, 25, 11, 59))
    tasks: List[GetAllTasksProcessingNoBatchHaltTasks] = [
        GetAllTasksProcessingNoBatchHaltTasks(schedule="0 0 29 * *", task_slug="test", executions=[]),
        GetAllTasksProcessingNoBatchHaltTasks(schedule="0 0 28 * *", task_slug="test", executions=[]),
    ]
    last_supposed_scheduled_min = last_supposed_schedule_time_min(tasks, base)
    assert last_supposed_scheduled_min == local_time(datetime(2024, 4, 28)), "should be 2024-04-28 00:00:00"


def test_last_supposed_schedule_time_min_schedule_fixed():
    with pytest.raises(ValueError) as excinfo:
        base = local_time(datetime(2024, 5, 25, 11, 59))
        tasks: List[GetAllTasksProcessingNoBatchHaltTasks] = [
            GetAllTasksProcessingNoBatchHaltTasks(id="foo", schedule="? * * * *", task_slug="test", executions=[])
        ]
        last_supposed_scheduled_min = last_supposed_schedule_time_min(tasks, base)
    assert str(excinfo.value) == "No valid schedule or created_at found for task foo"

    base = local_time(datetime(2024, 4, 28))
    tasks: List[GetAllTasksProcessingNoBatchHaltTasks] = [
        GetAllTasksProcessingNoBatchHaltTasks(
            schedule="? * * * *",
            task_slug="test",
            executions=[{"status": "complete", "created_at": "2024-04-20T00:00:00.452195+00:00"}],
        ),
    ]
    last_supposed_scheduled_min = last_supposed_schedule_time_min(tasks, base)
    assert last_supposed_scheduled_min == local_time(
        local_time(datetime(2024, 4, 27, 23))
    ), "should be 2024-04-27 23:00:00"


def test_worker_is_stuck():
    tasks: List[GetAllTasksProcessingNoBatchHaltTasks] = [
        GetAllTasksProcessingNoBatchHaltTasks(
            schedule="*/5 * * * *",
            task_slug="test",
            executions=[
                {
                    "status": "complete",
                    "started_at": "2024-06-12T16:08:00.166863+00:00",
                },
            ],
        ),
        GetAllTasksProcessingNoBatchHaltTasks(schedule="*/3 * * * *", task_slug="test", executions=[]),
    ]
    last_supposed_scheduled_min = datetime.fromisoformat("2024-06-12T16:20:00.166863+00:00")
    now = datetime(2024, 6, 12, 16, 38)
    assert worker_is_stuck(
        tasks, last_supposed_scheduled_min, now
    ), "should return True when started_at is before last_supposed_scheduled_min and before thirty_minutes_ago"

    tasks: List[GetAllTasksProcessingNoBatchHaltTasks] = [
        GetAllTasksProcessingNoBatchHaltTasks(
            schedule="*/5 * * * *",
            task_slug="test",
            executions=[
                {
                    "status": "complete",
                    "started_at": "2024-06-12T16:08:00.166863+00:00",
                },
            ],
        ),
    ]
    last_supposed_scheduled_min = local_time(datetime.fromisoformat("2024-06-12T16:20:00.166863+00:00"))
    now = datetime.fromisoformat("2024-06-12T16:08:00.166863+00:00")
    assert not worker_is_stuck(
        tasks, last_supposed_scheduled_min, now
    ), "should return False when started_at is before last_supposed_scheduled_min but after thirty_minutes_ago"

    tasks: List[GetAllTasksProcessingNoBatchHaltTasks] = [
        GetAllTasksProcessingNoBatchHaltTasks(
            schedule="*/5 * * * *",
            task_slug="test",
            executions=[
                {
                    "status": "complete",
                    "started_at": "2024-06-12T16:08:00.166863+00:00",
                },
            ],
        ),
    ]
    last_supposed_scheduled_min = datetime.fromisoformat("2024-06-12T16:07:00.166863+00:00")
    now = datetime.fromisoformat("2024-06-12T16:39:00.166863+00:00")
    assert not worker_is_stuck(
        tasks, last_supposed_scheduled_min, now
    ), "should return False when started_at is after last_supposed_scheduled_min but before thirty_minutes_ago"

    tasks: List[GetAllTasksProcessingNoBatchHaltTasks] = [
        GetAllTasksProcessingNoBatchHaltTasks(
            schedule="*/5 * * * *",
            task_slug="test",
            executions=[
                {
                    "status": "complete",
                    "started_at": "2024-06-12T16:31:00.166863+00:00",
                },
            ],
        ),
    ]
    last_supposed_scheduled_min = datetime.fromisoformat("2024-06-12T16:30:00.166863+00:00")
    now = datetime.fromisoformat("2024-06-12T16:31:00.166863+00:00")
    assert not worker_is_stuck(
        tasks, last_supposed_scheduled_min, now
    ), "should return False when started_at is after last_supposed_scheduled_min and after thirty_minutes_ago"


def test_local_time():
    local = local_time(datetime.now())
    assert local.tzinfo

    utc = datetime.fromisoformat("2014-10-06T16:00:00+00:00")
    est = datetime.fromisoformat("2014-10-06T12:00:00-04:00")
    assert utc == est

    utc_local = local_time(utc)
    assert utc_local == est
