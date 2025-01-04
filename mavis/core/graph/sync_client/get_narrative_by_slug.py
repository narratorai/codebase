from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import narrative_types_enum, status_enum


class GetNarrativeBySlug(BaseModel):
    narrative: List["GetNarrativeBySlugNarrative"]


class GetNarrativeBySlugNarrative(BaseModel):
    id: Any
    created_at: Any
    name: str
    type: Optional[narrative_types_enum]
    slug: str
    description: Optional[str]
    state: status_enum
    created_by: Any
    narrative_runs: List["GetNarrativeBySlugNarrativeNarrativeRuns"]
    narrative_datasets: List["GetNarrativeBySlugNarrativeNarrativeDatasets"]


class GetNarrativeBySlugNarrativeNarrativeRuns(BaseModel):
    is_actionable: Optional[bool]
    created_at: Any
    s3_key: str


class GetNarrativeBySlugNarrativeNarrativeDatasets(BaseModel):
    dataset: "GetNarrativeBySlugNarrativeNarrativeDatasetsDataset"


class GetNarrativeBySlugNarrativeNarrativeDatasetsDataset(BaseModel):
    id: Any
    slug: str
    name: str


GetNarrativeBySlug.update_forward_refs()
GetNarrativeBySlugNarrative.update_forward_refs()
GetNarrativeBySlugNarrativeNarrativeRuns.update_forward_refs()
GetNarrativeBySlugNarrativeNarrativeDatasets.update_forward_refs()
GetNarrativeBySlugNarrativeNarrativeDatasetsDataset.update_forward_refs()
