from enum import StrEnum

from core.graph.sync_client.enums import (
    transformation_kinds_enum,
    transformation_update_types_enum,
)
from core.models.ids import UUIDStr

from ..utils.pydantic import Alert, CamelModel, SearchParams


class query_kind_enum(StrEnum):
    activity = "activity"
    dimension = "dimension"
    aggregate_dimension = "aggregate_dimension"
    customer_dimension = "customer_dimension"


KIND_MAPPING = {
    transformation_kinds_enum.customer_attribute: query_kind_enum.customer_dimension,
    transformation_kinds_enum.enrichment: query_kind_enum.dimension,
    transformation_kinds_enum.stream: query_kind_enum.activity,
    transformation_kinds_enum.spend: query_kind_enum.aggregate_dimension,
}


class update_approach_enum(StrEnum):
    materialized_view = "materialized_view"
    incremental_materialized_view = "incremental_materialized_view"
    one_time = "one_time"
    view = "view"
    insert_missing_ids = "insert_missing_ids"


UPDATE_MAPPING = {
    transformation_update_types_enum.regular: update_approach_enum.incremental_materialized_view,
    transformation_update_types_enum.materialized_view: update_approach_enum.materialized_view,
    transformation_update_types_enum.single_run: update_approach_enum.one_time,
    transformation_update_types_enum.view: update_approach_enum.view,
    transformation_update_types_enum.mutable: update_approach_enum.insert_missing_ids,
}


class advanced_config_enum(StrEnum):
    uses_identity_resolution = "uses_identity_resolution"
    aliasing_customer = "aliasing_customer"
    has_delete_window = "has_delete_window"
    delete_customers = "delete_customers"
    never_deletes_rows = "never_deletes_rows"
    uses_anomaly_detection = "uses_anomaly_detection"
    has_custom_alerts = "has_custom_alerts"
    depends_on_other_transformations = "depends_on_other_transformations"
    runs_after_transformation = "runs_after_transformation"
    do_not_update_on_percent_change = "do_not_update_on_percent_change"


CONFIG_MAPPINGS = {
    "has_source": advanced_config_enum.uses_identity_resolution,
    "is_aliasing": advanced_config_enum.aliasing_customer,
    "delete_window": advanced_config_enum.has_delete_window,
    "remove_customers": advanced_config_enum.delete_customers,
    "do_not_delete_on_resync": advanced_config_enum.never_deletes_rows,
    "notify_row_count_percent_change": advanced_config_enum.uses_anomaly_detection,
    "validation_queries": advanced_config_enum.has_custom_alerts,
    "run_after_transformations": advanced_config_enum.runs_after_transformation,
    "depends_on_transformations": advanced_config_enum.depends_on_other_transformations,
    "do_not_update_on_percent_change": advanced_config_enum.do_not_update_on_percent_change,
}


class test_enum(StrEnum):
    check_missing_columns = "check_missing_columns"
    update_column_names = "update_column_names"
    check_limit = "check_limit"
    check_null_columns = "check_null_columns"
    check_id_duplication = "check_id_duplication"
    check_activities = "check_activities"
    check_sources = "check_sources"
    check_identity_resolution = "check_identity_resolution"
    check_unnecessary_mapping = "check_unnecessary_mapping"


class QueryParams(SearchParams):
    kind: query_kind_enum | None = None
    pushed_to_production_by: UUIDStr | None = None
    update_type: update_approach_enum | None = None
    advanced_configs: advanced_config_enum | None = None
    task_id: UUIDStr | None = None
    in_maintenance: bool | None = None
    in_production: bool | None = None


class Activity(CamelModel):
    id: UUIDStr
    name: str


class TransformationOutput(CamelModel):
    id: UUIDStr
    name: str
    slug: str
    table: str
    created_at: str
    updated_at: str
    pushed_to_production_by: UUIDStr | None = None
    push_to_production_at: str | None = None
    in_production: bool = False
    update_type: update_approach_enum
    activities: list[Activity]
    kind: query_kind_enum
    advanced_configs: list[str]
    alerts: list[Alert]
    task_id: UUIDStr
    last_status: str | None


class GetTransformationCounts(CamelModel):
    total_in_maintenance: int


class GetTransformationOutput(CamelModel):
    total_count: int
    page: int
    per_page: int
    data: list[TransformationOutput]

    class Config:
        schema_extra = {
            "examples": [
                {
                    "totalCount": 1,
                    "page": 1,
                    "perPage": 1,
                    "data": [
                        {
                            "id": "db0daaa9-e7bf-4e62-9c5e-392cb193036d",
                            "name": "Completed Order",
                            "slug": "order",
                            "table": "activity_stream",
                            "createdAt": "2021-09-29T20:00:00Z",
                            "updatedAt": "2023-10-14T10:30:00.000000+00:00",
                            "pushedTOProductionBy": "db0daaa9-e7bf-4e62-9c5e-392cb193036d",
                            "pushToProductionAt": "2021-09-29T20:00:00Z",
                            "updateType": "materialized_view",
                            "activities": [
                                {
                                    "id": "db0daaa9-e7bf-4e62-9c5e-392cb193036d",
                                    "name": "Completed Order",
                                    "alerts": [
                                        {
                                            "id": "db0daaa9-e7bf-4e62-9c5e-392cb193036d",
                                            "kind": "maintenance",
                                            "notes": "This is a note",
                                            "startedAt": "2021-09-29T20:00:00Z",
                                        }
                                    ],
                                }
                            ],
                            "task_id": "db0daaa9-e7bf-4e62-9c5e-392cb193036d",
                            "last_status": "completed",
                            "kind": "activity",
                            "advancedConfigs": ["uses_identity_resolution"],
                            "alerts": [],
                            "in_production": True,
                        }
                    ],
                }
            ]
        }


# FOR the operations
class CreateTransformationOutput(CamelModel):
    id: UUIDStr
    slug: str
    task_id: UUIDStr | None = None
    update_type: transformation_update_types_enum


class CreateTransformationInput(CamelModel):
    name: str
    table_name: str | None = None
    kind: transformation_kinds_enum
    sql: str | None = None
    notes: str | None = None


class NewTask(CamelModel):
    label: str
    schedule: str | None = None


class UpdateTransformationInput(CamelModel):
    id: UUIDStr
    name: str
    table_name: str | None = None
    kind: transformation_kinds_enum
    query_id: UUIDStr | None = None
    sql: str | None = None
    notes: str | None = None


class ProcessingConfiguration(CamelModel):
    update_type: transformation_update_types_enum
    # processing configuration
    uses_identity_resolution: bool = False
    start_data_after: str | None = None
    delete_customers: bool = False
    do_not_update_on_percent_change: bool = False
    never_deletes_rows: bool | None = None
    allow_future_data: bool | None = None
    mutable_day_window: int | None = None
    max_days_to_insert: int | None = None
    delete_window: int | None = None
    aliasing_customer: bool = False
    notify_row_count_percent_change: float | None = None

    # resyncing configuration
    run_after_transformations: list[UUIDStr] | None = None
    depends_on_transformations: list[UUIDStr] | None = None

    task: NewTask | str
