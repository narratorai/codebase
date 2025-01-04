from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import materialization_type_enum, status_enum


class GetActivityDependencies(BaseModel):
    activity_by_pk: Optional["GetActivityDependenciesActivityByPk"]


class GetActivityDependenciesActivityByPk(BaseModel):
    id: Any
    slug: str
    name: Optional[str]
    table_id: Optional[Any]
    datasets: List["GetActivityDependenciesActivityByPkDatasets"]


class GetActivityDependenciesActivityByPkDatasets(BaseModel):
    dataset: "GetActivityDependenciesActivityByPkDatasetsDataset"


class GetActivityDependenciesActivityByPkDatasetsDataset(BaseModel):
    id: Any
    slug: str
    name: str
    tags: List["GetActivityDependenciesActivityByPkDatasetsDatasetTags"]
    materializations: List["GetActivityDependenciesActivityByPkDatasetsDatasetMaterializations"]
    dependent_narratives: List["GetActivityDependenciesActivityByPkDatasetsDatasetDependentNarratives"]


class GetActivityDependenciesActivityByPkDatasetsDatasetTags(BaseModel):
    updated_at: Optional[Any]
    company_tag: Optional["GetActivityDependenciesActivityByPkDatasetsDatasetTagsCompanyTag"]


class GetActivityDependenciesActivityByPkDatasetsDatasetTagsCompanyTag(BaseModel):
    user: Optional["GetActivityDependenciesActivityByPkDatasetsDatasetTagsCompanyTagUser"]


class GetActivityDependenciesActivityByPkDatasetsDatasetTagsCompanyTagUser(BaseModel):
    email: str


class GetActivityDependenciesActivityByPkDatasetsDatasetMaterializations(BaseModel):
    task_id: Optional[Any]
    label: str
    id: Any
    type: materialization_type_enum
    column_id: Optional[str]


class GetActivityDependenciesActivityByPkDatasetsDatasetDependentNarratives(BaseModel):
    narrative: "GetActivityDependenciesActivityByPkDatasetsDatasetDependentNarrativesNarrative"


class GetActivityDependenciesActivityByPkDatasetsDatasetDependentNarrativesNarrative(BaseModel):
    task_id: Optional[Any]
    id: Any
    slug: str
    name: str
    state: status_enum


GetActivityDependencies.update_forward_refs()
GetActivityDependenciesActivityByPk.update_forward_refs()
GetActivityDependenciesActivityByPkDatasets.update_forward_refs()
GetActivityDependenciesActivityByPkDatasetsDataset.update_forward_refs()
GetActivityDependenciesActivityByPkDatasetsDatasetTags.update_forward_refs()
GetActivityDependenciesActivityByPkDatasetsDatasetTagsCompanyTag.update_forward_refs()
GetActivityDependenciesActivityByPkDatasetsDatasetTagsCompanyTagUser.update_forward_refs()
GetActivityDependenciesActivityByPkDatasetsDatasetMaterializations.update_forward_refs()
GetActivityDependenciesActivityByPkDatasetsDatasetDependentNarratives.update_forward_refs()
GetActivityDependenciesActivityByPkDatasetsDatasetDependentNarrativesNarrative.update_forward_refs()
