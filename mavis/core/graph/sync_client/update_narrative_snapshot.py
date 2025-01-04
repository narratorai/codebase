from typing import Any, Optional

from .base_model import BaseModel


class UpdateNarrativeSnapshot(BaseModel):
    update_narrative_by_pk: Optional["UpdateNarrativeSnapshotUpdateNarrativeByPk"]


class UpdateNarrativeSnapshotUpdateNarrativeByPk(BaseModel):
    id: Any


UpdateNarrativeSnapshot.update_forward_refs()
UpdateNarrativeSnapshotUpdateNarrativeByPk.update_forward_refs()
