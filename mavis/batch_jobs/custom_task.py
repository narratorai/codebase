from dataclasses import dataclass
from enum import StrEnum

from pydantic import BaseModel, Field

from core.s3_data import S3Data


class TaskKindEnum(StrEnum):
    materialization = "materialization"
    validation = "validation"
    run_transformation = "run_transformation"


class EachTask(BaseModel):
    task: str
    completed: bool = False
    details: dict = Field(default_factory=dict)

    def complete(self):
        self.completed = True


@dataclass
class CustomTask:
    s3: S3Data
    kind: TaskKindEnum
    id: str = "all"
    tasks: list[EachTask] = Field(default_factory=list)
    start_empty: bool = False

    def __post_init__(self):
        if task := self.s3.get_file([self.kind, "tasks", f"{self.id}.json"]):
            self.tasks = [EachTask(**t) for t in task["tasks"]]
            self.start_empty = len(self.tasks) == 0
        else:
            self.tasks = []

    def to_dict(self):
        return dict(tasks=[t.dict() for t in self.tasks if not t.completed])

    def update(self):
        # do not bother updating if nothing happened
        if self.start_empty and len(self.tasks) == 0:
            return None
        return self.s3.upload_object(self.to_dict(), [self.kind, "tasks", f"{self.id}.json"])

    def add_task(self, task_slug: str, **kwargs):
        self.tasks.append(EachTask(task=task_slug, details=kwargs))

    def get(self, task_slug: str) -> EachTask | None:
        return next((t for t in self.tasks if t.task == task_slug), None)

    def clear(self):
        self.tasks = []
