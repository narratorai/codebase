from typing import Any, List, Optional

from .base_model import BaseModel


class GetNarrativeSnapshots(BaseModel):
    narrative_by_pk: Optional["GetNarrativeSnapshotsNarrativeByPk"]


class GetNarrativeSnapshotsNarrativeByPk(BaseModel):
    id: Any
    narrative_runs: List["GetNarrativeSnapshotsNarrativeByPkNarrativeRuns"]


class GetNarrativeSnapshotsNarrativeByPkNarrativeRuns(BaseModel):
    id: Any
    created_at: Any
    s3_key: str


GetNarrativeSnapshots.update_forward_refs()
GetNarrativeSnapshotsNarrativeByPk.update_forward_refs()
GetNarrativeSnapshotsNarrativeByPkNarrativeRuns.update_forward_refs()
