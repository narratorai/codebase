from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import (
    maintenance_kinds_enum,
    transformation_kinds_enum,
    transformation_update_types_enum,
)


class TransformationIndexWDependency(BaseModel):
    all_transformations: List["TransformationIndexWDependencyAllTransformations"]


class TransformationIndexWDependencyAllTransformations(BaseModel):
    id: Any
    kind: Optional[transformation_kinds_enum]
    updated_at: Any
    name: Optional[str]
    next_resync_at: Optional[Any]
    last_diff_data_and_insert_at: Optional[Any]
    has_source: Optional[bool]
    is_aliasing: Optional[bool]
    remove_customers: Optional[bool]
    mutable_day_window: Optional[int]
    delete_window: Optional[int]
    table: Optional[str]
    task_id: Optional[Any]
    slug: str
    update_type: Optional[transformation_update_types_enum]
    column_renames: List["TransformationIndexWDependencyAllTransformationsColumnRenames"]
    depends_on_transformations: List["TransformationIndexWDependencyAllTransformationsDependsOnTransformations"]
    activities: List["TransformationIndexWDependencyAllTransformationsActivities"]
    run_after_transformations: List["TransformationIndexWDependencyAllTransformationsRunAfterTransformations"]
    production_queries_aggregate: "TransformationIndexWDependencyAllTransformationsProductionQueriesAggregate"
    transformation_maintenances: List["TransformationIndexWDependencyAllTransformationsTransformationMaintenances"]
    query_updates: List["TransformationIndexWDependencyAllTransformationsQueryUpdates"]


class TransformationIndexWDependencyAllTransformationsColumnRenames(BaseModel):
    name: Optional[str]


class TransformationIndexWDependencyAllTransformationsDependsOnTransformations(BaseModel):
    depends_on_transformation_id: Any


class TransformationIndexWDependencyAllTransformationsActivities(BaseModel):
    activity: "TransformationIndexWDependencyAllTransformationsActivitiesActivity"


class TransformationIndexWDependencyAllTransformationsActivitiesActivity(BaseModel):
    id: Any
    slug: str
    row_count: Optional[int]
    name: Optional[str]
    activity_maintenances: List[
        "TransformationIndexWDependencyAllTransformationsActivitiesActivityActivityMaintenances"
    ]


class TransformationIndexWDependencyAllTransformationsActivitiesActivityActivityMaintenances(BaseModel):
    started_at: Any
    notes: Optional[str]
    kind: maintenance_kinds_enum
    id: Any


class TransformationIndexWDependencyAllTransformationsRunAfterTransformations(BaseModel):
    run_after_transformation_id: Any


class TransformationIndexWDependencyAllTransformationsProductionQueriesAggregate(BaseModel):
    aggregate: Optional["TransformationIndexWDependencyAllTransformationsProductionQueriesAggregateAggregate"]


class TransformationIndexWDependencyAllTransformationsProductionQueriesAggregateAggregate(BaseModel):
    count: int


class TransformationIndexWDependencyAllTransformationsTransformationMaintenances(BaseModel):
    started_at: Any
    notes: Optional[str]
    kind: maintenance_kinds_enum
    id: Any


class TransformationIndexWDependencyAllTransformationsQueryUpdates(BaseModel):
    rows_inserted: int
    from_sync_time: Any
    to_sync_time: Any


TransformationIndexWDependency.update_forward_refs()
TransformationIndexWDependencyAllTransformations.update_forward_refs()
TransformationIndexWDependencyAllTransformationsColumnRenames.update_forward_refs()
TransformationIndexWDependencyAllTransformationsDependsOnTransformations.update_forward_refs()
TransformationIndexWDependencyAllTransformationsActivities.update_forward_refs()
TransformationIndexWDependencyAllTransformationsActivitiesActivity.update_forward_refs()
TransformationIndexWDependencyAllTransformationsActivitiesActivityActivityMaintenances.update_forward_refs()
TransformationIndexWDependencyAllTransformationsRunAfterTransformations.update_forward_refs()
TransformationIndexWDependencyAllTransformationsProductionQueriesAggregate.update_forward_refs()
TransformationIndexWDependencyAllTransformationsProductionQueriesAggregateAggregate.update_forward_refs()
TransformationIndexWDependencyAllTransformationsTransformationMaintenances.update_forward_refs()
TransformationIndexWDependencyAllTransformationsQueryUpdates.update_forward_refs()
