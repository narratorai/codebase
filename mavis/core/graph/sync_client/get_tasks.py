from typing import Any, List, Optional

from .base_model import BaseModel
from .enums import (
    company_task_category_enum,
    materialization_type_enum,
    narrative_types_enum,
    task_execution_status_enum,
)


class GetTasks(BaseModel):
    company_task: List["GetTasksCompanyTask"]


class GetTasksCompanyTask(BaseModel):
    id: Any
    task_slug: str
    label: Optional[str]
    schedule: str
    category: Optional[company_task_category_enum]
    internal_only: bool
    dataset_materializations: List["GetTasksCompanyTaskDatasetMaterializations"]
    narratives: List["GetTasksCompanyTaskNarratives"]
    company_query_alerts: List["GetTasksCompanyTaskCompanyQueryAlerts"]
    executions: List["GetTasksCompanyTaskExecutions"]


class GetTasksCompanyTaskDatasetMaterializations(BaseModel):
    type: materialization_type_enum
    label: str
    column_id: Optional[str]
    external_link: Optional[str]
    dataset: "GetTasksCompanyTaskDatasetMaterializationsDataset"


class GetTasksCompanyTaskDatasetMaterializationsDataset(BaseModel):
    id: Any
    slug: str
    name: str


class GetTasksCompanyTaskNarratives(BaseModel):
    id: Any
    slug: str
    name: str
    type: Optional[narrative_types_enum]


class GetTasksCompanyTaskCompanyQueryAlerts(BaseModel):
    sql_query: "GetTasksCompanyTaskCompanyQueryAlertsSqlQuery"


class GetTasksCompanyTaskCompanyQueryAlertsSqlQuery(BaseModel):
    related_transformation: Optional["GetTasksCompanyTaskCompanyQueryAlertsSqlQueryRelatedTransformation"]


class GetTasksCompanyTaskCompanyQueryAlertsSqlQueryRelatedTransformation(BaseModel):
    id: Any
    name: Optional[str]


class GetTasksCompanyTaskExecutions(BaseModel):
    id: Any
    orchestration_id: Optional[str]
    status: task_execution_status_enum
    started_at: Optional[Any]
    completed_at: Optional[Any]
    details: Any


GetTasks.update_forward_refs()
GetTasksCompanyTask.update_forward_refs()
GetTasksCompanyTaskDatasetMaterializations.update_forward_refs()
GetTasksCompanyTaskDatasetMaterializationsDataset.update_forward_refs()
GetTasksCompanyTaskNarratives.update_forward_refs()
GetTasksCompanyTaskCompanyQueryAlerts.update_forward_refs()
GetTasksCompanyTaskCompanyQueryAlertsSqlQuery.update_forward_refs()
GetTasksCompanyTaskCompanyQueryAlertsSqlQueryRelatedTransformation.update_forward_refs()
GetTasksCompanyTaskExecutions.update_forward_refs()
