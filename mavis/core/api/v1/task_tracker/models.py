from enum import Enum

from pydantic import BaseModel


class PlotSlugEnum(str, Enum):
    TASK_EXECUTION = "task_execution"
    PROCESSING = "processing"
    MATERIALIZATION = "materializations"
    ALERTS = "alerts"
    NARRATIVES = "narratives"
    TABLE_UPDATES = "table_updates"
    TRANSFORMATION_UPDATES = "transformation_updates"
    TRANSFORMATION_DURATIONS = "transformation_duration"


class BlockPlot(BaseModel):
    type: str = "block_plot"
    value: dict | None
