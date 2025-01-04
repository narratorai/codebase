from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import (
    company_query_alert_kinds_enum,
    transformation_kinds_enum,
    transformation_update_types_enum,
)


class GetTransformationContext(BaseModel):
    transformation: Optional["GetTransformationContextTransformation"]


class GetTransformationContextTransformation(BaseModel):
    id: Any
    created_at: Any
    kind: Optional[transformation_kinds_enum]
    slug: str
    table: Optional[str]
    update_type: Optional[transformation_update_types_enum]
    updated_at: Any
    current_query: Optional["GetTransformationContextTransformationCurrentQuery"]
    column_renames: List["GetTransformationContextTransformationColumnRenames"]
    has_source: Optional[bool]
    is_aliasing: Optional[bool]
    start_data_after: Optional[Any]
    remove_customers: Optional[bool]
    notify_row_count_percent_change: Optional[Any]
    do_not_update_on_percent_change: Optional[bool]
    allow_future_data: Optional[bool]
    name: Optional[str]
    mutable_day_window: Optional[int]
    max_days_to_insert: Optional[int]
    delete_window: Optional[int]
    do_not_delete_on_resync: Optional[bool]
    depends_on_transformations: List["GetTransformationContextTransformationDependsOnTransformations"]
    run_after_transformations: List["GetTransformationContextTransformationRunAfterTransformations"]
    next_resync_at: Optional[Any]
    activities: List["GetTransformationContextTransformationActivities"]
    production_queries: List["GetTransformationContextTransformationProductionQueries"]
    task_id: Optional[Any]
    validation_queries: List["GetTransformationContextTransformationValidationQueries"]


class GetTransformationContextTransformationCurrentQuery(BaseModel):
    id: Optional[Any]
    sql: Optional[str]
    updated_by: Optional[str]
    updated_at: Optional[Any]
    notes: Optional[str]


class GetTransformationContextTransformationColumnRenames(BaseModel):
    id: Optional[Any]
    name: Optional[str]
    label: Optional[str]
    has_data: Optional[bool]
    type: Optional[str]
    casting: Optional[str]


class GetTransformationContextTransformationDependsOnTransformations(BaseModel):
    depends_on_transformation_id: Any


class GetTransformationContextTransformationRunAfterTransformations(BaseModel):
    run_after_transformation_id: Any


class GetTransformationContextTransformationActivities(BaseModel):
    activity: "GetTransformationContextTransformationActivitiesActivity"


class GetTransformationContextTransformationActivitiesActivity(BaseModel):
    id: Any
    slug: str


class GetTransformationContextTransformationProductionQueries(BaseModel):
    id: Optional[Any]
    sql: Optional[str]
    created_at: Optional[Any]
    updated_by: Optional[str]
    notes: Optional[str]


class GetTransformationContextTransformationValidationQueries(BaseModel):
    id: Optional[Any]
    updated_by: Optional[str]
    updated_at: Optional[Any]
    sql: Optional[str]
    notes: Optional[str]
    alert: Optional["GetTransformationContextTransformationValidationQueriesAlert"]


class GetTransformationContextTransformationValidationQueriesAlert(BaseModel):
    task_id: Optional[Any]
    email: Optional[str]
    alert_kind: company_query_alert_kinds_enum
    company_task: Optional["GetTransformationContextTransformationValidationQueriesAlertCompanyTask"]


class GetTransformationContextTransformationValidationQueriesAlertCompanyTask(BaseModel):
    task_slug: str
    schedule: str


GetTransformationContext.update_forward_refs()
GetTransformationContextTransformation.update_forward_refs()
GetTransformationContextTransformationCurrentQuery.update_forward_refs()
GetTransformationContextTransformationColumnRenames.update_forward_refs()
GetTransformationContextTransformationDependsOnTransformations.update_forward_refs()
GetTransformationContextTransformationRunAfterTransformations.update_forward_refs()
GetTransformationContextTransformationActivities.update_forward_refs()
GetTransformationContextTransformationActivitiesActivity.update_forward_refs()
GetTransformationContextTransformationProductionQueries.update_forward_refs()
GetTransformationContextTransformationValidationQueries.update_forward_refs()
GetTransformationContextTransformationValidationQueriesAlert.update_forward_refs()
GetTransformationContextTransformationValidationQueriesAlertCompanyTask.update_forward_refs()
