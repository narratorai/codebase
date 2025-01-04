from typing import Any, Optional

from .base_model import BaseModel


class UpdateNarrativeConfig(BaseModel):
    update_narrative_by_pk: Optional["UpdateNarrativeConfigUpdateNarrativeByPk"]


class UpdateNarrativeConfigUpdateNarrativeByPk(BaseModel):
    id: Any


UpdateNarrativeConfig.update_forward_refs()
UpdateNarrativeConfigUpdateNarrativeByPk.update_forward_refs()
