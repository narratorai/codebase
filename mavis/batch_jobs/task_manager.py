import importlib
import json
from collections.abc import Callable
from dataclasses import dataclass, field

import boto3
from dramatiq import Actor, Message
from dramatiq_abort import abort

from core.graph import graph_client
from core.graph.sync_client.enums import company_task_category_enum
from core.graph.sync_client.get_single_task import GetSingleTaskCompanyTaskByPk
from core.logger import get_logger
from core.models.ids import UUIDStr
from core.models.settings import settings

sqs = boto3.client("sqs")
logger = get_logger()


@dataclass
class TaskExecution:
    task_id: str
    message_id: str
    status: str
    started_at: int
    finished_at: int


@dataclass
class Task:
    id: UUIDStr | None
    company_id: UUIDStr
    slug: str
    label: str | None
    category: company_task_category_enum
    description: str | None

    fn: Callable
    kwargs: dict
    schedule: str
    timezone: str = "UTC"

    internal_only: bool = False


@dataclass
class UINotifier:
    @staticmethod
    def create(task: Task) -> UUIDStr:
        """
        Creates a task record in graph.
        """
        task_id = graph_client.insert_task(
            company_id=task.company_id,
            slug=task.slug,
            label=task.label,
            description=task.description,
            category=task.category,
            internal_only=task.internal_only,
            schedule=task.schedule,
            function_name=task.fn.__name__,
            function_path=task.fn.__module__,
            kwargs=json.dumps({k: v for k, v in task.kwargs.items() if k not in ("company_slug", "task_id")}),
        ).inserted_task.id
        return task_id

    @staticmethod
    def update_schedule(task_id: UUIDStr, schedule: str):
        """
        Updates the schedule of a task.
        """
        graph_client.update_task_schedule(id=task_id, schedule=schedule)

    @staticmethod
    def cancel(task_execution_id: UUIDStr, user_id: UUIDStr):
        graph_client.record_task_cancelled(
            task_execution_id=task_execution_id,
            details={"cancelled": True, "cancelled_by_user": user_id},
        )

    @staticmethod
    def delete(task_id: UUIDStr):
        """
        Deletes a task record in graph.
        """
        try:
            graph_client.execute(
                """
                mutation DeleteTask($id: uuid!) {
                    delete_company_task_by_pk(id: $id) {
                        id
                    }
                }
                """,
                dict(id=task_id),
            )

            logger.info("Task deleted", id=task_id)
            return True
        except IndexError:
            logger.error("Task does not exist", id=task_id)
            return False


@dataclass
class Scheduler:
    """
    Wrapper around instances of APScheduler
    """

    @staticmethod
    def create(task: Task):
        """
        Schedules a task, converts the local task timezone to UTC
        """
        sqs.send_message(
            QueueUrl=settings.sqs_queue_url,
            MessageBody=json.dumps(
                dict(
                    action="create_task",
                    task_id=task.id,
                    function_name=task.fn.__name__,
                    function_path=task.fn.__module__,
                    kwargs=task.kwargs,
                    schedule=task.schedule,
                    timezone=task.timezone,
                )
            ),
        )

    @staticmethod
    def update_schedule(id: UUIDStr, schedule: str, tz: str):
        """
        Updates the task's schedule
        """
        sqs.send_message(
            QueueUrl=settings.sqs_queue_url,
            MessageBody=json.dumps(
                dict(
                    action="update_task",
                    task_id=id,
                    schedule=schedule,
                    timezone=tz,
                )
            ),
        )

    @staticmethod
    def delete(id: UUIDStr):
        """
        Deletes a task from scheduler
        """
        sqs.send_message(
            QueueUrl=settings.sqs_queue_url,
            MessageBody=json.dumps(
                dict(
                    action="delete_task",
                    task_id=id,
                )
            ),
        )


@dataclass
class TaskManager:
    """
    Class to coordinate task operations between graph, scheduler and task runner.
    """

    scheduler: Scheduler = field(default_factory=Scheduler)
    ui_notifier: UINotifier = field(default_factory=UINotifier)

    def create(
        self,
        company_id: UUIDStr,
        slug: str,
        label: str | None,
        category: str,
        description: str | None,
        fn: Callable,
        kwargs: dict,
        schedule: str,
        timezone: str,
        internal_only,
    ):
        """
        Creates a task and its triggers, stores the data in graph.
        """
        task = Task(
            id=None,
            company_id=company_id,
            slug=slug,
            label=label,
            category=category,
            description=description,
            fn=fn.fn if isinstance(fn, Actor) else fn,
            kwargs=kwargs,
            schedule=schedule,
            timezone=timezone,
            internal_only=internal_only,
        )

        task_id = self.ui_notifier.create(task)
        task.id = task_id
        self.scheduler.create(task)

        return task_id

    def update_schedule(self, id: UUIDStr, schedule: str, timezone: str):
        """
        Updates a task
        """
        self.ui_notifier.update_schedule(id, schedule)
        self.scheduler.update_schedule(id, schedule, timezone)
        return True

    @staticmethod
    def run(id: UUIDStr):
        task = graph_client.get_single_task(id=id).company_task_by_pk
        if task:
            logger.info("Running task", task=task)
            return run_background_fn(task)

    def cancel(self, task_execution_id: UUIDStr, user_id: UUIDStr):
        """
        Cancels a task currently running. Tasks do not run in the scheduler but in the background worker.
        """
        task_execution = graph_client.get_task_execution(task_execution_id=task_execution_id).task_execution_by_pk

        if not task_execution:
            return None
        elif task_execution.status == task_execution.status.running:
            logger.info("Cancelling task", id=task_execution.task_id)

            # cancelling the execution
            self.ui_notifier.cancel(task_execution_id, user_id)
            orchestration_id = task_execution.orchestration_id
            if orchestration_id:
                abort(orchestration_id)
            return orchestration_id

    def delete(self, id: UUIDStr):
        self.ui_notifier.delete(id)
        self.scheduler.delete(id)


def run_background_fn(task: GetSingleTaskCompanyTaskByPk) -> Message | None:
    if not task.function_path:
        logger.error("Task has no function path", task=task)
        return None

    module = importlib.import_module(task.function_path)
    function = getattr(module, task.function_name)
    kwargs = dict(company_slug=task.company.slug, task_id=task.id) | (json.loads(task.kwargs or "{}"))
    return function.send(**kwargs)


task_manager = TaskManager()
