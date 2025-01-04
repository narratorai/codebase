from typing import Any, Optional

from .base_model import BaseModel


class DeleteNarrative(BaseModel):
    delete_narrative_by_pk: Optional["DeleteNarrativeDeleteNarrativeByPk"]


class DeleteNarrativeDeleteNarrativeByPk(BaseModel):
    id: Any


DeleteNarrative.update_forward_refs()
DeleteNarrativeDeleteNarrativeByPk.update_forward_refs()
