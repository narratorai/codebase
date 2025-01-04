from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import materialization_type_enum


class GetActivityDependency(BaseModel):
    all_activities: List["GetActivityDependencyAllActivities"]


class GetActivityDependencyAllActivities(BaseModel):
    id: Any
    name: Optional[str]
    category: Optional[str]
    description: Optional[str]
    company_table: Optional["GetActivityDependencyAllActivitiesCompanyTable"]
    datasets: List["GetActivityDependencyAllActivitiesDatasets"]
    transformations: List["GetActivityDependencyAllActivitiesTransformations"]


class GetActivityDependencyAllActivitiesCompanyTable(BaseModel):
    activity_stream: str


class GetActivityDependencyAllActivitiesDatasets(BaseModel):
    dataset: "GetActivityDependencyAllActivitiesDatasetsDataset"


class GetActivityDependencyAllActivitiesDatasetsDataset(BaseModel):
    id: Any
    slug: str
    name: str
    hide_from_index: Optional[bool]
    tags: List["GetActivityDependencyAllActivitiesDatasetsDatasetTags"]
    tags_aggregate: "GetActivityDependencyAllActivitiesDatasetsDatasetTagsAggregate"
    dependent_narratives: List["GetActivityDependencyAllActivitiesDatasetsDatasetDependentNarratives"]
    materializations: List["GetActivityDependencyAllActivitiesDatasetsDatasetMaterializations"]


class GetActivityDependencyAllActivitiesDatasetsDatasetTags(BaseModel):
    created_at: Optional[Any]


class GetActivityDependencyAllActivitiesDatasetsDatasetTagsAggregate(BaseModel):
    aggregate: Optional["GetActivityDependencyAllActivitiesDatasetsDatasetTagsAggregateAggregate"]


class GetActivityDependencyAllActivitiesDatasetsDatasetTagsAggregateAggregate(BaseModel):
    count: int


class GetActivityDependencyAllActivitiesDatasetsDatasetDependentNarratives(BaseModel):
    narrative: "GetActivityDependencyAllActivitiesDatasetsDatasetDependentNarrativesNarrative"


class GetActivityDependencyAllActivitiesDatasetsDatasetDependentNarrativesNarrative(BaseModel):
    id: Any
    slug: str
    last_viewed_at: Optional[Any]
    name: str
    tags: List["GetActivityDependencyAllActivitiesDatasetsDatasetDependentNarrativesNarrativeTags"]
    tags_aggregate: "GetActivityDependencyAllActivitiesDatasetsDatasetDependentNarrativesNarrativeTagsAggregate"


class GetActivityDependencyAllActivitiesDatasetsDatasetDependentNarrativesNarrativeTags(BaseModel):
    created_at: Optional[Any]


class GetActivityDependencyAllActivitiesDatasetsDatasetDependentNarrativesNarrativeTagsAggregate(BaseModel):
    aggregate: Optional[
        "GetActivityDependencyAllActivitiesDatasetsDatasetDependentNarrativesNarrativeTagsAggregateAggregate"
    ]


class GetActivityDependencyAllActivitiesDatasetsDatasetDependentNarrativesNarrativeTagsAggregateAggregate(BaseModel):
    count: int


class GetActivityDependencyAllActivitiesDatasetsDatasetMaterializations(BaseModel):
    task_id: Optional[Any]
    id: Any
    type: materialization_type_enum
    label: str


class GetActivityDependencyAllActivitiesTransformations(BaseModel):
    transformation: "GetActivityDependencyAllActivitiesTransformationsTransformation"


class GetActivityDependencyAllActivitiesTransformationsTransformation(BaseModel):
    id: Any
    name: Optional[str]
    production_queries: List["GetActivityDependencyAllActivitiesTransformationsTransformationProductionQueries"]


class GetActivityDependencyAllActivitiesTransformationsTransformationProductionQueries(BaseModel):
    sql: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[str]


GetActivityDependency.update_forward_refs()
GetActivityDependencyAllActivities.update_forward_refs()
GetActivityDependencyAllActivitiesCompanyTable.update_forward_refs()
GetActivityDependencyAllActivitiesDatasets.update_forward_refs()
GetActivityDependencyAllActivitiesDatasetsDataset.update_forward_refs()
GetActivityDependencyAllActivitiesDatasetsDatasetTags.update_forward_refs()
GetActivityDependencyAllActivitiesDatasetsDatasetTagsAggregate.update_forward_refs()
GetActivityDependencyAllActivitiesDatasetsDatasetTagsAggregateAggregate.update_forward_refs()
GetActivityDependencyAllActivitiesDatasetsDatasetDependentNarratives.update_forward_refs()
GetActivityDependencyAllActivitiesDatasetsDatasetDependentNarrativesNarrative.update_forward_refs()
GetActivityDependencyAllActivitiesDatasetsDatasetDependentNarrativesNarrativeTags.update_forward_refs()
GetActivityDependencyAllActivitiesDatasetsDatasetDependentNarrativesNarrativeTagsAggregate.update_forward_refs()
GetActivityDependencyAllActivitiesDatasetsDatasetDependentNarrativesNarrativeTagsAggregateAggregate.update_forward_refs()
GetActivityDependencyAllActivitiesDatasetsDatasetMaterializations.update_forward_refs()
GetActivityDependencyAllActivitiesTransformations.update_forward_refs()
GetActivityDependencyAllActivitiesTransformationsTransformation.update_forward_refs()
GetActivityDependencyAllActivitiesTransformationsTransformationProductionQueries.update_forward_refs()
