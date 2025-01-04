from typing import Any, Optional

from .base_model import BaseModel


class InsertNarrativeRun(BaseModel):
    insert_narrative_runs_one: Optional["InsertNarrativeRunInsertNarrativeRunsOne"]


class InsertNarrativeRunInsertNarrativeRunsOne(BaseModel):
    id: Any


InsertNarrativeRun.update_forward_refs()
InsertNarrativeRunInsertNarrativeRunsOne.update_forward_refs()
