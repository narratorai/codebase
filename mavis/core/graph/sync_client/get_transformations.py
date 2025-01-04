from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import (
    maintenance_kinds_enum,
    task_execution_status_enum,
    transformation_kinds_enum,
    transformation_update_types_enum,
)


class GetTransformations(BaseModel):
    transformation: List["GetTransformationsTransformation"]


class GetTransformationsTransformation(BaseModel):
    id: Any
    slug: str
    name: Optional[str]
    created_at: Any
    updated_at: Any
    table: Optional[str]
    kind: Optional[transformation_kinds_enum]
    next_resync_at: Optional[Any]
    update_type: Optional[transformation_update_types_enum]
    delete_window: Optional[int]
    has_source: Optional[bool]
    is_aliasing: Optional[bool]
    remove_customers: Optional[bool]
    do_not_delete_on_resync: Optional[bool]
    notify_row_count_percent_change: Optional[Any]
    validation_queries: List["GetTransformationsTransformationValidationQueries"]
    run_after_transformations: List["GetTransformationsTransformationRunAfterTransformations"]
    depends_on_transformations: List["GetTransformationsTransformationDependsOnTransformations"]
    current_query: Optional["GetTransformationsTransformationCurrentQuery"]
    production_queries: List["GetTransformationsTransformationProductionQueries"]
    company_task: Optional["GetTransformationsTransformationCompanyTask"]
    transformation_maintenances: List["GetTransformationsTransformationTransformationMaintenances"]
    activities: List["GetTransformationsTransformationActivities"]


class GetTransformationsTransformationValidationQueries(BaseModel):
    id: Optional[Any]


class GetTransformationsTransformationRunAfterTransformations(BaseModel):
    id: int


class GetTransformationsTransformationDependsOnTransformations(BaseModel):
    id: int


class GetTransformationsTransformationCurrentQuery(BaseModel):
    sql: Optional[str]


class GetTransformationsTransformationProductionQueries(BaseModel):
    id: Optional[Any]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class GetTransformationsTransformationCompanyTask(BaseModel):
    id: Any
    executions: List["GetTransformationsTransformationCompanyTaskExecutions"]


class GetTransformationsTransformationCompanyTaskExecutions(BaseModel):
    started_at: Optional[Any]
    status: task_execution_status_enum


class GetTransformationsTransformationTransformationMaintenances(BaseModel):
    id: Any
    kind: maintenance_kinds_enum
    started_at: Any
    notes: Optional[str]


class GetTransformationsTransformationActivities(BaseModel):
    activity: "GetTransformationsTransformationActivitiesActivity"


class GetTransformationsTransformationActivitiesActivity(BaseModel):
    id: Any
    name: Optional[str]


GetTransformations.update_forward_refs()
GetTransformationsTransformation.update_forward_refs()
GetTransformationsTransformationValidationQueries.update_forward_refs()
GetTransformationsTransformationRunAfterTransformations.update_forward_refs()
GetTransformationsTransformationDependsOnTransformations.update_forward_refs()
GetTransformationsTransformationCurrentQuery.update_forward_refs()
GetTransformationsTransformationProductionQueries.update_forward_refs()
GetTransformationsTransformationCompanyTask.update_forward_refs()
GetTransformationsTransformationCompanyTaskExecutions.update_forward_refs()
GetTransformationsTransformationTransformationMaintenances.update_forward_refs()
GetTransformationsTransformationActivities.update_forward_refs()
GetTransformationsTransformationActivitiesActivity.update_forward_refs()
