from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import transformation_kinds_enum, transformation_update_types_enum


class GetFullTransformation(BaseModel):
    transformation: Optional["GetFullTransformationTransformation"]


class GetFullTransformationTransformation(BaseModel):
    id: Any
    slug: str
    name: Optional[str]
    updated_at: Any
    updated_by: Optional[Any]
    delete_window: Optional[int]
    has_source: Optional[bool]
    do_not_delete_on_resync: Optional[bool]
    is_aliasing: Optional[bool]
    kind: Optional[transformation_kinds_enum]
    max_days_to_insert: Optional[int]
    mutable_day_window: Optional[int]
    last_resynced_at: Optional[Any]
    next_resync_at: Optional[Any]
    task_id: Optional[Any]
    single_activity: Optional[bool]
    notify_row_count_percent_change: Optional[Any]
    do_not_update_on_percent_change: Optional[bool]
    remove_customers: Optional[bool]
    allow_future_data: Optional[bool]
    start_data_after: Optional[Any]
    table: Optional[str]
    update_type: Optional[transformation_update_types_enum]
    validation_queries: List["GetFullTransformationTransformationValidationQueries"]
    current_query: Optional["GetFullTransformationTransformationCurrentQuery"]
    production_queries: List["GetFullTransformationTransformationProductionQueries"]
    run_after_transformations: List["GetFullTransformationTransformationRunAfterTransformations"]
    depends_on_transformations: List["GetFullTransformationTransformationDependsOnTransformations"]
    activities: List["GetFullTransformationTransformationActivities"]


class GetFullTransformationTransformationValidationQueries(BaseModel):
    id: Optional[Any]


class GetFullTransformationTransformationCurrentQuery(BaseModel):
    sql: Optional[str]


class GetFullTransformationTransformationProductionQueries(BaseModel):
    id: Optional[Any]
    sql: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class GetFullTransformationTransformationRunAfterTransformations(BaseModel):
    run_after_transformation_id: Any


class GetFullTransformationTransformationDependsOnTransformations(BaseModel):
    depends_on_transformation_id: Any


class GetFullTransformationTransformationActivities(BaseModel):
    activity_id: Any
    activity: "GetFullTransformationTransformationActivitiesActivity"


class GetFullTransformationTransformationActivitiesActivity(BaseModel):
    id: Any
    slug: str
    name: Optional[str]


GetFullTransformation.update_forward_refs()
GetFullTransformationTransformation.update_forward_refs()
GetFullTransformationTransformationValidationQueries.update_forward_refs()
GetFullTransformationTransformationCurrentQuery.update_forward_refs()
GetFullTransformationTransformationProductionQueries.update_forward_refs()
GetFullTransformationTransformationRunAfterTransformations.update_forward_refs()
GetFullTransformationTransformationDependsOnTransformations.update_forward_refs()
GetFullTransformationTransformationActivities.update_forward_refs()
GetFullTransformationTransformationActivitiesActivity.update_forward_refs()
