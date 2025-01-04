import json

import boto3
from apscheduler.jobstores.base import JobLookupError

from core.logger import get_logger
from core.models.settings import settings

from .helpers import get_tz_adjusted_cron
from .scheduler import add_job, import_function, local_scheduler

sqs = boto3.client("sqs")
logger = get_logger()


def update_task(task_id: str, schedule: str, tz: str):
    """
    Updates the task's schedule
    """
    trigger = get_tz_adjusted_cron(schedule, tz)
    try:
        local_scheduler.modify_job(task_id, trigger=trigger)
        return True
    except JobLookupError:
        logger.warn("Task does not exist", task_id=task_id)
        return False


def create_task(
    task_id: str,
    function_name: str,
    function_path: str,
    kwargs: dict,
    schedule: str,
    tz: str,
):
    """
    Creates a new task in the scheduler
    """
    trigger = get_tz_adjusted_cron(schedule, tz)
    fn = import_function(function_name, function_path)

    add_job(task_id, trigger, fn=fn.send, kwargs=kwargs)


def delete_task(task_id: str):
    """
    Deletes a task from the scheduler
    """
    try:
        local_scheduler.remove_job(task_id)
    except JobLookupError:
        logger.warn("Task does not exist", task_id=task_id)


def process_message(message: dict):
    action = message["action"]
    task_id: str = message["task_id"]
    schedule: str = message.get("schedule", "")
    tz: str = message.get("timezone", "utc")

    logger.debug("Processing message", action=action, task_id=task_id, schedule=schedule, tz=tz)

    if action == "update_task":
        update_task(task_id, schedule, tz)
    elif action == "create_task":
        create_task(
            task_id,
            message["function_name"],
            message["function_path"],
            message.get("kwargs", {}),
            schedule,
            tz,
        )
    elif action == "delete_task":
        delete_task(task_id)
    else:
        logger.error(f"Unknown action: {action}")


def consume_messages():
    """
    Consumes messages from the SQS queue and processes them.

    It consumes uwing long polling for messages to reduce empty responses by allowing SQS to wait until a message
    is available.
    """
    response = sqs.receive_message(
        QueueUrl=settings.sqs_queue_url,
        AttributeNames=["All"],
        MessageAttributeNames=["All"],
        MaxNumberOfMessages=10,
        WaitTimeSeconds=5,
    )

    if "Messages" in response:
        for message in response["Messages"]:
            try:
                message_dict = json.loads(message["Body"])
                process_message(message_dict)
            except json.JSONDecodeError as e:
                logger.exception(e)
            finally:
                # Delete the message from the queue
                sqs.delete_message(
                    QueueUrl=settings.sqs_queue_url,
                    ReceiptHandle=message["ReceiptHandle"],
                )
