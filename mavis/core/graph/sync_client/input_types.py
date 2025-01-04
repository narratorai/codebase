from typing import Any, List, Optional

from pydantic import Field

from .base_model import BaseModel
from .enums import (
    access_role_constraint,
    access_role_enum,
    access_role_update_column,
    activity_column_renames_select_column,
    activity_column_renames_select_column_activity_column_renames_aggregate_bool_exp_bool_and_arguments_columns,
    activity_column_renames_select_column_activity_column_renames_aggregate_bool_exp_bool_or_arguments_columns,
    activity_company_timelines_select_column,
    activity_constraint,
    activity_dim_constraint,
    activity_dim_select_column,
    activity_dim_update_column,
    activity_maintenance_constraint,
    activity_maintenance_select_column,
    activity_maintenance_update_column,
    activity_questions_select_column,
    activity_select_column,
    activity_select_column_activity_aggregate_bool_exp_bool_and_arguments_columns,
    activity_select_column_activity_aggregate_bool_exp_bool_or_arguments_columns,
    activity_status_constraint,
    activity_status_enum,
    activity_status_update_column,
    activity_tags_select_column,
    activity_team_permissions_select_column,
    activity_team_permissions_select_column_activity_team_permissions_aggregate_bool_exp_bool_and_arguments_columns,
    activity_team_permissions_select_column_activity_team_permissions_aggregate_bool_exp_bool_or_arguments_columns,
    activity_update_column,
    chat_constraint,
    chat_tags_select_column,
    chat_update_column,
    column_rename_relations_constraint,
    column_rename_relations_enum,
    column_rename_relations_update_column,
    column_renames_constraint,
    column_renames_update_column,
    company_auth0_constraint,
    company_auth0_update_column,
    company_categories_constraint,
    company_categories_update_column,
    company_config_batch_version_constraint,
    company_config_batch_version_update_column,
    company_config_core_version_constraint,
    company_config_core_version_update_column,
    company_config_warehouse_language_constraint,
    company_config_warehouse_language_enum,
    company_config_warehouse_language_update_column,
    company_constraint,
    company_github_sync_constraint,
    company_github_sync_select_column,
    company_github_sync_update_column,
    company_narrative_templates_constraint,
    company_narrative_templates_update_column,
    company_prototypes_constraint,
    company_prototypes_update_column,
    company_query_alert_constraint,
    company_query_alert_kinds_constraint,
    company_query_alert_kinds_enum,
    company_query_alert_kinds_update_column,
    company_query_alert_select_column,
    company_query_alert_update_column,
    company_resources_constraint,
    company_resources_update_column,
    company_status_constraint,
    company_status_enum,
    company_status_update_column,
    company_table_aggregation_dim_constraint,
    company_table_aggregation_dim_select_column,
    company_table_aggregation_dim_update_column,
    company_table_constraint,
    company_table_select_column,
    company_table_select_column_company_table_aggregate_bool_exp_bool_and_arguments_columns,
    company_table_select_column_company_table_aggregate_bool_exp_bool_or_arguments_columns,
    company_table_update_column,
    company_tags_constraint,
    company_tags_select_column,
    company_tags_update_column,
    company_task_category_constraint,
    company_task_category_enum,
    company_task_category_update_column,
    company_task_constraint,
    company_task_select_column,
    company_task_select_column_company_task_aggregate_bool_exp_bool_and_arguments_columns,
    company_task_select_column_company_task_aggregate_bool_exp_bool_or_arguments_columns,
    company_task_update_column,
    company_timeline_constraint,
    company_timeline_relations_constraint,
    company_timeline_relations_enum,
    company_timeline_relations_update_column,
    company_timeline_update_column,
    company_update_column,
    company_user_api_key_constraint,
    company_user_api_key_update_column,
    company_user_constraint,
    company_user_notifications_constraint,
    company_user_notifications_select_column,
    company_user_notifications_update_column,
    company_user_preferences_constraint,
    company_user_preferences_update_column,
    company_user_role_constraint,
    company_user_role_enum,
    company_user_role_update_column,
    company_user_select_column,
    company_user_select_column_company_user_aggregate_bool_exp_bool_and_arguments_columns,
    company_user_select_column_company_user_aggregate_bool_exp_bool_or_arguments_columns,
    company_user_update_column,
    compiled_narratives_select_column,
    cursor_ordering,
    custom_function_constraint,
    custom_function_update_column,
    datacenter_region_constraint,
    datacenter_region_enum,
    datacenter_region_update_column,
    dataset_activities_constraint,
    dataset_activities_select_column,
    dataset_activities_update_column,
    dataset_constraint,
    dataset_materialization_constraint,
    dataset_materialization_select_column,
    dataset_materialization_update_column,
    dataset_select_column,
    dataset_select_column_dataset_aggregate_bool_exp_bool_and_arguments_columns,
    dataset_select_column_dataset_aggregate_bool_exp_bool_or_arguments_columns,
    dataset_tags_select_column,
    dataset_team_permissions_select_column,
    dataset_team_permissions_select_column_dataset_team_permissions_aggregate_bool_exp_bool_and_arguments_columns,
    dataset_team_permissions_select_column_dataset_team_permissions_aggregate_bool_exp_bool_or_arguments_columns,
    dataset_update_column,
    dataset_versions_select_column,
    dim_table_columns_select_column,
    dim_table_columns_select_column_dim_table_columns_aggregate_bool_exp_bool_and_arguments_columns,
    dim_table_columns_select_column_dim_table_columns_aggregate_bool_exp_bool_or_arguments_columns,
    dim_table_constraint,
    dim_table_update_column,
    dim_team_permissions_select_column,
    dim_team_permissions_select_column_dim_team_permissions_aggregate_bool_exp_bool_and_arguments_columns,
    dim_team_permissions_select_column_dim_team_permissions_aggregate_bool_exp_bool_or_arguments_columns,
    document_revision_constraint,
    document_revision_update_column,
    group_constraint,
    group_select_column,
    group_update_column,
    llm_training_constraint,
    llm_training_update_column,
    maintenance_kinds_constraint,
    maintenance_kinds_enum,
    maintenance_kinds_update_column,
    materialization_type_constraint,
    materialization_type_enum,
    materialization_type_update_column,
    metric_constraint,
    metric_tags_select_column,
    metric_timelines_select_column,
    metric_update_column,
    narrative_company_timelines_select_column,
    narrative_constraint,
    narrative_datasets_constraint,
    narrative_datasets_select_column,
    narrative_datasets_update_column,
    narrative_integration_kind_constraint,
    narrative_integration_kind_enum,
    narrative_integration_kind_update_column,
    narrative_integrations_constraint,
    narrative_integrations_select_column,
    narrative_integrations_update_column,
    narrative_narratives_constraint,
    narrative_narratives_select_column,
    narrative_narratives_update_column,
    narrative_runs_constraint,
    narrative_runs_select_column,
    narrative_runs_select_column_narrative_runs_aggregate_bool_exp_avg_arguments_columns,
    narrative_runs_select_column_narrative_runs_aggregate_bool_exp_bool_and_arguments_columns,
    narrative_runs_select_column_narrative_runs_aggregate_bool_exp_bool_or_arguments_columns,
    narrative_runs_select_column_narrative_runs_aggregate_bool_exp_corr_arguments_columns,
    narrative_runs_select_column_narrative_runs_aggregate_bool_exp_covar_samp_arguments_columns,
    narrative_runs_select_column_narrative_runs_aggregate_bool_exp_max_arguments_columns,
    narrative_runs_select_column_narrative_runs_aggregate_bool_exp_min_arguments_columns,
    narrative_runs_select_column_narrative_runs_aggregate_bool_exp_stddev_samp_arguments_columns,
    narrative_runs_select_column_narrative_runs_aggregate_bool_exp_sum_arguments_columns,
    narrative_runs_select_column_narrative_runs_aggregate_bool_exp_var_samp_arguments_columns,
    narrative_runs_update_column,
    narrative_select_column,
    narrative_tags_select_column,
    narrative_team_permissions_select_column,
    narrative_team_permissions_select_column_narrative_team_permissions_aggregate_bool_exp_bool_and_arguments_columns,
    narrative_team_permissions_select_column_narrative_team_permissions_aggregate_bool_exp_bool_or_arguments_columns,
    narrative_template_constraint,
    narrative_template_kinds_constraint,
    narrative_template_kinds_enum,
    narrative_template_kinds_update_column,
    narrative_template_select_column,
    narrative_template_select_column_narrative_template_aggregate_bool_exp_bool_and_arguments_columns,
    narrative_template_select_column_narrative_template_aggregate_bool_exp_bool_or_arguments_columns,
    narrative_template_states_constraint,
    narrative_template_states_enum,
    narrative_template_states_update_column,
    narrative_template_update_column,
    narrative_types_constraint,
    narrative_types_enum,
    narrative_types_update_column,
    narrative_update_column,
    narrative_versions_select_column,
    order_by,
    package_constraint,
    package_update_column,
    production_tranformation_sql_queries_select_column,
    query_template_constraint,
    query_template_update_column,
    query_updates_constraint,
    query_updates_select_column,
    query_updates_update_column,
    question_answer_constraint,
    question_answer_relations_constraint,
    question_answer_relations_enum,
    question_answer_relations_update_column,
    question_answer_update_column,
    scratchpad_tranformation_sql_queries_select_column,
    service_limit_constraint,
    service_limit_select_column,
    service_limit_select_column_service_limit_aggregate_bool_exp_avg_arguments_columns,
    service_limit_select_column_service_limit_aggregate_bool_exp_corr_arguments_columns,
    service_limit_select_column_service_limit_aggregate_bool_exp_covar_samp_arguments_columns,
    service_limit_select_column_service_limit_aggregate_bool_exp_max_arguments_columns,
    service_limit_select_column_service_limit_aggregate_bool_exp_min_arguments_columns,
    service_limit_select_column_service_limit_aggregate_bool_exp_stddev_samp_arguments_columns,
    service_limit_select_column_service_limit_aggregate_bool_exp_sum_arguments_columns,
    service_limit_select_column_service_limit_aggregate_bool_exp_var_samp_arguments_columns,
    service_limit_update_column,
    slowly_changing_customer_dims_constraint,
    slowly_changing_customer_dims_select_column,
    slowly_changing_customer_dims_update_column,
    sql_queries_constraint,
    sql_queries_update_column,
    sql_query_kinds_constraint,
    sql_query_kinds_enum,
    sql_query_kinds_update_column,
    sql_query_relations_constraint,
    sql_query_relations_enum,
    sql_query_relations_update_column,
    status_constraint,
    status_enum,
    status_update_column,
    table_team_permissions_select_column,
    table_team_permissions_select_column_table_team_permissions_aggregate_bool_exp_bool_and_arguments_columns,
    table_team_permissions_select_column_table_team_permissions_aggregate_bool_exp_bool_or_arguments_columns,
    tag_constraint,
    tag_relations_constraint,
    tag_relations_enum,
    tag_relations_update_column,
    tag_select_column,
    tag_update_column,
    task_execution_constraint,
    task_execution_select_column,
    task_execution_select_column_task_execution_aggregate_bool_exp_bool_and_arguments_columns,
    task_execution_select_column_task_execution_aggregate_bool_exp_bool_or_arguments_columns,
    task_execution_status_constraint,
    task_execution_status_enum,
    task_execution_status_update_column,
    task_execution_update_column,
    team_constraint,
    team_permission_constraint,
    team_permission_update_column,
    team_select_column,
    team_update_column,
    team_user_constraint,
    team_user_select_column,
    team_user_update_column,
    training_request_constraint,
    training_request_select_column,
    training_request_select_column_training_request_aggregate_bool_exp_bool_and_arguments_columns,
    training_request_select_column_training_request_aggregate_bool_exp_bool_or_arguments_columns,
    training_request_update_column,
    trainining_request_status_constraint,
    trainining_request_status_enum,
    trainining_request_status_update_column,
    tranformation_enriched_activities_constraint,
    tranformation_enriched_activities_select_column,
    tranformation_enriched_activities_update_column,
    transformation_activities_constraint,
    transformation_activities_select_column,
    transformation_activities_update_column,
    transformation_column_renames_select_column,
    transformation_column_renames_select_column_transformation_column_renames_aggregate_bool_exp_bool_and_arguments_columns,
    transformation_column_renames_select_column_transformation_column_renames_aggregate_bool_exp_bool_or_arguments_columns,
    transformation_constraint,
    transformation_depends_on_constraint,
    transformation_depends_on_select_column,
    transformation_depends_on_update_column,
    transformation_kinds_constraint,
    transformation_kinds_enum,
    transformation_kinds_update_column,
    transformation_maintenance_constraint,
    transformation_maintenance_select_column,
    transformation_maintenance_update_column,
    transformation_questions_select_column,
    transformation_run_after_constraint,
    transformation_run_after_select_column,
    transformation_run_after_update_column,
    transformation_select_column,
    transformation_select_column_transformation_aggregate_bool_exp_bool_and_arguments_columns,
    transformation_select_column_transformation_aggregate_bool_exp_bool_or_arguments_columns,
    transformation_test_constraint,
    transformation_test_select_column,
    transformation_test_status_constraint,
    transformation_test_status_enum,
    transformation_test_status_update_column,
    transformation_test_update_column,
    transformation_update_column,
    transformation_update_types_constraint,
    transformation_update_types_enum,
    transformation_update_types_update_column,
    user_access_role_constraint,
    user_access_role_select_column,
    user_access_role_update_column,
    user_constraint,
    user_role_constraint,
    user_role_enum,
    user_role_update_column,
    user_training_question_constraint,
    user_training_question_select_column,
    user_training_question_update_column,
    user_update_column,
    validation_activity_sql_queries_select_column,
    validation_tranformation_sql_queries_select_column,
    versions_constraint,
    versions_update_column,
    watcher_constraint,
    watcher_relation_constraint,
    watcher_relation_enum,
    watcher_relation_update_column,
    watcher_update_column,
)


class Boolean_comparison_exp(BaseModel):
    eq: Optional[bool] = Field(alias="_eq")
    gt: Optional[bool] = Field(alias="_gt")
    gte: Optional[bool] = Field(alias="_gte")
    in_: Optional[List[bool]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    lt: Optional[bool] = Field(alias="_lt")
    lte: Optional[bool] = Field(alias="_lte")
    neq: Optional[bool] = Field(alias="_neq")
    nin: Optional[List[bool]] = Field(alias="_nin")


class Int_comparison_exp(BaseModel):
    eq: Optional[int] = Field(alias="_eq")
    gt: Optional[int] = Field(alias="_gt")
    gte: Optional[int] = Field(alias="_gte")
    in_: Optional[List[int]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    lt: Optional[int] = Field(alias="_lt")
    lte: Optional[int] = Field(alias="_lte")
    neq: Optional[int] = Field(alias="_neq")
    nin: Optional[List[int]] = Field(alias="_nin")


class String_comparison_exp(BaseModel):
    eq: Optional[str] = Field(alias="_eq")
    gt: Optional[str] = Field(alias="_gt")
    gte: Optional[str] = Field(alias="_gte")
    ilike: Optional[str] = Field(alias="_ilike")
    in_: Optional[List[str]] = Field(alias="_in")
    iregex: Optional[str] = Field(alias="_iregex")
    is_null: Optional[bool] = Field(alias="_is_null")
    like: Optional[str] = Field(alias="_like")
    lt: Optional[str] = Field(alias="_lt")
    lte: Optional[str] = Field(alias="_lte")
    neq: Optional[str] = Field(alias="_neq")
    nilike: Optional[str] = Field(alias="_nilike")
    nin: Optional[List[str]] = Field(alias="_nin")
    niregex: Optional[str] = Field(alias="_niregex")
    nlike: Optional[str] = Field(alias="_nlike")
    nregex: Optional[str] = Field(alias="_nregex")
    nsimilar: Optional[str] = Field(alias="_nsimilar")
    regex: Optional[str] = Field(alias="_regex")
    similar: Optional[str] = Field(alias="_similar")


class access_role_bool_exp(BaseModel):
    and_: Optional[List["access_role_bool_exp"]] = Field(alias="_and")
    not_: Optional["access_role_bool_exp"] = Field(alias="_not")
    or_: Optional[List["access_role_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class access_role_enum_comparison_exp(BaseModel):
    eq: Optional[access_role_enum] = Field(alias="_eq")
    in_: Optional[List[access_role_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[access_role_enum] = Field(alias="_neq")
    nin: Optional[List[access_role_enum]] = Field(alias="_nin")


class access_role_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class access_role_obj_rel_insert_input(BaseModel):
    data: "access_role_insert_input"
    on_conflict: Optional["access_role_on_conflict"]


class access_role_on_conflict(BaseModel):
    constraint: access_role_constraint
    update_columns: List[access_role_update_column]
    where: Optional["access_role_bool_exp"]


class access_role_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class access_role_pk_columns_input(BaseModel):
    value: str


class access_role_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class access_role_stream_cursor_input(BaseModel):
    initial_value: "access_role_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class access_role_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class access_role_updates(BaseModel):
    set: Optional["access_role_set_input"] = Field(alias="_set")
    where: "access_role_bool_exp"


class activity_aggregate_bool_exp(BaseModel):
    bool_and: Optional["activity_aggregate_bool_exp_bool_and"]
    bool_or: Optional["activity_aggregate_bool_exp_bool_or"]
    count: Optional["activity_aggregate_bool_exp_count"]


class activity_aggregate_bool_exp_bool_and(BaseModel):
    arguments: activity_select_column_activity_aggregate_bool_exp_bool_and_arguments_columns
    distinct: Optional[bool]
    filter: Optional["activity_bool_exp"]
    predicate: "Boolean_comparison_exp"


class activity_aggregate_bool_exp_bool_or(BaseModel):
    arguments: activity_select_column_activity_aggregate_bool_exp_bool_or_arguments_columns
    distinct: Optional[bool]
    filter: Optional["activity_bool_exp"]
    predicate: "Boolean_comparison_exp"


class activity_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[activity_select_column]]
    distinct: Optional[bool]
    filter: Optional["activity_bool_exp"]
    predicate: "Int_comparison_exp"


class activity_aggregate_order_by(BaseModel):
    avg: Optional["activity_avg_order_by"]
    count: Optional[order_by]
    max: Optional["activity_max_order_by"]
    min: Optional["activity_min_order_by"]
    stddev: Optional["activity_stddev_order_by"]
    stddev_pop: Optional["activity_stddev_pop_order_by"]
    stddev_samp: Optional["activity_stddev_samp_order_by"]
    sum: Optional["activity_sum_order_by"]
    var_pop: Optional["activity_var_pop_order_by"]
    var_samp: Optional["activity_var_samp_order_by"]
    variance: Optional["activity_variance_order_by"]


class activity_arr_rel_insert_input(BaseModel):
    data: List["activity_insert_input"]
    on_conflict: Optional["activity_on_conflict"]


class activity_avg_order_by(BaseModel):
    row_count: Optional[order_by]


class activity_bool_exp(BaseModel):
    and_: Optional[List["activity_bool_exp"]] = Field(alias="_and")
    not_: Optional["activity_bool_exp"] = Field(alias="_not")
    or_: Optional[List["activity_bool_exp"]] = Field(alias="_or")
    activity_dims: Optional["activity_dim_bool_exp"]
    activity_dims_aggregate: Optional["activity_dim_aggregate_bool_exp"]
    activity_maintenances: Optional["activity_maintenance_bool_exp"]
    activity_maintenances_aggregate: Optional["activity_maintenance_aggregate_bool_exp"]
    category: Optional["String_comparison_exp"]
    category_id: Optional["uuid_comparison_exp"]
    column_renames: Optional["activity_column_renames_bool_exp"]
    column_renames_aggregate: Optional["activity_column_renames_aggregate_bool_exp"]
    company: Optional["company_bool_exp"]
    company_category: Optional["company_categories_bool_exp"]
    company_id: Optional["uuid_comparison_exp"]
    company_table: Optional["company_table_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    datasets: Optional["dataset_activities_bool_exp"]
    datasets_aggregate: Optional["dataset_activities_aggregate_bool_exp"]
    description: Optional["String_comparison_exp"]
    enriched_by: Optional["tranformation_enriched_activities_bool_exp"]
    enriched_by_aggregate: Optional["tranformation_enriched_activities_aggregate_bool_exp"]
    feature_distributions: Optional["String_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    last_indexed_at: Optional["timestamptz_comparison_exp"]
    maintainer: Optional["user_bool_exp"]
    maintainer_id: Optional["uuid_comparison_exp"]
    maintenance_ended_at: Optional["timestamptz_comparison_exp"]
    maintenance_started_at: Optional["timestamptz_comparison_exp"]
    name: Optional["String_comparison_exp"]
    next_index_at: Optional["timestamptz_comparison_exp"]
    question_answers: Optional["activity_questions_bool_exp"]
    question_answers_aggregate: Optional["activity_questions_aggregate_bool_exp"]
    row_count: Optional["Int_comparison_exp"]
    sensitive_name_alternative: Optional["String_comparison_exp"]
    slug: Optional["String_comparison_exp"]
    status: Optional["activity_status_enum_comparison_exp"]
    table_id: Optional["uuid_comparison_exp"]
    tags: Optional["activity_tags_bool_exp"]
    tags_aggregate: Optional["activity_tags_aggregate_bool_exp"]
    team_permissions: Optional["activity_team_permissions_bool_exp"]
    team_permissions_aggregate: Optional["activity_team_permissions_aggregate_bool_exp"]
    time_plots: Optional["String_comparison_exp"]
    timeline: Optional["activity_company_timelines_bool_exp"]
    timeline_aggregate: Optional["activity_company_timelines_aggregate_bool_exp"]
    transformations: Optional["transformation_activities_bool_exp"]
    transformations_aggregate: Optional["transformation_activities_aggregate_bool_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    updated_by: Optional["String_comparison_exp"]
    validated: Optional["Boolean_comparison_exp"]
    validation_queries: Optional["validation_activity_sql_queries_bool_exp"]
    validation_queries_aggregate: Optional["validation_activity_sql_queries_aggregate_bool_exp"]


class activity_column_renames_aggregate_bool_exp(BaseModel):
    bool_and: Optional["activity_column_renames_aggregate_bool_exp_bool_and"]
    bool_or: Optional["activity_column_renames_aggregate_bool_exp_bool_or"]
    count: Optional["activity_column_renames_aggregate_bool_exp_count"]


class activity_column_renames_aggregate_bool_exp_bool_and(BaseModel):
    arguments: (
        activity_column_renames_select_column_activity_column_renames_aggregate_bool_exp_bool_and_arguments_columns
    )
    distinct: Optional[bool]
    filter: Optional["activity_column_renames_bool_exp"]
    predicate: "Boolean_comparison_exp"


class activity_column_renames_aggregate_bool_exp_bool_or(BaseModel):
    arguments: (
        activity_column_renames_select_column_activity_column_renames_aggregate_bool_exp_bool_or_arguments_columns
    )
    distinct: Optional[bool]
    filter: Optional["activity_column_renames_bool_exp"]
    predicate: "Boolean_comparison_exp"


class activity_column_renames_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[activity_column_renames_select_column]]
    distinct: Optional[bool]
    filter: Optional["activity_column_renames_bool_exp"]
    predicate: "Int_comparison_exp"


class activity_column_renames_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["activity_column_renames_max_order_by"]
    min: Optional["activity_column_renames_min_order_by"]


class activity_column_renames_arr_rel_insert_input(BaseModel):
    data: List["activity_column_renames_insert_input"]


class activity_column_renames_bool_exp(BaseModel):
    and_: Optional[List["activity_column_renames_bool_exp"]] = Field(alias="_and")
    not_: Optional["activity_column_renames_bool_exp"] = Field(alias="_not")
    or_: Optional[List["activity_column_renames_bool_exp"]] = Field(alias="_or")
    activity: Optional["activity_bool_exp"]
    casting: Optional["String_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    description: Optional["String_comparison_exp"]
    has_data: Optional["Boolean_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    label: Optional["String_comparison_exp"]
    name: Optional["String_comparison_exp"]
    related_to: Optional["String_comparison_exp"]
    related_to_id: Optional["uuid_comparison_exp"]
    type: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class activity_column_renames_insert_input(BaseModel):
    activity: Optional["activity_obj_rel_insert_input"]
    casting: Optional[str]
    created_at: Optional[Any]
    description: Optional[str]
    has_data: Optional[bool]
    id: Optional[Any]
    label: Optional[str]
    name: Optional[str]
    related_to: Optional[str]
    related_to_id: Optional[Any]
    type: Optional[str]
    updated_at: Optional[Any]


class activity_column_renames_max_order_by(BaseModel):
    casting: Optional[order_by]
    created_at: Optional[order_by]
    description: Optional[order_by]
    id: Optional[order_by]
    label: Optional[order_by]
    name: Optional[order_by]
    related_to: Optional[order_by]
    related_to_id: Optional[order_by]
    type: Optional[order_by]
    updated_at: Optional[order_by]


class activity_column_renames_min_order_by(BaseModel):
    casting: Optional[order_by]
    created_at: Optional[order_by]
    description: Optional[order_by]
    id: Optional[order_by]
    label: Optional[order_by]
    name: Optional[order_by]
    related_to: Optional[order_by]
    related_to_id: Optional[order_by]
    type: Optional[order_by]
    updated_at: Optional[order_by]


class activity_column_renames_order_by(BaseModel):
    activity: Optional["activity_order_by"]
    casting: Optional[order_by]
    created_at: Optional[order_by]
    description: Optional[order_by]
    has_data: Optional[order_by]
    id: Optional[order_by]
    label: Optional[order_by]
    name: Optional[order_by]
    related_to: Optional[order_by]
    related_to_id: Optional[order_by]
    type: Optional[order_by]
    updated_at: Optional[order_by]


class activity_column_renames_set_input(BaseModel):
    casting: Optional[str]
    created_at: Optional[Any]
    description: Optional[str]
    has_data: Optional[bool]
    id: Optional[Any]
    label: Optional[str]
    name: Optional[str]
    related_to: Optional[str]
    related_to_id: Optional[Any]
    type: Optional[str]
    updated_at: Optional[Any]


class activity_column_renames_stream_cursor_input(BaseModel):
    initial_value: "activity_column_renames_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class activity_column_renames_stream_cursor_value_input(BaseModel):
    casting: Optional[str]
    created_at: Optional[Any]
    description: Optional[str]
    has_data: Optional[bool]
    id: Optional[Any]
    label: Optional[str]
    name: Optional[str]
    related_to: Optional[str]
    related_to_id: Optional[Any]
    type: Optional[str]
    updated_at: Optional[Any]


class activity_column_renames_updates(BaseModel):
    set: Optional["activity_column_renames_set_input"] = Field(alias="_set")
    where: "activity_column_renames_bool_exp"


class activity_company_timelines_aggregate_bool_exp(BaseModel):
    count: Optional["activity_company_timelines_aggregate_bool_exp_count"]


class activity_company_timelines_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[activity_company_timelines_select_column]]
    distinct: Optional[bool]
    filter: Optional["activity_company_timelines_bool_exp"]
    predicate: "Int_comparison_exp"


class activity_company_timelines_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["activity_company_timelines_max_order_by"]
    min: Optional["activity_company_timelines_min_order_by"]


class activity_company_timelines_arr_rel_insert_input(BaseModel):
    data: List["activity_company_timelines_insert_input"]


class activity_company_timelines_bool_exp(BaseModel):
    and_: Optional[List["activity_company_timelines_bool_exp"]] = Field(alias="_and")
    not_: Optional["activity_company_timelines_bool_exp"] = Field(alias="_not")
    or_: Optional[List["activity_company_timelines_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    description: Optional["String_comparison_exp"]
    happened_at: Optional["date_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    name: Optional["String_comparison_exp"]
    related_to: Optional["String_comparison_exp"]
    related_to_id: Optional["uuid_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class activity_company_timelines_insert_input(BaseModel):
    created_at: Optional[Any]
    description: Optional[str]
    happened_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    related_to: Optional[str]
    related_to_id: Optional[Any]
    updated_at: Optional[Any]


class activity_company_timelines_max_order_by(BaseModel):
    created_at: Optional[order_by]
    description: Optional[order_by]
    happened_at: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]
    related_to: Optional[order_by]
    related_to_id: Optional[order_by]
    updated_at: Optional[order_by]


class activity_company_timelines_min_order_by(BaseModel):
    created_at: Optional[order_by]
    description: Optional[order_by]
    happened_at: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]
    related_to: Optional[order_by]
    related_to_id: Optional[order_by]
    updated_at: Optional[order_by]


class activity_company_timelines_order_by(BaseModel):
    created_at: Optional[order_by]
    description: Optional[order_by]
    happened_at: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]
    related_to: Optional[order_by]
    related_to_id: Optional[order_by]
    updated_at: Optional[order_by]


class activity_company_timelines_set_input(BaseModel):
    created_at: Optional[Any]
    description: Optional[str]
    happened_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    related_to: Optional[str]
    related_to_id: Optional[Any]
    updated_at: Optional[Any]


class activity_company_timelines_stream_cursor_input(BaseModel):
    initial_value: "activity_company_timelines_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class activity_company_timelines_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    description: Optional[str]
    happened_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    related_to: Optional[str]
    related_to_id: Optional[Any]
    updated_at: Optional[Any]


class activity_company_timelines_updates(BaseModel):
    set: Optional["activity_company_timelines_set_input"] = Field(alias="_set")
    where: "activity_company_timelines_bool_exp"


class activity_dim_aggregate_bool_exp(BaseModel):
    count: Optional["activity_dim_aggregate_bool_exp_count"]


class activity_dim_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[activity_dim_select_column]]
    distinct: Optional[bool]
    filter: Optional["activity_dim_bool_exp"]
    predicate: "Int_comparison_exp"


class activity_dim_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["activity_dim_max_order_by"]
    min: Optional["activity_dim_min_order_by"]


class activity_dim_arr_rel_insert_input(BaseModel):
    data: List["activity_dim_insert_input"]
    on_conflict: Optional["activity_dim_on_conflict"]


class activity_dim_bool_exp(BaseModel):
    and_: Optional[List["activity_dim_bool_exp"]] = Field(alias="_and")
    not_: Optional["activity_dim_bool_exp"] = Field(alias="_not")
    or_: Optional[List["activity_dim_bool_exp"]] = Field(alias="_or")
    activity: Optional["activity_bool_exp"]
    activity_id: Optional["uuid_comparison_exp"]
    activity_join_column: Optional["String_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    dim_table: Optional["dim_table_bool_exp"]
    dim_table_id: Optional["uuid_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    slowly_changing_ts_column: Optional["String_comparison_exp"]


class activity_dim_insert_input(BaseModel):
    activity: Optional["activity_obj_rel_insert_input"]
    activity_id: Optional[Any]
    activity_join_column: Optional[str]
    created_at: Optional[Any]
    dim_table: Optional["dim_table_obj_rel_insert_input"]
    dim_table_id: Optional[Any]
    id: Optional[Any]
    slowly_changing_ts_column: Optional[str]


class activity_dim_max_order_by(BaseModel):
    activity_id: Optional[order_by]
    activity_join_column: Optional[order_by]
    created_at: Optional[order_by]
    dim_table_id: Optional[order_by]
    id: Optional[order_by]
    slowly_changing_ts_column: Optional[order_by]


class activity_dim_min_order_by(BaseModel):
    activity_id: Optional[order_by]
    activity_join_column: Optional[order_by]
    created_at: Optional[order_by]
    dim_table_id: Optional[order_by]
    id: Optional[order_by]
    slowly_changing_ts_column: Optional[order_by]


class activity_dim_on_conflict(BaseModel):
    constraint: activity_dim_constraint
    update_columns: List[activity_dim_update_column]
    where: Optional["activity_dim_bool_exp"]


class activity_dim_order_by(BaseModel):
    activity: Optional["activity_order_by"]
    activity_id: Optional[order_by]
    activity_join_column: Optional[order_by]
    created_at: Optional[order_by]
    dim_table: Optional["dim_table_order_by"]
    dim_table_id: Optional[order_by]
    id: Optional[order_by]
    slowly_changing_ts_column: Optional[order_by]


class activity_dim_pk_columns_input(BaseModel):
    id: Any


class activity_dim_set_input(BaseModel):
    activity_id: Optional[Any]
    activity_join_column: Optional[str]
    created_at: Optional[Any]
    dim_table_id: Optional[Any]
    id: Optional[Any]
    slowly_changing_ts_column: Optional[str]


class activity_dim_stream_cursor_input(BaseModel):
    initial_value: "activity_dim_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class activity_dim_stream_cursor_value_input(BaseModel):
    activity_id: Optional[Any]
    activity_join_column: Optional[str]
    created_at: Optional[Any]
    dim_table_id: Optional[Any]
    id: Optional[Any]
    slowly_changing_ts_column: Optional[str]


class activity_dim_updates(BaseModel):
    set: Optional["activity_dim_set_input"] = Field(alias="_set")
    where: "activity_dim_bool_exp"


class activity_inc_input(BaseModel):
    row_count: Optional[int]


class activity_insert_input(BaseModel):
    activity_dims: Optional["activity_dim_arr_rel_insert_input"]
    activity_maintenances: Optional["activity_maintenance_arr_rel_insert_input"]
    category: Optional[str]
    category_id: Optional[Any]
    column_renames: Optional["activity_column_renames_arr_rel_insert_input"]
    company: Optional["company_obj_rel_insert_input"]
    company_category: Optional["company_categories_obj_rel_insert_input"]
    company_id: Optional[Any]
    company_table: Optional["company_table_obj_rel_insert_input"]
    created_at: Optional[Any]
    datasets: Optional["dataset_activities_arr_rel_insert_input"]
    description: Optional[str]
    enriched_by: Optional["tranformation_enriched_activities_arr_rel_insert_input"]
    feature_distributions: Optional[str]
    id: Optional[Any]
    last_indexed_at: Optional[Any]
    maintainer: Optional["user_obj_rel_insert_input"]
    maintainer_id: Optional[Any]
    maintenance_ended_at: Optional[Any]
    maintenance_started_at: Optional[Any]
    name: Optional[str]
    next_index_at: Optional[Any]
    question_answers: Optional["activity_questions_arr_rel_insert_input"]
    row_count: Optional[int]
    sensitive_name_alternative: Optional[str]
    slug: Optional[str]
    status: Optional[activity_status_enum]
    table_id: Optional[Any]
    tags: Optional["activity_tags_arr_rel_insert_input"]
    team_permissions: Optional["activity_team_permissions_arr_rel_insert_input"]
    time_plots: Optional[str]
    timeline: Optional["activity_company_timelines_arr_rel_insert_input"]
    transformations: Optional["transformation_activities_arr_rel_insert_input"]
    updated_at: Optional[Any]
    updated_by: Optional[str]
    validated: Optional[bool]
    validation_queries: Optional["validation_activity_sql_queries_arr_rel_insert_input"]


class activity_maintenance_aggregate_bool_exp(BaseModel):
    count: Optional["activity_maintenance_aggregate_bool_exp_count"]


class activity_maintenance_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[activity_maintenance_select_column]]
    distinct: Optional[bool]
    filter: Optional["activity_maintenance_bool_exp"]
    predicate: "Int_comparison_exp"


class activity_maintenance_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["activity_maintenance_max_order_by"]
    min: Optional["activity_maintenance_min_order_by"]


class activity_maintenance_arr_rel_insert_input(BaseModel):
    data: List["activity_maintenance_insert_input"]
    on_conflict: Optional["activity_maintenance_on_conflict"]


class activity_maintenance_bool_exp(BaseModel):
    and_: Optional[List["activity_maintenance_bool_exp"]] = Field(alias="_and")
    not_: Optional["activity_maintenance_bool_exp"] = Field(alias="_not")
    or_: Optional[List["activity_maintenance_bool_exp"]] = Field(alias="_or")
    activity: Optional["activity_bool_exp"]
    activity_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    dim_table: Optional["dim_table_bool_exp"]
    dim_table_id: Optional["uuid_comparison_exp"]
    ended_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    kind: Optional["maintenance_kinds_enum_comparison_exp"]
    maintenance_kind: Optional["maintenance_kinds_bool_exp"]
    notes: Optional["String_comparison_exp"]
    started_at: Optional["timestamptz_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class activity_maintenance_insert_input(BaseModel):
    activity: Optional["activity_obj_rel_insert_input"]
    activity_id: Optional[Any]
    created_at: Optional[Any]
    dim_table: Optional["dim_table_obj_rel_insert_input"]
    dim_table_id: Optional[Any]
    ended_at: Optional[Any]
    id: Optional[Any]
    kind: Optional[maintenance_kinds_enum]
    maintenance_kind: Optional["maintenance_kinds_obj_rel_insert_input"]
    notes: Optional[str]
    started_at: Optional[Any]
    updated_at: Optional[Any]


class activity_maintenance_max_order_by(BaseModel):
    activity_id: Optional[order_by]
    created_at: Optional[order_by]
    dim_table_id: Optional[order_by]
    ended_at: Optional[order_by]
    id: Optional[order_by]
    notes: Optional[order_by]
    started_at: Optional[order_by]
    updated_at: Optional[order_by]


class activity_maintenance_min_order_by(BaseModel):
    activity_id: Optional[order_by]
    created_at: Optional[order_by]
    dim_table_id: Optional[order_by]
    ended_at: Optional[order_by]
    id: Optional[order_by]
    notes: Optional[order_by]
    started_at: Optional[order_by]
    updated_at: Optional[order_by]


class activity_maintenance_on_conflict(BaseModel):
    constraint: activity_maintenance_constraint
    update_columns: List[activity_maintenance_update_column]
    where: Optional["activity_maintenance_bool_exp"]


class activity_maintenance_order_by(BaseModel):
    activity: Optional["activity_order_by"]
    activity_id: Optional[order_by]
    created_at: Optional[order_by]
    dim_table: Optional["dim_table_order_by"]
    dim_table_id: Optional[order_by]
    ended_at: Optional[order_by]
    id: Optional[order_by]
    kind: Optional[order_by]
    maintenance_kind: Optional["maintenance_kinds_order_by"]
    notes: Optional[order_by]
    started_at: Optional[order_by]
    updated_at: Optional[order_by]


class activity_maintenance_pk_columns_input(BaseModel):
    id: Any


class activity_maintenance_set_input(BaseModel):
    activity_id: Optional[Any]
    created_at: Optional[Any]
    dim_table_id: Optional[Any]
    ended_at: Optional[Any]
    id: Optional[Any]
    kind: Optional[maintenance_kinds_enum]
    notes: Optional[str]
    started_at: Optional[Any]
    updated_at: Optional[Any]


class activity_maintenance_stream_cursor_input(BaseModel):
    initial_value: "activity_maintenance_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class activity_maintenance_stream_cursor_value_input(BaseModel):
    activity_id: Optional[Any]
    created_at: Optional[Any]
    dim_table_id: Optional[Any]
    ended_at: Optional[Any]
    id: Optional[Any]
    kind: Optional[maintenance_kinds_enum]
    notes: Optional[str]
    started_at: Optional[Any]
    updated_at: Optional[Any]


class activity_maintenance_updates(BaseModel):
    set: Optional["activity_maintenance_set_input"] = Field(alias="_set")
    where: "activity_maintenance_bool_exp"


class activity_max_order_by(BaseModel):
    category: Optional[order_by]
    category_id: Optional[order_by]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    description: Optional[order_by]
    feature_distributions: Optional[order_by]
    id: Optional[order_by]
    last_indexed_at: Optional[order_by]
    maintainer_id: Optional[order_by]
    maintenance_ended_at: Optional[order_by]
    maintenance_started_at: Optional[order_by]
    name: Optional[order_by]
    next_index_at: Optional[order_by]
    row_count: Optional[order_by]
    sensitive_name_alternative: Optional[order_by]
    slug: Optional[order_by]
    table_id: Optional[order_by]
    time_plots: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class activity_min_order_by(BaseModel):
    category: Optional[order_by]
    category_id: Optional[order_by]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    description: Optional[order_by]
    feature_distributions: Optional[order_by]
    id: Optional[order_by]
    last_indexed_at: Optional[order_by]
    maintainer_id: Optional[order_by]
    maintenance_ended_at: Optional[order_by]
    maintenance_started_at: Optional[order_by]
    name: Optional[order_by]
    next_index_at: Optional[order_by]
    row_count: Optional[order_by]
    sensitive_name_alternative: Optional[order_by]
    slug: Optional[order_by]
    table_id: Optional[order_by]
    time_plots: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class activity_obj_rel_insert_input(BaseModel):
    data: "activity_insert_input"
    on_conflict: Optional["activity_on_conflict"]


class activity_on_conflict(BaseModel):
    constraint: activity_constraint
    update_columns: List[activity_update_column]
    where: Optional["activity_bool_exp"]


class activity_order_by(BaseModel):
    activity_dims_aggregate: Optional["activity_dim_aggregate_order_by"]
    activity_maintenances_aggregate: Optional["activity_maintenance_aggregate_order_by"]
    category: Optional[order_by]
    category_id: Optional[order_by]
    column_renames_aggregate: Optional["activity_column_renames_aggregate_order_by"]
    company: Optional["company_order_by"]
    company_category: Optional["company_categories_order_by"]
    company_id: Optional[order_by]
    company_table: Optional["company_table_order_by"]
    created_at: Optional[order_by]
    datasets_aggregate: Optional["dataset_activities_aggregate_order_by"]
    description: Optional[order_by]
    enriched_by_aggregate: Optional["tranformation_enriched_activities_aggregate_order_by"]
    feature_distributions: Optional[order_by]
    id: Optional[order_by]
    last_indexed_at: Optional[order_by]
    maintainer: Optional["user_order_by"]
    maintainer_id: Optional[order_by]
    maintenance_ended_at: Optional[order_by]
    maintenance_started_at: Optional[order_by]
    name: Optional[order_by]
    next_index_at: Optional[order_by]
    question_answers_aggregate: Optional["activity_questions_aggregate_order_by"]
    row_count: Optional[order_by]
    sensitive_name_alternative: Optional[order_by]
    slug: Optional[order_by]
    status: Optional[order_by]
    table_id: Optional[order_by]
    tags_aggregate: Optional["activity_tags_aggregate_order_by"]
    team_permissions_aggregate: Optional["activity_team_permissions_aggregate_order_by"]
    time_plots: Optional[order_by]
    timeline_aggregate: Optional["activity_company_timelines_aggregate_order_by"]
    transformations_aggregate: Optional["transformation_activities_aggregate_order_by"]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]
    validated: Optional[order_by]
    validation_queries_aggregate: Optional["validation_activity_sql_queries_aggregate_order_by"]


class activity_pk_columns_input(BaseModel):
    id: Any


class activity_questions_aggregate_bool_exp(BaseModel):
    count: Optional["activity_questions_aggregate_bool_exp_count"]


class activity_questions_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[activity_questions_select_column]]
    distinct: Optional[bool]
    filter: Optional["activity_questions_bool_exp"]
    predicate: "Int_comparison_exp"


class activity_questions_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["activity_questions_max_order_by"]
    min: Optional["activity_questions_min_order_by"]


class activity_questions_arr_rel_insert_input(BaseModel):
    data: List["activity_questions_insert_input"]


class activity_questions_bool_exp(BaseModel):
    and_: Optional[List["activity_questions_bool_exp"]] = Field(alias="_and")
    not_: Optional["activity_questions_bool_exp"] = Field(alias="_not")
    or_: Optional[List["activity_questions_bool_exp"]] = Field(alias="_or")
    activity_id: Optional["uuid_comparison_exp"]
    answer: Optional["String_comparison_exp"]
    answered_by: Optional["String_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    question: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class activity_questions_insert_input(BaseModel):
    activity_id: Optional[Any]
    answer: Optional[str]
    answered_by: Optional[str]
    created_at: Optional[Any]
    id: Optional[Any]
    question: Optional[str]
    updated_at: Optional[Any]


class activity_questions_max_order_by(BaseModel):
    activity_id: Optional[order_by]
    answer: Optional[order_by]
    answered_by: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    question: Optional[order_by]
    updated_at: Optional[order_by]


class activity_questions_min_order_by(BaseModel):
    activity_id: Optional[order_by]
    answer: Optional[order_by]
    answered_by: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    question: Optional[order_by]
    updated_at: Optional[order_by]


class activity_questions_order_by(BaseModel):
    activity_id: Optional[order_by]
    answer: Optional[order_by]
    answered_by: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    question: Optional[order_by]
    updated_at: Optional[order_by]


class activity_questions_set_input(BaseModel):
    activity_id: Optional[Any]
    answer: Optional[str]
    answered_by: Optional[str]
    created_at: Optional[Any]
    id: Optional[Any]
    question: Optional[str]
    updated_at: Optional[Any]


class activity_questions_stream_cursor_input(BaseModel):
    initial_value: "activity_questions_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class activity_questions_stream_cursor_value_input(BaseModel):
    activity_id: Optional[Any]
    answer: Optional[str]
    answered_by: Optional[str]
    created_at: Optional[Any]
    id: Optional[Any]
    question: Optional[str]
    updated_at: Optional[Any]


class activity_questions_updates(BaseModel):
    set: Optional["activity_questions_set_input"] = Field(alias="_set")
    where: "activity_questions_bool_exp"


class activity_set_input(BaseModel):
    category: Optional[str]
    category_id: Optional[Any]
    company_id: Optional[Any]
    created_at: Optional[Any]
    description: Optional[str]
    feature_distributions: Optional[str]
    id: Optional[Any]
    last_indexed_at: Optional[Any]
    maintainer_id: Optional[Any]
    maintenance_ended_at: Optional[Any]
    maintenance_started_at: Optional[Any]
    name: Optional[str]
    next_index_at: Optional[Any]
    row_count: Optional[int]
    sensitive_name_alternative: Optional[str]
    slug: Optional[str]
    status: Optional[activity_status_enum]
    table_id: Optional[Any]
    time_plots: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[str]
    validated: Optional[bool]


class activity_status_bool_exp(BaseModel):
    and_: Optional[List["activity_status_bool_exp"]] = Field(alias="_and")
    not_: Optional["activity_status_bool_exp"] = Field(alias="_not")
    or_: Optional[List["activity_status_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class activity_status_enum_comparison_exp(BaseModel):
    eq: Optional[activity_status_enum] = Field(alias="_eq")
    in_: Optional[List[activity_status_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[activity_status_enum] = Field(alias="_neq")
    nin: Optional[List[activity_status_enum]] = Field(alias="_nin")


class activity_status_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class activity_status_on_conflict(BaseModel):
    constraint: activity_status_constraint
    update_columns: List[activity_status_update_column]
    where: Optional["activity_status_bool_exp"]


class activity_status_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class activity_status_pk_columns_input(BaseModel):
    value: str


class activity_status_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class activity_status_stream_cursor_input(BaseModel):
    initial_value: "activity_status_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class activity_status_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class activity_status_updates(BaseModel):
    set: Optional["activity_status_set_input"] = Field(alias="_set")
    where: "activity_status_bool_exp"


class activity_stddev_order_by(BaseModel):
    row_count: Optional[order_by]


class activity_stddev_pop_order_by(BaseModel):
    row_count: Optional[order_by]


class activity_stddev_samp_order_by(BaseModel):
    row_count: Optional[order_by]


class activity_stream_cursor_input(BaseModel):
    initial_value: "activity_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class activity_stream_cursor_value_input(BaseModel):
    category: Optional[str]
    category_id: Optional[Any]
    company_id: Optional[Any]
    created_at: Optional[Any]
    description: Optional[str]
    feature_distributions: Optional[str]
    id: Optional[Any]
    last_indexed_at: Optional[Any]
    maintainer_id: Optional[Any]
    maintenance_ended_at: Optional[Any]
    maintenance_started_at: Optional[Any]
    name: Optional[str]
    next_index_at: Optional[Any]
    row_count: Optional[int]
    sensitive_name_alternative: Optional[str]
    slug: Optional[str]
    status: Optional[activity_status_enum]
    table_id: Optional[Any]
    time_plots: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[str]
    validated: Optional[bool]


class activity_sum_order_by(BaseModel):
    row_count: Optional[order_by]


class activity_tags_aggregate_bool_exp(BaseModel):
    count: Optional["activity_tags_aggregate_bool_exp_count"]


class activity_tags_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[activity_tags_select_column]]
    distinct: Optional[bool]
    filter: Optional["activity_tags_bool_exp"]
    predicate: "Int_comparison_exp"


class activity_tags_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["activity_tags_max_order_by"]
    min: Optional["activity_tags_min_order_by"]


class activity_tags_arr_rel_insert_input(BaseModel):
    data: List["activity_tags_insert_input"]


class activity_tags_bool_exp(BaseModel):
    and_: Optional[List["activity_tags_bool_exp"]] = Field(alias="_and")
    not_: Optional["activity_tags_bool_exp"] = Field(alias="_not")
    or_: Optional[List["activity_tags_bool_exp"]] = Field(alias="_or")
    activity: Optional["activity_bool_exp"]
    activity_id: Optional["uuid_comparison_exp"]
    company_tag: Optional["company_tags_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    tag_id: Optional["uuid_comparison_exp"]


class activity_tags_insert_input(BaseModel):
    activity: Optional["activity_obj_rel_insert_input"]
    activity_id: Optional[Any]
    company_tag: Optional["company_tags_obj_rel_insert_input"]
    created_at: Optional[Any]
    id: Optional[Any]
    tag_id: Optional[Any]


class activity_tags_max_order_by(BaseModel):
    activity_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    tag_id: Optional[order_by]


class activity_tags_min_order_by(BaseModel):
    activity_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    tag_id: Optional[order_by]


class activity_tags_order_by(BaseModel):
    activity: Optional["activity_order_by"]
    activity_id: Optional[order_by]
    company_tag: Optional["company_tags_order_by"]
    created_at: Optional[order_by]
    id: Optional[order_by]
    tag_id: Optional[order_by]


class activity_tags_set_input(BaseModel):
    activity_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    tag_id: Optional[Any]


class activity_tags_stream_cursor_input(BaseModel):
    initial_value: "activity_tags_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class activity_tags_stream_cursor_value_input(BaseModel):
    activity_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    tag_id: Optional[Any]


class activity_tags_updates(BaseModel):
    set: Optional["activity_tags_set_input"] = Field(alias="_set")
    where: "activity_tags_bool_exp"


class activity_team_permissions_aggregate_bool_exp(BaseModel):
    bool_and: Optional["activity_team_permissions_aggregate_bool_exp_bool_and"]
    bool_or: Optional["activity_team_permissions_aggregate_bool_exp_bool_or"]
    count: Optional["activity_team_permissions_aggregate_bool_exp_count"]


class activity_team_permissions_aggregate_bool_exp_bool_and(BaseModel):
    arguments: (
        activity_team_permissions_select_column_activity_team_permissions_aggregate_bool_exp_bool_and_arguments_columns
    )
    distinct: Optional[bool]
    filter: Optional["activity_team_permissions_bool_exp"]
    predicate: "Boolean_comparison_exp"


class activity_team_permissions_aggregate_bool_exp_bool_or(BaseModel):
    arguments: (
        activity_team_permissions_select_column_activity_team_permissions_aggregate_bool_exp_bool_or_arguments_columns
    )
    distinct: Optional[bool]
    filter: Optional["activity_team_permissions_bool_exp"]
    predicate: "Boolean_comparison_exp"


class activity_team_permissions_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[activity_team_permissions_select_column]]
    distinct: Optional[bool]
    filter: Optional["activity_team_permissions_bool_exp"]
    predicate: "Int_comparison_exp"


class activity_team_permissions_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["activity_team_permissions_max_order_by"]
    min: Optional["activity_team_permissions_min_order_by"]


class activity_team_permissions_arr_rel_insert_input(BaseModel):
    data: List["activity_team_permissions_insert_input"]


class activity_team_permissions_bool_exp(BaseModel):
    and_: Optional[List["activity_team_permissions_bool_exp"]] = Field(alias="_and")
    not_: Optional["activity_team_permissions_bool_exp"] = Field(alias="_not")
    or_: Optional[List["activity_team_permissions_bool_exp"]] = Field(alias="_or")
    activity_id: Optional["uuid_comparison_exp"]
    can_edit: Optional["Boolean_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    team: Optional["team_bool_exp"]
    team_id: Optional["uuid_comparison_exp"]


class activity_team_permissions_insert_input(BaseModel):
    activity_id: Optional[Any]
    can_edit: Optional[bool]
    created_at: Optional[Any]
    id: Optional[Any]
    team: Optional["team_obj_rel_insert_input"]
    team_id: Optional[Any]


class activity_team_permissions_max_order_by(BaseModel):
    activity_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    team_id: Optional[order_by]


class activity_team_permissions_min_order_by(BaseModel):
    activity_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    team_id: Optional[order_by]


class activity_team_permissions_order_by(BaseModel):
    activity_id: Optional[order_by]
    can_edit: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    team: Optional["team_order_by"]
    team_id: Optional[order_by]


class activity_team_permissions_set_input(BaseModel):
    activity_id: Optional[Any]
    can_edit: Optional[bool]
    created_at: Optional[Any]
    id: Optional[Any]
    team_id: Optional[Any]


class activity_team_permissions_stream_cursor_input(BaseModel):
    initial_value: "activity_team_permissions_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class activity_team_permissions_stream_cursor_value_input(BaseModel):
    activity_id: Optional[Any]
    can_edit: Optional[bool]
    created_at: Optional[Any]
    id: Optional[Any]
    team_id: Optional[Any]


class activity_team_permissions_updates(BaseModel):
    set: Optional["activity_team_permissions_set_input"] = Field(alias="_set")
    where: "activity_team_permissions_bool_exp"


class activity_updates(BaseModel):
    inc: Optional["activity_inc_input"] = Field(alias="_inc")
    set: Optional["activity_set_input"] = Field(alias="_set")
    where: "activity_bool_exp"


class activity_var_pop_order_by(BaseModel):
    row_count: Optional[order_by]


class activity_var_samp_order_by(BaseModel):
    row_count: Optional[order_by]


class activity_variance_order_by(BaseModel):
    row_count: Optional[order_by]


class bigint_comparison_exp(BaseModel):
    eq: Optional[Any] = Field(alias="_eq")
    gt: Optional[Any] = Field(alias="_gt")
    gte: Optional[Any] = Field(alias="_gte")
    in_: Optional[List[Any]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    lt: Optional[Any] = Field(alias="_lt")
    lte: Optional[Any] = Field(alias="_lte")
    neq: Optional[Any] = Field(alias="_neq")
    nin: Optional[List[Any]] = Field(alias="_nin")


class chat_append_input(BaseModel):
    messages: Optional[Any]


class chat_bool_exp(BaseModel):
    and_: Optional[List["chat_bool_exp"]] = Field(alias="_and")
    not_: Optional["chat_bool_exp"] = Field(alias="_not")
    or_: Optional[List["chat_bool_exp"]] = Field(alias="_or")
    company_table: Optional["company_table_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    created_by: Optional["uuid_comparison_exp"]
    detailed_summary: Optional["String_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    messages: Optional["jsonb_comparison_exp"]
    question: Optional["String_comparison_exp"]
    rating: Optional["Int_comparison_exp"]
    summary: Optional["String_comparison_exp"]
    table_id: Optional["uuid_comparison_exp"]
    tags: Optional["chat_tags_bool_exp"]
    tags_aggregate: Optional["chat_tags_aggregate_bool_exp"]
    training_requests: Optional["training_request_bool_exp"]
    training_requests_aggregate: Optional["training_request_aggregate_bool_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    user: Optional["user_bool_exp"]


class chat_delete_at_path_input(BaseModel):
    messages: Optional[List[str]]


class chat_delete_elem_input(BaseModel):
    messages: Optional[int]


class chat_delete_key_input(BaseModel):
    messages: Optional[str]


class chat_inc_input(BaseModel):
    rating: Optional[int]


class chat_insert_input(BaseModel):
    company_table: Optional["company_table_obj_rel_insert_input"]
    created_at: Optional[Any]
    created_by: Optional[Any]
    detailed_summary: Optional[str]
    id: Optional[Any]
    messages: Optional[Any]
    question: Optional[str]
    rating: Optional[int]
    summary: Optional[str]
    table_id: Optional[Any]
    tags: Optional["chat_tags_arr_rel_insert_input"]
    training_requests: Optional["training_request_arr_rel_insert_input"]
    updated_at: Optional[Any]
    user: Optional["user_obj_rel_insert_input"]


class chat_obj_rel_insert_input(BaseModel):
    data: "chat_insert_input"
    on_conflict: Optional["chat_on_conflict"]


class chat_on_conflict(BaseModel):
    constraint: chat_constraint
    update_columns: List[chat_update_column]
    where: Optional["chat_bool_exp"]


class chat_order_by(BaseModel):
    company_table: Optional["company_table_order_by"]
    created_at: Optional[order_by]
    created_by: Optional[order_by]
    detailed_summary: Optional[order_by]
    id: Optional[order_by]
    messages: Optional[order_by]
    question: Optional[order_by]
    rating: Optional[order_by]
    summary: Optional[order_by]
    table_id: Optional[order_by]
    tags_aggregate: Optional["chat_tags_aggregate_order_by"]
    training_requests_aggregate: Optional["training_request_aggregate_order_by"]
    updated_at: Optional[order_by]
    user: Optional["user_order_by"]


class chat_pk_columns_input(BaseModel):
    id: Any


class chat_prepend_input(BaseModel):
    messages: Optional[Any]


class chat_set_input(BaseModel):
    created_at: Optional[Any]
    created_by: Optional[Any]
    detailed_summary: Optional[str]
    id: Optional[Any]
    messages: Optional[Any]
    question: Optional[str]
    rating: Optional[int]
    summary: Optional[str]
    table_id: Optional[Any]
    updated_at: Optional[Any]


class chat_stream_cursor_input(BaseModel):
    initial_value: "chat_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class chat_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    created_by: Optional[Any]
    detailed_summary: Optional[str]
    id: Optional[Any]
    messages: Optional[Any]
    question: Optional[str]
    rating: Optional[int]
    summary: Optional[str]
    table_id: Optional[Any]
    updated_at: Optional[Any]


class chat_tags_aggregate_bool_exp(BaseModel):
    count: Optional["chat_tags_aggregate_bool_exp_count"]


class chat_tags_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[chat_tags_select_column]]
    distinct: Optional[bool]
    filter: Optional["chat_tags_bool_exp"]
    predicate: "Int_comparison_exp"


class chat_tags_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["chat_tags_max_order_by"]
    min: Optional["chat_tags_min_order_by"]


class chat_tags_arr_rel_insert_input(BaseModel):
    data: List["chat_tags_insert_input"]


class chat_tags_bool_exp(BaseModel):
    and_: Optional[List["chat_tags_bool_exp"]] = Field(alias="_and")
    not_: Optional["chat_tags_bool_exp"] = Field(alias="_not")
    or_: Optional[List["chat_tags_bool_exp"]] = Field(alias="_or")
    chat_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    tag_id: Optional["uuid_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class chat_tags_insert_input(BaseModel):
    chat_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    tag_id: Optional[Any]
    updated_at: Optional[Any]


class chat_tags_max_order_by(BaseModel):
    chat_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    tag_id: Optional[order_by]
    updated_at: Optional[order_by]


class chat_tags_min_order_by(BaseModel):
    chat_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    tag_id: Optional[order_by]
    updated_at: Optional[order_by]


class chat_tags_order_by(BaseModel):
    chat_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    tag_id: Optional[order_by]
    updated_at: Optional[order_by]


class chat_tags_set_input(BaseModel):
    chat_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    tag_id: Optional[Any]
    updated_at: Optional[Any]


class chat_tags_stream_cursor_input(BaseModel):
    initial_value: "chat_tags_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class chat_tags_stream_cursor_value_input(BaseModel):
    chat_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    tag_id: Optional[Any]
    updated_at: Optional[Any]


class chat_tags_updates(BaseModel):
    set: Optional["chat_tags_set_input"] = Field(alias="_set")
    where: "chat_tags_bool_exp"


class chat_updates(BaseModel):
    append: Optional["chat_append_input"] = Field(alias="_append")
    delete_at_path: Optional["chat_delete_at_path_input"] = Field(alias="_delete_at_path")
    delete_elem: Optional["chat_delete_elem_input"] = Field(alias="_delete_elem")
    delete_key: Optional["chat_delete_key_input"] = Field(alias="_delete_key")
    inc: Optional["chat_inc_input"] = Field(alias="_inc")
    prepend: Optional["chat_prepend_input"] = Field(alias="_prepend")
    set: Optional["chat_set_input"] = Field(alias="_set")
    where: "chat_bool_exp"


class column_rename_relations_bool_exp(BaseModel):
    and_: Optional[List["column_rename_relations_bool_exp"]] = Field(alias="_and")
    not_: Optional["column_rename_relations_bool_exp"] = Field(alias="_not")
    or_: Optional[List["column_rename_relations_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class column_rename_relations_enum_comparison_exp(BaseModel):
    eq: Optional[column_rename_relations_enum] = Field(alias="_eq")
    in_: Optional[List[column_rename_relations_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[column_rename_relations_enum] = Field(alias="_neq")
    nin: Optional[List[column_rename_relations_enum]] = Field(alias="_nin")


class column_rename_relations_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class column_rename_relations_on_conflict(BaseModel):
    constraint: column_rename_relations_constraint
    update_columns: List[column_rename_relations_update_column]
    where: Optional["column_rename_relations_bool_exp"]


class column_rename_relations_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class column_rename_relations_pk_columns_input(BaseModel):
    value: str


class column_rename_relations_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class column_rename_relations_stream_cursor_input(BaseModel):
    initial_value: "column_rename_relations_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class column_rename_relations_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class column_rename_relations_updates(BaseModel):
    set: Optional["column_rename_relations_set_input"] = Field(alias="_set")
    where: "column_rename_relations_bool_exp"


class column_renames_bool_exp(BaseModel):
    and_: Optional[List["column_renames_bool_exp"]] = Field(alias="_and")
    not_: Optional["column_renames_bool_exp"] = Field(alias="_not")
    or_: Optional[List["column_renames_bool_exp"]] = Field(alias="_or")
    casting: Optional["String_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    description: Optional["String_comparison_exp"]
    has_data: Optional["Boolean_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    label: Optional["String_comparison_exp"]
    name: Optional["String_comparison_exp"]
    related_to: Optional["column_rename_relations_enum_comparison_exp"]
    related_to_id: Optional["uuid_comparison_exp"]
    sensitive_label_alternative: Optional["String_comparison_exp"]
    type: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class column_renames_insert_input(BaseModel):
    casting: Optional[str]
    created_at: Optional[Any]
    description: Optional[str]
    has_data: Optional[bool]
    id: Optional[Any]
    label: Optional[str]
    name: Optional[str]
    related_to: Optional[column_rename_relations_enum]
    related_to_id: Optional[Any]
    sensitive_label_alternative: Optional[str]
    type: Optional[str]
    updated_at: Optional[Any]


class column_renames_on_conflict(BaseModel):
    constraint: column_renames_constraint
    update_columns: List[column_renames_update_column]
    where: Optional["column_renames_bool_exp"]


class column_renames_order_by(BaseModel):
    casting: Optional[order_by]
    created_at: Optional[order_by]
    description: Optional[order_by]
    has_data: Optional[order_by]
    id: Optional[order_by]
    label: Optional[order_by]
    name: Optional[order_by]
    related_to: Optional[order_by]
    related_to_id: Optional[order_by]
    sensitive_label_alternative: Optional[order_by]
    type: Optional[order_by]
    updated_at: Optional[order_by]


class column_renames_pk_columns_input(BaseModel):
    id: Any


class column_renames_set_input(BaseModel):
    casting: Optional[str]
    created_at: Optional[Any]
    description: Optional[str]
    has_data: Optional[bool]
    id: Optional[Any]
    label: Optional[str]
    name: Optional[str]
    related_to: Optional[column_rename_relations_enum]
    related_to_id: Optional[Any]
    sensitive_label_alternative: Optional[str]
    type: Optional[str]
    updated_at: Optional[Any]


class column_renames_stream_cursor_input(BaseModel):
    initial_value: "column_renames_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class column_renames_stream_cursor_value_input(BaseModel):
    casting: Optional[str]
    created_at: Optional[Any]
    description: Optional[str]
    has_data: Optional[bool]
    id: Optional[Any]
    label: Optional[str]
    name: Optional[str]
    related_to: Optional[column_rename_relations_enum]
    related_to_id: Optional[Any]
    sensitive_label_alternative: Optional[str]
    type: Optional[str]
    updated_at: Optional[Any]


class column_renames_updates(BaseModel):
    set: Optional["column_renames_set_input"] = Field(alias="_set")
    where: "column_renames_bool_exp"


class company_auth0_bool_exp(BaseModel):
    and_: Optional[List["company_auth0_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_auth0_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_auth0_bool_exp"]] = Field(alias="_or")
    assign_membership_on_login: Optional["Boolean_comparison_exp"]
    company: Optional["company_bool_exp"]
    company_id: Optional["uuid_comparison_exp"]
    connection_id: Optional["String_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    disable_sso: Optional["Boolean_comparison_exp"]
    enforce_sso: Optional["Boolean_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    org_id: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class company_auth0_insert_input(BaseModel):
    assign_membership_on_login: Optional[bool]
    company: Optional["company_obj_rel_insert_input"]
    company_id: Optional[Any]
    connection_id: Optional[str]
    created_at: Optional[Any]
    disable_sso: Optional[bool]
    enforce_sso: Optional[bool]
    id: Optional[Any]
    org_id: Optional[str]
    updated_at: Optional[Any]


class company_auth0_obj_rel_insert_input(BaseModel):
    data: "company_auth0_insert_input"
    on_conflict: Optional["company_auth0_on_conflict"]


class company_auth0_on_conflict(BaseModel):
    constraint: company_auth0_constraint
    update_columns: List[company_auth0_update_column]
    where: Optional["company_auth0_bool_exp"]


class company_auth0_order_by(BaseModel):
    assign_membership_on_login: Optional[order_by]
    company: Optional["company_order_by"]
    company_id: Optional[order_by]
    connection_id: Optional[order_by]
    created_at: Optional[order_by]
    disable_sso: Optional[order_by]
    enforce_sso: Optional[order_by]
    id: Optional[order_by]
    org_id: Optional[order_by]
    updated_at: Optional[order_by]


class company_auth0_pk_columns_input(BaseModel):
    id: Any


class company_auth0_set_input(BaseModel):
    assign_membership_on_login: Optional[bool]
    company_id: Optional[Any]
    connection_id: Optional[str]
    created_at: Optional[Any]
    disable_sso: Optional[bool]
    enforce_sso: Optional[bool]
    id: Optional[Any]
    org_id: Optional[str]
    updated_at: Optional[Any]


class company_auth0_stream_cursor_input(BaseModel):
    initial_value: "company_auth0_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_auth0_stream_cursor_value_input(BaseModel):
    assign_membership_on_login: Optional[bool]
    company_id: Optional[Any]
    connection_id: Optional[str]
    created_at: Optional[Any]
    disable_sso: Optional[bool]
    enforce_sso: Optional[bool]
    id: Optional[Any]
    org_id: Optional[str]
    updated_at: Optional[Any]


class company_auth0_updates(BaseModel):
    set: Optional["company_auth0_set_input"] = Field(alias="_set")
    where: "company_auth0_bool_exp"


class company_bool_exp(BaseModel):
    and_: Optional[List["company_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_bool_exp"]] = Field(alias="_or")
    activities: Optional["activity_bool_exp"]
    activities_aggregate: Optional["activity_aggregate_bool_exp"]
    allow_narrator_employee_access: Optional["Boolean_comparison_exp"]
    auth0: Optional["company_auth0_bool_exp"]
    batch_halt: Optional["Boolean_comparison_exp"]
    batch_halted_at: Optional["date_comparison_exp"]
    batch_halted_by: Optional["uuid_comparison_exp"]
    branding_color: Optional["String_comparison_exp"]
    cache_minutes: Optional["Int_comparison_exp"]
    company_tags: Optional["company_tags_bool_exp"]
    company_tags_aggregate: Optional["company_tags_aggregate_bool_exp"]
    company_users: Optional["company_user_bool_exp"]
    company_users_aggregate: Optional["company_user_aggregate_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    created_by: Optional["uuid_comparison_exp"]
    created_by_user: Optional["user_bool_exp"]
    created_for: Optional["uuid_comparison_exp"]
    created_for_user: Optional["user_bool_exp"]
    currency_used: Optional["String_comparison_exp"]
    datacenter_region: Optional["datacenter_region_enum_comparison_exp"]
    dataset_default_filter_days: Optional["Int_comparison_exp"]
    dataset_default_filter_months: Optional["Int_comparison_exp"]
    dataset_row_threshold: Optional["Int_comparison_exp"]
    demo_company: Optional["Boolean_comparison_exp"]
    description: Optional["String_comparison_exp"]
    fivetran_destination_id: Optional["String_comparison_exp"]
    github_sync: Optional["company_github_sync_bool_exp"]
    github_sync_aggregate: Optional["company_github_sync_aggregate_bool_exp"]
    groups: Optional["group_bool_exp"]
    groups_aggregate: Optional["group_aggregate_bool_exp"]
    id: Optional["uuid_comparison_exp"]
    ignore_in_reporting: Optional["Boolean_comparison_exp"]
    logo_url: Optional["String_comparison_exp"]
    materialize_schema: Optional["String_comparison_exp"]
    max_inserts: Optional["Int_comparison_exp"]
    name: Optional["String_comparison_exp"]
    plot_colors: Optional["String_comparison_exp"]
    production_schema: Optional["String_comparison_exp"]
    project_id: Optional["String_comparison_exp"]
    removed_at: Optional["timestamptz_comparison_exp"]
    resources: Optional["company_resources_bool_exp"]
    select_wlm_count: Optional["Int_comparison_exp"]
    service_limits: Optional["service_limit_bool_exp"]
    service_limits_aggregate: Optional["service_limit_aggregate_bool_exp"]
    skip_automated_archive: Optional["Boolean_comparison_exp"]
    slug: Optional["String_comparison_exp"]
    spend_table: Optional["String_comparison_exp"]
    start_data_on: Optional["date_comparison_exp"]
    status: Optional["company_status_enum_comparison_exp"]
    tables: Optional["company_table_bool_exp"]
    tables_aggregate: Optional["company_table_aggregate_bool_exp"]
    tasks: Optional["company_task_bool_exp"]
    tasks_aggregate: Optional["company_task_aggregate_bool_exp"]
    teams: Optional["team_bool_exp"]
    teams_aggregate: Optional["team_aggregate_bool_exp"]
    timezone: Optional["String_comparison_exp"]
    transformations: Optional["transformation_bool_exp"]
    transformations_aggregate: Optional["transformation_aggregate_bool_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    use_time_boundary: Optional["Boolean_comparison_exp"]
    validation_months: Optional["Int_comparison_exp"]
    warehouse_default_schemas: Optional["String_comparison_exp"]
    warehouse_language: Optional["company_config_warehouse_language_enum_comparison_exp"]
    website: Optional["String_comparison_exp"]
    week_day_offset: Optional["Int_comparison_exp"]


class company_categories_bool_exp(BaseModel):
    and_: Optional[List["company_categories_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_categories_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_categories_bool_exp"]] = Field(alias="_or")
    activities: Optional["activity_bool_exp"]
    activities_aggregate: Optional["activity_aggregate_bool_exp"]
    category: Optional["String_comparison_exp"]
    color: Optional["String_comparison_exp"]
    company_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]


class company_categories_insert_input(BaseModel):
    activities: Optional["activity_arr_rel_insert_input"]
    category: Optional[str]
    color: Optional[str]
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]


class company_categories_obj_rel_insert_input(BaseModel):
    data: "company_categories_insert_input"
    on_conflict: Optional["company_categories_on_conflict"]


class company_categories_on_conflict(BaseModel):
    constraint: company_categories_constraint
    update_columns: List[company_categories_update_column]
    where: Optional["company_categories_bool_exp"]


class company_categories_order_by(BaseModel):
    activities_aggregate: Optional["activity_aggregate_order_by"]
    category: Optional[order_by]
    color: Optional[order_by]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]


class company_categories_pk_columns_input(BaseModel):
    id: Any


class company_categories_set_input(BaseModel):
    category: Optional[str]
    color: Optional[str]
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]


class company_categories_stream_cursor_input(BaseModel):
    initial_value: "company_categories_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_categories_stream_cursor_value_input(BaseModel):
    category: Optional[str]
    color: Optional[str]
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]


class company_categories_updates(BaseModel):
    set: Optional["company_categories_set_input"] = Field(alias="_set")
    where: "company_categories_bool_exp"


class company_config_batch_version_bool_exp(BaseModel):
    and_: Optional[List["company_config_batch_version_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_config_batch_version_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_config_batch_version_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class company_config_batch_version_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_config_batch_version_on_conflict(BaseModel):
    constraint: company_config_batch_version_constraint
    update_columns: List[company_config_batch_version_update_column]
    where: Optional["company_config_batch_version_bool_exp"]


class company_config_batch_version_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class company_config_batch_version_pk_columns_input(BaseModel):
    value: str


class company_config_batch_version_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_config_batch_version_stream_cursor_input(BaseModel):
    initial_value: "company_config_batch_version_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_config_batch_version_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_config_batch_version_updates(BaseModel):
    set: Optional["company_config_batch_version_set_input"] = Field(alias="_set")
    where: "company_config_batch_version_bool_exp"


class company_config_core_version_bool_exp(BaseModel):
    and_: Optional[List["company_config_core_version_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_config_core_version_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_config_core_version_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class company_config_core_version_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_config_core_version_on_conflict(BaseModel):
    constraint: company_config_core_version_constraint
    update_columns: List[company_config_core_version_update_column]
    where: Optional["company_config_core_version_bool_exp"]


class company_config_core_version_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class company_config_core_version_pk_columns_input(BaseModel):
    value: str


class company_config_core_version_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_config_core_version_stream_cursor_input(BaseModel):
    initial_value: "company_config_core_version_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_config_core_version_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_config_core_version_updates(BaseModel):
    set: Optional["company_config_core_version_set_input"] = Field(alias="_set")
    where: "company_config_core_version_bool_exp"


class company_config_warehouse_language_bool_exp(BaseModel):
    and_: Optional[List["company_config_warehouse_language_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_config_warehouse_language_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_config_warehouse_language_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class company_config_warehouse_language_enum_comparison_exp(BaseModel):
    eq: Optional[company_config_warehouse_language_enum] = Field(alias="_eq")
    in_: Optional[List[company_config_warehouse_language_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[company_config_warehouse_language_enum] = Field(alias="_neq")
    nin: Optional[List[company_config_warehouse_language_enum]] = Field(alias="_nin")


class company_config_warehouse_language_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_config_warehouse_language_on_conflict(BaseModel):
    constraint: company_config_warehouse_language_constraint
    update_columns: List[company_config_warehouse_language_update_column]
    where: Optional["company_config_warehouse_language_bool_exp"]


class company_config_warehouse_language_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class company_config_warehouse_language_pk_columns_input(BaseModel):
    value: str


class company_config_warehouse_language_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_config_warehouse_language_stream_cursor_input(BaseModel):
    initial_value: "company_config_warehouse_language_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_config_warehouse_language_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_config_warehouse_language_updates(BaseModel):
    set: Optional["company_config_warehouse_language_set_input"] = Field(alias="_set")
    where: "company_config_warehouse_language_bool_exp"


class company_github_sync_aggregate_bool_exp(BaseModel):
    count: Optional["company_github_sync_aggregate_bool_exp_count"]


class company_github_sync_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[company_github_sync_select_column]]
    distinct: Optional[bool]
    filter: Optional["company_github_sync_bool_exp"]
    predicate: "Int_comparison_exp"


class company_github_sync_aggregate_order_by(BaseModel):
    avg: Optional["company_github_sync_avg_order_by"]
    count: Optional[order_by]
    max: Optional["company_github_sync_max_order_by"]
    min: Optional["company_github_sync_min_order_by"]
    stddev: Optional["company_github_sync_stddev_order_by"]
    stddev_pop: Optional["company_github_sync_stddev_pop_order_by"]
    stddev_samp: Optional["company_github_sync_stddev_samp_order_by"]
    sum: Optional["company_github_sync_sum_order_by"]
    var_pop: Optional["company_github_sync_var_pop_order_by"]
    var_samp: Optional["company_github_sync_var_samp_order_by"]
    variance: Optional["company_github_sync_variance_order_by"]


class company_github_sync_arr_rel_insert_input(BaseModel):
    data: List["company_github_sync_insert_input"]
    on_conflict: Optional["company_github_sync_on_conflict"]


class company_github_sync_avg_order_by(BaseModel):
    installation_id: Optional[order_by]


class company_github_sync_bool_exp(BaseModel):
    and_: Optional[List["company_github_sync_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_github_sync_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_github_sync_bool_exp"]] = Field(alias="_or")
    company: Optional["company_bool_exp"]
    company_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    installation_id: Optional["Int_comparison_exp"]
    target_repo: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    user: Optional["user_bool_exp"]
    user_id: Optional["uuid_comparison_exp"]


class company_github_sync_inc_input(BaseModel):
    installation_id: Optional[int]


class company_github_sync_insert_input(BaseModel):
    company: Optional["company_obj_rel_insert_input"]
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    installation_id: Optional[int]
    target_repo: Optional[str]
    updated_at: Optional[Any]
    user: Optional["user_obj_rel_insert_input"]
    user_id: Optional[Any]


class company_github_sync_max_order_by(BaseModel):
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    installation_id: Optional[order_by]
    target_repo: Optional[order_by]
    updated_at: Optional[order_by]
    user_id: Optional[order_by]


class company_github_sync_min_order_by(BaseModel):
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    installation_id: Optional[order_by]
    target_repo: Optional[order_by]
    updated_at: Optional[order_by]
    user_id: Optional[order_by]


class company_github_sync_on_conflict(BaseModel):
    constraint: company_github_sync_constraint
    update_columns: List[company_github_sync_update_column]
    where: Optional["company_github_sync_bool_exp"]


class company_github_sync_order_by(BaseModel):
    company: Optional["company_order_by"]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    installation_id: Optional[order_by]
    target_repo: Optional[order_by]
    updated_at: Optional[order_by]
    user: Optional["user_order_by"]
    user_id: Optional[order_by]


class company_github_sync_pk_columns_input(BaseModel):
    id: Any


class company_github_sync_set_input(BaseModel):
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    installation_id: Optional[int]
    target_repo: Optional[str]
    updated_at: Optional[Any]
    user_id: Optional[Any]


class company_github_sync_stddev_order_by(BaseModel):
    installation_id: Optional[order_by]


class company_github_sync_stddev_pop_order_by(BaseModel):
    installation_id: Optional[order_by]


class company_github_sync_stddev_samp_order_by(BaseModel):
    installation_id: Optional[order_by]


class company_github_sync_stream_cursor_input(BaseModel):
    initial_value: "company_github_sync_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_github_sync_stream_cursor_value_input(BaseModel):
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    installation_id: Optional[int]
    target_repo: Optional[str]
    updated_at: Optional[Any]
    user_id: Optional[Any]


class company_github_sync_sum_order_by(BaseModel):
    installation_id: Optional[order_by]


class company_github_sync_updates(BaseModel):
    inc: Optional["company_github_sync_inc_input"] = Field(alias="_inc")
    set: Optional["company_github_sync_set_input"] = Field(alias="_set")
    where: "company_github_sync_bool_exp"


class company_github_sync_var_pop_order_by(BaseModel):
    installation_id: Optional[order_by]


class company_github_sync_var_samp_order_by(BaseModel):
    installation_id: Optional[order_by]


class company_github_sync_variance_order_by(BaseModel):
    installation_id: Optional[order_by]


class company_inc_input(BaseModel):
    cache_minutes: Optional[int]
    dataset_default_filter_days: Optional[int]
    dataset_default_filter_months: Optional[int]
    dataset_row_threshold: Optional[int]
    max_inserts: Optional[int]
    select_wlm_count: Optional[int]
    validation_months: Optional[int]
    week_day_offset: Optional[int]


class company_insert_input(BaseModel):
    activities: Optional["activity_arr_rel_insert_input"]
    allow_narrator_employee_access: Optional[bool]
    auth0: Optional["company_auth0_obj_rel_insert_input"]
    batch_halt: Optional[bool]
    batch_halted_at: Optional[Any]
    batch_halted_by: Optional[Any]
    branding_color: Optional[str]
    cache_minutes: Optional[int]
    company_tags: Optional["company_tags_arr_rel_insert_input"]
    company_users: Optional["company_user_arr_rel_insert_input"]
    created_at: Optional[Any]
    created_by: Optional[Any]
    created_by_user: Optional["user_obj_rel_insert_input"]
    created_for: Optional[Any]
    created_for_user: Optional["user_obj_rel_insert_input"]
    currency_used: Optional[str]
    datacenter_region: Optional[datacenter_region_enum]
    dataset_default_filter_days: Optional[int]
    dataset_default_filter_months: Optional[int]
    dataset_row_threshold: Optional[int]
    demo_company: Optional[bool]
    description: Optional[str]
    fivetran_destination_id: Optional[str]
    github_sync: Optional["company_github_sync_arr_rel_insert_input"]
    groups: Optional["group_arr_rel_insert_input"]
    id: Optional[Any]
    ignore_in_reporting: Optional[bool]
    logo_url: Optional[str]
    materialize_schema: Optional[str]
    max_inserts: Optional[int]
    name: Optional[str]
    plot_colors: Optional[str]
    production_schema: Optional[str]
    project_id: Optional[str]
    removed_at: Optional[Any]
    resources: Optional["company_resources_obj_rel_insert_input"]
    select_wlm_count: Optional[int]
    service_limits: Optional["service_limit_arr_rel_insert_input"]
    skip_automated_archive: Optional[bool]
    slug: Optional[str]
    spend_table: Optional[str]
    start_data_on: Optional[Any]
    status: Optional[company_status_enum]
    tables: Optional["company_table_arr_rel_insert_input"]
    tasks: Optional["company_task_arr_rel_insert_input"]
    teams: Optional["team_arr_rel_insert_input"]
    timezone: Optional[str]
    transformations: Optional["transformation_arr_rel_insert_input"]
    updated_at: Optional[Any]
    use_time_boundary: Optional[bool]
    validation_months: Optional[int]
    warehouse_default_schemas: Optional[str]
    warehouse_language: Optional[company_config_warehouse_language_enum]
    website: Optional[str]
    week_day_offset: Optional[int]


class company_narrative_templates_bool_exp(BaseModel):
    and_: Optional[List["company_narrative_templates_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_narrative_templates_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_narrative_templates_bool_exp"]] = Field(alias="_or")
    company: Optional["company_bool_exp"]
    company_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    template_name: Optional["String_comparison_exp"]
    templates: Optional["narrative_template_bool_exp"]
    templates_aggregate: Optional["narrative_template_aggregate_bool_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class company_narrative_templates_insert_input(BaseModel):
    company: Optional["company_obj_rel_insert_input"]
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    template_name: Optional[str]
    templates: Optional["narrative_template_arr_rel_insert_input"]
    updated_at: Optional[Any]


class company_narrative_templates_on_conflict(BaseModel):
    constraint: company_narrative_templates_constraint
    update_columns: List[company_narrative_templates_update_column]
    where: Optional["company_narrative_templates_bool_exp"]


class company_narrative_templates_order_by(BaseModel):
    company: Optional["company_order_by"]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    template_name: Optional[order_by]
    templates_aggregate: Optional["narrative_template_aggregate_order_by"]
    updated_at: Optional[order_by]


class company_narrative_templates_pk_columns_input(BaseModel):
    id: Any


class company_narrative_templates_set_input(BaseModel):
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    template_name: Optional[str]
    updated_at: Optional[Any]


class company_narrative_templates_stream_cursor_input(BaseModel):
    initial_value: "company_narrative_templates_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_narrative_templates_stream_cursor_value_input(BaseModel):
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    template_name: Optional[str]
    updated_at: Optional[Any]


class company_narrative_templates_updates(BaseModel):
    set: Optional["company_narrative_templates_set_input"] = Field(alias="_set")
    where: "company_narrative_templates_bool_exp"


class company_obj_rel_insert_input(BaseModel):
    data: "company_insert_input"
    on_conflict: Optional["company_on_conflict"]


class company_on_conflict(BaseModel):
    constraint: company_constraint
    update_columns: List[company_update_column]
    where: Optional["company_bool_exp"]


class company_order_by(BaseModel):
    activities_aggregate: Optional["activity_aggregate_order_by"]
    allow_narrator_employee_access: Optional[order_by]
    auth0: Optional["company_auth0_order_by"]
    batch_halt: Optional[order_by]
    batch_halted_at: Optional[order_by]
    batch_halted_by: Optional[order_by]
    branding_color: Optional[order_by]
    cache_minutes: Optional[order_by]
    company_tags_aggregate: Optional["company_tags_aggregate_order_by"]
    company_users_aggregate: Optional["company_user_aggregate_order_by"]
    created_at: Optional[order_by]
    created_by: Optional[order_by]
    created_by_user: Optional["user_order_by"]
    created_for: Optional[order_by]
    created_for_user: Optional["user_order_by"]
    currency_used: Optional[order_by]
    datacenter_region: Optional[order_by]
    dataset_default_filter_days: Optional[order_by]
    dataset_default_filter_months: Optional[order_by]
    dataset_row_threshold: Optional[order_by]
    demo_company: Optional[order_by]
    description: Optional[order_by]
    fivetran_destination_id: Optional[order_by]
    github_sync_aggregate: Optional["company_github_sync_aggregate_order_by"]
    groups_aggregate: Optional["group_aggregate_order_by"]
    id: Optional[order_by]
    ignore_in_reporting: Optional[order_by]
    logo_url: Optional[order_by]
    materialize_schema: Optional[order_by]
    max_inserts: Optional[order_by]
    name: Optional[order_by]
    plot_colors: Optional[order_by]
    production_schema: Optional[order_by]
    project_id: Optional[order_by]
    removed_at: Optional[order_by]
    resources: Optional["company_resources_order_by"]
    select_wlm_count: Optional[order_by]
    service_limits_aggregate: Optional["service_limit_aggregate_order_by"]
    skip_automated_archive: Optional[order_by]
    slug: Optional[order_by]
    spend_table: Optional[order_by]
    start_data_on: Optional[order_by]
    status: Optional[order_by]
    tables_aggregate: Optional["company_table_aggregate_order_by"]
    tasks_aggregate: Optional["company_task_aggregate_order_by"]
    teams_aggregate: Optional["team_aggregate_order_by"]
    timezone: Optional[order_by]
    transformations_aggregate: Optional["transformation_aggregate_order_by"]
    updated_at: Optional[order_by]
    use_time_boundary: Optional[order_by]
    validation_months: Optional[order_by]
    warehouse_default_schemas: Optional[order_by]
    warehouse_language: Optional[order_by]
    website: Optional[order_by]
    week_day_offset: Optional[order_by]


class company_pk_columns_input(BaseModel):
    id: Any


class company_prototypes_bool_exp(BaseModel):
    and_: Optional[List["company_prototypes_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_prototypes_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_prototypes_bool_exp"]] = Field(alias="_or")
    block_slug: Optional["String_comparison_exp"]
    company: Optional["company_bool_exp"]
    company_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]


class company_prototypes_insert_input(BaseModel):
    block_slug: Optional[str]
    company: Optional["company_obj_rel_insert_input"]
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]


class company_prototypes_on_conflict(BaseModel):
    constraint: company_prototypes_constraint
    update_columns: List[company_prototypes_update_column]
    where: Optional["company_prototypes_bool_exp"]


class company_prototypes_order_by(BaseModel):
    block_slug: Optional[order_by]
    company: Optional["company_order_by"]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]


class company_prototypes_pk_columns_input(BaseModel):
    id: Any


class company_prototypes_set_input(BaseModel):
    block_slug: Optional[str]
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]


class company_prototypes_stream_cursor_input(BaseModel):
    initial_value: "company_prototypes_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_prototypes_stream_cursor_value_input(BaseModel):
    block_slug: Optional[str]
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]


class company_prototypes_updates(BaseModel):
    set: Optional["company_prototypes_set_input"] = Field(alias="_set")
    where: "company_prototypes_bool_exp"


class company_query_alert_aggregate_bool_exp(BaseModel):
    count: Optional["company_query_alert_aggregate_bool_exp_count"]


class company_query_alert_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[company_query_alert_select_column]]
    distinct: Optional[bool]
    filter: Optional["company_query_alert_bool_exp"]
    predicate: "Int_comparison_exp"


class company_query_alert_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["company_query_alert_max_order_by"]
    min: Optional["company_query_alert_min_order_by"]


class company_query_alert_arr_rel_insert_input(BaseModel):
    data: List["company_query_alert_insert_input"]
    on_conflict: Optional["company_query_alert_on_conflict"]


class company_query_alert_bool_exp(BaseModel):
    and_: Optional[List["company_query_alert_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_query_alert_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_query_alert_bool_exp"]] = Field(alias="_or")
    alert_kind: Optional["company_query_alert_kinds_enum_comparison_exp"]
    company_task: Optional["company_task_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    email: Optional["String_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    query_id: Optional["uuid_comparison_exp"]
    sql_query: Optional["sql_queries_bool_exp"]
    task_id: Optional["uuid_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    updated_by: Optional["uuid_comparison_exp"]


class company_query_alert_insert_input(BaseModel):
    alert_kind: Optional[company_query_alert_kinds_enum]
    company_task: Optional["company_task_obj_rel_insert_input"]
    created_at: Optional[Any]
    email: Optional[str]
    id: Optional[Any]
    query_id: Optional[Any]
    sql_query: Optional["sql_queries_obj_rel_insert_input"]
    task_id: Optional[Any]
    updated_at: Optional[Any]
    updated_by: Optional[Any]


class company_query_alert_kinds_bool_exp(BaseModel):
    and_: Optional[List["company_query_alert_kinds_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_query_alert_kinds_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_query_alert_kinds_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class company_query_alert_kinds_enum_comparison_exp(BaseModel):
    eq: Optional[company_query_alert_kinds_enum] = Field(alias="_eq")
    in_: Optional[List[company_query_alert_kinds_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[company_query_alert_kinds_enum] = Field(alias="_neq")
    nin: Optional[List[company_query_alert_kinds_enum]] = Field(alias="_nin")


class company_query_alert_kinds_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_query_alert_kinds_on_conflict(BaseModel):
    constraint: company_query_alert_kinds_constraint
    update_columns: List[company_query_alert_kinds_update_column]
    where: Optional["company_query_alert_kinds_bool_exp"]


class company_query_alert_kinds_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class company_query_alert_kinds_pk_columns_input(BaseModel):
    value: str


class company_query_alert_kinds_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_query_alert_kinds_stream_cursor_input(BaseModel):
    initial_value: "company_query_alert_kinds_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_query_alert_kinds_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_query_alert_kinds_updates(BaseModel):
    set: Optional["company_query_alert_kinds_set_input"] = Field(alias="_set")
    where: "company_query_alert_kinds_bool_exp"


class company_query_alert_max_order_by(BaseModel):
    created_at: Optional[order_by]
    email: Optional[order_by]
    id: Optional[order_by]
    query_id: Optional[order_by]
    task_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class company_query_alert_min_order_by(BaseModel):
    created_at: Optional[order_by]
    email: Optional[order_by]
    id: Optional[order_by]
    query_id: Optional[order_by]
    task_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class company_query_alert_obj_rel_insert_input(BaseModel):
    data: "company_query_alert_insert_input"
    on_conflict: Optional["company_query_alert_on_conflict"]


class company_query_alert_on_conflict(BaseModel):
    constraint: company_query_alert_constraint
    update_columns: List[company_query_alert_update_column]
    where: Optional["company_query_alert_bool_exp"]


class company_query_alert_order_by(BaseModel):
    alert_kind: Optional[order_by]
    company_task: Optional["company_task_order_by"]
    created_at: Optional[order_by]
    email: Optional[order_by]
    id: Optional[order_by]
    query_id: Optional[order_by]
    sql_query: Optional["sql_queries_order_by"]
    task_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class company_query_alert_pk_columns_input(BaseModel):
    id: Any


class company_query_alert_set_input(BaseModel):
    alert_kind: Optional[company_query_alert_kinds_enum]
    created_at: Optional[Any]
    email: Optional[str]
    id: Optional[Any]
    query_id: Optional[Any]
    task_id: Optional[Any]
    updated_at: Optional[Any]
    updated_by: Optional[Any]


class company_query_alert_stream_cursor_input(BaseModel):
    initial_value: "company_query_alert_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_query_alert_stream_cursor_value_input(BaseModel):
    alert_kind: Optional[company_query_alert_kinds_enum]
    created_at: Optional[Any]
    email: Optional[str]
    id: Optional[Any]
    query_id: Optional[Any]
    task_id: Optional[Any]
    updated_at: Optional[Any]
    updated_by: Optional[Any]


class company_query_alert_updates(BaseModel):
    set: Optional["company_query_alert_set_input"] = Field(alias="_set")
    where: "company_query_alert_bool_exp"


class company_resources_bool_exp(BaseModel):
    and_: Optional[List["company_resources_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_resources_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_resources_bool_exp"]] = Field(alias="_or")
    company: Optional["company_bool_exp"]
    company_id: Optional["uuid_comparison_exp"]
    company_role: Optional["String_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    dedicated_redash_admin_datasource_id: Optional["Int_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    kms_key: Optional["String_comparison_exp"]
    read_policy: Optional["String_comparison_exp"]
    s3_bucket: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    updated_by: Optional["uuid_comparison_exp"]
    write_policy: Optional["String_comparison_exp"]


class company_resources_inc_input(BaseModel):
    dedicated_redash_admin_datasource_id: Optional[int]


class company_resources_insert_input(BaseModel):
    company: Optional["company_obj_rel_insert_input"]
    company_id: Optional[Any]
    company_role: Optional[str]
    created_at: Optional[Any]
    dedicated_redash_admin_datasource_id: Optional[int]
    id: Optional[Any]
    kms_key: Optional[str]
    read_policy: Optional[str]
    s3_bucket: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[Any]
    write_policy: Optional[str]


class company_resources_obj_rel_insert_input(BaseModel):
    data: "company_resources_insert_input"
    on_conflict: Optional["company_resources_on_conflict"]


class company_resources_on_conflict(BaseModel):
    constraint: company_resources_constraint
    update_columns: List[company_resources_update_column]
    where: Optional["company_resources_bool_exp"]


class company_resources_order_by(BaseModel):
    company: Optional["company_order_by"]
    company_id: Optional[order_by]
    company_role: Optional[order_by]
    created_at: Optional[order_by]
    dedicated_redash_admin_datasource_id: Optional[order_by]
    id: Optional[order_by]
    kms_key: Optional[order_by]
    read_policy: Optional[order_by]
    s3_bucket: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]
    write_policy: Optional[order_by]


class company_resources_pk_columns_input(BaseModel):
    id: Any


class company_resources_set_input(BaseModel):
    company_id: Optional[Any]
    company_role: Optional[str]
    created_at: Optional[Any]
    dedicated_redash_admin_datasource_id: Optional[int]
    id: Optional[Any]
    kms_key: Optional[str]
    read_policy: Optional[str]
    s3_bucket: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[Any]
    write_policy: Optional[str]


class company_resources_stream_cursor_input(BaseModel):
    initial_value: "company_resources_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_resources_stream_cursor_value_input(BaseModel):
    company_id: Optional[Any]
    company_role: Optional[str]
    created_at: Optional[Any]
    dedicated_redash_admin_datasource_id: Optional[int]
    id: Optional[Any]
    kms_key: Optional[str]
    read_policy: Optional[str]
    s3_bucket: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[Any]
    write_policy: Optional[str]


class company_resources_updates(BaseModel):
    inc: Optional["company_resources_inc_input"] = Field(alias="_inc")
    set: Optional["company_resources_set_input"] = Field(alias="_set")
    where: "company_resources_bool_exp"


class company_set_input(BaseModel):
    allow_narrator_employee_access: Optional[bool]
    batch_halt: Optional[bool]
    batch_halted_at: Optional[Any]
    batch_halted_by: Optional[Any]
    branding_color: Optional[str]
    cache_minutes: Optional[int]
    created_at: Optional[Any]
    created_by: Optional[Any]
    created_for: Optional[Any]
    currency_used: Optional[str]
    datacenter_region: Optional[datacenter_region_enum]
    dataset_default_filter_days: Optional[int]
    dataset_default_filter_months: Optional[int]
    dataset_row_threshold: Optional[int]
    demo_company: Optional[bool]
    description: Optional[str]
    fivetran_destination_id: Optional[str]
    id: Optional[Any]
    ignore_in_reporting: Optional[bool]
    logo_url: Optional[str]
    materialize_schema: Optional[str]
    max_inserts: Optional[int]
    name: Optional[str]
    plot_colors: Optional[str]
    production_schema: Optional[str]
    project_id: Optional[str]
    removed_at: Optional[Any]
    select_wlm_count: Optional[int]
    skip_automated_archive: Optional[bool]
    slug: Optional[str]
    spend_table: Optional[str]
    start_data_on: Optional[Any]
    status: Optional[company_status_enum]
    timezone: Optional[str]
    updated_at: Optional[Any]
    use_time_boundary: Optional[bool]
    validation_months: Optional[int]
    warehouse_default_schemas: Optional[str]
    warehouse_language: Optional[company_config_warehouse_language_enum]
    website: Optional[str]
    week_day_offset: Optional[int]


class company_sql_queries_bool_exp(BaseModel):
    and_: Optional[List["company_sql_queries_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_sql_queries_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_sql_queries_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    name: Optional["String_comparison_exp"]
    notes: Optional["String_comparison_exp"]
    related_id: Optional["uuid_comparison_exp"]
    related_kind: Optional["String_comparison_exp"]
    related_to: Optional["String_comparison_exp"]
    sql: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    updated_by: Optional["String_comparison_exp"]


class company_sql_queries_insert_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    notes: Optional[str]
    related_id: Optional[Any]
    related_kind: Optional[str]
    related_to: Optional[str]
    sql: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class company_sql_queries_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]
    notes: Optional[order_by]
    related_id: Optional[order_by]
    related_kind: Optional[order_by]
    related_to: Optional[order_by]
    sql: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class company_sql_queries_set_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    notes: Optional[str]
    related_id: Optional[Any]
    related_kind: Optional[str]
    related_to: Optional[str]
    sql: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class company_sql_queries_stream_cursor_input(BaseModel):
    initial_value: "company_sql_queries_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_sql_queries_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    notes: Optional[str]
    related_id: Optional[Any]
    related_kind: Optional[str]
    related_to: Optional[str]
    sql: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class company_sql_queries_updates(BaseModel):
    set: Optional["company_sql_queries_set_input"] = Field(alias="_set")
    where: "company_sql_queries_bool_exp"


class company_status_bool_exp(BaseModel):
    and_: Optional[List["company_status_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_status_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_status_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class company_status_enum_comparison_exp(BaseModel):
    eq: Optional[company_status_enum] = Field(alias="_eq")
    in_: Optional[List[company_status_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[company_status_enum] = Field(alias="_neq")
    nin: Optional[List[company_status_enum]] = Field(alias="_nin")


class company_status_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_status_on_conflict(BaseModel):
    constraint: company_status_constraint
    update_columns: List[company_status_update_column]
    where: Optional["company_status_bool_exp"]


class company_status_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class company_status_pk_columns_input(BaseModel):
    value: str


class company_status_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_status_stream_cursor_input(BaseModel):
    initial_value: "company_status_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_status_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_status_updates(BaseModel):
    set: Optional["company_status_set_input"] = Field(alias="_set")
    where: "company_status_bool_exp"


class company_stream_cursor_input(BaseModel):
    initial_value: "company_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_stream_cursor_value_input(BaseModel):
    allow_narrator_employee_access: Optional[bool]
    batch_halt: Optional[bool]
    batch_halted_at: Optional[Any]
    batch_halted_by: Optional[Any]
    branding_color: Optional[str]
    cache_minutes: Optional[int]
    created_at: Optional[Any]
    created_by: Optional[Any]
    created_for: Optional[Any]
    currency_used: Optional[str]
    datacenter_region: Optional[datacenter_region_enum]
    dataset_default_filter_days: Optional[int]
    dataset_default_filter_months: Optional[int]
    dataset_row_threshold: Optional[int]
    demo_company: Optional[bool]
    description: Optional[str]
    fivetran_destination_id: Optional[str]
    id: Optional[Any]
    ignore_in_reporting: Optional[bool]
    logo_url: Optional[str]
    materialize_schema: Optional[str]
    max_inserts: Optional[int]
    name: Optional[str]
    plot_colors: Optional[str]
    production_schema: Optional[str]
    project_id: Optional[str]
    removed_at: Optional[Any]
    select_wlm_count: Optional[int]
    skip_automated_archive: Optional[bool]
    slug: Optional[str]
    spend_table: Optional[str]
    start_data_on: Optional[Any]
    status: Optional[company_status_enum]
    timezone: Optional[str]
    updated_at: Optional[Any]
    use_time_boundary: Optional[bool]
    validation_months: Optional[int]
    warehouse_default_schemas: Optional[str]
    warehouse_language: Optional[company_config_warehouse_language_enum]
    website: Optional[str]
    week_day_offset: Optional[int]


class company_table_aggregate_bool_exp(BaseModel):
    bool_and: Optional["company_table_aggregate_bool_exp_bool_and"]
    bool_or: Optional["company_table_aggregate_bool_exp_bool_or"]
    count: Optional["company_table_aggregate_bool_exp_count"]


class company_table_aggregate_bool_exp_bool_and(BaseModel):
    arguments: company_table_select_column_company_table_aggregate_bool_exp_bool_and_arguments_columns
    distinct: Optional[bool]
    filter: Optional["company_table_bool_exp"]
    predicate: "Boolean_comparison_exp"


class company_table_aggregate_bool_exp_bool_or(BaseModel):
    arguments: company_table_select_column_company_table_aggregate_bool_exp_bool_or_arguments_columns
    distinct: Optional[bool]
    filter: Optional["company_table_bool_exp"]
    predicate: "Boolean_comparison_exp"


class company_table_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[company_table_select_column]]
    distinct: Optional[bool]
    filter: Optional["company_table_bool_exp"]
    predicate: "Int_comparison_exp"


class company_table_aggregate_order_by(BaseModel):
    avg: Optional["company_table_avg_order_by"]
    count: Optional[order_by]
    max: Optional["company_table_max_order_by"]
    min: Optional["company_table_min_order_by"]
    stddev: Optional["company_table_stddev_order_by"]
    stddev_pop: Optional["company_table_stddev_pop_order_by"]
    stddev_samp: Optional["company_table_stddev_samp_order_by"]
    sum: Optional["company_table_sum_order_by"]
    var_pop: Optional["company_table_var_pop_order_by"]
    var_samp: Optional["company_table_var_samp_order_by"]
    variance: Optional["company_table_variance_order_by"]


class company_table_aggregation_dim_aggregate_bool_exp(BaseModel):
    count: Optional["company_table_aggregation_dim_aggregate_bool_exp_count"]


class company_table_aggregation_dim_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[company_table_aggregation_dim_select_column]]
    distinct: Optional[bool]
    filter: Optional["company_table_aggregation_dim_bool_exp"]
    predicate: "Int_comparison_exp"


class company_table_aggregation_dim_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["company_table_aggregation_dim_max_order_by"]
    min: Optional["company_table_aggregation_dim_min_order_by"]


class company_table_aggregation_dim_arr_rel_insert_input(BaseModel):
    data: List["company_table_aggregation_dim_insert_input"]
    on_conflict: Optional["company_table_aggregation_dim_on_conflict"]


class company_table_aggregation_dim_bool_exp(BaseModel):
    and_: Optional[List["company_table_aggregation_dim_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_table_aggregation_dim_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_table_aggregation_dim_bool_exp"]] = Field(alias="_or")
    company_table: Optional["company_table_bool_exp"]
    company_table_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    dim_table: Optional["dim_table_bool_exp"]
    dim_table_id: Optional["uuid_comparison_exp"]
    id: Optional["uuid_comparison_exp"]


class company_table_aggregation_dim_insert_input(BaseModel):
    company_table: Optional["company_table_obj_rel_insert_input"]
    company_table_id: Optional[Any]
    created_at: Optional[Any]
    dim_table: Optional["dim_table_obj_rel_insert_input"]
    dim_table_id: Optional[Any]
    id: Optional[Any]


class company_table_aggregation_dim_max_order_by(BaseModel):
    company_table_id: Optional[order_by]
    created_at: Optional[order_by]
    dim_table_id: Optional[order_by]
    id: Optional[order_by]


class company_table_aggregation_dim_min_order_by(BaseModel):
    company_table_id: Optional[order_by]
    created_at: Optional[order_by]
    dim_table_id: Optional[order_by]
    id: Optional[order_by]


class company_table_aggregation_dim_on_conflict(BaseModel):
    constraint: company_table_aggregation_dim_constraint
    update_columns: List[company_table_aggregation_dim_update_column]
    where: Optional["company_table_aggregation_dim_bool_exp"]


class company_table_aggregation_dim_order_by(BaseModel):
    company_table: Optional["company_table_order_by"]
    company_table_id: Optional[order_by]
    created_at: Optional[order_by]
    dim_table: Optional["dim_table_order_by"]
    dim_table_id: Optional[order_by]
    id: Optional[order_by]


class company_table_aggregation_dim_pk_columns_input(BaseModel):
    id: Any


class company_table_aggregation_dim_set_input(BaseModel):
    company_table_id: Optional[Any]
    created_at: Optional[Any]
    dim_table_id: Optional[Any]
    id: Optional[Any]


class company_table_aggregation_dim_stream_cursor_input(BaseModel):
    initial_value: "company_table_aggregation_dim_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_table_aggregation_dim_stream_cursor_value_input(BaseModel):
    company_table_id: Optional[Any]
    created_at: Optional[Any]
    dim_table_id: Optional[Any]
    id: Optional[Any]


class company_table_aggregation_dim_updates(BaseModel):
    set: Optional["company_table_aggregation_dim_set_input"] = Field(alias="_set")
    where: "company_table_aggregation_dim_bool_exp"


class company_table_arr_rel_insert_input(BaseModel):
    data: List["company_table_insert_input"]
    on_conflict: Optional["company_table_on_conflict"]


class company_table_avg_order_by(BaseModel):
    row_count: Optional[order_by]


class company_table_bool_exp(BaseModel):
    and_: Optional[List["company_table_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_table_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_table_bool_exp"]] = Field(alias="_or")
    activities: Optional["activity_bool_exp"]
    activities_aggregate: Optional["activity_aggregate_bool_exp"]
    activity_stream: Optional["String_comparison_exp"]
    aggregation_dims: Optional["company_table_aggregation_dim_bool_exp"]
    aggregation_dims_aggregate: Optional["company_table_aggregation_dim_aggregate_bool_exp"]
    company: Optional["company_bool_exp"]
    company_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    customer_dim: Optional["dim_table_bool_exp"]
    customer_dim_table_id: Optional["uuid_comparison_exp"]
    customer_label: Optional["String_comparison_exp"]
    customer_table: Optional["String_comparison_exp"]
    default_time_between: Optional["String_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    identifier: Optional["String_comparison_exp"]
    index_table: Optional["Boolean_comparison_exp"]
    is_imported: Optional["Boolean_comparison_exp"]
    maintainer: Optional["user_bool_exp"]
    maintainer_id: Optional["uuid_comparison_exp"]
    manually_partition_activity: Optional["Boolean_comparison_exp"]
    row_count: Optional["bigint_comparison_exp"]
    schema_name: Optional["String_comparison_exp"]
    slowly_changing_customer_dims: Optional["slowly_changing_customer_dims_bool_exp"]
    slowly_changing_customer_dims_aggregate: Optional["slowly_changing_customer_dims_aggregate_bool_exp"]
    team_permissions: Optional["table_team_permissions_bool_exp"]
    team_permissions_aggregate: Optional["table_team_permissions_aggregate_bool_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class company_table_inc_input(BaseModel):
    row_count: Optional[Any]


class company_table_insert_input(BaseModel):
    activities: Optional["activity_arr_rel_insert_input"]
    activity_stream: Optional[str]
    aggregation_dims: Optional["company_table_aggregation_dim_arr_rel_insert_input"]
    company: Optional["company_obj_rel_insert_input"]
    company_id: Optional[Any]
    created_at: Optional[Any]
    customer_dim: Optional["dim_table_obj_rel_insert_input"]
    customer_dim_table_id: Optional[Any]
    customer_label: Optional[str]
    customer_table: Optional[str]
    default_time_between: Optional[str]
    id: Optional[Any]
    identifier: Optional[str]
    index_table: Optional[bool]
    is_imported: Optional[bool]
    maintainer: Optional["user_obj_rel_insert_input"]
    maintainer_id: Optional[Any]
    manually_partition_activity: Optional[bool]
    row_count: Optional[Any]
    schema_name: Optional[str]
    slowly_changing_customer_dims: Optional["slowly_changing_customer_dims_arr_rel_insert_input"]
    team_permissions: Optional["table_team_permissions_arr_rel_insert_input"]
    updated_at: Optional[Any]


class company_table_max_order_by(BaseModel):
    activity_stream: Optional[order_by]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    customer_dim_table_id: Optional[order_by]
    customer_label: Optional[order_by]
    customer_table: Optional[order_by]
    default_time_between: Optional[order_by]
    id: Optional[order_by]
    identifier: Optional[order_by]
    maintainer_id: Optional[order_by]
    row_count: Optional[order_by]
    schema_name: Optional[order_by]
    updated_at: Optional[order_by]


class company_table_min_order_by(BaseModel):
    activity_stream: Optional[order_by]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    customer_dim_table_id: Optional[order_by]
    customer_label: Optional[order_by]
    customer_table: Optional[order_by]
    default_time_between: Optional[order_by]
    id: Optional[order_by]
    identifier: Optional[order_by]
    maintainer_id: Optional[order_by]
    row_count: Optional[order_by]
    schema_name: Optional[order_by]
    updated_at: Optional[order_by]


class company_table_obj_rel_insert_input(BaseModel):
    data: "company_table_insert_input"
    on_conflict: Optional["company_table_on_conflict"]


class company_table_on_conflict(BaseModel):
    constraint: company_table_constraint
    update_columns: List[company_table_update_column]
    where: Optional["company_table_bool_exp"]


class company_table_order_by(BaseModel):
    activities_aggregate: Optional["activity_aggregate_order_by"]
    activity_stream: Optional[order_by]
    aggregation_dims_aggregate: Optional["company_table_aggregation_dim_aggregate_order_by"]
    company: Optional["company_order_by"]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    customer_dim: Optional["dim_table_order_by"]
    customer_dim_table_id: Optional[order_by]
    customer_label: Optional[order_by]
    customer_table: Optional[order_by]
    default_time_between: Optional[order_by]
    id: Optional[order_by]
    identifier: Optional[order_by]
    index_table: Optional[order_by]
    is_imported: Optional[order_by]
    maintainer: Optional["user_order_by"]
    maintainer_id: Optional[order_by]
    manually_partition_activity: Optional[order_by]
    row_count: Optional[order_by]
    schema_name: Optional[order_by]
    slowly_changing_customer_dims_aggregate: Optional["slowly_changing_customer_dims_aggregate_order_by"]
    team_permissions_aggregate: Optional["table_team_permissions_aggregate_order_by"]
    updated_at: Optional[order_by]


class company_table_pk_columns_input(BaseModel):
    id: Any


class company_table_set_input(BaseModel):
    activity_stream: Optional[str]
    company_id: Optional[Any]
    created_at: Optional[Any]
    customer_dim_table_id: Optional[Any]
    customer_label: Optional[str]
    customer_table: Optional[str]
    default_time_between: Optional[str]
    id: Optional[Any]
    identifier: Optional[str]
    index_table: Optional[bool]
    is_imported: Optional[bool]
    maintainer_id: Optional[Any]
    manually_partition_activity: Optional[bool]
    row_count: Optional[Any]
    schema_name: Optional[str]
    updated_at: Optional[Any]


class company_table_stddev_order_by(BaseModel):
    row_count: Optional[order_by]


class company_table_stddev_pop_order_by(BaseModel):
    row_count: Optional[order_by]


class company_table_stddev_samp_order_by(BaseModel):
    row_count: Optional[order_by]


class company_table_stream_cursor_input(BaseModel):
    initial_value: "company_table_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_table_stream_cursor_value_input(BaseModel):
    activity_stream: Optional[str]
    company_id: Optional[Any]
    created_at: Optional[Any]
    customer_dim_table_id: Optional[Any]
    customer_label: Optional[str]
    customer_table: Optional[str]
    default_time_between: Optional[str]
    id: Optional[Any]
    identifier: Optional[str]
    index_table: Optional[bool]
    is_imported: Optional[bool]
    maintainer_id: Optional[Any]
    manually_partition_activity: Optional[bool]
    row_count: Optional[Any]
    schema_name: Optional[str]
    updated_at: Optional[Any]


class company_table_sum_order_by(BaseModel):
    row_count: Optional[order_by]


class company_table_updates(BaseModel):
    inc: Optional["company_table_inc_input"] = Field(alias="_inc")
    set: Optional["company_table_set_input"] = Field(alias="_set")
    where: "company_table_bool_exp"


class company_table_var_pop_order_by(BaseModel):
    row_count: Optional[order_by]


class company_table_var_samp_order_by(BaseModel):
    row_count: Optional[order_by]


class company_table_variance_order_by(BaseModel):
    row_count: Optional[order_by]


class company_tags_aggregate_bool_exp(BaseModel):
    count: Optional["company_tags_aggregate_bool_exp_count"]


class company_tags_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[company_tags_select_column]]
    distinct: Optional[bool]
    filter: Optional["company_tags_bool_exp"]
    predicate: "Int_comparison_exp"


class company_tags_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["company_tags_max_order_by"]
    min: Optional["company_tags_min_order_by"]


class company_tags_arr_rel_insert_input(BaseModel):
    data: List["company_tags_insert_input"]
    on_conflict: Optional["company_tags_on_conflict"]


class company_tags_bool_exp(BaseModel):
    and_: Optional[List["company_tags_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_tags_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_tags_bool_exp"]] = Field(alias="_or")
    color: Optional["String_comparison_exp"]
    company: Optional["company_bool_exp"]
    company_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    description: Optional["String_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    tag: Optional["String_comparison_exp"]
    tagged_items: Optional["tag_bool_exp"]
    tagged_items_aggregate: Optional["tag_aggregate_bool_exp"]
    user: Optional["user_bool_exp"]
    user_id: Optional["uuid_comparison_exp"]


class company_tags_insert_input(BaseModel):
    color: Optional[str]
    company: Optional["company_obj_rel_insert_input"]
    company_id: Optional[Any]
    created_at: Optional[Any]
    description: Optional[str]
    id: Optional[Any]
    tag: Optional[str]
    tagged_items: Optional["tag_arr_rel_insert_input"]
    user: Optional["user_obj_rel_insert_input"]
    user_id: Optional[Any]


class company_tags_max_order_by(BaseModel):
    color: Optional[order_by]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    description: Optional[order_by]
    id: Optional[order_by]
    tag: Optional[order_by]
    user_id: Optional[order_by]


class company_tags_min_order_by(BaseModel):
    color: Optional[order_by]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    description: Optional[order_by]
    id: Optional[order_by]
    tag: Optional[order_by]
    user_id: Optional[order_by]


class company_tags_obj_rel_insert_input(BaseModel):
    data: "company_tags_insert_input"
    on_conflict: Optional["company_tags_on_conflict"]


class company_tags_on_conflict(BaseModel):
    constraint: company_tags_constraint
    update_columns: List[company_tags_update_column]
    where: Optional["company_tags_bool_exp"]


class company_tags_order_by(BaseModel):
    color: Optional[order_by]
    company: Optional["company_order_by"]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    description: Optional[order_by]
    id: Optional[order_by]
    tag: Optional[order_by]
    tagged_items_aggregate: Optional["tag_aggregate_order_by"]
    user: Optional["user_order_by"]
    user_id: Optional[order_by]


class company_tags_pk_columns_input(BaseModel):
    id: Any


class company_tags_set_input(BaseModel):
    color: Optional[str]
    company_id: Optional[Any]
    created_at: Optional[Any]
    description: Optional[str]
    id: Optional[Any]
    tag: Optional[str]
    user_id: Optional[Any]


class company_tags_stream_cursor_input(BaseModel):
    initial_value: "company_tags_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_tags_stream_cursor_value_input(BaseModel):
    color: Optional[str]
    company_id: Optional[Any]
    created_at: Optional[Any]
    description: Optional[str]
    id: Optional[Any]
    tag: Optional[str]
    user_id: Optional[Any]


class company_tags_updates(BaseModel):
    set: Optional["company_tags_set_input"] = Field(alias="_set")
    where: "company_tags_bool_exp"


class company_task_aggregate_bool_exp(BaseModel):
    bool_and: Optional["company_task_aggregate_bool_exp_bool_and"]
    bool_or: Optional["company_task_aggregate_bool_exp_bool_or"]
    count: Optional["company_task_aggregate_bool_exp_count"]


class company_task_aggregate_bool_exp_bool_and(BaseModel):
    arguments: company_task_select_column_company_task_aggregate_bool_exp_bool_and_arguments_columns
    distinct: Optional[bool]
    filter: Optional["company_task_bool_exp"]
    predicate: "Boolean_comparison_exp"


class company_task_aggregate_bool_exp_bool_or(BaseModel):
    arguments: company_task_select_column_company_task_aggregate_bool_exp_bool_or_arguments_columns
    distinct: Optional[bool]
    filter: Optional["company_task_bool_exp"]
    predicate: "Boolean_comparison_exp"


class company_task_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[company_task_select_column]]
    distinct: Optional[bool]
    filter: Optional["company_task_bool_exp"]
    predicate: "Int_comparison_exp"


class company_task_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["company_task_max_order_by"]
    min: Optional["company_task_min_order_by"]


class company_task_arr_rel_insert_input(BaseModel):
    data: List["company_task_insert_input"]
    on_conflict: Optional["company_task_on_conflict"]


class company_task_bool_exp(BaseModel):
    and_: Optional[List["company_task_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_task_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_task_bool_exp"]] = Field(alias="_or")
    category: Optional["company_task_category_enum_comparison_exp"]
    company: Optional["company_bool_exp"]
    company_id: Optional["uuid_comparison_exp"]
    company_query_alerts: Optional["company_query_alert_bool_exp"]
    company_query_alerts_aggregate: Optional["company_query_alert_aggregate_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    dataset_materializations: Optional["dataset_materialization_bool_exp"]
    dataset_materializations_aggregate: Optional["dataset_materialization_aggregate_bool_exp"]
    description: Optional["String_comparison_exp"]
    executions: Optional["task_execution_bool_exp"]
    executions_aggregate: Optional["task_execution_aggregate_bool_exp"]
    function_name: Optional["String_comparison_exp"]
    function_path: Optional["String_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    internal_only: Optional["Boolean_comparison_exp"]
    kwargs: Optional["String_comparison_exp"]
    label: Optional["String_comparison_exp"]
    narratives: Optional["narrative_bool_exp"]
    narratives_aggregate: Optional["narrative_aggregate_bool_exp"]
    schedule: Optional["String_comparison_exp"]
    task_slug: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class company_task_category_bool_exp(BaseModel):
    and_: Optional[List["company_task_category_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_task_category_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_task_category_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class company_task_category_enum_comparison_exp(BaseModel):
    eq: Optional[company_task_category_enum] = Field(alias="_eq")
    in_: Optional[List[company_task_category_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[company_task_category_enum] = Field(alias="_neq")
    nin: Optional[List[company_task_category_enum]] = Field(alias="_nin")


class company_task_category_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_task_category_on_conflict(BaseModel):
    constraint: company_task_category_constraint
    update_columns: List[company_task_category_update_column]
    where: Optional["company_task_category_bool_exp"]


class company_task_category_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class company_task_category_pk_columns_input(BaseModel):
    value: str


class company_task_category_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_task_category_stream_cursor_input(BaseModel):
    initial_value: "company_task_category_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_task_category_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_task_category_updates(BaseModel):
    set: Optional["company_task_category_set_input"] = Field(alias="_set")
    where: "company_task_category_bool_exp"


class company_task_insert_input(BaseModel):
    category: Optional[company_task_category_enum]
    company: Optional["company_obj_rel_insert_input"]
    company_id: Optional[Any]
    company_query_alerts: Optional["company_query_alert_arr_rel_insert_input"]
    created_at: Optional[Any]
    dataset_materializations: Optional["dataset_materialization_arr_rel_insert_input"]
    description: Optional[str]
    executions: Optional["task_execution_arr_rel_insert_input"]
    function_name: Optional[str]
    function_path: Optional[str]
    id: Optional[Any]
    internal_only: Optional[bool]
    kwargs: Optional[str]
    label: Optional[str]
    narratives: Optional["narrative_arr_rel_insert_input"]
    schedule: Optional[str]
    task_slug: Optional[str]
    updated_at: Optional[Any]


class company_task_max_order_by(BaseModel):
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    description: Optional[order_by]
    function_name: Optional[order_by]
    function_path: Optional[order_by]
    id: Optional[order_by]
    kwargs: Optional[order_by]
    label: Optional[order_by]
    schedule: Optional[order_by]
    task_slug: Optional[order_by]
    updated_at: Optional[order_by]


class company_task_min_order_by(BaseModel):
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    description: Optional[order_by]
    function_name: Optional[order_by]
    function_path: Optional[order_by]
    id: Optional[order_by]
    kwargs: Optional[order_by]
    label: Optional[order_by]
    schedule: Optional[order_by]
    task_slug: Optional[order_by]
    updated_at: Optional[order_by]


class company_task_obj_rel_insert_input(BaseModel):
    data: "company_task_insert_input"
    on_conflict: Optional["company_task_on_conflict"]


class company_task_on_conflict(BaseModel):
    constraint: company_task_constraint
    update_columns: List[company_task_update_column]
    where: Optional["company_task_bool_exp"]


class company_task_order_by(BaseModel):
    category: Optional[order_by]
    company: Optional["company_order_by"]
    company_id: Optional[order_by]
    company_query_alerts_aggregate: Optional["company_query_alert_aggregate_order_by"]
    created_at: Optional[order_by]
    dataset_materializations_aggregate: Optional["dataset_materialization_aggregate_order_by"]
    description: Optional[order_by]
    executions_aggregate: Optional["task_execution_aggregate_order_by"]
    function_name: Optional[order_by]
    function_path: Optional[order_by]
    id: Optional[order_by]
    internal_only: Optional[order_by]
    kwargs: Optional[order_by]
    label: Optional[order_by]
    narratives_aggregate: Optional["narrative_aggregate_order_by"]
    schedule: Optional[order_by]
    task_slug: Optional[order_by]
    updated_at: Optional[order_by]


class company_task_pk_columns_input(BaseModel):
    id: Any


class company_task_set_input(BaseModel):
    category: Optional[company_task_category_enum]
    company_id: Optional[Any]
    created_at: Optional[Any]
    description: Optional[str]
    function_name: Optional[str]
    function_path: Optional[str]
    id: Optional[Any]
    internal_only: Optional[bool]
    kwargs: Optional[str]
    label: Optional[str]
    schedule: Optional[str]
    task_slug: Optional[str]
    updated_at: Optional[Any]


class company_task_stream_cursor_input(BaseModel):
    initial_value: "company_task_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_task_stream_cursor_value_input(BaseModel):
    category: Optional[company_task_category_enum]
    company_id: Optional[Any]
    created_at: Optional[Any]
    description: Optional[str]
    function_name: Optional[str]
    function_path: Optional[str]
    id: Optional[Any]
    internal_only: Optional[bool]
    kwargs: Optional[str]
    label: Optional[str]
    schedule: Optional[str]
    task_slug: Optional[str]
    updated_at: Optional[Any]


class company_task_updates(BaseModel):
    set: Optional["company_task_set_input"] = Field(alias="_set")
    where: "company_task_bool_exp"


class company_timeline_bool_exp(BaseModel):
    and_: Optional[List["company_timeline_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_timeline_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_timeline_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    description: Optional["String_comparison_exp"]
    happened_at: Optional["date_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    name: Optional["String_comparison_exp"]
    related_to: Optional["company_timeline_relations_enum_comparison_exp"]
    related_to_id: Optional["uuid_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class company_timeline_insert_input(BaseModel):
    created_at: Optional[Any]
    description: Optional[str]
    happened_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    related_to: Optional[company_timeline_relations_enum]
    related_to_id: Optional[Any]
    updated_at: Optional[Any]


class company_timeline_on_conflict(BaseModel):
    constraint: company_timeline_constraint
    update_columns: List[company_timeline_update_column]
    where: Optional["company_timeline_bool_exp"]


class company_timeline_order_by(BaseModel):
    created_at: Optional[order_by]
    description: Optional[order_by]
    happened_at: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]
    related_to: Optional[order_by]
    related_to_id: Optional[order_by]
    updated_at: Optional[order_by]


class company_timeline_pk_columns_input(BaseModel):
    id: Any


class company_timeline_relations_bool_exp(BaseModel):
    and_: Optional[List["company_timeline_relations_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_timeline_relations_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_timeline_relations_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class company_timeline_relations_enum_comparison_exp(BaseModel):
    eq: Optional[company_timeline_relations_enum] = Field(alias="_eq")
    in_: Optional[List[company_timeline_relations_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[company_timeline_relations_enum] = Field(alias="_neq")
    nin: Optional[List[company_timeline_relations_enum]] = Field(alias="_nin")


class company_timeline_relations_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_timeline_relations_on_conflict(BaseModel):
    constraint: company_timeline_relations_constraint
    update_columns: List[company_timeline_relations_update_column]
    where: Optional["company_timeline_relations_bool_exp"]


class company_timeline_relations_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class company_timeline_relations_pk_columns_input(BaseModel):
    value: str


class company_timeline_relations_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_timeline_relations_stream_cursor_input(BaseModel):
    initial_value: "company_timeline_relations_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_timeline_relations_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_timeline_relations_updates(BaseModel):
    set: Optional["company_timeline_relations_set_input"] = Field(alias="_set")
    where: "company_timeline_relations_bool_exp"


class company_timeline_set_input(BaseModel):
    created_at: Optional[Any]
    description: Optional[str]
    happened_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    related_to: Optional[company_timeline_relations_enum]
    related_to_id: Optional[Any]
    updated_at: Optional[Any]


class company_timeline_stream_cursor_input(BaseModel):
    initial_value: "company_timeline_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_timeline_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    description: Optional[str]
    happened_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    related_to: Optional[company_timeline_relations_enum]
    related_to_id: Optional[Any]
    updated_at: Optional[Any]


class company_timeline_updates(BaseModel):
    set: Optional["company_timeline_set_input"] = Field(alias="_set")
    where: "company_timeline_bool_exp"


class company_updates(BaseModel):
    inc: Optional["company_inc_input"] = Field(alias="_inc")
    set: Optional["company_set_input"] = Field(alias="_set")
    where: "company_bool_exp"


class company_user_aggregate_bool_exp(BaseModel):
    bool_and: Optional["company_user_aggregate_bool_exp_bool_and"]
    bool_or: Optional["company_user_aggregate_bool_exp_bool_or"]
    count: Optional["company_user_aggregate_bool_exp_count"]


class company_user_aggregate_bool_exp_bool_and(BaseModel):
    arguments: company_user_select_column_company_user_aggregate_bool_exp_bool_and_arguments_columns
    distinct: Optional[bool]
    filter: Optional["company_user_bool_exp"]
    predicate: "Boolean_comparison_exp"


class company_user_aggregate_bool_exp_bool_or(BaseModel):
    arguments: company_user_select_column_company_user_aggregate_bool_exp_bool_or_arguments_columns
    distinct: Optional[bool]
    filter: Optional["company_user_bool_exp"]
    predicate: "Boolean_comparison_exp"


class company_user_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[company_user_select_column]]
    distinct: Optional[bool]
    filter: Optional["company_user_bool_exp"]
    predicate: "Int_comparison_exp"


class company_user_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["company_user_max_order_by"]
    min: Optional["company_user_min_order_by"]


class company_user_api_key_bool_exp(BaseModel):
    and_: Optional[List["company_user_api_key_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_user_api_key_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_user_api_key_bool_exp"]] = Field(alias="_or")
    company_user: Optional["company_user_bool_exp"]
    company_user_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    label: Optional["String_comparison_exp"]
    last_used_at: Optional["timestamptz_comparison_exp"]
    revoked_at: Optional["timestamptz_comparison_exp"]


class company_user_api_key_insert_input(BaseModel):
    company_user: Optional["company_user_obj_rel_insert_input"]
    company_user_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    label: Optional[str]
    last_used_at: Optional[Any]
    revoked_at: Optional[Any]


class company_user_api_key_on_conflict(BaseModel):
    constraint: company_user_api_key_constraint
    update_columns: List[company_user_api_key_update_column]
    where: Optional["company_user_api_key_bool_exp"]


class company_user_api_key_order_by(BaseModel):
    company_user: Optional["company_user_order_by"]
    company_user_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    label: Optional[order_by]
    last_used_at: Optional[order_by]
    revoked_at: Optional[order_by]


class company_user_api_key_pk_columns_input(BaseModel):
    id: Any


class company_user_api_key_set_input(BaseModel):
    company_user_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    label: Optional[str]
    last_used_at: Optional[Any]
    revoked_at: Optional[Any]


class company_user_api_key_stream_cursor_input(BaseModel):
    initial_value: "company_user_api_key_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_user_api_key_stream_cursor_value_input(BaseModel):
    company_user_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    label: Optional[str]
    last_used_at: Optional[Any]
    revoked_at: Optional[Any]


class company_user_api_key_updates(BaseModel):
    set: Optional["company_user_api_key_set_input"] = Field(alias="_set")
    where: "company_user_api_key_bool_exp"


class company_user_arr_rel_insert_input(BaseModel):
    data: List["company_user_insert_input"]
    on_conflict: Optional["company_user_on_conflict"]


class company_user_bool_exp(BaseModel):
    and_: Optional[List["company_user_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_user_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_user_bool_exp"]] = Field(alias="_or")
    company: Optional["company_bool_exp"]
    company_context: Optional["String_comparison_exp"]
    company_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    first_name: Optional["String_comparison_exp"]
    from_sso: Optional["Boolean_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    job_title: Optional["String_comparison_exp"]
    last_name: Optional["String_comparison_exp"]
    metrics_context: Optional["String_comparison_exp"]
    notifications: Optional["company_user_notifications_bool_exp"]
    notifications_aggregate: Optional["company_user_notifications_aggregate_bool_exp"]
    phone: Optional["String_comparison_exp"]
    preferences: Optional["company_user_preferences_bool_exp"]
    role: Optional["company_user_role_enum_comparison_exp"]
    team_users: Optional["team_user_bool_exp"]
    team_users_aggregate: Optional["team_user_aggregate_bool_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    user: Optional["user_bool_exp"]
    user_access_roles: Optional["user_access_role_bool_exp"]
    user_access_roles_aggregate: Optional["user_access_role_aggregate_bool_exp"]
    user_context: Optional["String_comparison_exp"]
    user_id: Optional["uuid_comparison_exp"]


class company_user_insert_input(BaseModel):
    company: Optional["company_obj_rel_insert_input"]
    company_context: Optional[str]
    company_id: Optional[Any]
    created_at: Optional[Any]
    first_name: Optional[str]
    from_sso: Optional[bool]
    id: Optional[Any]
    job_title: Optional[str]
    last_name: Optional[str]
    metrics_context: Optional[str]
    notifications: Optional["company_user_notifications_arr_rel_insert_input"]
    phone: Optional[str]
    preferences: Optional["company_user_preferences_obj_rel_insert_input"]
    role: Optional[company_user_role_enum]
    team_users: Optional["team_user_arr_rel_insert_input"]
    updated_at: Optional[Any]
    user: Optional["user_obj_rel_insert_input"]
    user_access_roles: Optional["user_access_role_arr_rel_insert_input"]
    user_context: Optional[str]
    user_id: Optional[Any]


class company_user_max_order_by(BaseModel):
    company_context: Optional[order_by]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    first_name: Optional[order_by]
    id: Optional[order_by]
    job_title: Optional[order_by]
    last_name: Optional[order_by]
    metrics_context: Optional[order_by]
    phone: Optional[order_by]
    updated_at: Optional[order_by]
    user_context: Optional[order_by]
    user_id: Optional[order_by]


class company_user_min_order_by(BaseModel):
    company_context: Optional[order_by]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    first_name: Optional[order_by]
    id: Optional[order_by]
    job_title: Optional[order_by]
    last_name: Optional[order_by]
    metrics_context: Optional[order_by]
    phone: Optional[order_by]
    updated_at: Optional[order_by]
    user_context: Optional[order_by]
    user_id: Optional[order_by]


class company_user_notifications_aggregate_bool_exp(BaseModel):
    count: Optional["company_user_notifications_aggregate_bool_exp_count"]


class company_user_notifications_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[company_user_notifications_select_column]]
    distinct: Optional[bool]
    filter: Optional["company_user_notifications_bool_exp"]
    predicate: "Int_comparison_exp"


class company_user_notifications_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["company_user_notifications_max_order_by"]
    min: Optional["company_user_notifications_min_order_by"]


class company_user_notifications_append_input(BaseModel):
    template_data: Optional[Any]


class company_user_notifications_arr_rel_insert_input(BaseModel):
    data: List["company_user_notifications_insert_input"]
    on_conflict: Optional["company_user_notifications_on_conflict"]


class company_user_notifications_bool_exp(BaseModel):
    and_: Optional[List["company_user_notifications_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_user_notifications_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_user_notifications_bool_exp"]] = Field(alias="_or")
    company_user_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    template_data: Optional["jsonb_comparison_exp"]
    template_slug: Optional["String_comparison_exp"]


class company_user_notifications_delete_at_path_input(BaseModel):
    template_data: Optional[List[str]]


class company_user_notifications_delete_elem_input(BaseModel):
    template_data: Optional[int]


class company_user_notifications_delete_key_input(BaseModel):
    template_data: Optional[str]


class company_user_notifications_insert_input(BaseModel):
    company_user_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    template_data: Optional[Any]
    template_slug: Optional[str]


class company_user_notifications_max_order_by(BaseModel):
    company_user_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    template_slug: Optional[order_by]


class company_user_notifications_min_order_by(BaseModel):
    company_user_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    template_slug: Optional[order_by]


class company_user_notifications_on_conflict(BaseModel):
    constraint: company_user_notifications_constraint
    update_columns: List[company_user_notifications_update_column]
    where: Optional["company_user_notifications_bool_exp"]


class company_user_notifications_order_by(BaseModel):
    company_user_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    template_data: Optional[order_by]
    template_slug: Optional[order_by]


class company_user_notifications_pk_columns_input(BaseModel):
    id: Any


class company_user_notifications_prepend_input(BaseModel):
    template_data: Optional[Any]


class company_user_notifications_set_input(BaseModel):
    company_user_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    template_data: Optional[Any]
    template_slug: Optional[str]


class company_user_notifications_stream_cursor_input(BaseModel):
    initial_value: "company_user_notifications_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_user_notifications_stream_cursor_value_input(BaseModel):
    company_user_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    template_data: Optional[Any]
    template_slug: Optional[str]


class company_user_notifications_updates(BaseModel):
    append: Optional["company_user_notifications_append_input"] = Field(alias="_append")
    delete_at_path: Optional["company_user_notifications_delete_at_path_input"] = Field(alias="_delete_at_path")
    delete_elem: Optional["company_user_notifications_delete_elem_input"] = Field(alias="_delete_elem")
    delete_key: Optional["company_user_notifications_delete_key_input"] = Field(alias="_delete_key")
    prepend: Optional["company_user_notifications_prepend_input"] = Field(alias="_prepend")
    set: Optional["company_user_notifications_set_input"] = Field(alias="_set")
    where: "company_user_notifications_bool_exp"


class company_user_obj_rel_insert_input(BaseModel):
    data: "company_user_insert_input"
    on_conflict: Optional["company_user_on_conflict"]


class company_user_on_conflict(BaseModel):
    constraint: company_user_constraint
    update_columns: List[company_user_update_column]
    where: Optional["company_user_bool_exp"]


class company_user_order_by(BaseModel):
    company: Optional["company_order_by"]
    company_context: Optional[order_by]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    first_name: Optional[order_by]
    from_sso: Optional[order_by]
    id: Optional[order_by]
    job_title: Optional[order_by]
    last_name: Optional[order_by]
    metrics_context: Optional[order_by]
    notifications_aggregate: Optional["company_user_notifications_aggregate_order_by"]
    phone: Optional[order_by]
    preferences: Optional["company_user_preferences_order_by"]
    role: Optional[order_by]
    team_users_aggregate: Optional["team_user_aggregate_order_by"]
    updated_at: Optional[order_by]
    user: Optional["user_order_by"]
    user_access_roles_aggregate: Optional["user_access_role_aggregate_order_by"]
    user_context: Optional[order_by]
    user_id: Optional[order_by]


class company_user_pk_columns_input(BaseModel):
    id: Any


class company_user_preferences_bool_exp(BaseModel):
    and_: Optional[List["company_user_preferences_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_user_preferences_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_user_preferences_bool_exp"]] = Field(alias="_or")
    company_user: Optional["company_user_bool_exp"]
    company_user_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    email_opt_out: Optional["Boolean_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    profile_picture: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class company_user_preferences_insert_input(BaseModel):
    company_user: Optional["company_user_obj_rel_insert_input"]
    company_user_id: Optional[Any]
    created_at: Optional[Any]
    email_opt_out: Optional[bool]
    id: Optional[Any]
    profile_picture: Optional[str]
    updated_at: Optional[Any]


class company_user_preferences_obj_rel_insert_input(BaseModel):
    data: "company_user_preferences_insert_input"
    on_conflict: Optional["company_user_preferences_on_conflict"]


class company_user_preferences_on_conflict(BaseModel):
    constraint: company_user_preferences_constraint
    update_columns: List[company_user_preferences_update_column]
    where: Optional["company_user_preferences_bool_exp"]


class company_user_preferences_order_by(BaseModel):
    company_user: Optional["company_user_order_by"]
    company_user_id: Optional[order_by]
    created_at: Optional[order_by]
    email_opt_out: Optional[order_by]
    id: Optional[order_by]
    profile_picture: Optional[order_by]
    updated_at: Optional[order_by]


class company_user_preferences_pk_columns_input(BaseModel):
    id: Any


class company_user_preferences_set_input(BaseModel):
    company_user_id: Optional[Any]
    created_at: Optional[Any]
    email_opt_out: Optional[bool]
    id: Optional[Any]
    profile_picture: Optional[str]
    updated_at: Optional[Any]


class company_user_preferences_stream_cursor_input(BaseModel):
    initial_value: "company_user_preferences_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_user_preferences_stream_cursor_value_input(BaseModel):
    company_user_id: Optional[Any]
    created_at: Optional[Any]
    email_opt_out: Optional[bool]
    id: Optional[Any]
    profile_picture: Optional[str]
    updated_at: Optional[Any]


class company_user_preferences_updates(BaseModel):
    set: Optional["company_user_preferences_set_input"] = Field(alias="_set")
    where: "company_user_preferences_bool_exp"


class company_user_role_bool_exp(BaseModel):
    and_: Optional[List["company_user_role_bool_exp"]] = Field(alias="_and")
    not_: Optional["company_user_role_bool_exp"] = Field(alias="_not")
    or_: Optional[List["company_user_role_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class company_user_role_enum_comparison_exp(BaseModel):
    eq: Optional[company_user_role_enum] = Field(alias="_eq")
    in_: Optional[List[company_user_role_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[company_user_role_enum] = Field(alias="_neq")
    nin: Optional[List[company_user_role_enum]] = Field(alias="_nin")


class company_user_role_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_user_role_on_conflict(BaseModel):
    constraint: company_user_role_constraint
    update_columns: List[company_user_role_update_column]
    where: Optional["company_user_role_bool_exp"]


class company_user_role_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class company_user_role_pk_columns_input(BaseModel):
    value: str


class company_user_role_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_user_role_stream_cursor_input(BaseModel):
    initial_value: "company_user_role_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_user_role_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class company_user_role_updates(BaseModel):
    set: Optional["company_user_role_set_input"] = Field(alias="_set")
    where: "company_user_role_bool_exp"


class company_user_set_input(BaseModel):
    company_context: Optional[str]
    company_id: Optional[Any]
    created_at: Optional[Any]
    first_name: Optional[str]
    from_sso: Optional[bool]
    id: Optional[Any]
    job_title: Optional[str]
    last_name: Optional[str]
    metrics_context: Optional[str]
    phone: Optional[str]
    role: Optional[company_user_role_enum]
    updated_at: Optional[Any]
    user_context: Optional[str]
    user_id: Optional[Any]


class company_user_stream_cursor_input(BaseModel):
    initial_value: "company_user_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class company_user_stream_cursor_value_input(BaseModel):
    company_context: Optional[str]
    company_id: Optional[Any]
    created_at: Optional[Any]
    first_name: Optional[str]
    from_sso: Optional[bool]
    id: Optional[Any]
    job_title: Optional[str]
    last_name: Optional[str]
    metrics_context: Optional[str]
    phone: Optional[str]
    role: Optional[company_user_role_enum]
    updated_at: Optional[Any]
    user_context: Optional[str]
    user_id: Optional[Any]


class company_user_updates(BaseModel):
    set: Optional["company_user_set_input"] = Field(alias="_set")
    where: "company_user_bool_exp"


class compiled_narratives_aggregate_bool_exp(BaseModel):
    count: Optional["compiled_narratives_aggregate_bool_exp_count"]


class compiled_narratives_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[compiled_narratives_select_column]]
    distinct: Optional[bool]
    filter: Optional["compiled_narratives_bool_exp"]
    predicate: "Int_comparison_exp"


class compiled_narratives_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["compiled_narratives_max_order_by"]
    min: Optional["compiled_narratives_min_order_by"]


class compiled_narratives_arr_rel_insert_input(BaseModel):
    data: List["compiled_narratives_insert_input"]


class compiled_narratives_bool_exp(BaseModel):
    and_: Optional[List["compiled_narratives_bool_exp"]] = Field(alias="_and")
    not_: Optional["compiled_narratives_bool_exp"] = Field(alias="_not")
    or_: Optional[List["compiled_narratives_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    narrative_id: Optional["uuid_comparison_exp"]
    s3_key: Optional["String_comparison_exp"]


class compiled_narratives_insert_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    narrative_id: Optional[Any]
    s3_key: Optional[str]


class compiled_narratives_max_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    narrative_id: Optional[order_by]
    s3_key: Optional[order_by]


class compiled_narratives_min_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    narrative_id: Optional[order_by]
    s3_key: Optional[order_by]


class compiled_narratives_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    narrative_id: Optional[order_by]
    s3_key: Optional[order_by]


class compiled_narratives_set_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    narrative_id: Optional[Any]
    s3_key: Optional[str]


class compiled_narratives_stream_cursor_input(BaseModel):
    initial_value: "compiled_narratives_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class compiled_narratives_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    narrative_id: Optional[Any]
    s3_key: Optional[str]


class compiled_narratives_updates(BaseModel):
    set: Optional["compiled_narratives_set_input"] = Field(alias="_set")
    where: "compiled_narratives_bool_exp"


class current_tranformation_sql_queries_bool_exp(BaseModel):
    and_: Optional[List["current_tranformation_sql_queries_bool_exp"]] = Field(alias="_and")
    not_: Optional["current_tranformation_sql_queries_bool_exp"] = Field(alias="_not")
    or_: Optional[List["current_tranformation_sql_queries_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    notes: Optional["String_comparison_exp"]
    related_kind: Optional["String_comparison_exp"]
    sql: Optional["String_comparison_exp"]
    transformation: Optional["transformation_bool_exp"]
    transformation_id: Optional["uuid_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    updated_by: Optional["String_comparison_exp"]


class current_tranformation_sql_queries_insert_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    notes: Optional[str]
    related_kind: Optional[str]
    sql: Optional[str]
    transformation: Optional["transformation_obj_rel_insert_input"]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class current_tranformation_sql_queries_obj_rel_insert_input(BaseModel):
    data: "current_tranformation_sql_queries_insert_input"


class current_tranformation_sql_queries_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    notes: Optional[order_by]
    related_kind: Optional[order_by]
    sql: Optional[order_by]
    transformation: Optional["transformation_order_by"]
    transformation_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class current_tranformation_sql_queries_set_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    notes: Optional[str]
    related_kind: Optional[str]
    sql: Optional[str]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class current_tranformation_sql_queries_stream_cursor_input(BaseModel):
    initial_value: "current_tranformation_sql_queries_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class current_tranformation_sql_queries_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    notes: Optional[str]
    related_kind: Optional[str]
    sql: Optional[str]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class current_tranformation_sql_queries_updates(BaseModel):
    set: Optional["current_tranformation_sql_queries_set_input"] = Field(alias="_set")
    where: "current_tranformation_sql_queries_bool_exp"


class custom_function_bool_exp(BaseModel):
    and_: Optional[List["custom_function_bool_exp"]] = Field(alias="_and")
    not_: Optional["custom_function_bool_exp"] = Field(alias="_not")
    or_: Optional[List["custom_function_bool_exp"]] = Field(alias="_or")
    company: Optional["company_bool_exp"]
    company_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    description: Optional["String_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    input_count: Optional["Int_comparison_exp"]
    name: Optional["String_comparison_exp"]
    text_to_replace: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class custom_function_inc_input(BaseModel):
    input_count: Optional[int]


class custom_function_insert_input(BaseModel):
    company: Optional["company_obj_rel_insert_input"]
    company_id: Optional[Any]
    created_at: Optional[Any]
    description: Optional[str]
    id: Optional[Any]
    input_count: Optional[int]
    name: Optional[str]
    text_to_replace: Optional[str]
    updated_at: Optional[Any]


class custom_function_on_conflict(BaseModel):
    constraint: custom_function_constraint
    update_columns: List[custom_function_update_column]
    where: Optional["custom_function_bool_exp"]


class custom_function_order_by(BaseModel):
    company: Optional["company_order_by"]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    description: Optional[order_by]
    id: Optional[order_by]
    input_count: Optional[order_by]
    name: Optional[order_by]
    text_to_replace: Optional[order_by]
    updated_at: Optional[order_by]


class custom_function_pk_columns_input(BaseModel):
    id: Any


class custom_function_set_input(BaseModel):
    company_id: Optional[Any]
    created_at: Optional[Any]
    description: Optional[str]
    id: Optional[Any]
    input_count: Optional[int]
    name: Optional[str]
    text_to_replace: Optional[str]
    updated_at: Optional[Any]


class custom_function_stream_cursor_input(BaseModel):
    initial_value: "custom_function_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class custom_function_stream_cursor_value_input(BaseModel):
    company_id: Optional[Any]
    created_at: Optional[Any]
    description: Optional[str]
    id: Optional[Any]
    input_count: Optional[int]
    name: Optional[str]
    text_to_replace: Optional[str]
    updated_at: Optional[Any]


class custom_function_updates(BaseModel):
    inc: Optional["custom_function_inc_input"] = Field(alias="_inc")
    set: Optional["custom_function_set_input"] = Field(alias="_set")
    where: "custom_function_bool_exp"


class datacenter_region_bool_exp(BaseModel):
    and_: Optional[List["datacenter_region_bool_exp"]] = Field(alias="_and")
    not_: Optional["datacenter_region_bool_exp"] = Field(alias="_not")
    or_: Optional[List["datacenter_region_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class datacenter_region_enum_comparison_exp(BaseModel):
    eq: Optional[datacenter_region_enum] = Field(alias="_eq")
    in_: Optional[List[datacenter_region_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[datacenter_region_enum] = Field(alias="_neq")
    nin: Optional[List[datacenter_region_enum]] = Field(alias="_nin")


class datacenter_region_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class datacenter_region_on_conflict(BaseModel):
    constraint: datacenter_region_constraint
    update_columns: List[datacenter_region_update_column]
    where: Optional["datacenter_region_bool_exp"]


class datacenter_region_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class datacenter_region_pk_columns_input(BaseModel):
    value: str


class datacenter_region_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class datacenter_region_stream_cursor_input(BaseModel):
    initial_value: "datacenter_region_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class datacenter_region_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class datacenter_region_updates(BaseModel):
    set: Optional["datacenter_region_set_input"] = Field(alias="_set")
    where: "datacenter_region_bool_exp"


class dataset_activities_aggregate_bool_exp(BaseModel):
    count: Optional["dataset_activities_aggregate_bool_exp_count"]


class dataset_activities_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[dataset_activities_select_column]]
    distinct: Optional[bool]
    filter: Optional["dataset_activities_bool_exp"]
    predicate: "Int_comparison_exp"


class dataset_activities_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["dataset_activities_max_order_by"]
    min: Optional["dataset_activities_min_order_by"]


class dataset_activities_arr_rel_insert_input(BaseModel):
    data: List["dataset_activities_insert_input"]
    on_conflict: Optional["dataset_activities_on_conflict"]


class dataset_activities_bool_exp(BaseModel):
    and_: Optional[List["dataset_activities_bool_exp"]] = Field(alias="_and")
    not_: Optional["dataset_activities_bool_exp"] = Field(alias="_not")
    or_: Optional[List["dataset_activities_bool_exp"]] = Field(alias="_or")
    activity: Optional["activity_bool_exp"]
    activity_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    dataset: Optional["dataset_bool_exp"]
    dataset_id: Optional["uuid_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class dataset_activities_insert_input(BaseModel):
    activity: Optional["activity_obj_rel_insert_input"]
    activity_id: Optional[Any]
    created_at: Optional[Any]
    dataset: Optional["dataset_obj_rel_insert_input"]
    dataset_id: Optional[Any]
    id: Optional[Any]
    updated_at: Optional[Any]


class dataset_activities_max_order_by(BaseModel):
    activity_id: Optional[order_by]
    created_at: Optional[order_by]
    dataset_id: Optional[order_by]
    id: Optional[order_by]
    updated_at: Optional[order_by]


class dataset_activities_min_order_by(BaseModel):
    activity_id: Optional[order_by]
    created_at: Optional[order_by]
    dataset_id: Optional[order_by]
    id: Optional[order_by]
    updated_at: Optional[order_by]


class dataset_activities_on_conflict(BaseModel):
    constraint: dataset_activities_constraint
    update_columns: List[dataset_activities_update_column]
    where: Optional["dataset_activities_bool_exp"]


class dataset_activities_order_by(BaseModel):
    activity: Optional["activity_order_by"]
    activity_id: Optional[order_by]
    created_at: Optional[order_by]
    dataset: Optional["dataset_order_by"]
    dataset_id: Optional[order_by]
    id: Optional[order_by]
    updated_at: Optional[order_by]


class dataset_activities_pk_columns_input(BaseModel):
    id: Any


class dataset_activities_set_input(BaseModel):
    activity_id: Optional[Any]
    created_at: Optional[Any]
    dataset_id: Optional[Any]
    id: Optional[Any]
    updated_at: Optional[Any]


class dataset_activities_stream_cursor_input(BaseModel):
    initial_value: "dataset_activities_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class dataset_activities_stream_cursor_value_input(BaseModel):
    activity_id: Optional[Any]
    created_at: Optional[Any]
    dataset_id: Optional[Any]
    id: Optional[Any]
    updated_at: Optional[Any]


class dataset_activities_updates(BaseModel):
    set: Optional["dataset_activities_set_input"] = Field(alias="_set")
    where: "dataset_activities_bool_exp"


class dataset_aggregate_bool_exp(BaseModel):
    bool_and: Optional["dataset_aggregate_bool_exp_bool_and"]
    bool_or: Optional["dataset_aggregate_bool_exp_bool_or"]
    count: Optional["dataset_aggregate_bool_exp_count"]


class dataset_aggregate_bool_exp_bool_and(BaseModel):
    arguments: dataset_select_column_dataset_aggregate_bool_exp_bool_and_arguments_columns
    distinct: Optional[bool]
    filter: Optional["dataset_bool_exp"]
    predicate: "Boolean_comparison_exp"


class dataset_aggregate_bool_exp_bool_or(BaseModel):
    arguments: dataset_select_column_dataset_aggregate_bool_exp_bool_or_arguments_columns
    distinct: Optional[bool]
    filter: Optional["dataset_bool_exp"]
    predicate: "Boolean_comparison_exp"


class dataset_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[dataset_select_column]]
    distinct: Optional[bool]
    filter: Optional["dataset_bool_exp"]
    predicate: "Int_comparison_exp"


class dataset_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["dataset_max_order_by"]
    min: Optional["dataset_min_order_by"]


class dataset_arr_rel_insert_input(BaseModel):
    data: List["dataset_insert_input"]
    on_conflict: Optional["dataset_on_conflict"]


class dataset_bool_exp(BaseModel):
    and_: Optional[List["dataset_bool_exp"]] = Field(alias="_and")
    not_: Optional["dataset_bool_exp"] = Field(alias="_not")
    or_: Optional[List["dataset_bool_exp"]] = Field(alias="_or")
    category: Optional["String_comparison_exp"]
    category_id: Optional["uuid_comparison_exp"]
    company: Optional["company_bool_exp"]
    company_category: Optional["company_categories_bool_exp"]
    company_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    created_by: Optional["uuid_comparison_exp"]
    dataset_activities: Optional["dataset_activities_bool_exp"]
    dataset_activities_aggregate: Optional["dataset_activities_aggregate_bool_exp"]
    dependent_narratives: Optional["narrative_datasets_bool_exp"]
    dependent_narratives_aggregate: Optional["narrative_datasets_aggregate_bool_exp"]
    description: Optional["String_comparison_exp"]
    has_training: Optional["Boolean_comparison_exp"]
    hide_from_index: Optional["Boolean_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    last_config_updated_at: Optional["timestamptz_comparison_exp"]
    last_viewed_at: Optional["timestamptz_comparison_exp"]
    locked: Optional["Boolean_comparison_exp"]
    materializations: Optional["dataset_materialization_bool_exp"]
    materializations_aggregate: Optional["dataset_materialization_aggregate_bool_exp"]
    metric: Optional["metric_bool_exp"]
    metric_id: Optional["uuid_comparison_exp"]
    name: Optional["String_comparison_exp"]
    slug: Optional["String_comparison_exp"]
    status: Optional["status_enum_comparison_exp"]
    tags: Optional["dataset_tags_bool_exp"]
    tags_aggregate: Optional["dataset_tags_aggregate_bool_exp"]
    team_permissions: Optional["dataset_team_permissions_bool_exp"]
    team_permissions_aggregate: Optional["dataset_team_permissions_aggregate_bool_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    updated_by: Optional["uuid_comparison_exp"]
    updated_by_user: Optional["user_bool_exp"]
    user: Optional["user_bool_exp"]
    versions: Optional["dataset_versions_bool_exp"]
    versions_aggregate: Optional["dataset_versions_aggregate_bool_exp"]


class dataset_insert_input(BaseModel):
    category: Optional[str]
    category_id: Optional[Any]
    company: Optional["company_obj_rel_insert_input"]
    company_category: Optional["company_categories_obj_rel_insert_input"]
    company_id: Optional[Any]
    created_at: Optional[Any]
    created_by: Optional[Any]
    dataset_activities: Optional["dataset_activities_arr_rel_insert_input"]
    dependent_narratives: Optional["narrative_datasets_arr_rel_insert_input"]
    description: Optional[str]
    has_training: Optional[bool]
    hide_from_index: Optional[bool]
    id: Optional[Any]
    last_config_updated_at: Optional[Any]
    last_viewed_at: Optional[Any]
    locked: Optional[bool]
    materializations: Optional["dataset_materialization_arr_rel_insert_input"]
    metric: Optional["metric_obj_rel_insert_input"]
    metric_id: Optional[Any]
    name: Optional[str]
    slug: Optional[str]
    status: Optional[status_enum]
    tags: Optional["dataset_tags_arr_rel_insert_input"]
    team_permissions: Optional["dataset_team_permissions_arr_rel_insert_input"]
    updated_at: Optional[Any]
    updated_by: Optional[Any]
    updated_by_user: Optional["user_obj_rel_insert_input"]
    user: Optional["user_obj_rel_insert_input"]
    versions: Optional["dataset_versions_arr_rel_insert_input"]


class dataset_materialization_aggregate_bool_exp(BaseModel):
    count: Optional["dataset_materialization_aggregate_bool_exp_count"]


class dataset_materialization_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[dataset_materialization_select_column]]
    distinct: Optional[bool]
    filter: Optional["dataset_materialization_bool_exp"]
    predicate: "Int_comparison_exp"


class dataset_materialization_aggregate_order_by(BaseModel):
    avg: Optional["dataset_materialization_avg_order_by"]
    count: Optional[order_by]
    max: Optional["dataset_materialization_max_order_by"]
    min: Optional["dataset_materialization_min_order_by"]
    stddev: Optional["dataset_materialization_stddev_order_by"]
    stddev_pop: Optional["dataset_materialization_stddev_pop_order_by"]
    stddev_samp: Optional["dataset_materialization_stddev_samp_order_by"]
    sum: Optional["dataset_materialization_sum_order_by"]
    var_pop: Optional["dataset_materialization_var_pop_order_by"]
    var_samp: Optional["dataset_materialization_var_samp_order_by"]
    variance: Optional["dataset_materialization_variance_order_by"]


class dataset_materialization_arr_rel_insert_input(BaseModel):
    data: List["dataset_materialization_insert_input"]
    on_conflict: Optional["dataset_materialization_on_conflict"]


class dataset_materialization_avg_order_by(BaseModel):
    days_to_resync: Optional[order_by]


class dataset_materialization_bool_exp(BaseModel):
    and_: Optional[List["dataset_materialization_bool_exp"]] = Field(alias="_and")
    not_: Optional["dataset_materialization_bool_exp"] = Field(alias="_not")
    or_: Optional[List["dataset_materialization_bool_exp"]] = Field(alias="_or")
    column_id: Optional["String_comparison_exp"]
    company_task: Optional["company_task_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    dataset: Optional["dataset_bool_exp"]
    dataset_id: Optional["uuid_comparison_exp"]
    days_to_resync: Optional["Int_comparison_exp"]
    external_link: Optional["String_comparison_exp"]
    group_slug: Optional["String_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    label: Optional["String_comparison_exp"]
    postmark_from: Optional["String_comparison_exp"]
    s3_secret_key: Optional["String_comparison_exp"]
    sheet_key: Optional["String_comparison_exp"]
    task_id: Optional["uuid_comparison_exp"]
    template_id: Optional["String_comparison_exp"]
    type: Optional["materialization_type_enum_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    updated_by: Optional["uuid_comparison_exp"]
    user: Optional["user_bool_exp"]
    user_ids: Optional["String_comparison_exp"]
    webhook_url: Optional["String_comparison_exp"]


class dataset_materialization_inc_input(BaseModel):
    days_to_resync: Optional[int]


class dataset_materialization_insert_input(BaseModel):
    column_id: Optional[str]
    company_task: Optional["company_task_obj_rel_insert_input"]
    created_at: Optional[Any]
    dataset: Optional["dataset_obj_rel_insert_input"]
    dataset_id: Optional[Any]
    days_to_resync: Optional[int]
    external_link: Optional[str]
    group_slug: Optional[str]
    id: Optional[Any]
    label: Optional[str]
    postmark_from: Optional[str]
    s3_secret_key: Optional[str]
    sheet_key: Optional[str]
    task_id: Optional[Any]
    template_id: Optional[str]
    type: Optional[materialization_type_enum]
    updated_at: Optional[Any]
    updated_by: Optional[Any]
    user: Optional["user_obj_rel_insert_input"]
    user_ids: Optional[str]
    webhook_url: Optional[str]


class dataset_materialization_max_order_by(BaseModel):
    column_id: Optional[order_by]
    created_at: Optional[order_by]
    dataset_id: Optional[order_by]
    days_to_resync: Optional[order_by]
    external_link: Optional[order_by]
    group_slug: Optional[order_by]
    id: Optional[order_by]
    label: Optional[order_by]
    postmark_from: Optional[order_by]
    s3_secret_key: Optional[order_by]
    sheet_key: Optional[order_by]
    task_id: Optional[order_by]
    template_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]
    user_ids: Optional[order_by]
    webhook_url: Optional[order_by]


class dataset_materialization_min_order_by(BaseModel):
    column_id: Optional[order_by]
    created_at: Optional[order_by]
    dataset_id: Optional[order_by]
    days_to_resync: Optional[order_by]
    external_link: Optional[order_by]
    group_slug: Optional[order_by]
    id: Optional[order_by]
    label: Optional[order_by]
    postmark_from: Optional[order_by]
    s3_secret_key: Optional[order_by]
    sheet_key: Optional[order_by]
    task_id: Optional[order_by]
    template_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]
    user_ids: Optional[order_by]
    webhook_url: Optional[order_by]


class dataset_materialization_on_conflict(BaseModel):
    constraint: dataset_materialization_constraint
    update_columns: List[dataset_materialization_update_column]
    where: Optional["dataset_materialization_bool_exp"]


class dataset_materialization_order_by(BaseModel):
    column_id: Optional[order_by]
    company_task: Optional["company_task_order_by"]
    created_at: Optional[order_by]
    dataset: Optional["dataset_order_by"]
    dataset_id: Optional[order_by]
    days_to_resync: Optional[order_by]
    external_link: Optional[order_by]
    group_slug: Optional[order_by]
    id: Optional[order_by]
    label: Optional[order_by]
    postmark_from: Optional[order_by]
    s3_secret_key: Optional[order_by]
    sheet_key: Optional[order_by]
    task_id: Optional[order_by]
    template_id: Optional[order_by]
    type: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]
    user: Optional["user_order_by"]
    user_ids: Optional[order_by]
    webhook_url: Optional[order_by]


class dataset_materialization_pk_columns_input(BaseModel):
    id: Any


class dataset_materialization_set_input(BaseModel):
    column_id: Optional[str]
    created_at: Optional[Any]
    dataset_id: Optional[Any]
    days_to_resync: Optional[int]
    external_link: Optional[str]
    group_slug: Optional[str]
    id: Optional[Any]
    label: Optional[str]
    postmark_from: Optional[str]
    s3_secret_key: Optional[str]
    sheet_key: Optional[str]
    task_id: Optional[Any]
    template_id: Optional[str]
    type: Optional[materialization_type_enum]
    updated_at: Optional[Any]
    updated_by: Optional[Any]
    user_ids: Optional[str]
    webhook_url: Optional[str]


class dataset_materialization_stddev_order_by(BaseModel):
    days_to_resync: Optional[order_by]


class dataset_materialization_stddev_pop_order_by(BaseModel):
    days_to_resync: Optional[order_by]


class dataset_materialization_stddev_samp_order_by(BaseModel):
    days_to_resync: Optional[order_by]


class dataset_materialization_stream_cursor_input(BaseModel):
    initial_value: "dataset_materialization_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class dataset_materialization_stream_cursor_value_input(BaseModel):
    column_id: Optional[str]
    created_at: Optional[Any]
    dataset_id: Optional[Any]
    days_to_resync: Optional[int]
    external_link: Optional[str]
    group_slug: Optional[str]
    id: Optional[Any]
    label: Optional[str]
    postmark_from: Optional[str]
    s3_secret_key: Optional[str]
    sheet_key: Optional[str]
    task_id: Optional[Any]
    template_id: Optional[str]
    type: Optional[materialization_type_enum]
    updated_at: Optional[Any]
    updated_by: Optional[Any]
    user_ids: Optional[str]
    webhook_url: Optional[str]


class dataset_materialization_sum_order_by(BaseModel):
    days_to_resync: Optional[order_by]


class dataset_materialization_updates(BaseModel):
    inc: Optional["dataset_materialization_inc_input"] = Field(alias="_inc")
    set: Optional["dataset_materialization_set_input"] = Field(alias="_set")
    where: "dataset_materialization_bool_exp"


class dataset_materialization_var_pop_order_by(BaseModel):
    days_to_resync: Optional[order_by]


class dataset_materialization_var_samp_order_by(BaseModel):
    days_to_resync: Optional[order_by]


class dataset_materialization_variance_order_by(BaseModel):
    days_to_resync: Optional[order_by]


class dataset_max_order_by(BaseModel):
    category: Optional[order_by]
    category_id: Optional[order_by]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    created_by: Optional[order_by]
    description: Optional[order_by]
    id: Optional[order_by]
    last_config_updated_at: Optional[order_by]
    last_viewed_at: Optional[order_by]
    metric_id: Optional[order_by]
    name: Optional[order_by]
    slug: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class dataset_min_order_by(BaseModel):
    category: Optional[order_by]
    category_id: Optional[order_by]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    created_by: Optional[order_by]
    description: Optional[order_by]
    id: Optional[order_by]
    last_config_updated_at: Optional[order_by]
    last_viewed_at: Optional[order_by]
    metric_id: Optional[order_by]
    name: Optional[order_by]
    slug: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class dataset_obj_rel_insert_input(BaseModel):
    data: "dataset_insert_input"
    on_conflict: Optional["dataset_on_conflict"]


class dataset_on_conflict(BaseModel):
    constraint: dataset_constraint
    update_columns: List[dataset_update_column]
    where: Optional["dataset_bool_exp"]


class dataset_order_by(BaseModel):
    category: Optional[order_by]
    category_id: Optional[order_by]
    company: Optional["company_order_by"]
    company_category: Optional["company_categories_order_by"]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    created_by: Optional[order_by]
    dataset_activities_aggregate: Optional["dataset_activities_aggregate_order_by"]
    dependent_narratives_aggregate: Optional["narrative_datasets_aggregate_order_by"]
    description: Optional[order_by]
    has_training: Optional[order_by]
    hide_from_index: Optional[order_by]
    id: Optional[order_by]
    last_config_updated_at: Optional[order_by]
    last_viewed_at: Optional[order_by]
    locked: Optional[order_by]
    materializations_aggregate: Optional["dataset_materialization_aggregate_order_by"]
    metric: Optional["metric_order_by"]
    metric_id: Optional[order_by]
    name: Optional[order_by]
    slug: Optional[order_by]
    status: Optional[order_by]
    tags_aggregate: Optional["dataset_tags_aggregate_order_by"]
    team_permissions_aggregate: Optional["dataset_team_permissions_aggregate_order_by"]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]
    updated_by_user: Optional["user_order_by"]
    user: Optional["user_order_by"]
    versions_aggregate: Optional["dataset_versions_aggregate_order_by"]


class dataset_pk_columns_input(BaseModel):
    id: Any


class dataset_set_input(BaseModel):
    category: Optional[str]
    category_id: Optional[Any]
    company_id: Optional[Any]
    created_at: Optional[Any]
    created_by: Optional[Any]
    description: Optional[str]
    has_training: Optional[bool]
    hide_from_index: Optional[bool]
    id: Optional[Any]
    last_config_updated_at: Optional[Any]
    last_viewed_at: Optional[Any]
    locked: Optional[bool]
    metric_id: Optional[Any]
    name: Optional[str]
    slug: Optional[str]
    status: Optional[status_enum]
    updated_at: Optional[Any]
    updated_by: Optional[Any]


class dataset_stream_cursor_input(BaseModel):
    initial_value: "dataset_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class dataset_stream_cursor_value_input(BaseModel):
    category: Optional[str]
    category_id: Optional[Any]
    company_id: Optional[Any]
    created_at: Optional[Any]
    created_by: Optional[Any]
    description: Optional[str]
    has_training: Optional[bool]
    hide_from_index: Optional[bool]
    id: Optional[Any]
    last_config_updated_at: Optional[Any]
    last_viewed_at: Optional[Any]
    locked: Optional[bool]
    metric_id: Optional[Any]
    name: Optional[str]
    slug: Optional[str]
    status: Optional[status_enum]
    updated_at: Optional[Any]
    updated_by: Optional[Any]


class dataset_tags_aggregate_bool_exp(BaseModel):
    count: Optional["dataset_tags_aggregate_bool_exp_count"]


class dataset_tags_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[dataset_tags_select_column]]
    distinct: Optional[bool]
    filter: Optional["dataset_tags_bool_exp"]
    predicate: "Int_comparison_exp"


class dataset_tags_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["dataset_tags_max_order_by"]
    min: Optional["dataset_tags_min_order_by"]


class dataset_tags_arr_rel_insert_input(BaseModel):
    data: List["dataset_tags_insert_input"]


class dataset_tags_bool_exp(BaseModel):
    and_: Optional[List["dataset_tags_bool_exp"]] = Field(alias="_and")
    not_: Optional["dataset_tags_bool_exp"] = Field(alias="_not")
    or_: Optional[List["dataset_tags_bool_exp"]] = Field(alias="_or")
    company_tag: Optional["company_tags_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    dataset: Optional["dataset_bool_exp"]
    dataset_id: Optional["uuid_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    tag_id: Optional["uuid_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class dataset_tags_insert_input(BaseModel):
    company_tag: Optional["company_tags_obj_rel_insert_input"]
    created_at: Optional[Any]
    dataset: Optional["dataset_obj_rel_insert_input"]
    dataset_id: Optional[Any]
    id: Optional[Any]
    tag_id: Optional[Any]
    updated_at: Optional[Any]


class dataset_tags_max_order_by(BaseModel):
    created_at: Optional[order_by]
    dataset_id: Optional[order_by]
    id: Optional[order_by]
    tag_id: Optional[order_by]
    updated_at: Optional[order_by]


class dataset_tags_min_order_by(BaseModel):
    created_at: Optional[order_by]
    dataset_id: Optional[order_by]
    id: Optional[order_by]
    tag_id: Optional[order_by]
    updated_at: Optional[order_by]


class dataset_tags_order_by(BaseModel):
    company_tag: Optional["company_tags_order_by"]
    created_at: Optional[order_by]
    dataset: Optional["dataset_order_by"]
    dataset_id: Optional[order_by]
    id: Optional[order_by]
    tag_id: Optional[order_by]
    updated_at: Optional[order_by]


class dataset_tags_set_input(BaseModel):
    created_at: Optional[Any]
    dataset_id: Optional[Any]
    id: Optional[Any]
    tag_id: Optional[Any]
    updated_at: Optional[Any]


class dataset_tags_stream_cursor_input(BaseModel):
    initial_value: "dataset_tags_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class dataset_tags_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    dataset_id: Optional[Any]
    id: Optional[Any]
    tag_id: Optional[Any]
    updated_at: Optional[Any]


class dataset_tags_updates(BaseModel):
    set: Optional["dataset_tags_set_input"] = Field(alias="_set")
    where: "dataset_tags_bool_exp"


class dataset_team_permissions_aggregate_bool_exp(BaseModel):
    bool_and: Optional["dataset_team_permissions_aggregate_bool_exp_bool_and"]
    bool_or: Optional["dataset_team_permissions_aggregate_bool_exp_bool_or"]
    count: Optional["dataset_team_permissions_aggregate_bool_exp_count"]


class dataset_team_permissions_aggregate_bool_exp_bool_and(BaseModel):
    arguments: (
        dataset_team_permissions_select_column_dataset_team_permissions_aggregate_bool_exp_bool_and_arguments_columns
    )
    distinct: Optional[bool]
    filter: Optional["dataset_team_permissions_bool_exp"]
    predicate: "Boolean_comparison_exp"


class dataset_team_permissions_aggregate_bool_exp_bool_or(BaseModel):
    arguments: (
        dataset_team_permissions_select_column_dataset_team_permissions_aggregate_bool_exp_bool_or_arguments_columns
    )
    distinct: Optional[bool]
    filter: Optional["dataset_team_permissions_bool_exp"]
    predicate: "Boolean_comparison_exp"


class dataset_team_permissions_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[dataset_team_permissions_select_column]]
    distinct: Optional[bool]
    filter: Optional["dataset_team_permissions_bool_exp"]
    predicate: "Int_comparison_exp"


class dataset_team_permissions_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["dataset_team_permissions_max_order_by"]
    min: Optional["dataset_team_permissions_min_order_by"]


class dataset_team_permissions_arr_rel_insert_input(BaseModel):
    data: List["dataset_team_permissions_insert_input"]


class dataset_team_permissions_bool_exp(BaseModel):
    and_: Optional[List["dataset_team_permissions_bool_exp"]] = Field(alias="_and")
    not_: Optional["dataset_team_permissions_bool_exp"] = Field(alias="_not")
    or_: Optional[List["dataset_team_permissions_bool_exp"]] = Field(alias="_or")
    can_edit: Optional["Boolean_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    dataset_id: Optional["uuid_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    team: Optional["team_bool_exp"]
    team_id: Optional["uuid_comparison_exp"]


class dataset_team_permissions_insert_input(BaseModel):
    can_edit: Optional[bool]
    created_at: Optional[Any]
    dataset_id: Optional[Any]
    id: Optional[Any]
    team: Optional["team_obj_rel_insert_input"]
    team_id: Optional[Any]


class dataset_team_permissions_max_order_by(BaseModel):
    created_at: Optional[order_by]
    dataset_id: Optional[order_by]
    id: Optional[order_by]
    team_id: Optional[order_by]


class dataset_team_permissions_min_order_by(BaseModel):
    created_at: Optional[order_by]
    dataset_id: Optional[order_by]
    id: Optional[order_by]
    team_id: Optional[order_by]


class dataset_team_permissions_order_by(BaseModel):
    can_edit: Optional[order_by]
    created_at: Optional[order_by]
    dataset_id: Optional[order_by]
    id: Optional[order_by]
    team: Optional["team_order_by"]
    team_id: Optional[order_by]


class dataset_team_permissions_set_input(BaseModel):
    can_edit: Optional[bool]
    created_at: Optional[Any]
    dataset_id: Optional[Any]
    id: Optional[Any]
    team_id: Optional[Any]


class dataset_team_permissions_stream_cursor_input(BaseModel):
    initial_value: "dataset_team_permissions_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class dataset_team_permissions_stream_cursor_value_input(BaseModel):
    can_edit: Optional[bool]
    created_at: Optional[Any]
    dataset_id: Optional[Any]
    id: Optional[Any]
    team_id: Optional[Any]


class dataset_team_permissions_updates(BaseModel):
    set: Optional["dataset_team_permissions_set_input"] = Field(alias="_set")
    where: "dataset_team_permissions_bool_exp"


class dataset_updates(BaseModel):
    set: Optional["dataset_set_input"] = Field(alias="_set")
    where: "dataset_bool_exp"


class dataset_versions_aggregate_bool_exp(BaseModel):
    count: Optional["dataset_versions_aggregate_bool_exp_count"]


class dataset_versions_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[dataset_versions_select_column]]
    distinct: Optional[bool]
    filter: Optional["dataset_versions_bool_exp"]
    predicate: "Int_comparison_exp"


class dataset_versions_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["dataset_versions_max_order_by"]
    min: Optional["dataset_versions_min_order_by"]


class dataset_versions_arr_rel_insert_input(BaseModel):
    data: List["dataset_versions_insert_input"]


class dataset_versions_bool_exp(BaseModel):
    and_: Optional[List["dataset_versions_bool_exp"]] = Field(alias="_and")
    not_: Optional["dataset_versions_bool_exp"] = Field(alias="_not")
    or_: Optional[List["dataset_versions_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    dataset_id: Optional["uuid_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    s3_key: Optional["String_comparison_exp"]


class dataset_versions_insert_input(BaseModel):
    created_at: Optional[Any]
    dataset_id: Optional[Any]
    id: Optional[Any]
    s3_key: Optional[str]


class dataset_versions_max_order_by(BaseModel):
    created_at: Optional[order_by]
    dataset_id: Optional[order_by]
    id: Optional[order_by]
    s3_key: Optional[order_by]


class dataset_versions_min_order_by(BaseModel):
    created_at: Optional[order_by]
    dataset_id: Optional[order_by]
    id: Optional[order_by]
    s3_key: Optional[order_by]


class dataset_versions_order_by(BaseModel):
    created_at: Optional[order_by]
    dataset_id: Optional[order_by]
    id: Optional[order_by]
    s3_key: Optional[order_by]


class dataset_versions_set_input(BaseModel):
    created_at: Optional[Any]
    dataset_id: Optional[Any]
    id: Optional[Any]
    s3_key: Optional[str]


class dataset_versions_stream_cursor_input(BaseModel):
    initial_value: "dataset_versions_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class dataset_versions_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    dataset_id: Optional[Any]
    id: Optional[Any]
    s3_key: Optional[str]


class dataset_versions_updates(BaseModel):
    set: Optional["dataset_versions_set_input"] = Field(alias="_set")
    where: "dataset_versions_bool_exp"


class date_comparison_exp(BaseModel):
    eq: Optional[Any] = Field(alias="_eq")
    gt: Optional[Any] = Field(alias="_gt")
    gte: Optional[Any] = Field(alias="_gte")
    in_: Optional[List[Any]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    lt: Optional[Any] = Field(alias="_lt")
    lte: Optional[Any] = Field(alias="_lte")
    neq: Optional[Any] = Field(alias="_neq")
    nin: Optional[List[Any]] = Field(alias="_nin")


class dim_table_bool_exp(BaseModel):
    and_: Optional[List["dim_table_bool_exp"]] = Field(alias="_and")
    not_: Optional["dim_table_bool_exp"] = Field(alias="_not")
    or_: Optional[List["dim_table_bool_exp"]] = Field(alias="_or")
    activities: Optional["activity_dim_bool_exp"]
    activities_aggregate: Optional["activity_dim_aggregate_bool_exp"]
    columns: Optional["dim_table_columns_bool_exp"]
    columns_aggregate: Optional["dim_table_columns_aggregate_bool_exp"]
    company_id: Optional["uuid_comparison_exp"]
    company_table_aggregations: Optional["company_table_aggregation_dim_bool_exp"]
    company_table_aggregations_aggregate: Optional["company_table_aggregation_dim_aggregate_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    customer_table: Optional["company_table_bool_exp"]
    customer_table_aggregate: Optional["company_table_aggregate_bool_exp"]
    description: Optional["String_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    join_key: Optional["String_comparison_exp"]
    maintenances: Optional["activity_maintenance_bool_exp"]
    maintenances_aggregate: Optional["activity_maintenance_aggregate_bool_exp"]
    schema_: Optional["String_comparison_exp"] = Field(alias="schema")
    slowly_changing_customer_dims: Optional["slowly_changing_customer_dims_bool_exp"]
    slowly_changing_customer_dims_aggregate: Optional["slowly_changing_customer_dims_aggregate_bool_exp"]
    table: Optional["String_comparison_exp"]
    team_permissions: Optional["dim_team_permissions_bool_exp"]
    team_permissions_aggregate: Optional["dim_team_permissions_aggregate_bool_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class dim_table_columns_aggregate_bool_exp(BaseModel):
    bool_and: Optional["dim_table_columns_aggregate_bool_exp_bool_and"]
    bool_or: Optional["dim_table_columns_aggregate_bool_exp_bool_or"]
    count: Optional["dim_table_columns_aggregate_bool_exp_count"]


class dim_table_columns_aggregate_bool_exp_bool_and(BaseModel):
    arguments: dim_table_columns_select_column_dim_table_columns_aggregate_bool_exp_bool_and_arguments_columns
    distinct: Optional[bool]
    filter: Optional["dim_table_columns_bool_exp"]
    predicate: "Boolean_comparison_exp"


class dim_table_columns_aggregate_bool_exp_bool_or(BaseModel):
    arguments: dim_table_columns_select_column_dim_table_columns_aggregate_bool_exp_bool_or_arguments_columns
    distinct: Optional[bool]
    filter: Optional["dim_table_columns_bool_exp"]
    predicate: "Boolean_comparison_exp"


class dim_table_columns_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[dim_table_columns_select_column]]
    distinct: Optional[bool]
    filter: Optional["dim_table_columns_bool_exp"]
    predicate: "Int_comparison_exp"


class dim_table_columns_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["dim_table_columns_max_order_by"]
    min: Optional["dim_table_columns_min_order_by"]


class dim_table_columns_arr_rel_insert_input(BaseModel):
    data: List["dim_table_columns_insert_input"]


class dim_table_columns_bool_exp(BaseModel):
    and_: Optional[List["dim_table_columns_bool_exp"]] = Field(alias="_and")
    not_: Optional["dim_table_columns_bool_exp"] = Field(alias="_not")
    or_: Optional[List["dim_table_columns_bool_exp"]] = Field(alias="_or")
    casting: Optional["String_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    description: Optional["String_comparison_exp"]
    dim_table_id: Optional["uuid_comparison_exp"]
    has_data: Optional["Boolean_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    label: Optional["String_comparison_exp"]
    name: Optional["String_comparison_exp"]
    related_to: Optional["String_comparison_exp"]
    related_to_id: Optional["uuid_comparison_exp"]
    type: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class dim_table_columns_insert_input(BaseModel):
    casting: Optional[str]
    created_at: Optional[Any]
    description: Optional[str]
    dim_table_id: Optional[Any]
    has_data: Optional[bool]
    id: Optional[Any]
    label: Optional[str]
    name: Optional[str]
    related_to: Optional[str]
    related_to_id: Optional[Any]
    type: Optional[str]
    updated_at: Optional[Any]


class dim_table_columns_max_order_by(BaseModel):
    casting: Optional[order_by]
    created_at: Optional[order_by]
    description: Optional[order_by]
    dim_table_id: Optional[order_by]
    id: Optional[order_by]
    label: Optional[order_by]
    name: Optional[order_by]
    related_to: Optional[order_by]
    related_to_id: Optional[order_by]
    type: Optional[order_by]
    updated_at: Optional[order_by]


class dim_table_columns_min_order_by(BaseModel):
    casting: Optional[order_by]
    created_at: Optional[order_by]
    description: Optional[order_by]
    dim_table_id: Optional[order_by]
    id: Optional[order_by]
    label: Optional[order_by]
    name: Optional[order_by]
    related_to: Optional[order_by]
    related_to_id: Optional[order_by]
    type: Optional[order_by]
    updated_at: Optional[order_by]


class dim_table_columns_order_by(BaseModel):
    casting: Optional[order_by]
    created_at: Optional[order_by]
    description: Optional[order_by]
    dim_table_id: Optional[order_by]
    has_data: Optional[order_by]
    id: Optional[order_by]
    label: Optional[order_by]
    name: Optional[order_by]
    related_to: Optional[order_by]
    related_to_id: Optional[order_by]
    type: Optional[order_by]
    updated_at: Optional[order_by]


class dim_table_columns_set_input(BaseModel):
    casting: Optional[str]
    created_at: Optional[Any]
    description: Optional[str]
    dim_table_id: Optional[Any]
    has_data: Optional[bool]
    id: Optional[Any]
    label: Optional[str]
    name: Optional[str]
    related_to: Optional[str]
    related_to_id: Optional[Any]
    type: Optional[str]
    updated_at: Optional[Any]


class dim_table_columns_stream_cursor_input(BaseModel):
    initial_value: "dim_table_columns_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class dim_table_columns_stream_cursor_value_input(BaseModel):
    casting: Optional[str]
    created_at: Optional[Any]
    description: Optional[str]
    dim_table_id: Optional[Any]
    has_data: Optional[bool]
    id: Optional[Any]
    label: Optional[str]
    name: Optional[str]
    related_to: Optional[str]
    related_to_id: Optional[Any]
    type: Optional[str]
    updated_at: Optional[Any]


class dim_table_columns_updates(BaseModel):
    set: Optional["dim_table_columns_set_input"] = Field(alias="_set")
    where: "dim_table_columns_bool_exp"


class dim_table_insert_input(BaseModel):
    activities: Optional["activity_dim_arr_rel_insert_input"]
    columns: Optional["dim_table_columns_arr_rel_insert_input"]
    company_id: Optional[Any]
    company_table_aggregations: Optional["company_table_aggregation_dim_arr_rel_insert_input"]
    created_at: Optional[Any]
    customer_table: Optional["company_table_arr_rel_insert_input"]
    description: Optional[str]
    id: Optional[Any]
    join_key: Optional[str]
    maintenances: Optional["activity_maintenance_arr_rel_insert_input"]
    schema_: Optional[str] = Field(alias="schema")
    slowly_changing_customer_dims: Optional["slowly_changing_customer_dims_arr_rel_insert_input"]
    table: Optional[str]
    team_permissions: Optional["dim_team_permissions_arr_rel_insert_input"]
    updated_at: Optional[Any]


class dim_table_obj_rel_insert_input(BaseModel):
    data: "dim_table_insert_input"
    on_conflict: Optional["dim_table_on_conflict"]


class dim_table_on_conflict(BaseModel):
    constraint: dim_table_constraint
    update_columns: List[dim_table_update_column]
    where: Optional["dim_table_bool_exp"]


class dim_table_order_by(BaseModel):
    activities_aggregate: Optional["activity_dim_aggregate_order_by"]
    columns_aggregate: Optional["dim_table_columns_aggregate_order_by"]
    company_id: Optional[order_by]
    company_table_aggregations_aggregate: Optional["company_table_aggregation_dim_aggregate_order_by"]
    created_at: Optional[order_by]
    customer_table_aggregate: Optional["company_table_aggregate_order_by"]
    description: Optional[order_by]
    id: Optional[order_by]
    join_key: Optional[order_by]
    maintenances_aggregate: Optional["activity_maintenance_aggregate_order_by"]
    schema_: Optional[order_by] = Field(alias="schema")
    slowly_changing_customer_dims_aggregate: Optional["slowly_changing_customer_dims_aggregate_order_by"]
    table: Optional[order_by]
    team_permissions_aggregate: Optional["dim_team_permissions_aggregate_order_by"]
    updated_at: Optional[order_by]


class dim_table_pk_columns_input(BaseModel):
    id: Any


class dim_table_set_input(BaseModel):
    company_id: Optional[Any]
    created_at: Optional[Any]
    description: Optional[str]
    id: Optional[Any]
    join_key: Optional[str]
    schema_: Optional[str] = Field(alias="schema")
    table: Optional[str]
    updated_at: Optional[Any]


class dim_table_stream_cursor_input(BaseModel):
    initial_value: "dim_table_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class dim_table_stream_cursor_value_input(BaseModel):
    company_id: Optional[Any]
    created_at: Optional[Any]
    description: Optional[str]
    id: Optional[Any]
    join_key: Optional[str]
    schema_: Optional[str] = Field(alias="schema")
    table: Optional[str]
    updated_at: Optional[Any]


class dim_table_updates(BaseModel):
    set: Optional["dim_table_set_input"] = Field(alias="_set")
    where: "dim_table_bool_exp"


class dim_team_permissions_aggregate_bool_exp(BaseModel):
    bool_and: Optional["dim_team_permissions_aggregate_bool_exp_bool_and"]
    bool_or: Optional["dim_team_permissions_aggregate_bool_exp_bool_or"]
    count: Optional["dim_team_permissions_aggregate_bool_exp_count"]


class dim_team_permissions_aggregate_bool_exp_bool_and(BaseModel):
    arguments: dim_team_permissions_select_column_dim_team_permissions_aggregate_bool_exp_bool_and_arguments_columns
    distinct: Optional[bool]
    filter: Optional["dim_team_permissions_bool_exp"]
    predicate: "Boolean_comparison_exp"


class dim_team_permissions_aggregate_bool_exp_bool_or(BaseModel):
    arguments: dim_team_permissions_select_column_dim_team_permissions_aggregate_bool_exp_bool_or_arguments_columns
    distinct: Optional[bool]
    filter: Optional["dim_team_permissions_bool_exp"]
    predicate: "Boolean_comparison_exp"


class dim_team_permissions_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[dim_team_permissions_select_column]]
    distinct: Optional[bool]
    filter: Optional["dim_team_permissions_bool_exp"]
    predicate: "Int_comparison_exp"


class dim_team_permissions_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["dim_team_permissions_max_order_by"]
    min: Optional["dim_team_permissions_min_order_by"]


class dim_team_permissions_arr_rel_insert_input(BaseModel):
    data: List["dim_team_permissions_insert_input"]


class dim_team_permissions_bool_exp(BaseModel):
    and_: Optional[List["dim_team_permissions_bool_exp"]] = Field(alias="_and")
    not_: Optional["dim_team_permissions_bool_exp"] = Field(alias="_not")
    or_: Optional[List["dim_team_permissions_bool_exp"]] = Field(alias="_or")
    can_edit: Optional["Boolean_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    dim_id: Optional["uuid_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    team_id: Optional["uuid_comparison_exp"]


class dim_team_permissions_insert_input(BaseModel):
    can_edit: Optional[bool]
    created_at: Optional[Any]
    dim_id: Optional[Any]
    id: Optional[Any]
    team_id: Optional[Any]


class dim_team_permissions_max_order_by(BaseModel):
    created_at: Optional[order_by]
    dim_id: Optional[order_by]
    id: Optional[order_by]
    team_id: Optional[order_by]


class dim_team_permissions_min_order_by(BaseModel):
    created_at: Optional[order_by]
    dim_id: Optional[order_by]
    id: Optional[order_by]
    team_id: Optional[order_by]


class dim_team_permissions_order_by(BaseModel):
    can_edit: Optional[order_by]
    created_at: Optional[order_by]
    dim_id: Optional[order_by]
    id: Optional[order_by]
    team_id: Optional[order_by]


class dim_team_permissions_set_input(BaseModel):
    can_edit: Optional[bool]
    created_at: Optional[Any]
    dim_id: Optional[Any]
    id: Optional[Any]
    team_id: Optional[Any]


class dim_team_permissions_stream_cursor_input(BaseModel):
    initial_value: "dim_team_permissions_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class dim_team_permissions_stream_cursor_value_input(BaseModel):
    can_edit: Optional[bool]
    created_at: Optional[Any]
    dim_id: Optional[Any]
    id: Optional[Any]
    team_id: Optional[Any]


class dim_team_permissions_updates(BaseModel):
    set: Optional["dim_team_permissions_set_input"] = Field(alias="_set")
    where: "dim_team_permissions_bool_exp"


class document_live_bool_exp(BaseModel):
    and_: Optional[List["document_live_bool_exp"]] = Field(alias="_and")
    not_: Optional["document_live_bool_exp"] = Field(alias="_not")
    or_: Optional[List["document_live_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    markdown: Optional["String_comparison_exp"]
    name: Optional["String_comparison_exp"]
    published: Optional["Boolean_comparison_exp"]
    slug: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class document_live_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    markdown: Optional[order_by]
    name: Optional[order_by]
    published: Optional[order_by]
    slug: Optional[order_by]
    updated_at: Optional[order_by]


class document_live_stream_cursor_input(BaseModel):
    initial_value: "document_live_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class document_live_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    markdown: Optional[str]
    name: Optional[str]
    published: Optional[bool]
    slug: Optional[str]
    updated_at: Optional[Any]


class document_revision_bool_exp(BaseModel):
    and_: Optional[List["document_revision_bool_exp"]] = Field(alias="_and")
    not_: Optional["document_revision_bool_exp"] = Field(alias="_not")
    or_: Optional[List["document_revision_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    markdown: Optional["String_comparison_exp"]
    name: Optional["String_comparison_exp"]
    published: Optional["Boolean_comparison_exp"]
    slug: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class document_revision_insert_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    markdown: Optional[str]
    name: Optional[str]
    published: Optional[bool]
    slug: Optional[str]
    updated_at: Optional[Any]


class document_revision_on_conflict(BaseModel):
    constraint: document_revision_constraint
    update_columns: List[document_revision_update_column]
    where: Optional["document_revision_bool_exp"]


class document_revision_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    markdown: Optional[order_by]
    name: Optional[order_by]
    published: Optional[order_by]
    slug: Optional[order_by]
    updated_at: Optional[order_by]


class document_revision_pk_columns_input(BaseModel):
    id: Any


class document_revision_set_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    markdown: Optional[str]
    name: Optional[str]
    published: Optional[bool]
    slug: Optional[str]
    updated_at: Optional[Any]


class document_revision_stream_cursor_input(BaseModel):
    initial_value: "document_revision_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class document_revision_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    markdown: Optional[str]
    name: Optional[str]
    published: Optional[bool]
    slug: Optional[str]
    updated_at: Optional[Any]


class document_revision_updates(BaseModel):
    set: Optional["document_revision_set_input"] = Field(alias="_set")
    where: "document_revision_bool_exp"


class float8_comparison_exp(BaseModel):
    eq: Optional[Any] = Field(alias="_eq")
    gt: Optional[Any] = Field(alias="_gt")
    gte: Optional[Any] = Field(alias="_gte")
    in_: Optional[List[Any]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    lt: Optional[Any] = Field(alias="_lt")
    lte: Optional[Any] = Field(alias="_lte")
    neq: Optional[Any] = Field(alias="_neq")
    nin: Optional[List[Any]] = Field(alias="_nin")


class group_aggregate_bool_exp(BaseModel):
    count: Optional["group_aggregate_bool_exp_count"]


class group_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[group_select_column]]
    distinct: Optional[bool]
    filter: Optional["group_bool_exp"]
    predicate: "Int_comparison_exp"


class group_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["group_max_order_by"]
    min: Optional["group_min_order_by"]


class group_arr_rel_insert_input(BaseModel):
    data: List["group_insert_input"]
    on_conflict: Optional["group_on_conflict"]


class group_bool_exp(BaseModel):
    and_: Optional[List["group_bool_exp"]] = Field(alias="_and")
    not_: Optional["group_bool_exp"] = Field(alias="_not")
    or_: Optional[List["group_bool_exp"]] = Field(alias="_or")
    company: Optional["company_bool_exp"]
    company_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    name: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class group_insert_input(BaseModel):
    company: Optional["company_obj_rel_insert_input"]
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    updated_at: Optional[Any]


class group_max_order_by(BaseModel):
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]
    updated_at: Optional[order_by]


class group_min_order_by(BaseModel):
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]
    updated_at: Optional[order_by]


class group_on_conflict(BaseModel):
    constraint: group_constraint
    update_columns: List[group_update_column]
    where: Optional["group_bool_exp"]


class group_order_by(BaseModel):
    company: Optional["company_order_by"]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]
    updated_at: Optional[order_by]


class group_pk_columns_input(BaseModel):
    id: Any


class group_set_input(BaseModel):
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    updated_at: Optional[Any]


class group_stream_cursor_input(BaseModel):
    initial_value: "group_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class group_stream_cursor_value_input(BaseModel):
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    updated_at: Optional[Any]


class group_updates(BaseModel):
    set: Optional["group_set_input"] = Field(alias="_set")
    where: "group_bool_exp"


class jsonb_cast_exp(BaseModel):
    string: Optional["String_comparison_exp"] = Field(alias="String")


class jsonb_comparison_exp(BaseModel):
    cast: Optional["jsonb_cast_exp"] = Field(alias="_cast")
    contained_in: Optional[Any] = Field(alias="_contained_in")
    contains: Optional[Any] = Field(alias="_contains")
    eq: Optional[Any] = Field(alias="_eq")
    gt: Optional[Any] = Field(alias="_gt")
    gte: Optional[Any] = Field(alias="_gte")
    has_key: Optional[str] = Field(alias="_has_key")
    has_keys_all: Optional[List[str]] = Field(alias="_has_keys_all")
    has_keys_any: Optional[List[str]] = Field(alias="_has_keys_any")
    in_: Optional[List[Any]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    lt: Optional[Any] = Field(alias="_lt")
    lte: Optional[Any] = Field(alias="_lte")
    neq: Optional[Any] = Field(alias="_neq")
    nin: Optional[List[Any]] = Field(alias="_nin")


class llm_training_bool_exp(BaseModel):
    and_: Optional[List["llm_training_bool_exp"]] = Field(alias="_and")
    not_: Optional["llm_training_bool_exp"] = Field(alias="_not")
    or_: Optional[List["llm_training_bool_exp"]] = Field(alias="_or")
    answer: Optional["String_comparison_exp"]
    company_table: Optional["company_table_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    created_by: Optional["uuid_comparison_exp"]
    custom_definition: Optional["Boolean_comparison_exp"]
    dataset: Optional["dataset_bool_exp"]
    dataset_id: Optional["uuid_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    in_production: Optional["Boolean_comparison_exp"]
    question: Optional["String_comparison_exp"]
    table_id: Optional["uuid_comparison_exp"]
    training_requests: Optional["training_request_bool_exp"]
    training_requests_aggregate: Optional["training_request_aggregate_bool_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    use_for_seed: Optional["Boolean_comparison_exp"]
    user: Optional["user_bool_exp"]
    user_training_questions: Optional["user_training_question_bool_exp"]
    user_training_questions_aggregate: Optional["user_training_question_aggregate_bool_exp"]


class llm_training_insert_input(BaseModel):
    answer: Optional[str]
    company_table: Optional["company_table_obj_rel_insert_input"]
    created_at: Optional[Any]
    created_by: Optional[Any]
    custom_definition: Optional[bool]
    dataset: Optional["dataset_obj_rel_insert_input"]
    dataset_id: Optional[Any]
    id: Optional[Any]
    in_production: Optional[bool]
    question: Optional[str]
    table_id: Optional[Any]
    training_requests: Optional["training_request_arr_rel_insert_input"]
    updated_at: Optional[Any]
    use_for_seed: Optional[bool]
    user: Optional["user_obj_rel_insert_input"]
    user_training_questions: Optional["user_training_question_arr_rel_insert_input"]


class llm_training_obj_rel_insert_input(BaseModel):
    data: "llm_training_insert_input"
    on_conflict: Optional["llm_training_on_conflict"]


class llm_training_on_conflict(BaseModel):
    constraint: llm_training_constraint
    update_columns: List[llm_training_update_column]
    where: Optional["llm_training_bool_exp"]


class llm_training_order_by(BaseModel):
    answer: Optional[order_by]
    company_table: Optional["company_table_order_by"]
    created_at: Optional[order_by]
    created_by: Optional[order_by]
    custom_definition: Optional[order_by]
    dataset: Optional["dataset_order_by"]
    dataset_id: Optional[order_by]
    id: Optional[order_by]
    in_production: Optional[order_by]
    question: Optional[order_by]
    table_id: Optional[order_by]
    training_requests_aggregate: Optional["training_request_aggregate_order_by"]
    updated_at: Optional[order_by]
    use_for_seed: Optional[order_by]
    user: Optional["user_order_by"]
    user_training_questions_aggregate: Optional["user_training_question_aggregate_order_by"]


class llm_training_pk_columns_input(BaseModel):
    id: Any


class llm_training_set_input(BaseModel):
    answer: Optional[str]
    created_at: Optional[Any]
    created_by: Optional[Any]
    custom_definition: Optional[bool]
    dataset_id: Optional[Any]
    id: Optional[Any]
    in_production: Optional[bool]
    question: Optional[str]
    table_id: Optional[Any]
    updated_at: Optional[Any]
    use_for_seed: Optional[bool]


class llm_training_stream_cursor_input(BaseModel):
    initial_value: "llm_training_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class llm_training_stream_cursor_value_input(BaseModel):
    answer: Optional[str]
    created_at: Optional[Any]
    created_by: Optional[Any]
    custom_definition: Optional[bool]
    dataset_id: Optional[Any]
    id: Optional[Any]
    in_production: Optional[bool]
    question: Optional[str]
    table_id: Optional[Any]
    updated_at: Optional[Any]
    use_for_seed: Optional[bool]


class llm_training_updates(BaseModel):
    set: Optional["llm_training_set_input"] = Field(alias="_set")
    where: "llm_training_bool_exp"


class maintenance_kinds_bool_exp(BaseModel):
    and_: Optional[List["maintenance_kinds_bool_exp"]] = Field(alias="_and")
    not_: Optional["maintenance_kinds_bool_exp"] = Field(alias="_not")
    or_: Optional[List["maintenance_kinds_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class maintenance_kinds_enum_comparison_exp(BaseModel):
    eq: Optional[maintenance_kinds_enum] = Field(alias="_eq")
    in_: Optional[List[maintenance_kinds_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[maintenance_kinds_enum] = Field(alias="_neq")
    nin: Optional[List[maintenance_kinds_enum]] = Field(alias="_nin")


class maintenance_kinds_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class maintenance_kinds_obj_rel_insert_input(BaseModel):
    data: "maintenance_kinds_insert_input"
    on_conflict: Optional["maintenance_kinds_on_conflict"]


class maintenance_kinds_on_conflict(BaseModel):
    constraint: maintenance_kinds_constraint
    update_columns: List[maintenance_kinds_update_column]
    where: Optional["maintenance_kinds_bool_exp"]


class maintenance_kinds_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class maintenance_kinds_pk_columns_input(BaseModel):
    value: str


class maintenance_kinds_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class maintenance_kinds_stream_cursor_input(BaseModel):
    initial_value: "maintenance_kinds_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class maintenance_kinds_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class maintenance_kinds_updates(BaseModel):
    set: Optional["maintenance_kinds_set_input"] = Field(alias="_set")
    where: "maintenance_kinds_bool_exp"


class materialization_type_bool_exp(BaseModel):
    and_: Optional[List["materialization_type_bool_exp"]] = Field(alias="_and")
    not_: Optional["materialization_type_bool_exp"] = Field(alias="_not")
    or_: Optional[List["materialization_type_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class materialization_type_enum_comparison_exp(BaseModel):
    eq: Optional[materialization_type_enum] = Field(alias="_eq")
    in_: Optional[List[materialization_type_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[materialization_type_enum] = Field(alias="_neq")
    nin: Optional[List[materialization_type_enum]] = Field(alias="_nin")


class materialization_type_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class materialization_type_on_conflict(BaseModel):
    constraint: materialization_type_constraint
    update_columns: List[materialization_type_update_column]
    where: Optional["materialization_type_bool_exp"]


class materialization_type_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class materialization_type_pk_columns_input(BaseModel):
    value: str


class materialization_type_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class materialization_type_stream_cursor_input(BaseModel):
    initial_value: "materialization_type_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class materialization_type_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class materialization_type_updates(BaseModel):
    set: Optional["materialization_type_set_input"] = Field(alias="_set")
    where: "materialization_type_bool_exp"


class metric_bool_exp(BaseModel):
    and_: Optional[List["metric_bool_exp"]] = Field(alias="_and")
    not_: Optional["metric_bool_exp"] = Field(alias="_not")
    or_: Optional[List["metric_bool_exp"]] = Field(alias="_or")
    actions: Optional["metric_timelines_bool_exp"]
    actions_aggregate: Optional["metric_timelines_aggregate_bool_exp"]
    agg_function: Optional["String_comparison_exp"]
    analyzable: Optional["Boolean_comparison_exp"]
    archived_at: Optional["timestamptz_comparison_exp"]
    column_id: Optional["String_comparison_exp"]
    company: Optional["company_bool_exp"]
    company_id: Optional["uuid_comparison_exp"]
    company_table: Optional["company_table_bool_exp"]
    company_task: Optional["company_task_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    created_by: Optional["uuid_comparison_exp"]
    dataset_slug: Optional["String_comparison_exp"]
    datasets: Optional["dataset_bool_exp"]
    datasets_aggregate: Optional["dataset_aggregate_bool_exp"]
    format: Optional["String_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    is_increase: Optional["Boolean_comparison_exp"]
    name: Optional["String_comparison_exp"]
    narratives: Optional["narrative_bool_exp"]
    narratives_aggregate: Optional["narrative_aggregate_bool_exp"]
    status: Optional["status_enum_comparison_exp"]
    table_id: Optional["uuid_comparison_exp"]
    tags: Optional["metric_tags_bool_exp"]
    tags_aggregate: Optional["metric_tags_aggregate_bool_exp"]
    task_id: Optional["uuid_comparison_exp"]
    time_resolution: Optional["String_comparison_exp"]
    time_to_convert_column_id: Optional["String_comparison_exp"]
    unit_name: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    updated_by: Optional["uuid_comparison_exp"]
    updated_by_user: Optional["user_bool_exp"]
    user: Optional["user_bool_exp"]


class metric_insert_input(BaseModel):
    actions: Optional["metric_timelines_arr_rel_insert_input"]
    agg_function: Optional[str]
    analyzable: Optional[bool]
    archived_at: Optional[Any]
    column_id: Optional[str]
    company: Optional["company_obj_rel_insert_input"]
    company_id: Optional[Any]
    company_table: Optional["company_table_obj_rel_insert_input"]
    company_task: Optional["company_task_obj_rel_insert_input"]
    created_at: Optional[Any]
    created_by: Optional[Any]
    dataset_slug: Optional[str]
    datasets: Optional["dataset_arr_rel_insert_input"]
    format: Optional[str]
    id: Optional[Any]
    is_increase: Optional[bool]
    name: Optional[str]
    narratives: Optional["narrative_arr_rel_insert_input"]
    status: Optional[status_enum]
    table_id: Optional[Any]
    tags: Optional["metric_tags_arr_rel_insert_input"]
    task_id: Optional[Any]
    time_resolution: Optional[str]
    time_to_convert_column_id: Optional[str]
    unit_name: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[Any]
    updated_by_user: Optional["user_obj_rel_insert_input"]
    user: Optional["user_obj_rel_insert_input"]


class metric_obj_rel_insert_input(BaseModel):
    data: "metric_insert_input"
    on_conflict: Optional["metric_on_conflict"]


class metric_on_conflict(BaseModel):
    constraint: metric_constraint
    update_columns: List[metric_update_column]
    where: Optional["metric_bool_exp"]


class metric_order_by(BaseModel):
    actions_aggregate: Optional["metric_timelines_aggregate_order_by"]
    agg_function: Optional[order_by]
    analyzable: Optional[order_by]
    archived_at: Optional[order_by]
    column_id: Optional[order_by]
    company: Optional["company_order_by"]
    company_id: Optional[order_by]
    company_table: Optional["company_table_order_by"]
    company_task: Optional["company_task_order_by"]
    created_at: Optional[order_by]
    created_by: Optional[order_by]
    dataset_slug: Optional[order_by]
    datasets_aggregate: Optional["dataset_aggregate_order_by"]
    format: Optional[order_by]
    id: Optional[order_by]
    is_increase: Optional[order_by]
    name: Optional[order_by]
    narratives_aggregate: Optional["narrative_aggregate_order_by"]
    status: Optional[order_by]
    table_id: Optional[order_by]
    tags_aggregate: Optional["metric_tags_aggregate_order_by"]
    task_id: Optional[order_by]
    time_resolution: Optional[order_by]
    time_to_convert_column_id: Optional[order_by]
    unit_name: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]
    updated_by_user: Optional["user_order_by"]
    user: Optional["user_order_by"]


class metric_pk_columns_input(BaseModel):
    id: Any


class metric_set_input(BaseModel):
    agg_function: Optional[str]
    analyzable: Optional[bool]
    archived_at: Optional[Any]
    column_id: Optional[str]
    company_id: Optional[Any]
    created_at: Optional[Any]
    created_by: Optional[Any]
    dataset_slug: Optional[str]
    format: Optional[str]
    id: Optional[Any]
    is_increase: Optional[bool]
    name: Optional[str]
    status: Optional[status_enum]
    table_id: Optional[Any]
    task_id: Optional[Any]
    time_resolution: Optional[str]
    time_to_convert_column_id: Optional[str]
    unit_name: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[Any]


class metric_stream_cursor_input(BaseModel):
    initial_value: "metric_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class metric_stream_cursor_value_input(BaseModel):
    agg_function: Optional[str]
    analyzable: Optional[bool]
    archived_at: Optional[Any]
    column_id: Optional[str]
    company_id: Optional[Any]
    created_at: Optional[Any]
    created_by: Optional[Any]
    dataset_slug: Optional[str]
    format: Optional[str]
    id: Optional[Any]
    is_increase: Optional[bool]
    name: Optional[str]
    status: Optional[status_enum]
    table_id: Optional[Any]
    task_id: Optional[Any]
    time_resolution: Optional[str]
    time_to_convert_column_id: Optional[str]
    unit_name: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[Any]


class metric_tags_aggregate_bool_exp(BaseModel):
    count: Optional["metric_tags_aggregate_bool_exp_count"]


class metric_tags_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[metric_tags_select_column]]
    distinct: Optional[bool]
    filter: Optional["metric_tags_bool_exp"]
    predicate: "Int_comparison_exp"


class metric_tags_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["metric_tags_max_order_by"]
    min: Optional["metric_tags_min_order_by"]


class metric_tags_arr_rel_insert_input(BaseModel):
    data: List["metric_tags_insert_input"]


class metric_tags_bool_exp(BaseModel):
    and_: Optional[List["metric_tags_bool_exp"]] = Field(alias="_and")
    not_: Optional["metric_tags_bool_exp"] = Field(alias="_not")
    or_: Optional[List["metric_tags_bool_exp"]] = Field(alias="_or")
    company_tag: Optional["company_tags_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    metric: Optional["metric_bool_exp"]
    metric_id: Optional["uuid_comparison_exp"]
    tag_id: Optional["uuid_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class metric_tags_insert_input(BaseModel):
    company_tag: Optional["company_tags_obj_rel_insert_input"]
    created_at: Optional[Any]
    id: Optional[Any]
    metric: Optional["metric_obj_rel_insert_input"]
    metric_id: Optional[Any]
    tag_id: Optional[Any]
    updated_at: Optional[Any]


class metric_tags_max_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    metric_id: Optional[order_by]
    tag_id: Optional[order_by]
    updated_at: Optional[order_by]


class metric_tags_min_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    metric_id: Optional[order_by]
    tag_id: Optional[order_by]
    updated_at: Optional[order_by]


class metric_tags_order_by(BaseModel):
    company_tag: Optional["company_tags_order_by"]
    created_at: Optional[order_by]
    id: Optional[order_by]
    metric: Optional["metric_order_by"]
    metric_id: Optional[order_by]
    tag_id: Optional[order_by]
    updated_at: Optional[order_by]


class metric_tags_set_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    metric_id: Optional[Any]
    tag_id: Optional[Any]
    updated_at: Optional[Any]


class metric_tags_stream_cursor_input(BaseModel):
    initial_value: "metric_tags_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class metric_tags_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    metric_id: Optional[Any]
    tag_id: Optional[Any]
    updated_at: Optional[Any]


class metric_tags_updates(BaseModel):
    set: Optional["metric_tags_set_input"] = Field(alias="_set")
    where: "metric_tags_bool_exp"


class metric_timelines_aggregate_bool_exp(BaseModel):
    count: Optional["metric_timelines_aggregate_bool_exp_count"]


class metric_timelines_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[metric_timelines_select_column]]
    distinct: Optional[bool]
    filter: Optional["metric_timelines_bool_exp"]
    predicate: "Int_comparison_exp"


class metric_timelines_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["metric_timelines_max_order_by"]
    min: Optional["metric_timelines_min_order_by"]


class metric_timelines_arr_rel_insert_input(BaseModel):
    data: List["metric_timelines_insert_input"]


class metric_timelines_bool_exp(BaseModel):
    and_: Optional[List["metric_timelines_bool_exp"]] = Field(alias="_and")
    not_: Optional["metric_timelines_bool_exp"] = Field(alias="_not")
    or_: Optional[List["metric_timelines_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    description: Optional["String_comparison_exp"]
    happened_at: Optional["date_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    name: Optional["String_comparison_exp"]
    related_to: Optional["String_comparison_exp"]
    related_to_id: Optional["uuid_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class metric_timelines_insert_input(BaseModel):
    created_at: Optional[Any]
    description: Optional[str]
    happened_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    related_to: Optional[str]
    related_to_id: Optional[Any]
    updated_at: Optional[Any]


class metric_timelines_max_order_by(BaseModel):
    created_at: Optional[order_by]
    description: Optional[order_by]
    happened_at: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]
    related_to: Optional[order_by]
    related_to_id: Optional[order_by]
    updated_at: Optional[order_by]


class metric_timelines_min_order_by(BaseModel):
    created_at: Optional[order_by]
    description: Optional[order_by]
    happened_at: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]
    related_to: Optional[order_by]
    related_to_id: Optional[order_by]
    updated_at: Optional[order_by]


class metric_timelines_order_by(BaseModel):
    created_at: Optional[order_by]
    description: Optional[order_by]
    happened_at: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]
    related_to: Optional[order_by]
    related_to_id: Optional[order_by]
    updated_at: Optional[order_by]


class metric_timelines_set_input(BaseModel):
    created_at: Optional[Any]
    description: Optional[str]
    happened_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    related_to: Optional[str]
    related_to_id: Optional[Any]
    updated_at: Optional[Any]


class metric_timelines_stream_cursor_input(BaseModel):
    initial_value: "metric_timelines_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class metric_timelines_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    description: Optional[str]
    happened_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    related_to: Optional[str]
    related_to_id: Optional[Any]
    updated_at: Optional[Any]


class metric_timelines_updates(BaseModel):
    set: Optional["metric_timelines_set_input"] = Field(alias="_set")
    where: "metric_timelines_bool_exp"


class metric_updates(BaseModel):
    set: Optional["metric_set_input"] = Field(alias="_set")
    where: "metric_bool_exp"


class narrative_aggregate_bool_exp(BaseModel):
    count: Optional["narrative_aggregate_bool_exp_count"]


class narrative_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[narrative_select_column]]
    distinct: Optional[bool]
    filter: Optional["narrative_bool_exp"]
    predicate: "Int_comparison_exp"


class narrative_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["narrative_max_order_by"]
    min: Optional["narrative_min_order_by"]


class narrative_arr_rel_insert_input(BaseModel):
    data: List["narrative_insert_input"]
    on_conflict: Optional["narrative_on_conflict"]


class narrative_bool_exp(BaseModel):
    and_: Optional[List["narrative_bool_exp"]] = Field(alias="_and")
    not_: Optional["narrative_bool_exp"] = Field(alias="_not")
    or_: Optional[List["narrative_bool_exp"]] = Field(alias="_or")
    actions: Optional["narrative_company_timelines_bool_exp"]
    actions_aggregate: Optional["narrative_company_timelines_aggregate_bool_exp"]
    category_id: Optional["uuid_comparison_exp"]
    company: Optional["company_bool_exp"]
    company_category: Optional["company_categories_bool_exp"]
    company_id: Optional["uuid_comparison_exp"]
    company_task: Optional["company_task_bool_exp"]
    compiled_versions: Optional["compiled_narratives_bool_exp"]
    compiled_versions_aggregate: Optional["compiled_narratives_aggregate_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    created_by: Optional["uuid_comparison_exp"]
    dependent_narratives: Optional["narrative_narratives_bool_exp"]
    dependent_narratives_aggregate: Optional["narrative_narratives_aggregate_bool_exp"]
    description: Optional["String_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    integrations: Optional["narrative_integrations_bool_exp"]
    integrations_aggregate: Optional["narrative_integrations_aggregate_bool_exp"]
    last_config_updated_at: Optional["timestamptz_comparison_exp"]
    last_viewed_at: Optional["timestamptz_comparison_exp"]
    metric: Optional["metric_bool_exp"]
    metric_id: Optional["uuid_comparison_exp"]
    name: Optional["String_comparison_exp"]
    narrative_datasets: Optional["narrative_datasets_bool_exp"]
    narrative_datasets_aggregate: Optional["narrative_datasets_aggregate_bool_exp"]
    narrative_runs: Optional["narrative_runs_bool_exp"]
    narrative_runs_aggregate: Optional["narrative_runs_aggregate_bool_exp"]
    requested_by: Optional["uuid_comparison_exp"]
    requested_by_user: Optional["user_bool_exp"]
    slug: Optional["String_comparison_exp"]
    snapshot_updated_at: Optional["timestamptz_comparison_exp"]
    state: Optional["status_enum_comparison_exp"]
    tags: Optional["narrative_tags_bool_exp"]
    tags_aggregate: Optional["narrative_tags_aggregate_bool_exp"]
    task_id: Optional["uuid_comparison_exp"]
    team_permissions: Optional["narrative_team_permissions_bool_exp"]
    team_permissions_aggregate: Optional["narrative_team_permissions_aggregate_bool_exp"]
    template_id: Optional["uuid_comparison_exp"]
    type: Optional["narrative_types_enum_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    updated_by: Optional["uuid_comparison_exp"]
    updated_by_user: Optional["user_bool_exp"]
    user: Optional["user_bool_exp"]
    versions: Optional["narrative_versions_bool_exp"]
    versions_aggregate: Optional["narrative_versions_aggregate_bool_exp"]


class narrative_company_timelines_aggregate_bool_exp(BaseModel):
    count: Optional["narrative_company_timelines_aggregate_bool_exp_count"]


class narrative_company_timelines_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[narrative_company_timelines_select_column]]
    distinct: Optional[bool]
    filter: Optional["narrative_company_timelines_bool_exp"]
    predicate: "Int_comparison_exp"


class narrative_company_timelines_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["narrative_company_timelines_max_order_by"]
    min: Optional["narrative_company_timelines_min_order_by"]


class narrative_company_timelines_arr_rel_insert_input(BaseModel):
    data: List["narrative_company_timelines_insert_input"]


class narrative_company_timelines_bool_exp(BaseModel):
    and_: Optional[List["narrative_company_timelines_bool_exp"]] = Field(alias="_and")
    not_: Optional["narrative_company_timelines_bool_exp"] = Field(alias="_not")
    or_: Optional[List["narrative_company_timelines_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    description: Optional["String_comparison_exp"]
    happened_at: Optional["date_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    name: Optional["String_comparison_exp"]
    narrative: Optional["narrative_bool_exp"]
    related_to: Optional["String_comparison_exp"]
    related_to_id: Optional["uuid_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class narrative_company_timelines_insert_input(BaseModel):
    created_at: Optional[Any]
    description: Optional[str]
    happened_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    narrative: Optional["narrative_obj_rel_insert_input"]
    related_to: Optional[str]
    related_to_id: Optional[Any]
    updated_at: Optional[Any]


class narrative_company_timelines_max_order_by(BaseModel):
    created_at: Optional[order_by]
    description: Optional[order_by]
    happened_at: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]
    related_to: Optional[order_by]
    related_to_id: Optional[order_by]
    updated_at: Optional[order_by]


class narrative_company_timelines_min_order_by(BaseModel):
    created_at: Optional[order_by]
    description: Optional[order_by]
    happened_at: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]
    related_to: Optional[order_by]
    related_to_id: Optional[order_by]
    updated_at: Optional[order_by]


class narrative_company_timelines_order_by(BaseModel):
    created_at: Optional[order_by]
    description: Optional[order_by]
    happened_at: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]
    narrative: Optional["narrative_order_by"]
    related_to: Optional[order_by]
    related_to_id: Optional[order_by]
    updated_at: Optional[order_by]


class narrative_company_timelines_set_input(BaseModel):
    created_at: Optional[Any]
    description: Optional[str]
    happened_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    related_to: Optional[str]
    related_to_id: Optional[Any]
    updated_at: Optional[Any]


class narrative_company_timelines_stream_cursor_input(BaseModel):
    initial_value: "narrative_company_timelines_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class narrative_company_timelines_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    description: Optional[str]
    happened_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    related_to: Optional[str]
    related_to_id: Optional[Any]
    updated_at: Optional[Any]


class narrative_company_timelines_updates(BaseModel):
    set: Optional["narrative_company_timelines_set_input"] = Field(alias="_set")
    where: "narrative_company_timelines_bool_exp"


class narrative_datasets_aggregate_bool_exp(BaseModel):
    count: Optional["narrative_datasets_aggregate_bool_exp_count"]


class narrative_datasets_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[narrative_datasets_select_column]]
    distinct: Optional[bool]
    filter: Optional["narrative_datasets_bool_exp"]
    predicate: "Int_comparison_exp"


class narrative_datasets_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["narrative_datasets_max_order_by"]
    min: Optional["narrative_datasets_min_order_by"]


class narrative_datasets_arr_rel_insert_input(BaseModel):
    data: List["narrative_datasets_insert_input"]
    on_conflict: Optional["narrative_datasets_on_conflict"]


class narrative_datasets_bool_exp(BaseModel):
    and_: Optional[List["narrative_datasets_bool_exp"]] = Field(alias="_and")
    not_: Optional["narrative_datasets_bool_exp"] = Field(alias="_not")
    or_: Optional[List["narrative_datasets_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    dataset: Optional["dataset_bool_exp"]
    dataset_id: Optional["uuid_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    narrative: Optional["narrative_bool_exp"]
    narrative_id: Optional["uuid_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class narrative_datasets_insert_input(BaseModel):
    created_at: Optional[Any]
    dataset: Optional["dataset_obj_rel_insert_input"]
    dataset_id: Optional[Any]
    id: Optional[Any]
    narrative: Optional["narrative_obj_rel_insert_input"]
    narrative_id: Optional[Any]
    updated_at: Optional[Any]


class narrative_datasets_max_order_by(BaseModel):
    created_at: Optional[order_by]
    dataset_id: Optional[order_by]
    id: Optional[order_by]
    narrative_id: Optional[order_by]
    updated_at: Optional[order_by]


class narrative_datasets_min_order_by(BaseModel):
    created_at: Optional[order_by]
    dataset_id: Optional[order_by]
    id: Optional[order_by]
    narrative_id: Optional[order_by]
    updated_at: Optional[order_by]


class narrative_datasets_on_conflict(BaseModel):
    constraint: narrative_datasets_constraint
    update_columns: List[narrative_datasets_update_column]
    where: Optional["narrative_datasets_bool_exp"]


class narrative_datasets_order_by(BaseModel):
    created_at: Optional[order_by]
    dataset: Optional["dataset_order_by"]
    dataset_id: Optional[order_by]
    id: Optional[order_by]
    narrative: Optional["narrative_order_by"]
    narrative_id: Optional[order_by]
    updated_at: Optional[order_by]


class narrative_datasets_pk_columns_input(BaseModel):
    id: Any


class narrative_datasets_set_input(BaseModel):
    created_at: Optional[Any]
    dataset_id: Optional[Any]
    id: Optional[Any]
    narrative_id: Optional[Any]
    updated_at: Optional[Any]


class narrative_datasets_stream_cursor_input(BaseModel):
    initial_value: "narrative_datasets_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class narrative_datasets_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    dataset_id: Optional[Any]
    id: Optional[Any]
    narrative_id: Optional[Any]
    updated_at: Optional[Any]


class narrative_datasets_updates(BaseModel):
    set: Optional["narrative_datasets_set_input"] = Field(alias="_set")
    where: "narrative_datasets_bool_exp"


class narrative_insert_input(BaseModel):
    actions: Optional["narrative_company_timelines_arr_rel_insert_input"]
    category_id: Optional[Any]
    company: Optional["company_obj_rel_insert_input"]
    company_category: Optional["company_categories_obj_rel_insert_input"]
    company_id: Optional[Any]
    company_task: Optional["company_task_obj_rel_insert_input"]
    compiled_versions: Optional["compiled_narratives_arr_rel_insert_input"]
    created_at: Optional[Any]
    created_by: Optional[Any]
    dependent_narratives: Optional["narrative_narratives_arr_rel_insert_input"]
    description: Optional[str]
    id: Optional[Any]
    integrations: Optional["narrative_integrations_arr_rel_insert_input"]
    last_config_updated_at: Optional[Any]
    last_viewed_at: Optional[Any]
    metric: Optional["metric_obj_rel_insert_input"]
    metric_id: Optional[Any]
    name: Optional[str]
    narrative_datasets: Optional["narrative_datasets_arr_rel_insert_input"]
    narrative_runs: Optional["narrative_runs_arr_rel_insert_input"]
    requested_by: Optional[Any]
    requested_by_user: Optional["user_obj_rel_insert_input"]
    slug: Optional[str]
    snapshot_updated_at: Optional[Any]
    state: Optional[status_enum]
    tags: Optional["narrative_tags_arr_rel_insert_input"]
    task_id: Optional[Any]
    team_permissions: Optional["narrative_team_permissions_arr_rel_insert_input"]
    template_id: Optional[Any]
    type: Optional[narrative_types_enum]
    updated_at: Optional[Any]
    updated_by: Optional[Any]
    updated_by_user: Optional["user_obj_rel_insert_input"]
    user: Optional["user_obj_rel_insert_input"]
    versions: Optional["narrative_versions_arr_rel_insert_input"]


class narrative_integration_kind_bool_exp(BaseModel):
    and_: Optional[List["narrative_integration_kind_bool_exp"]] = Field(alias="_and")
    not_: Optional["narrative_integration_kind_bool_exp"] = Field(alias="_not")
    or_: Optional[List["narrative_integration_kind_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class narrative_integration_kind_enum_comparison_exp(BaseModel):
    eq: Optional[narrative_integration_kind_enum] = Field(alias="_eq")
    in_: Optional[List[narrative_integration_kind_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[narrative_integration_kind_enum] = Field(alias="_neq")
    nin: Optional[List[narrative_integration_kind_enum]] = Field(alias="_nin")


class narrative_integration_kind_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class narrative_integration_kind_on_conflict(BaseModel):
    constraint: narrative_integration_kind_constraint
    update_columns: List[narrative_integration_kind_update_column]
    where: Optional["narrative_integration_kind_bool_exp"]


class narrative_integration_kind_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class narrative_integration_kind_pk_columns_input(BaseModel):
    value: str


class narrative_integration_kind_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class narrative_integration_kind_stream_cursor_input(BaseModel):
    initial_value: "narrative_integration_kind_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class narrative_integration_kind_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class narrative_integration_kind_updates(BaseModel):
    set: Optional["narrative_integration_kind_set_input"] = Field(alias="_set")
    where: "narrative_integration_kind_bool_exp"


class narrative_integrations_aggregate_bool_exp(BaseModel):
    count: Optional["narrative_integrations_aggregate_bool_exp_count"]


class narrative_integrations_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[narrative_integrations_select_column]]
    distinct: Optional[bool]
    filter: Optional["narrative_integrations_bool_exp"]
    predicate: "Int_comparison_exp"


class narrative_integrations_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["narrative_integrations_max_order_by"]
    min: Optional["narrative_integrations_min_order_by"]


class narrative_integrations_arr_rel_insert_input(BaseModel):
    data: List["narrative_integrations_insert_input"]
    on_conflict: Optional["narrative_integrations_on_conflict"]


class narrative_integrations_bool_exp(BaseModel):
    and_: Optional[List["narrative_integrations_bool_exp"]] = Field(alias="_and")
    not_: Optional["narrative_integrations_bool_exp"] = Field(alias="_not")
    or_: Optional[List["narrative_integrations_bool_exp"]] = Field(alias="_or")
    company_task: Optional["company_task_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    kind: Optional["narrative_integration_kind_enum_comparison_exp"]
    narrative: Optional["narrative_bool_exp"]
    narrative_id: Optional["uuid_comparison_exp"]
    task_id: Optional["uuid_comparison_exp"]


class narrative_integrations_insert_input(BaseModel):
    company_task: Optional["company_task_obj_rel_insert_input"]
    created_at: Optional[Any]
    id: Optional[Any]
    kind: Optional[narrative_integration_kind_enum]
    narrative: Optional["narrative_obj_rel_insert_input"]
    narrative_id: Optional[Any]
    task_id: Optional[Any]


class narrative_integrations_max_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    narrative_id: Optional[order_by]
    task_id: Optional[order_by]


class narrative_integrations_min_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    narrative_id: Optional[order_by]
    task_id: Optional[order_by]


class narrative_integrations_on_conflict(BaseModel):
    constraint: narrative_integrations_constraint
    update_columns: List[narrative_integrations_update_column]
    where: Optional["narrative_integrations_bool_exp"]


class narrative_integrations_order_by(BaseModel):
    company_task: Optional["company_task_order_by"]
    created_at: Optional[order_by]
    id: Optional[order_by]
    kind: Optional[order_by]
    narrative: Optional["narrative_order_by"]
    narrative_id: Optional[order_by]
    task_id: Optional[order_by]


class narrative_integrations_pk_columns_input(BaseModel):
    id: Any


class narrative_integrations_set_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    kind: Optional[narrative_integration_kind_enum]
    narrative_id: Optional[Any]
    task_id: Optional[Any]


class narrative_integrations_stream_cursor_input(BaseModel):
    initial_value: "narrative_integrations_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class narrative_integrations_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    kind: Optional[narrative_integration_kind_enum]
    narrative_id: Optional[Any]
    task_id: Optional[Any]


class narrative_integrations_updates(BaseModel):
    set: Optional["narrative_integrations_set_input"] = Field(alias="_set")
    where: "narrative_integrations_bool_exp"


class narrative_max_order_by(BaseModel):
    category_id: Optional[order_by]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    created_by: Optional[order_by]
    description: Optional[order_by]
    id: Optional[order_by]
    last_config_updated_at: Optional[order_by]
    last_viewed_at: Optional[order_by]
    metric_id: Optional[order_by]
    name: Optional[order_by]
    requested_by: Optional[order_by]
    slug: Optional[order_by]
    snapshot_updated_at: Optional[order_by]
    task_id: Optional[order_by]
    template_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class narrative_min_order_by(BaseModel):
    category_id: Optional[order_by]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    created_by: Optional[order_by]
    description: Optional[order_by]
    id: Optional[order_by]
    last_config_updated_at: Optional[order_by]
    last_viewed_at: Optional[order_by]
    metric_id: Optional[order_by]
    name: Optional[order_by]
    requested_by: Optional[order_by]
    slug: Optional[order_by]
    snapshot_updated_at: Optional[order_by]
    task_id: Optional[order_by]
    template_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class narrative_narratives_aggregate_bool_exp(BaseModel):
    count: Optional["narrative_narratives_aggregate_bool_exp_count"]


class narrative_narratives_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[narrative_narratives_select_column]]
    distinct: Optional[bool]
    filter: Optional["narrative_narratives_bool_exp"]
    predicate: "Int_comparison_exp"


class narrative_narratives_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["narrative_narratives_max_order_by"]
    min: Optional["narrative_narratives_min_order_by"]


class narrative_narratives_arr_rel_insert_input(BaseModel):
    data: List["narrative_narratives_insert_input"]
    on_conflict: Optional["narrative_narratives_on_conflict"]


class narrative_narratives_bool_exp(BaseModel):
    and_: Optional[List["narrative_narratives_bool_exp"]] = Field(alias="_and")
    not_: Optional["narrative_narratives_bool_exp"] = Field(alias="_not")
    or_: Optional[List["narrative_narratives_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    depends_on_narrative: Optional["narrative_bool_exp"]
    depends_on_narrative_id: Optional["uuid_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    narrative: Optional["narrative_bool_exp"]
    narrative_id: Optional["uuid_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class narrative_narratives_insert_input(BaseModel):
    created_at: Optional[Any]
    depends_on_narrative: Optional["narrative_obj_rel_insert_input"]
    depends_on_narrative_id: Optional[Any]
    id: Optional[Any]
    narrative: Optional["narrative_obj_rel_insert_input"]
    narrative_id: Optional[Any]
    updated_at: Optional[Any]


class narrative_narratives_max_order_by(BaseModel):
    created_at: Optional[order_by]
    depends_on_narrative_id: Optional[order_by]
    id: Optional[order_by]
    narrative_id: Optional[order_by]
    updated_at: Optional[order_by]


class narrative_narratives_min_order_by(BaseModel):
    created_at: Optional[order_by]
    depends_on_narrative_id: Optional[order_by]
    id: Optional[order_by]
    narrative_id: Optional[order_by]
    updated_at: Optional[order_by]


class narrative_narratives_on_conflict(BaseModel):
    constraint: narrative_narratives_constraint
    update_columns: List[narrative_narratives_update_column]
    where: Optional["narrative_narratives_bool_exp"]


class narrative_narratives_order_by(BaseModel):
    created_at: Optional[order_by]
    depends_on_narrative: Optional["narrative_order_by"]
    depends_on_narrative_id: Optional[order_by]
    id: Optional[order_by]
    narrative: Optional["narrative_order_by"]
    narrative_id: Optional[order_by]
    updated_at: Optional[order_by]


class narrative_narratives_pk_columns_input(BaseModel):
    id: Any


class narrative_narratives_set_input(BaseModel):
    created_at: Optional[Any]
    depends_on_narrative_id: Optional[Any]
    id: Optional[Any]
    narrative_id: Optional[Any]
    updated_at: Optional[Any]


class narrative_narratives_stream_cursor_input(BaseModel):
    initial_value: "narrative_narratives_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class narrative_narratives_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    depends_on_narrative_id: Optional[Any]
    id: Optional[Any]
    narrative_id: Optional[Any]
    updated_at: Optional[Any]


class narrative_narratives_updates(BaseModel):
    set: Optional["narrative_narratives_set_input"] = Field(alias="_set")
    where: "narrative_narratives_bool_exp"


class narrative_obj_rel_insert_input(BaseModel):
    data: "narrative_insert_input"
    on_conflict: Optional["narrative_on_conflict"]


class narrative_on_conflict(BaseModel):
    constraint: narrative_constraint
    update_columns: List[narrative_update_column]
    where: Optional["narrative_bool_exp"]


class narrative_order_by(BaseModel):
    actions_aggregate: Optional["narrative_company_timelines_aggregate_order_by"]
    category_id: Optional[order_by]
    company: Optional["company_order_by"]
    company_category: Optional["company_categories_order_by"]
    company_id: Optional[order_by]
    company_task: Optional["company_task_order_by"]
    compiled_versions_aggregate: Optional["compiled_narratives_aggregate_order_by"]
    created_at: Optional[order_by]
    created_by: Optional[order_by]
    dependent_narratives_aggregate: Optional["narrative_narratives_aggregate_order_by"]
    description: Optional[order_by]
    id: Optional[order_by]
    integrations_aggregate: Optional["narrative_integrations_aggregate_order_by"]
    last_config_updated_at: Optional[order_by]
    last_viewed_at: Optional[order_by]
    metric: Optional["metric_order_by"]
    metric_id: Optional[order_by]
    name: Optional[order_by]
    narrative_datasets_aggregate: Optional["narrative_datasets_aggregate_order_by"]
    narrative_runs_aggregate: Optional["narrative_runs_aggregate_order_by"]
    requested_by: Optional[order_by]
    requested_by_user: Optional["user_order_by"]
    slug: Optional[order_by]
    snapshot_updated_at: Optional[order_by]
    state: Optional[order_by]
    tags_aggregate: Optional["narrative_tags_aggregate_order_by"]
    task_id: Optional[order_by]
    team_permissions_aggregate: Optional["narrative_team_permissions_aggregate_order_by"]
    template_id: Optional[order_by]
    type: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]
    updated_by_user: Optional["user_order_by"]
    user: Optional["user_order_by"]
    versions_aggregate: Optional["narrative_versions_aggregate_order_by"]


class narrative_pk_columns_input(BaseModel):
    id: Any


class narrative_runs_aggregate_bool_exp(BaseModel):
    avg: Optional["narrative_runs_aggregate_bool_exp_avg"]
    bool_and: Optional["narrative_runs_aggregate_bool_exp_bool_and"]
    bool_or: Optional["narrative_runs_aggregate_bool_exp_bool_or"]
    corr: Optional["narrative_runs_aggregate_bool_exp_corr"]
    count: Optional["narrative_runs_aggregate_bool_exp_count"]
    covar_samp: Optional["narrative_runs_aggregate_bool_exp_covar_samp"]
    max: Optional["narrative_runs_aggregate_bool_exp_max"]
    min: Optional["narrative_runs_aggregate_bool_exp_min"]
    stddev_samp: Optional["narrative_runs_aggregate_bool_exp_stddev_samp"]
    sum: Optional["narrative_runs_aggregate_bool_exp_sum"]
    var_samp: Optional["narrative_runs_aggregate_bool_exp_var_samp"]


class narrative_runs_aggregate_bool_exp_avg(BaseModel):
    arguments: narrative_runs_select_column_narrative_runs_aggregate_bool_exp_avg_arguments_columns
    distinct: Optional[bool]
    filter: Optional["narrative_runs_bool_exp"]
    predicate: "float8_comparison_exp"


class narrative_runs_aggregate_bool_exp_bool_and(BaseModel):
    arguments: narrative_runs_select_column_narrative_runs_aggregate_bool_exp_bool_and_arguments_columns
    distinct: Optional[bool]
    filter: Optional["narrative_runs_bool_exp"]
    predicate: "Boolean_comparison_exp"


class narrative_runs_aggregate_bool_exp_bool_or(BaseModel):
    arguments: narrative_runs_select_column_narrative_runs_aggregate_bool_exp_bool_or_arguments_columns
    distinct: Optional[bool]
    filter: Optional["narrative_runs_bool_exp"]
    predicate: "Boolean_comparison_exp"


class narrative_runs_aggregate_bool_exp_corr(BaseModel):
    arguments: "narrative_runs_aggregate_bool_exp_corr_arguments"
    distinct: Optional[bool]
    filter: Optional["narrative_runs_bool_exp"]
    predicate: "float8_comparison_exp"


class narrative_runs_aggregate_bool_exp_corr_arguments(BaseModel):
    x: narrative_runs_select_column_narrative_runs_aggregate_bool_exp_corr_arguments_columns = Field(alias="X")
    y: narrative_runs_select_column_narrative_runs_aggregate_bool_exp_corr_arguments_columns = Field(alias="Y")


class narrative_runs_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[narrative_runs_select_column]]
    distinct: Optional[bool]
    filter: Optional["narrative_runs_bool_exp"]
    predicate: "Int_comparison_exp"


class narrative_runs_aggregate_bool_exp_covar_samp(BaseModel):
    arguments: "narrative_runs_aggregate_bool_exp_covar_samp_arguments"
    distinct: Optional[bool]
    filter: Optional["narrative_runs_bool_exp"]
    predicate: "float8_comparison_exp"


class narrative_runs_aggregate_bool_exp_covar_samp_arguments(BaseModel):
    x: narrative_runs_select_column_narrative_runs_aggregate_bool_exp_covar_samp_arguments_columns = Field(alias="X")
    y: narrative_runs_select_column_narrative_runs_aggregate_bool_exp_covar_samp_arguments_columns = Field(alias="Y")


class narrative_runs_aggregate_bool_exp_max(BaseModel):
    arguments: narrative_runs_select_column_narrative_runs_aggregate_bool_exp_max_arguments_columns
    distinct: Optional[bool]
    filter: Optional["narrative_runs_bool_exp"]
    predicate: "float8_comparison_exp"


class narrative_runs_aggregate_bool_exp_min(BaseModel):
    arguments: narrative_runs_select_column_narrative_runs_aggregate_bool_exp_min_arguments_columns
    distinct: Optional[bool]
    filter: Optional["narrative_runs_bool_exp"]
    predicate: "float8_comparison_exp"


class narrative_runs_aggregate_bool_exp_stddev_samp(BaseModel):
    arguments: narrative_runs_select_column_narrative_runs_aggregate_bool_exp_stddev_samp_arguments_columns
    distinct: Optional[bool]
    filter: Optional["narrative_runs_bool_exp"]
    predicate: "float8_comparison_exp"


class narrative_runs_aggregate_bool_exp_sum(BaseModel):
    arguments: narrative_runs_select_column_narrative_runs_aggregate_bool_exp_sum_arguments_columns
    distinct: Optional[bool]
    filter: Optional["narrative_runs_bool_exp"]
    predicate: "float8_comparison_exp"


class narrative_runs_aggregate_bool_exp_var_samp(BaseModel):
    arguments: narrative_runs_select_column_narrative_runs_aggregate_bool_exp_var_samp_arguments_columns
    distinct: Optional[bool]
    filter: Optional["narrative_runs_bool_exp"]
    predicate: "float8_comparison_exp"


class narrative_runs_aggregate_order_by(BaseModel):
    avg: Optional["narrative_runs_avg_order_by"]
    count: Optional[order_by]
    max: Optional["narrative_runs_max_order_by"]
    min: Optional["narrative_runs_min_order_by"]
    stddev: Optional["narrative_runs_stddev_order_by"]
    stddev_pop: Optional["narrative_runs_stddev_pop_order_by"]
    stddev_samp: Optional["narrative_runs_stddev_samp_order_by"]
    sum: Optional["narrative_runs_sum_order_by"]
    var_pop: Optional["narrative_runs_var_pop_order_by"]
    var_samp: Optional["narrative_runs_var_samp_order_by"]
    variance: Optional["narrative_runs_variance_order_by"]


class narrative_runs_arr_rel_insert_input(BaseModel):
    data: List["narrative_runs_insert_input"]
    on_conflict: Optional["narrative_runs_on_conflict"]


class narrative_runs_avg_order_by(BaseModel):
    potential_lift: Optional[order_by]


class narrative_runs_bool_exp(BaseModel):
    and_: Optional[List["narrative_runs_bool_exp"]] = Field(alias="_and")
    not_: Optional["narrative_runs_bool_exp"] = Field(alias="_not")
    or_: Optional[List["narrative_runs_bool_exp"]] = Field(alias="_or")
    company_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    is_actionable: Optional["Boolean_comparison_exp"]
    narrative: Optional["narrative_bool_exp"]
    narrative_slug: Optional["String_comparison_exp"]
    potential_lift: Optional["float8_comparison_exp"]
    s3_key: Optional["String_comparison_exp"]


class narrative_runs_inc_input(BaseModel):
    potential_lift: Optional[Any]


class narrative_runs_insert_input(BaseModel):
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    is_actionable: Optional[bool]
    narrative: Optional["narrative_obj_rel_insert_input"]
    narrative_slug: Optional[str]
    potential_lift: Optional[Any]
    s3_key: Optional[str]


class narrative_runs_max_order_by(BaseModel):
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    narrative_slug: Optional[order_by]
    potential_lift: Optional[order_by]
    s3_key: Optional[order_by]


class narrative_runs_min_order_by(BaseModel):
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    narrative_slug: Optional[order_by]
    potential_lift: Optional[order_by]
    s3_key: Optional[order_by]


class narrative_runs_on_conflict(BaseModel):
    constraint: narrative_runs_constraint
    update_columns: List[narrative_runs_update_column]
    where: Optional["narrative_runs_bool_exp"]


class narrative_runs_order_by(BaseModel):
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    is_actionable: Optional[order_by]
    narrative: Optional["narrative_order_by"]
    narrative_slug: Optional[order_by]
    potential_lift: Optional[order_by]
    s3_key: Optional[order_by]


class narrative_runs_pk_columns_input(BaseModel):
    id: Any


class narrative_runs_set_input(BaseModel):
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    is_actionable: Optional[bool]
    narrative_slug: Optional[str]
    potential_lift: Optional[Any]
    s3_key: Optional[str]


class narrative_runs_stddev_order_by(BaseModel):
    potential_lift: Optional[order_by]


class narrative_runs_stddev_pop_order_by(BaseModel):
    potential_lift: Optional[order_by]


class narrative_runs_stddev_samp_order_by(BaseModel):
    potential_lift: Optional[order_by]


class narrative_runs_stream_cursor_input(BaseModel):
    initial_value: "narrative_runs_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class narrative_runs_stream_cursor_value_input(BaseModel):
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    is_actionable: Optional[bool]
    narrative_slug: Optional[str]
    potential_lift: Optional[Any]
    s3_key: Optional[str]


class narrative_runs_sum_order_by(BaseModel):
    potential_lift: Optional[order_by]


class narrative_runs_updates(BaseModel):
    inc: Optional["narrative_runs_inc_input"] = Field(alias="_inc")
    set: Optional["narrative_runs_set_input"] = Field(alias="_set")
    where: "narrative_runs_bool_exp"


class narrative_runs_var_pop_order_by(BaseModel):
    potential_lift: Optional[order_by]


class narrative_runs_var_samp_order_by(BaseModel):
    potential_lift: Optional[order_by]


class narrative_runs_variance_order_by(BaseModel):
    potential_lift: Optional[order_by]


class narrative_set_input(BaseModel):
    category_id: Optional[Any]
    company_id: Optional[Any]
    created_at: Optional[Any]
    created_by: Optional[Any]
    description: Optional[str]
    id: Optional[Any]
    last_config_updated_at: Optional[Any]
    last_viewed_at: Optional[Any]
    metric_id: Optional[Any]
    name: Optional[str]
    requested_by: Optional[Any]
    slug: Optional[str]
    snapshot_updated_at: Optional[Any]
    state: Optional[status_enum]
    task_id: Optional[Any]
    template_id: Optional[Any]
    type: Optional[narrative_types_enum]
    updated_at: Optional[Any]
    updated_by: Optional[Any]


class narrative_stream_cursor_input(BaseModel):
    initial_value: "narrative_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class narrative_stream_cursor_value_input(BaseModel):
    category_id: Optional[Any]
    company_id: Optional[Any]
    created_at: Optional[Any]
    created_by: Optional[Any]
    description: Optional[str]
    id: Optional[Any]
    last_config_updated_at: Optional[Any]
    last_viewed_at: Optional[Any]
    metric_id: Optional[Any]
    name: Optional[str]
    requested_by: Optional[Any]
    slug: Optional[str]
    snapshot_updated_at: Optional[Any]
    state: Optional[status_enum]
    task_id: Optional[Any]
    template_id: Optional[Any]
    type: Optional[narrative_types_enum]
    updated_at: Optional[Any]
    updated_by: Optional[Any]


class narrative_tags_aggregate_bool_exp(BaseModel):
    count: Optional["narrative_tags_aggregate_bool_exp_count"]


class narrative_tags_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[narrative_tags_select_column]]
    distinct: Optional[bool]
    filter: Optional["narrative_tags_bool_exp"]
    predicate: "Int_comparison_exp"


class narrative_tags_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["narrative_tags_max_order_by"]
    min: Optional["narrative_tags_min_order_by"]


class narrative_tags_arr_rel_insert_input(BaseModel):
    data: List["narrative_tags_insert_input"]


class narrative_tags_bool_exp(BaseModel):
    and_: Optional[List["narrative_tags_bool_exp"]] = Field(alias="_and")
    not_: Optional["narrative_tags_bool_exp"] = Field(alias="_not")
    or_: Optional[List["narrative_tags_bool_exp"]] = Field(alias="_or")
    company_tag: Optional["company_tags_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    narrative: Optional["narrative_bool_exp"]
    narrative_id: Optional["uuid_comparison_exp"]
    tag_id: Optional["uuid_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class narrative_tags_insert_input(BaseModel):
    company_tag: Optional["company_tags_obj_rel_insert_input"]
    created_at: Optional[Any]
    id: Optional[Any]
    narrative: Optional["narrative_obj_rel_insert_input"]
    narrative_id: Optional[Any]
    tag_id: Optional[Any]
    updated_at: Optional[Any]


class narrative_tags_max_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    narrative_id: Optional[order_by]
    tag_id: Optional[order_by]
    updated_at: Optional[order_by]


class narrative_tags_min_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    narrative_id: Optional[order_by]
    tag_id: Optional[order_by]
    updated_at: Optional[order_by]


class narrative_tags_order_by(BaseModel):
    company_tag: Optional["company_tags_order_by"]
    created_at: Optional[order_by]
    id: Optional[order_by]
    narrative: Optional["narrative_order_by"]
    narrative_id: Optional[order_by]
    tag_id: Optional[order_by]
    updated_at: Optional[order_by]


class narrative_tags_set_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    narrative_id: Optional[Any]
    tag_id: Optional[Any]
    updated_at: Optional[Any]


class narrative_tags_stream_cursor_input(BaseModel):
    initial_value: "narrative_tags_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class narrative_tags_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    narrative_id: Optional[Any]
    tag_id: Optional[Any]
    updated_at: Optional[Any]


class narrative_tags_updates(BaseModel):
    set: Optional["narrative_tags_set_input"] = Field(alias="_set")
    where: "narrative_tags_bool_exp"


class narrative_team_permissions_aggregate_bool_exp(BaseModel):
    bool_and: Optional["narrative_team_permissions_aggregate_bool_exp_bool_and"]
    bool_or: Optional["narrative_team_permissions_aggregate_bool_exp_bool_or"]
    count: Optional["narrative_team_permissions_aggregate_bool_exp_count"]


class narrative_team_permissions_aggregate_bool_exp_bool_and(BaseModel):
    arguments: narrative_team_permissions_select_column_narrative_team_permissions_aggregate_bool_exp_bool_and_arguments_columns
    distinct: Optional[bool]
    filter: Optional["narrative_team_permissions_bool_exp"]
    predicate: "Boolean_comparison_exp"


class narrative_team_permissions_aggregate_bool_exp_bool_or(BaseModel):
    arguments: (
        narrative_team_permissions_select_column_narrative_team_permissions_aggregate_bool_exp_bool_or_arguments_columns
    )
    distinct: Optional[bool]
    filter: Optional["narrative_team_permissions_bool_exp"]
    predicate: "Boolean_comparison_exp"


class narrative_team_permissions_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[narrative_team_permissions_select_column]]
    distinct: Optional[bool]
    filter: Optional["narrative_team_permissions_bool_exp"]
    predicate: "Int_comparison_exp"


class narrative_team_permissions_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["narrative_team_permissions_max_order_by"]
    min: Optional["narrative_team_permissions_min_order_by"]


class narrative_team_permissions_arr_rel_insert_input(BaseModel):
    data: List["narrative_team_permissions_insert_input"]


class narrative_team_permissions_bool_exp(BaseModel):
    and_: Optional[List["narrative_team_permissions_bool_exp"]] = Field(alias="_and")
    not_: Optional["narrative_team_permissions_bool_exp"] = Field(alias="_not")
    or_: Optional[List["narrative_team_permissions_bool_exp"]] = Field(alias="_or")
    can_edit: Optional["Boolean_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    narrative_id: Optional["uuid_comparison_exp"]
    team: Optional["team_bool_exp"]
    team_id: Optional["uuid_comparison_exp"]


class narrative_team_permissions_insert_input(BaseModel):
    can_edit: Optional[bool]
    created_at: Optional[Any]
    id: Optional[Any]
    narrative_id: Optional[Any]
    team: Optional["team_obj_rel_insert_input"]
    team_id: Optional[Any]


class narrative_team_permissions_max_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    narrative_id: Optional[order_by]
    team_id: Optional[order_by]


class narrative_team_permissions_min_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    narrative_id: Optional[order_by]
    team_id: Optional[order_by]


class narrative_team_permissions_order_by(BaseModel):
    can_edit: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    narrative_id: Optional[order_by]
    team: Optional["team_order_by"]
    team_id: Optional[order_by]


class narrative_team_permissions_set_input(BaseModel):
    can_edit: Optional[bool]
    created_at: Optional[Any]
    id: Optional[Any]
    narrative_id: Optional[Any]
    team_id: Optional[Any]


class narrative_team_permissions_stream_cursor_input(BaseModel):
    initial_value: "narrative_team_permissions_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class narrative_team_permissions_stream_cursor_value_input(BaseModel):
    can_edit: Optional[bool]
    created_at: Optional[Any]
    id: Optional[Any]
    narrative_id: Optional[Any]
    team_id: Optional[Any]


class narrative_team_permissions_updates(BaseModel):
    set: Optional["narrative_team_permissions_set_input"] = Field(alias="_set")
    where: "narrative_team_permissions_bool_exp"


class narrative_template_aggregate_bool_exp(BaseModel):
    bool_and: Optional["narrative_template_aggregate_bool_exp_bool_and"]
    bool_or: Optional["narrative_template_aggregate_bool_exp_bool_or"]
    count: Optional["narrative_template_aggregate_bool_exp_count"]


class narrative_template_aggregate_bool_exp_bool_and(BaseModel):
    arguments: narrative_template_select_column_narrative_template_aggregate_bool_exp_bool_and_arguments_columns
    distinct: Optional[bool]
    filter: Optional["narrative_template_bool_exp"]
    predicate: "Boolean_comparison_exp"


class narrative_template_aggregate_bool_exp_bool_or(BaseModel):
    arguments: narrative_template_select_column_narrative_template_aggregate_bool_exp_bool_or_arguments_columns
    distinct: Optional[bool]
    filter: Optional["narrative_template_bool_exp"]
    predicate: "Boolean_comparison_exp"


class narrative_template_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[narrative_template_select_column]]
    distinct: Optional[bool]
    filter: Optional["narrative_template_bool_exp"]
    predicate: "Int_comparison_exp"


class narrative_template_aggregate_order_by(BaseModel):
    avg: Optional["narrative_template_avg_order_by"]
    count: Optional[order_by]
    max: Optional["narrative_template_max_order_by"]
    min: Optional["narrative_template_min_order_by"]
    stddev: Optional["narrative_template_stddev_order_by"]
    stddev_pop: Optional["narrative_template_stddev_pop_order_by"]
    stddev_samp: Optional["narrative_template_stddev_samp_order_by"]
    sum: Optional["narrative_template_sum_order_by"]
    var_pop: Optional["narrative_template_var_pop_order_by"]
    var_samp: Optional["narrative_template_var_samp_order_by"]
    variance: Optional["narrative_template_variance_order_by"]


class narrative_template_arr_rel_insert_input(BaseModel):
    data: List["narrative_template_insert_input"]
    on_conflict: Optional["narrative_template_on_conflict"]


class narrative_template_avg_order_by(BaseModel):
    customer_iteration: Optional[order_by]
    display_companies_using: Optional[order_by]
    global_version: Optional[order_by]
    local_iteration: Optional[order_by]


class narrative_template_bool_exp(BaseModel):
    and_: Optional[List["narrative_template_bool_exp"]] = Field(alias="_and")
    not_: Optional["narrative_template_bool_exp"] = Field(alias="_not")
    or_: Optional[List["narrative_template_bool_exp"]] = Field(alias="_or")
    category: Optional["String_comparison_exp"]
    company: Optional["company_bool_exp"]
    company_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    created_by: Optional["uuid_comparison_exp"]
    customer_iteration: Optional["Int_comparison_exp"]
    description: Optional["String_comparison_exp"]
    display_companies_using: Optional["Int_comparison_exp"]
    global_version: Optional["Int_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    in_free_tier: Optional["Boolean_comparison_exp"]
    kind: Optional["narrative_template_kinds_enum_comparison_exp"]
    local_iteration: Optional["Int_comparison_exp"]
    name: Optional["String_comparison_exp"]
    narrative_template_kind: Optional["narrative_template_kinds_bool_exp"]
    narratives: Optional["narrative_bool_exp"]
    narratives_aggregate: Optional["narrative_aggregate_bool_exp"]
    preview_narrative_json: Optional["String_comparison_exp"]
    question: Optional["String_comparison_exp"]
    state: Optional["narrative_template_states_enum_comparison_exp"]
    template: Optional["String_comparison_exp"]
    type: Optional["narrative_types_enum_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    user: Optional["user_bool_exp"]


class narrative_template_inc_input(BaseModel):
    customer_iteration: Optional[int]
    display_companies_using: Optional[int]
    global_version: Optional[int]
    local_iteration: Optional[int]


class narrative_template_insert_input(BaseModel):
    category: Optional[str]
    company: Optional["company_obj_rel_insert_input"]
    company_id: Optional[Any]
    created_at: Optional[Any]
    created_by: Optional[Any]
    customer_iteration: Optional[int]
    description: Optional[str]
    display_companies_using: Optional[int]
    global_version: Optional[int]
    id: Optional[Any]
    in_free_tier: Optional[bool]
    kind: Optional[narrative_template_kinds_enum]
    local_iteration: Optional[int]
    name: Optional[str]
    narrative_template_kind: Optional["narrative_template_kinds_obj_rel_insert_input"]
    narratives: Optional["narrative_arr_rel_insert_input"]
    preview_narrative_json: Optional[str]
    question: Optional[str]
    state: Optional[narrative_template_states_enum]
    template: Optional[str]
    type: Optional[narrative_types_enum]
    updated_at: Optional[Any]
    user: Optional["user_obj_rel_insert_input"]


class narrative_template_kinds_bool_exp(BaseModel):
    and_: Optional[List["narrative_template_kinds_bool_exp"]] = Field(alias="_and")
    not_: Optional["narrative_template_kinds_bool_exp"] = Field(alias="_not")
    or_: Optional[List["narrative_template_kinds_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class narrative_template_kinds_enum_comparison_exp(BaseModel):
    eq: Optional[narrative_template_kinds_enum] = Field(alias="_eq")
    in_: Optional[List[narrative_template_kinds_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[narrative_template_kinds_enum] = Field(alias="_neq")
    nin: Optional[List[narrative_template_kinds_enum]] = Field(alias="_nin")


class narrative_template_kinds_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class narrative_template_kinds_obj_rel_insert_input(BaseModel):
    data: "narrative_template_kinds_insert_input"
    on_conflict: Optional["narrative_template_kinds_on_conflict"]


class narrative_template_kinds_on_conflict(BaseModel):
    constraint: narrative_template_kinds_constraint
    update_columns: List[narrative_template_kinds_update_column]
    where: Optional["narrative_template_kinds_bool_exp"]


class narrative_template_kinds_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class narrative_template_kinds_pk_columns_input(BaseModel):
    value: str


class narrative_template_kinds_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class narrative_template_kinds_stream_cursor_input(BaseModel):
    initial_value: "narrative_template_kinds_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class narrative_template_kinds_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class narrative_template_kinds_updates(BaseModel):
    set: Optional["narrative_template_kinds_set_input"] = Field(alias="_set")
    where: "narrative_template_kinds_bool_exp"


class narrative_template_max_order_by(BaseModel):
    category: Optional[order_by]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    created_by: Optional[order_by]
    customer_iteration: Optional[order_by]
    description: Optional[order_by]
    display_companies_using: Optional[order_by]
    global_version: Optional[order_by]
    id: Optional[order_by]
    local_iteration: Optional[order_by]
    name: Optional[order_by]
    preview_narrative_json: Optional[order_by]
    question: Optional[order_by]
    template: Optional[order_by]
    updated_at: Optional[order_by]


class narrative_template_min_order_by(BaseModel):
    category: Optional[order_by]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    created_by: Optional[order_by]
    customer_iteration: Optional[order_by]
    description: Optional[order_by]
    display_companies_using: Optional[order_by]
    global_version: Optional[order_by]
    id: Optional[order_by]
    local_iteration: Optional[order_by]
    name: Optional[order_by]
    preview_narrative_json: Optional[order_by]
    question: Optional[order_by]
    template: Optional[order_by]
    updated_at: Optional[order_by]


class narrative_template_on_conflict(BaseModel):
    constraint: narrative_template_constraint
    update_columns: List[narrative_template_update_column]
    where: Optional["narrative_template_bool_exp"]


class narrative_template_order_by(BaseModel):
    category: Optional[order_by]
    company: Optional["company_order_by"]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    created_by: Optional[order_by]
    customer_iteration: Optional[order_by]
    description: Optional[order_by]
    display_companies_using: Optional[order_by]
    global_version: Optional[order_by]
    id: Optional[order_by]
    in_free_tier: Optional[order_by]
    kind: Optional[order_by]
    local_iteration: Optional[order_by]
    name: Optional[order_by]
    narrative_template_kind: Optional["narrative_template_kinds_order_by"]
    narratives_aggregate: Optional["narrative_aggregate_order_by"]
    preview_narrative_json: Optional[order_by]
    question: Optional[order_by]
    state: Optional[order_by]
    template: Optional[order_by]
    type: Optional[order_by]
    updated_at: Optional[order_by]
    user: Optional["user_order_by"]


class narrative_template_pk_columns_input(BaseModel):
    id: Any


class narrative_template_set_input(BaseModel):
    category: Optional[str]
    company_id: Optional[Any]
    created_at: Optional[Any]
    created_by: Optional[Any]
    customer_iteration: Optional[int]
    description: Optional[str]
    display_companies_using: Optional[int]
    global_version: Optional[int]
    id: Optional[Any]
    in_free_tier: Optional[bool]
    kind: Optional[narrative_template_kinds_enum]
    local_iteration: Optional[int]
    name: Optional[str]
    preview_narrative_json: Optional[str]
    question: Optional[str]
    state: Optional[narrative_template_states_enum]
    template: Optional[str]
    type: Optional[narrative_types_enum]
    updated_at: Optional[Any]


class narrative_template_states_bool_exp(BaseModel):
    and_: Optional[List["narrative_template_states_bool_exp"]] = Field(alias="_and")
    not_: Optional["narrative_template_states_bool_exp"] = Field(alias="_not")
    or_: Optional[List["narrative_template_states_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class narrative_template_states_enum_comparison_exp(BaseModel):
    eq: Optional[narrative_template_states_enum] = Field(alias="_eq")
    in_: Optional[List[narrative_template_states_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[narrative_template_states_enum] = Field(alias="_neq")
    nin: Optional[List[narrative_template_states_enum]] = Field(alias="_nin")


class narrative_template_states_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class narrative_template_states_on_conflict(BaseModel):
    constraint: narrative_template_states_constraint
    update_columns: List[narrative_template_states_update_column]
    where: Optional["narrative_template_states_bool_exp"]


class narrative_template_states_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class narrative_template_states_pk_columns_input(BaseModel):
    value: str


class narrative_template_states_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class narrative_template_states_stream_cursor_input(BaseModel):
    initial_value: "narrative_template_states_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class narrative_template_states_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class narrative_template_states_updates(BaseModel):
    set: Optional["narrative_template_states_set_input"] = Field(alias="_set")
    where: "narrative_template_states_bool_exp"


class narrative_template_stddev_order_by(BaseModel):
    customer_iteration: Optional[order_by]
    display_companies_using: Optional[order_by]
    global_version: Optional[order_by]
    local_iteration: Optional[order_by]


class narrative_template_stddev_pop_order_by(BaseModel):
    customer_iteration: Optional[order_by]
    display_companies_using: Optional[order_by]
    global_version: Optional[order_by]
    local_iteration: Optional[order_by]


class narrative_template_stddev_samp_order_by(BaseModel):
    customer_iteration: Optional[order_by]
    display_companies_using: Optional[order_by]
    global_version: Optional[order_by]
    local_iteration: Optional[order_by]


class narrative_template_stream_cursor_input(BaseModel):
    initial_value: "narrative_template_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class narrative_template_stream_cursor_value_input(BaseModel):
    category: Optional[str]
    company_id: Optional[Any]
    created_at: Optional[Any]
    created_by: Optional[Any]
    customer_iteration: Optional[int]
    description: Optional[str]
    display_companies_using: Optional[int]
    global_version: Optional[int]
    id: Optional[Any]
    in_free_tier: Optional[bool]
    kind: Optional[narrative_template_kinds_enum]
    local_iteration: Optional[int]
    name: Optional[str]
    preview_narrative_json: Optional[str]
    question: Optional[str]
    state: Optional[narrative_template_states_enum]
    template: Optional[str]
    type: Optional[narrative_types_enum]
    updated_at: Optional[Any]


class narrative_template_sum_order_by(BaseModel):
    customer_iteration: Optional[order_by]
    display_companies_using: Optional[order_by]
    global_version: Optional[order_by]
    local_iteration: Optional[order_by]


class narrative_template_updates(BaseModel):
    inc: Optional["narrative_template_inc_input"] = Field(alias="_inc")
    set: Optional["narrative_template_set_input"] = Field(alias="_set")
    where: "narrative_template_bool_exp"


class narrative_template_var_pop_order_by(BaseModel):
    customer_iteration: Optional[order_by]
    display_companies_using: Optional[order_by]
    global_version: Optional[order_by]
    local_iteration: Optional[order_by]


class narrative_template_var_samp_order_by(BaseModel):
    customer_iteration: Optional[order_by]
    display_companies_using: Optional[order_by]
    global_version: Optional[order_by]
    local_iteration: Optional[order_by]


class narrative_template_variance_order_by(BaseModel):
    customer_iteration: Optional[order_by]
    display_companies_using: Optional[order_by]
    global_version: Optional[order_by]
    local_iteration: Optional[order_by]


class narrative_types_bool_exp(BaseModel):
    and_: Optional[List["narrative_types_bool_exp"]] = Field(alias="_and")
    not_: Optional["narrative_types_bool_exp"] = Field(alias="_not")
    or_: Optional[List["narrative_types_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class narrative_types_enum_comparison_exp(BaseModel):
    eq: Optional[narrative_types_enum] = Field(alias="_eq")
    in_: Optional[List[narrative_types_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[narrative_types_enum] = Field(alias="_neq")
    nin: Optional[List[narrative_types_enum]] = Field(alias="_nin")


class narrative_types_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class narrative_types_on_conflict(BaseModel):
    constraint: narrative_types_constraint
    update_columns: List[narrative_types_update_column]
    where: Optional["narrative_types_bool_exp"]


class narrative_types_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class narrative_types_pk_columns_input(BaseModel):
    value: str


class narrative_types_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class narrative_types_stream_cursor_input(BaseModel):
    initial_value: "narrative_types_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class narrative_types_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class narrative_types_updates(BaseModel):
    set: Optional["narrative_types_set_input"] = Field(alias="_set")
    where: "narrative_types_bool_exp"


class narrative_updates(BaseModel):
    set: Optional["narrative_set_input"] = Field(alias="_set")
    where: "narrative_bool_exp"


class narrative_versions_aggregate_bool_exp(BaseModel):
    count: Optional["narrative_versions_aggregate_bool_exp_count"]


class narrative_versions_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[narrative_versions_select_column]]
    distinct: Optional[bool]
    filter: Optional["narrative_versions_bool_exp"]
    predicate: "Int_comparison_exp"


class narrative_versions_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["narrative_versions_max_order_by"]
    min: Optional["narrative_versions_min_order_by"]


class narrative_versions_arr_rel_insert_input(BaseModel):
    data: List["narrative_versions_insert_input"]


class narrative_versions_bool_exp(BaseModel):
    and_: Optional[List["narrative_versions_bool_exp"]] = Field(alias="_and")
    not_: Optional["narrative_versions_bool_exp"] = Field(alias="_not")
    or_: Optional[List["narrative_versions_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    narrative_id: Optional["uuid_comparison_exp"]
    s3_key: Optional["String_comparison_exp"]


class narrative_versions_insert_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    narrative_id: Optional[Any]
    s3_key: Optional[str]


class narrative_versions_max_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    narrative_id: Optional[order_by]
    s3_key: Optional[order_by]


class narrative_versions_min_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    narrative_id: Optional[order_by]
    s3_key: Optional[order_by]


class narrative_versions_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    narrative_id: Optional[order_by]
    s3_key: Optional[order_by]


class narrative_versions_set_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    narrative_id: Optional[Any]
    s3_key: Optional[str]


class narrative_versions_stream_cursor_input(BaseModel):
    initial_value: "narrative_versions_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class narrative_versions_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    narrative_id: Optional[Any]
    s3_key: Optional[str]


class narrative_versions_updates(BaseModel):
    set: Optional["narrative_versions_set_input"] = Field(alias="_set")
    where: "narrative_versions_bool_exp"


class numeric_comparison_exp(BaseModel):
    eq: Optional[Any] = Field(alias="_eq")
    gt: Optional[Any] = Field(alias="_gt")
    gte: Optional[Any] = Field(alias="_gte")
    in_: Optional[List[Any]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    lt: Optional[Any] = Field(alias="_lt")
    lte: Optional[Any] = Field(alias="_lte")
    neq: Optional[Any] = Field(alias="_neq")
    nin: Optional[List[Any]] = Field(alias="_nin")


class package_bool_exp(BaseModel):
    and_: Optional[List["package_bool_exp"]] = Field(alias="_and")
    not_: Optional["package_bool_exp"] = Field(alias="_not")
    or_: Optional[List["package_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    name: Optional["String_comparison_exp"]
    package: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class package_insert_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    package: Optional[str]
    updated_at: Optional[Any]


class package_on_conflict(BaseModel):
    constraint: package_constraint
    update_columns: List[package_update_column]
    where: Optional["package_bool_exp"]


class package_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]
    package: Optional[order_by]
    updated_at: Optional[order_by]


class package_pk_columns_input(BaseModel):
    id: Any


class package_set_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    package: Optional[str]
    updated_at: Optional[Any]


class package_stream_cursor_input(BaseModel):
    initial_value: "package_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class package_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    package: Optional[str]
    updated_at: Optional[Any]


class package_updates(BaseModel):
    set: Optional["package_set_input"] = Field(alias="_set")
    where: "package_bool_exp"


class production_tranformation_sql_queries_aggregate_bool_exp(BaseModel):
    count: Optional["production_tranformation_sql_queries_aggregate_bool_exp_count"]


class production_tranformation_sql_queries_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[production_tranformation_sql_queries_select_column]]
    distinct: Optional[bool]
    filter: Optional["production_tranformation_sql_queries_bool_exp"]
    predicate: "Int_comparison_exp"


class production_tranformation_sql_queries_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["production_tranformation_sql_queries_max_order_by"]
    min: Optional["production_tranformation_sql_queries_min_order_by"]


class production_tranformation_sql_queries_arr_rel_insert_input(BaseModel):
    data: List["production_tranformation_sql_queries_insert_input"]


class production_tranformation_sql_queries_bool_exp(BaseModel):
    and_: Optional[List["production_tranformation_sql_queries_bool_exp"]] = Field(alias="_and")
    not_: Optional["production_tranformation_sql_queries_bool_exp"] = Field(alias="_not")
    or_: Optional[List["production_tranformation_sql_queries_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    notes: Optional["String_comparison_exp"]
    related_kind: Optional["String_comparison_exp"]
    sql: Optional["String_comparison_exp"]
    transformation: Optional["transformation_bool_exp"]
    transformation_id: Optional["uuid_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    updated_by: Optional["String_comparison_exp"]


class production_tranformation_sql_queries_insert_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    notes: Optional[str]
    related_kind: Optional[str]
    sql: Optional[str]
    transformation: Optional["transformation_obj_rel_insert_input"]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class production_tranformation_sql_queries_max_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    notes: Optional[order_by]
    related_kind: Optional[order_by]
    sql: Optional[order_by]
    transformation_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class production_tranformation_sql_queries_min_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    notes: Optional[order_by]
    related_kind: Optional[order_by]
    sql: Optional[order_by]
    transformation_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class production_tranformation_sql_queries_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    notes: Optional[order_by]
    related_kind: Optional[order_by]
    sql: Optional[order_by]
    transformation: Optional["transformation_order_by"]
    transformation_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class production_tranformation_sql_queries_set_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    notes: Optional[str]
    related_kind: Optional[str]
    sql: Optional[str]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class production_tranformation_sql_queries_stream_cursor_input(BaseModel):
    initial_value: "production_tranformation_sql_queries_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class production_tranformation_sql_queries_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    notes: Optional[str]
    related_kind: Optional[str]
    sql: Optional[str]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class production_tranformation_sql_queries_updates(BaseModel):
    set: Optional["production_tranformation_sql_queries_set_input"] = Field(alias="_set")
    where: "production_tranformation_sql_queries_bool_exp"


class query_template_bool_exp(BaseModel):
    and_: Optional[List["query_template_bool_exp"]] = Field(alias="_and")
    not_: Optional["query_template_bool_exp"] = Field(alias="_not")
    or_: Optional[List["query_template_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    data_source: Optional["String_comparison_exp"]
    el_source: Optional["String_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    query: Optional["String_comparison_exp"]
    schema_names: Optional["String_comparison_exp"]
    transformation_kind: Optional["transformation_kinds_enum_comparison_exp"]
    transformation_name: Optional["String_comparison_exp"]
    transformation_update_type: Optional["transformation_update_types_enum_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    updated_by: Optional["uuid_comparison_exp"]
    user: Optional["user_bool_exp"]
    warehouse_language: Optional["String_comparison_exp"]


class query_template_insert_input(BaseModel):
    created_at: Optional[Any]
    data_source: Optional[str]
    el_source: Optional[str]
    id: Optional[Any]
    query: Optional[str]
    schema_names: Optional[str]
    transformation_kind: Optional[transformation_kinds_enum]
    transformation_name: Optional[str]
    transformation_update_type: Optional[transformation_update_types_enum]
    updated_at: Optional[Any]
    updated_by: Optional[Any]
    user: Optional["user_obj_rel_insert_input"]
    warehouse_language: Optional[str]


class query_template_on_conflict(BaseModel):
    constraint: query_template_constraint
    update_columns: List[query_template_update_column]
    where: Optional["query_template_bool_exp"]


class query_template_order_by(BaseModel):
    created_at: Optional[order_by]
    data_source: Optional[order_by]
    el_source: Optional[order_by]
    id: Optional[order_by]
    query: Optional[order_by]
    schema_names: Optional[order_by]
    transformation_kind: Optional[order_by]
    transformation_name: Optional[order_by]
    transformation_update_type: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]
    user: Optional["user_order_by"]
    warehouse_language: Optional[order_by]


class query_template_pk_columns_input(BaseModel):
    id: Any


class query_template_set_input(BaseModel):
    created_at: Optional[Any]
    data_source: Optional[str]
    el_source: Optional[str]
    id: Optional[Any]
    query: Optional[str]
    schema_names: Optional[str]
    transformation_kind: Optional[transformation_kinds_enum]
    transformation_name: Optional[str]
    transformation_update_type: Optional[transformation_update_types_enum]
    updated_at: Optional[Any]
    updated_by: Optional[Any]
    warehouse_language: Optional[str]


class query_template_stream_cursor_input(BaseModel):
    initial_value: "query_template_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class query_template_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    data_source: Optional[str]
    el_source: Optional[str]
    id: Optional[Any]
    query: Optional[str]
    schema_names: Optional[str]
    transformation_kind: Optional[transformation_kinds_enum]
    transformation_name: Optional[str]
    transformation_update_type: Optional[transformation_update_types_enum]
    updated_at: Optional[Any]
    updated_by: Optional[Any]
    warehouse_language: Optional[str]


class query_template_updates(BaseModel):
    set: Optional["query_template_set_input"] = Field(alias="_set")
    where: "query_template_bool_exp"


class query_updates_aggregate_bool_exp(BaseModel):
    count: Optional["query_updates_aggregate_bool_exp_count"]


class query_updates_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[query_updates_select_column]]
    distinct: Optional[bool]
    filter: Optional["query_updates_bool_exp"]
    predicate: "Int_comparison_exp"


class query_updates_aggregate_order_by(BaseModel):
    avg: Optional["query_updates_avg_order_by"]
    count: Optional[order_by]
    max: Optional["query_updates_max_order_by"]
    min: Optional["query_updates_min_order_by"]
    stddev: Optional["query_updates_stddev_order_by"]
    stddev_pop: Optional["query_updates_stddev_pop_order_by"]
    stddev_samp: Optional["query_updates_stddev_samp_order_by"]
    sum: Optional["query_updates_sum_order_by"]
    var_pop: Optional["query_updates_var_pop_order_by"]
    var_samp: Optional["query_updates_var_samp_order_by"]
    variance: Optional["query_updates_variance_order_by"]


class query_updates_arr_rel_insert_input(BaseModel):
    data: List["query_updates_insert_input"]
    on_conflict: Optional["query_updates_on_conflict"]


class query_updates_avg_order_by(BaseModel):
    rows_inserted: Optional[order_by]
    update_duration: Optional[order_by]


class query_updates_bool_exp(BaseModel):
    and_: Optional[List["query_updates_bool_exp"]] = Field(alias="_and")
    not_: Optional["query_updates_bool_exp"] = Field(alias="_not")
    or_: Optional[List["query_updates_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    from_sync_time: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    processed_at: Optional["timestamptz_comparison_exp"]
    rows_inserted: Optional["Int_comparison_exp"]
    to_sync_time: Optional["timestamptz_comparison_exp"]
    transformation: Optional["transformation_bool_exp"]
    transformation_id: Optional["uuid_comparison_exp"]
    update_duration: Optional["Int_comparison_exp"]
    update_kind: Optional["transformation_update_types_enum_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class query_updates_inc_input(BaseModel):
    rows_inserted: Optional[int]
    update_duration: Optional[int]


class query_updates_insert_input(BaseModel):
    created_at: Optional[Any]
    from_sync_time: Optional[Any]
    id: Optional[Any]
    processed_at: Optional[Any]
    rows_inserted: Optional[int]
    to_sync_time: Optional[Any]
    transformation: Optional["transformation_obj_rel_insert_input"]
    transformation_id: Optional[Any]
    update_duration: Optional[int]
    update_kind: Optional[transformation_update_types_enum]
    updated_at: Optional[Any]


class query_updates_max_order_by(BaseModel):
    created_at: Optional[order_by]
    from_sync_time: Optional[order_by]
    id: Optional[order_by]
    processed_at: Optional[order_by]
    rows_inserted: Optional[order_by]
    to_sync_time: Optional[order_by]
    transformation_id: Optional[order_by]
    update_duration: Optional[order_by]
    updated_at: Optional[order_by]


class query_updates_min_order_by(BaseModel):
    created_at: Optional[order_by]
    from_sync_time: Optional[order_by]
    id: Optional[order_by]
    processed_at: Optional[order_by]
    rows_inserted: Optional[order_by]
    to_sync_time: Optional[order_by]
    transformation_id: Optional[order_by]
    update_duration: Optional[order_by]
    updated_at: Optional[order_by]


class query_updates_on_conflict(BaseModel):
    constraint: query_updates_constraint
    update_columns: List[query_updates_update_column]
    where: Optional["query_updates_bool_exp"]


class query_updates_order_by(BaseModel):
    created_at: Optional[order_by]
    from_sync_time: Optional[order_by]
    id: Optional[order_by]
    processed_at: Optional[order_by]
    rows_inserted: Optional[order_by]
    to_sync_time: Optional[order_by]
    transformation: Optional["transformation_order_by"]
    transformation_id: Optional[order_by]
    update_duration: Optional[order_by]
    update_kind: Optional[order_by]
    updated_at: Optional[order_by]


class query_updates_pk_columns_input(BaseModel):
    id: Any


class query_updates_set_input(BaseModel):
    created_at: Optional[Any]
    from_sync_time: Optional[Any]
    id: Optional[Any]
    processed_at: Optional[Any]
    rows_inserted: Optional[int]
    to_sync_time: Optional[Any]
    transformation_id: Optional[Any]
    update_duration: Optional[int]
    update_kind: Optional[transformation_update_types_enum]
    updated_at: Optional[Any]


class query_updates_stddev_order_by(BaseModel):
    rows_inserted: Optional[order_by]
    update_duration: Optional[order_by]


class query_updates_stddev_pop_order_by(BaseModel):
    rows_inserted: Optional[order_by]
    update_duration: Optional[order_by]


class query_updates_stddev_samp_order_by(BaseModel):
    rows_inserted: Optional[order_by]
    update_duration: Optional[order_by]


class query_updates_stream_cursor_input(BaseModel):
    initial_value: "query_updates_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class query_updates_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    from_sync_time: Optional[Any]
    id: Optional[Any]
    processed_at: Optional[Any]
    rows_inserted: Optional[int]
    to_sync_time: Optional[Any]
    transformation_id: Optional[Any]
    update_duration: Optional[int]
    update_kind: Optional[transformation_update_types_enum]
    updated_at: Optional[Any]


class query_updates_sum_order_by(BaseModel):
    rows_inserted: Optional[order_by]
    update_duration: Optional[order_by]


class query_updates_updates(BaseModel):
    inc: Optional["query_updates_inc_input"] = Field(alias="_inc")
    set: Optional["query_updates_set_input"] = Field(alias="_set")
    where: "query_updates_bool_exp"


class query_updates_var_pop_order_by(BaseModel):
    rows_inserted: Optional[order_by]
    update_duration: Optional[order_by]


class query_updates_var_samp_order_by(BaseModel):
    rows_inserted: Optional[order_by]
    update_duration: Optional[order_by]


class query_updates_variance_order_by(BaseModel):
    rows_inserted: Optional[order_by]
    update_duration: Optional[order_by]


class question_answer_bool_exp(BaseModel):
    and_: Optional[List["question_answer_bool_exp"]] = Field(alias="_and")
    not_: Optional["question_answer_bool_exp"] = Field(alias="_not")
    or_: Optional[List["question_answer_bool_exp"]] = Field(alias="_or")
    answer: Optional["String_comparison_exp"]
    answered_by: Optional["String_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    question: Optional["String_comparison_exp"]
    related_id: Optional["uuid_comparison_exp"]
    related_to: Optional["question_answer_relations_enum_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    updated_by: Optional["uuid_comparison_exp"]


class question_answer_insert_input(BaseModel):
    answer: Optional[str]
    answered_by: Optional[str]
    created_at: Optional[Any]
    id: Optional[Any]
    question: Optional[str]
    related_id: Optional[Any]
    related_to: Optional[question_answer_relations_enum]
    updated_at: Optional[Any]
    updated_by: Optional[Any]


class question_answer_on_conflict(BaseModel):
    constraint: question_answer_constraint
    update_columns: List[question_answer_update_column]
    where: Optional["question_answer_bool_exp"]


class question_answer_order_by(BaseModel):
    answer: Optional[order_by]
    answered_by: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    question: Optional[order_by]
    related_id: Optional[order_by]
    related_to: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class question_answer_pk_columns_input(BaseModel):
    id: Any


class question_answer_relations_bool_exp(BaseModel):
    and_: Optional[List["question_answer_relations_bool_exp"]] = Field(alias="_and")
    not_: Optional["question_answer_relations_bool_exp"] = Field(alias="_not")
    or_: Optional[List["question_answer_relations_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class question_answer_relations_enum_comparison_exp(BaseModel):
    eq: Optional[question_answer_relations_enum] = Field(alias="_eq")
    in_: Optional[List[question_answer_relations_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[question_answer_relations_enum] = Field(alias="_neq")
    nin: Optional[List[question_answer_relations_enum]] = Field(alias="_nin")


class question_answer_relations_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class question_answer_relations_on_conflict(BaseModel):
    constraint: question_answer_relations_constraint
    update_columns: List[question_answer_relations_update_column]
    where: Optional["question_answer_relations_bool_exp"]


class question_answer_relations_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class question_answer_relations_pk_columns_input(BaseModel):
    value: str


class question_answer_relations_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class question_answer_relations_stream_cursor_input(BaseModel):
    initial_value: "question_answer_relations_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class question_answer_relations_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class question_answer_relations_updates(BaseModel):
    set: Optional["question_answer_relations_set_input"] = Field(alias="_set")
    where: "question_answer_relations_bool_exp"


class question_answer_set_input(BaseModel):
    answer: Optional[str]
    answered_by: Optional[str]
    created_at: Optional[Any]
    id: Optional[Any]
    question: Optional[str]
    related_id: Optional[Any]
    related_to: Optional[question_answer_relations_enum]
    updated_at: Optional[Any]
    updated_by: Optional[Any]


class question_answer_stream_cursor_input(BaseModel):
    initial_value: "question_answer_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class question_answer_stream_cursor_value_input(BaseModel):
    answer: Optional[str]
    answered_by: Optional[str]
    created_at: Optional[Any]
    id: Optional[Any]
    question: Optional[str]
    related_id: Optional[Any]
    related_to: Optional[question_answer_relations_enum]
    updated_at: Optional[Any]
    updated_by: Optional[Any]


class question_answer_updates(BaseModel):
    set: Optional["question_answer_set_input"] = Field(alias="_set")
    where: "question_answer_bool_exp"


class scratchpad_tranformation_sql_queries_aggregate_bool_exp(BaseModel):
    count: Optional["scratchpad_tranformation_sql_queries_aggregate_bool_exp_count"]


class scratchpad_tranformation_sql_queries_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[scratchpad_tranformation_sql_queries_select_column]]
    distinct: Optional[bool]
    filter: Optional["scratchpad_tranformation_sql_queries_bool_exp"]
    predicate: "Int_comparison_exp"


class scratchpad_tranformation_sql_queries_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["scratchpad_tranformation_sql_queries_max_order_by"]
    min: Optional["scratchpad_tranformation_sql_queries_min_order_by"]


class scratchpad_tranformation_sql_queries_arr_rel_insert_input(BaseModel):
    data: List["scratchpad_tranformation_sql_queries_insert_input"]


class scratchpad_tranformation_sql_queries_bool_exp(BaseModel):
    and_: Optional[List["scratchpad_tranformation_sql_queries_bool_exp"]] = Field(alias="_and")
    not_: Optional["scratchpad_tranformation_sql_queries_bool_exp"] = Field(alias="_not")
    or_: Optional[List["scratchpad_tranformation_sql_queries_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    notes: Optional["String_comparison_exp"]
    related_kind: Optional["String_comparison_exp"]
    sql: Optional["String_comparison_exp"]
    transformation_id: Optional["uuid_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    updated_by: Optional["String_comparison_exp"]


class scratchpad_tranformation_sql_queries_insert_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    notes: Optional[str]
    related_kind: Optional[str]
    sql: Optional[str]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class scratchpad_tranformation_sql_queries_max_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    notes: Optional[order_by]
    related_kind: Optional[order_by]
    sql: Optional[order_by]
    transformation_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class scratchpad_tranformation_sql_queries_min_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    notes: Optional[order_by]
    related_kind: Optional[order_by]
    sql: Optional[order_by]
    transformation_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class scratchpad_tranformation_sql_queries_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    notes: Optional[order_by]
    related_kind: Optional[order_by]
    sql: Optional[order_by]
    transformation_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class scratchpad_tranformation_sql_queries_set_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    notes: Optional[str]
    related_kind: Optional[str]
    sql: Optional[str]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class scratchpad_tranformation_sql_queries_stream_cursor_input(BaseModel):
    initial_value: "scratchpad_tranformation_sql_queries_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class scratchpad_tranformation_sql_queries_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    notes: Optional[str]
    related_kind: Optional[str]
    sql: Optional[str]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class scratchpad_tranformation_sql_queries_updates(BaseModel):
    set: Optional["scratchpad_tranformation_sql_queries_set_input"] = Field(alias="_set")
    where: "scratchpad_tranformation_sql_queries_bool_exp"


class service_limit_aggregate_bool_exp(BaseModel):
    avg: Optional["service_limit_aggregate_bool_exp_avg"]
    corr: Optional["service_limit_aggregate_bool_exp_corr"]
    count: Optional["service_limit_aggregate_bool_exp_count"]
    covar_samp: Optional["service_limit_aggregate_bool_exp_covar_samp"]
    max: Optional["service_limit_aggregate_bool_exp_max"]
    min: Optional["service_limit_aggregate_bool_exp_min"]
    stddev_samp: Optional["service_limit_aggregate_bool_exp_stddev_samp"]
    sum: Optional["service_limit_aggregate_bool_exp_sum"]
    var_samp: Optional["service_limit_aggregate_bool_exp_var_samp"]


class service_limit_aggregate_bool_exp_avg(BaseModel):
    arguments: service_limit_select_column_service_limit_aggregate_bool_exp_avg_arguments_columns
    distinct: Optional[bool]
    filter: Optional["service_limit_bool_exp"]
    predicate: "float8_comparison_exp"


class service_limit_aggregate_bool_exp_corr(BaseModel):
    arguments: "service_limit_aggregate_bool_exp_corr_arguments"
    distinct: Optional[bool]
    filter: Optional["service_limit_bool_exp"]
    predicate: "float8_comparison_exp"


class service_limit_aggregate_bool_exp_corr_arguments(BaseModel):
    x: service_limit_select_column_service_limit_aggregate_bool_exp_corr_arguments_columns = Field(alias="X")
    y: service_limit_select_column_service_limit_aggregate_bool_exp_corr_arguments_columns = Field(alias="Y")


class service_limit_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[service_limit_select_column]]
    distinct: Optional[bool]
    filter: Optional["service_limit_bool_exp"]
    predicate: "Int_comparison_exp"


class service_limit_aggregate_bool_exp_covar_samp(BaseModel):
    arguments: "service_limit_aggregate_bool_exp_covar_samp_arguments"
    distinct: Optional[bool]
    filter: Optional["service_limit_bool_exp"]
    predicate: "float8_comparison_exp"


class service_limit_aggregate_bool_exp_covar_samp_arguments(BaseModel):
    x: service_limit_select_column_service_limit_aggregate_bool_exp_covar_samp_arguments_columns = Field(alias="X")
    y: service_limit_select_column_service_limit_aggregate_bool_exp_covar_samp_arguments_columns = Field(alias="Y")


class service_limit_aggregate_bool_exp_max(BaseModel):
    arguments: service_limit_select_column_service_limit_aggregate_bool_exp_max_arguments_columns
    distinct: Optional[bool]
    filter: Optional["service_limit_bool_exp"]
    predicate: "float8_comparison_exp"


class service_limit_aggregate_bool_exp_min(BaseModel):
    arguments: service_limit_select_column_service_limit_aggregate_bool_exp_min_arguments_columns
    distinct: Optional[bool]
    filter: Optional["service_limit_bool_exp"]
    predicate: "float8_comparison_exp"


class service_limit_aggregate_bool_exp_stddev_samp(BaseModel):
    arguments: service_limit_select_column_service_limit_aggregate_bool_exp_stddev_samp_arguments_columns
    distinct: Optional[bool]
    filter: Optional["service_limit_bool_exp"]
    predicate: "float8_comparison_exp"


class service_limit_aggregate_bool_exp_sum(BaseModel):
    arguments: service_limit_select_column_service_limit_aggregate_bool_exp_sum_arguments_columns
    distinct: Optional[bool]
    filter: Optional["service_limit_bool_exp"]
    predicate: "float8_comparison_exp"


class service_limit_aggregate_bool_exp_var_samp(BaseModel):
    arguments: service_limit_select_column_service_limit_aggregate_bool_exp_var_samp_arguments_columns
    distinct: Optional[bool]
    filter: Optional["service_limit_bool_exp"]
    predicate: "float8_comparison_exp"


class service_limit_aggregate_order_by(BaseModel):
    avg: Optional["service_limit_avg_order_by"]
    count: Optional[order_by]
    max: Optional["service_limit_max_order_by"]
    min: Optional["service_limit_min_order_by"]
    stddev: Optional["service_limit_stddev_order_by"]
    stddev_pop: Optional["service_limit_stddev_pop_order_by"]
    stddev_samp: Optional["service_limit_stddev_samp_order_by"]
    sum: Optional["service_limit_sum_order_by"]
    var_pop: Optional["service_limit_var_pop_order_by"]
    var_samp: Optional["service_limit_var_samp_order_by"]
    variance: Optional["service_limit_variance_order_by"]


class service_limit_arr_rel_insert_input(BaseModel):
    data: List["service_limit_insert_input"]
    on_conflict: Optional["service_limit_on_conflict"]


class service_limit_avg_order_by(BaseModel):
    activity_limit: Optional[order_by]
    activity_stream_limit: Optional[order_by]
    admin_user_limit: Optional[order_by]
    dataset_limit: Optional[order_by]
    materialization_limit: Optional[order_by]
    monthly_price: Optional[order_by]
    monthly_templates_from_library_limit: Optional[order_by]
    narrative_limit: Optional[order_by]
    row_limit: Optional[order_by]
    run_transformations_daily_limit: Optional[order_by]
    total_templates_from_library_limit: Optional[order_by]
    transformation_limit: Optional[order_by]
    user_limit: Optional[order_by]


class service_limit_bool_exp(BaseModel):
    and_: Optional[List["service_limit_bool_exp"]] = Field(alias="_and")
    not_: Optional["service_limit_bool_exp"] = Field(alias="_not")
    or_: Optional[List["service_limit_bool_exp"]] = Field(alias="_or")
    activity_limit: Optional["Int_comparison_exp"]
    activity_stream_limit: Optional["Int_comparison_exp"]
    admin_user_limit: Optional["Int_comparison_exp"]
    company: Optional["company_bool_exp"]
    company_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    dataset_limit: Optional["Int_comparison_exp"]
    deleted_at: Optional["timestamptz_comparison_exp"]
    disable_on: Optional["timestamptz_comparison_exp"]
    end_on: Optional["date_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    materialization_limit: Optional["Int_comparison_exp"]
    monthly_price: Optional["float8_comparison_exp"]
    monthly_templates_from_library_limit: Optional["Int_comparison_exp"]
    name: Optional["String_comparison_exp"]
    narrative_limit: Optional["Int_comparison_exp"]
    plan_id: Optional["uuid_comparison_exp"]
    row_limit: Optional["bigint_comparison_exp"]
    run_transformations_daily_limit: Optional["Int_comparison_exp"]
    start_on: Optional["date_comparison_exp"]
    total_templates_from_library_limit: Optional["Int_comparison_exp"]
    transformation_limit: Optional["Int_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    user_limit: Optional["Int_comparison_exp"]


class service_limit_inc_input(BaseModel):
    activity_limit: Optional[int]
    activity_stream_limit: Optional[int]
    admin_user_limit: Optional[int]
    dataset_limit: Optional[int]
    materialization_limit: Optional[int]
    monthly_price: Optional[Any]
    monthly_templates_from_library_limit: Optional[int]
    narrative_limit: Optional[int]
    row_limit: Optional[Any]
    run_transformations_daily_limit: Optional[int]
    total_templates_from_library_limit: Optional[int]
    transformation_limit: Optional[int]
    user_limit: Optional[int]


class service_limit_insert_input(BaseModel):
    activity_limit: Optional[int]
    activity_stream_limit: Optional[int]
    admin_user_limit: Optional[int]
    company: Optional["company_obj_rel_insert_input"]
    company_id: Optional[Any]
    created_at: Optional[Any]
    dataset_limit: Optional[int]
    deleted_at: Optional[Any]
    disable_on: Optional[Any]
    end_on: Optional[Any]
    id: Optional[Any]
    materialization_limit: Optional[int]
    monthly_price: Optional[Any]
    monthly_templates_from_library_limit: Optional[int]
    name: Optional[str]
    narrative_limit: Optional[int]
    plan_id: Optional[Any]
    row_limit: Optional[Any]
    run_transformations_daily_limit: Optional[int]
    start_on: Optional[Any]
    total_templates_from_library_limit: Optional[int]
    transformation_limit: Optional[int]
    updated_at: Optional[Any]
    user_limit: Optional[int]


class service_limit_max_order_by(BaseModel):
    activity_limit: Optional[order_by]
    activity_stream_limit: Optional[order_by]
    admin_user_limit: Optional[order_by]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    dataset_limit: Optional[order_by]
    deleted_at: Optional[order_by]
    disable_on: Optional[order_by]
    end_on: Optional[order_by]
    id: Optional[order_by]
    materialization_limit: Optional[order_by]
    monthly_price: Optional[order_by]
    monthly_templates_from_library_limit: Optional[order_by]
    name: Optional[order_by]
    narrative_limit: Optional[order_by]
    plan_id: Optional[order_by]
    row_limit: Optional[order_by]
    run_transformations_daily_limit: Optional[order_by]
    start_on: Optional[order_by]
    total_templates_from_library_limit: Optional[order_by]
    transformation_limit: Optional[order_by]
    updated_at: Optional[order_by]
    user_limit: Optional[order_by]


class service_limit_min_order_by(BaseModel):
    activity_limit: Optional[order_by]
    activity_stream_limit: Optional[order_by]
    admin_user_limit: Optional[order_by]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    dataset_limit: Optional[order_by]
    deleted_at: Optional[order_by]
    disable_on: Optional[order_by]
    end_on: Optional[order_by]
    id: Optional[order_by]
    materialization_limit: Optional[order_by]
    monthly_price: Optional[order_by]
    monthly_templates_from_library_limit: Optional[order_by]
    name: Optional[order_by]
    narrative_limit: Optional[order_by]
    plan_id: Optional[order_by]
    row_limit: Optional[order_by]
    run_transformations_daily_limit: Optional[order_by]
    start_on: Optional[order_by]
    total_templates_from_library_limit: Optional[order_by]
    transformation_limit: Optional[order_by]
    updated_at: Optional[order_by]
    user_limit: Optional[order_by]


class service_limit_on_conflict(BaseModel):
    constraint: service_limit_constraint
    update_columns: List[service_limit_update_column]
    where: Optional["service_limit_bool_exp"]


class service_limit_order_by(BaseModel):
    activity_limit: Optional[order_by]
    activity_stream_limit: Optional[order_by]
    admin_user_limit: Optional[order_by]
    company: Optional["company_order_by"]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    dataset_limit: Optional[order_by]
    deleted_at: Optional[order_by]
    disable_on: Optional[order_by]
    end_on: Optional[order_by]
    id: Optional[order_by]
    materialization_limit: Optional[order_by]
    monthly_price: Optional[order_by]
    monthly_templates_from_library_limit: Optional[order_by]
    name: Optional[order_by]
    narrative_limit: Optional[order_by]
    plan_id: Optional[order_by]
    row_limit: Optional[order_by]
    run_transformations_daily_limit: Optional[order_by]
    start_on: Optional[order_by]
    total_templates_from_library_limit: Optional[order_by]
    transformation_limit: Optional[order_by]
    updated_at: Optional[order_by]
    user_limit: Optional[order_by]


class service_limit_pk_columns_input(BaseModel):
    id: Any


class service_limit_set_input(BaseModel):
    activity_limit: Optional[int]
    activity_stream_limit: Optional[int]
    admin_user_limit: Optional[int]
    company_id: Optional[Any]
    created_at: Optional[Any]
    dataset_limit: Optional[int]
    deleted_at: Optional[Any]
    disable_on: Optional[Any]
    end_on: Optional[Any]
    id: Optional[Any]
    materialization_limit: Optional[int]
    monthly_price: Optional[Any]
    monthly_templates_from_library_limit: Optional[int]
    name: Optional[str]
    narrative_limit: Optional[int]
    plan_id: Optional[Any]
    row_limit: Optional[Any]
    run_transformations_daily_limit: Optional[int]
    start_on: Optional[Any]
    total_templates_from_library_limit: Optional[int]
    transformation_limit: Optional[int]
    updated_at: Optional[Any]
    user_limit: Optional[int]


class service_limit_stddev_order_by(BaseModel):
    activity_limit: Optional[order_by]
    activity_stream_limit: Optional[order_by]
    admin_user_limit: Optional[order_by]
    dataset_limit: Optional[order_by]
    materialization_limit: Optional[order_by]
    monthly_price: Optional[order_by]
    monthly_templates_from_library_limit: Optional[order_by]
    narrative_limit: Optional[order_by]
    row_limit: Optional[order_by]
    run_transformations_daily_limit: Optional[order_by]
    total_templates_from_library_limit: Optional[order_by]
    transformation_limit: Optional[order_by]
    user_limit: Optional[order_by]


class service_limit_stddev_pop_order_by(BaseModel):
    activity_limit: Optional[order_by]
    activity_stream_limit: Optional[order_by]
    admin_user_limit: Optional[order_by]
    dataset_limit: Optional[order_by]
    materialization_limit: Optional[order_by]
    monthly_price: Optional[order_by]
    monthly_templates_from_library_limit: Optional[order_by]
    narrative_limit: Optional[order_by]
    row_limit: Optional[order_by]
    run_transformations_daily_limit: Optional[order_by]
    total_templates_from_library_limit: Optional[order_by]
    transformation_limit: Optional[order_by]
    user_limit: Optional[order_by]


class service_limit_stddev_samp_order_by(BaseModel):
    activity_limit: Optional[order_by]
    activity_stream_limit: Optional[order_by]
    admin_user_limit: Optional[order_by]
    dataset_limit: Optional[order_by]
    materialization_limit: Optional[order_by]
    monthly_price: Optional[order_by]
    monthly_templates_from_library_limit: Optional[order_by]
    narrative_limit: Optional[order_by]
    row_limit: Optional[order_by]
    run_transformations_daily_limit: Optional[order_by]
    total_templates_from_library_limit: Optional[order_by]
    transformation_limit: Optional[order_by]
    user_limit: Optional[order_by]


class service_limit_stream_cursor_input(BaseModel):
    initial_value: "service_limit_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class service_limit_stream_cursor_value_input(BaseModel):
    activity_limit: Optional[int]
    activity_stream_limit: Optional[int]
    admin_user_limit: Optional[int]
    company_id: Optional[Any]
    created_at: Optional[Any]
    dataset_limit: Optional[int]
    deleted_at: Optional[Any]
    disable_on: Optional[Any]
    end_on: Optional[Any]
    id: Optional[Any]
    materialization_limit: Optional[int]
    monthly_price: Optional[Any]
    monthly_templates_from_library_limit: Optional[int]
    name: Optional[str]
    narrative_limit: Optional[int]
    plan_id: Optional[Any]
    row_limit: Optional[Any]
    run_transformations_daily_limit: Optional[int]
    start_on: Optional[Any]
    total_templates_from_library_limit: Optional[int]
    transformation_limit: Optional[int]
    updated_at: Optional[Any]
    user_limit: Optional[int]


class service_limit_sum_order_by(BaseModel):
    activity_limit: Optional[order_by]
    activity_stream_limit: Optional[order_by]
    admin_user_limit: Optional[order_by]
    dataset_limit: Optional[order_by]
    materialization_limit: Optional[order_by]
    monthly_price: Optional[order_by]
    monthly_templates_from_library_limit: Optional[order_by]
    narrative_limit: Optional[order_by]
    row_limit: Optional[order_by]
    run_transformations_daily_limit: Optional[order_by]
    total_templates_from_library_limit: Optional[order_by]
    transformation_limit: Optional[order_by]
    user_limit: Optional[order_by]


class service_limit_updates(BaseModel):
    inc: Optional["service_limit_inc_input"] = Field(alias="_inc")
    set: Optional["service_limit_set_input"] = Field(alias="_set")
    where: "service_limit_bool_exp"


class service_limit_var_pop_order_by(BaseModel):
    activity_limit: Optional[order_by]
    activity_stream_limit: Optional[order_by]
    admin_user_limit: Optional[order_by]
    dataset_limit: Optional[order_by]
    materialization_limit: Optional[order_by]
    monthly_price: Optional[order_by]
    monthly_templates_from_library_limit: Optional[order_by]
    narrative_limit: Optional[order_by]
    row_limit: Optional[order_by]
    run_transformations_daily_limit: Optional[order_by]
    total_templates_from_library_limit: Optional[order_by]
    transformation_limit: Optional[order_by]
    user_limit: Optional[order_by]


class service_limit_var_samp_order_by(BaseModel):
    activity_limit: Optional[order_by]
    activity_stream_limit: Optional[order_by]
    admin_user_limit: Optional[order_by]
    dataset_limit: Optional[order_by]
    materialization_limit: Optional[order_by]
    monthly_price: Optional[order_by]
    monthly_templates_from_library_limit: Optional[order_by]
    narrative_limit: Optional[order_by]
    row_limit: Optional[order_by]
    run_transformations_daily_limit: Optional[order_by]
    total_templates_from_library_limit: Optional[order_by]
    transformation_limit: Optional[order_by]
    user_limit: Optional[order_by]


class service_limit_variance_order_by(BaseModel):
    activity_limit: Optional[order_by]
    activity_stream_limit: Optional[order_by]
    admin_user_limit: Optional[order_by]
    dataset_limit: Optional[order_by]
    materialization_limit: Optional[order_by]
    monthly_price: Optional[order_by]
    monthly_templates_from_library_limit: Optional[order_by]
    narrative_limit: Optional[order_by]
    row_limit: Optional[order_by]
    run_transformations_daily_limit: Optional[order_by]
    total_templates_from_library_limit: Optional[order_by]
    transformation_limit: Optional[order_by]
    user_limit: Optional[order_by]


class slowly_changing_customer_dims_aggregate_bool_exp(BaseModel):
    count: Optional["slowly_changing_customer_dims_aggregate_bool_exp_count"]


class slowly_changing_customer_dims_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[slowly_changing_customer_dims_select_column]]
    distinct: Optional[bool]
    filter: Optional["slowly_changing_customer_dims_bool_exp"]
    predicate: "Int_comparison_exp"


class slowly_changing_customer_dims_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["slowly_changing_customer_dims_max_order_by"]
    min: Optional["slowly_changing_customer_dims_min_order_by"]


class slowly_changing_customer_dims_arr_rel_insert_input(BaseModel):
    data: List["slowly_changing_customer_dims_insert_input"]
    on_conflict: Optional["slowly_changing_customer_dims_on_conflict"]


class slowly_changing_customer_dims_bool_exp(BaseModel):
    and_: Optional[List["slowly_changing_customer_dims_bool_exp"]] = Field(alias="_and")
    not_: Optional["slowly_changing_customer_dims_bool_exp"] = Field(alias="_not")
    or_: Optional[List["slowly_changing_customer_dims_bool_exp"]] = Field(alias="_or")
    company_table: Optional["company_table_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    dim_table: Optional["dim_table_bool_exp"]
    dim_table_id: Optional["uuid_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    slowly_changing_ts_column: Optional["String_comparison_exp"]
    table_id: Optional["uuid_comparison_exp"]


class slowly_changing_customer_dims_insert_input(BaseModel):
    company_table: Optional["company_table_obj_rel_insert_input"]
    created_at: Optional[Any]
    dim_table: Optional["dim_table_obj_rel_insert_input"]
    dim_table_id: Optional[Any]
    id: Optional[Any]
    slowly_changing_ts_column: Optional[str]
    table_id: Optional[Any]


class slowly_changing_customer_dims_max_order_by(BaseModel):
    created_at: Optional[order_by]
    dim_table_id: Optional[order_by]
    id: Optional[order_by]
    slowly_changing_ts_column: Optional[order_by]
    table_id: Optional[order_by]


class slowly_changing_customer_dims_min_order_by(BaseModel):
    created_at: Optional[order_by]
    dim_table_id: Optional[order_by]
    id: Optional[order_by]
    slowly_changing_ts_column: Optional[order_by]
    table_id: Optional[order_by]


class slowly_changing_customer_dims_on_conflict(BaseModel):
    constraint: slowly_changing_customer_dims_constraint
    update_columns: List[slowly_changing_customer_dims_update_column]
    where: Optional["slowly_changing_customer_dims_bool_exp"]


class slowly_changing_customer_dims_order_by(BaseModel):
    company_table: Optional["company_table_order_by"]
    created_at: Optional[order_by]
    dim_table: Optional["dim_table_order_by"]
    dim_table_id: Optional[order_by]
    id: Optional[order_by]
    slowly_changing_ts_column: Optional[order_by]
    table_id: Optional[order_by]


class slowly_changing_customer_dims_pk_columns_input(BaseModel):
    id: Any


class slowly_changing_customer_dims_set_input(BaseModel):
    created_at: Optional[Any]
    dim_table_id: Optional[Any]
    id: Optional[Any]
    slowly_changing_ts_column: Optional[str]
    table_id: Optional[Any]


class slowly_changing_customer_dims_stream_cursor_input(BaseModel):
    initial_value: "slowly_changing_customer_dims_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class slowly_changing_customer_dims_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    dim_table_id: Optional[Any]
    id: Optional[Any]
    slowly_changing_ts_column: Optional[str]
    table_id: Optional[Any]


class slowly_changing_customer_dims_updates(BaseModel):
    set: Optional["slowly_changing_customer_dims_set_input"] = Field(alias="_set")
    where: "slowly_changing_customer_dims_bool_exp"


class sql_queries_bool_exp(BaseModel):
    and_: Optional[List["sql_queries_bool_exp"]] = Field(alias="_and")
    not_: Optional["sql_queries_bool_exp"] = Field(alias="_not")
    or_: Optional[List["sql_queries_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    name: Optional["String_comparison_exp"]
    notes: Optional["String_comparison_exp"]
    related_activity: Optional["activity_bool_exp"]
    related_company: Optional["company_bool_exp"]
    related_id: Optional["uuid_comparison_exp"]
    related_kind: Optional["sql_query_kinds_enum_comparison_exp"]
    related_to: Optional["sql_query_relations_enum_comparison_exp"]
    related_transformation: Optional["transformation_bool_exp"]
    sql: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    updated_by: Optional["String_comparison_exp"]


class sql_queries_insert_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    notes: Optional[str]
    related_activity: Optional["activity_obj_rel_insert_input"]
    related_company: Optional["company_obj_rel_insert_input"]
    related_id: Optional[Any]
    related_kind: Optional[sql_query_kinds_enum]
    related_to: Optional[sql_query_relations_enum]
    related_transformation: Optional["transformation_obj_rel_insert_input"]
    sql: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class sql_queries_obj_rel_insert_input(BaseModel):
    data: "sql_queries_insert_input"
    on_conflict: Optional["sql_queries_on_conflict"]


class sql_queries_on_conflict(BaseModel):
    constraint: sql_queries_constraint
    update_columns: List[sql_queries_update_column]
    where: Optional["sql_queries_bool_exp"]


class sql_queries_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]
    notes: Optional[order_by]
    related_activity: Optional["activity_order_by"]
    related_company: Optional["company_order_by"]
    related_id: Optional[order_by]
    related_kind: Optional[order_by]
    related_to: Optional[order_by]
    related_transformation: Optional["transformation_order_by"]
    sql: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class sql_queries_pk_columns_input(BaseModel):
    id: Any


class sql_queries_set_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    notes: Optional[str]
    related_id: Optional[Any]
    related_kind: Optional[sql_query_kinds_enum]
    related_to: Optional[sql_query_relations_enum]
    sql: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class sql_queries_stream_cursor_input(BaseModel):
    initial_value: "sql_queries_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class sql_queries_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    notes: Optional[str]
    related_id: Optional[Any]
    related_kind: Optional[sql_query_kinds_enum]
    related_to: Optional[sql_query_relations_enum]
    sql: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class sql_queries_updates(BaseModel):
    set: Optional["sql_queries_set_input"] = Field(alias="_set")
    where: "sql_queries_bool_exp"


class sql_query_kinds_bool_exp(BaseModel):
    and_: Optional[List["sql_query_kinds_bool_exp"]] = Field(alias="_and")
    not_: Optional["sql_query_kinds_bool_exp"] = Field(alias="_not")
    or_: Optional[List["sql_query_kinds_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class sql_query_kinds_enum_comparison_exp(BaseModel):
    eq: Optional[sql_query_kinds_enum] = Field(alias="_eq")
    in_: Optional[List[sql_query_kinds_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[sql_query_kinds_enum] = Field(alias="_neq")
    nin: Optional[List[sql_query_kinds_enum]] = Field(alias="_nin")


class sql_query_kinds_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class sql_query_kinds_on_conflict(BaseModel):
    constraint: sql_query_kinds_constraint
    update_columns: List[sql_query_kinds_update_column]
    where: Optional["sql_query_kinds_bool_exp"]


class sql_query_kinds_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class sql_query_kinds_pk_columns_input(BaseModel):
    value: str


class sql_query_kinds_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class sql_query_kinds_stream_cursor_input(BaseModel):
    initial_value: "sql_query_kinds_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class sql_query_kinds_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class sql_query_kinds_updates(BaseModel):
    set: Optional["sql_query_kinds_set_input"] = Field(alias="_set")
    where: "sql_query_kinds_bool_exp"


class sql_query_relations_bool_exp(BaseModel):
    and_: Optional[List["sql_query_relations_bool_exp"]] = Field(alias="_and")
    not_: Optional["sql_query_relations_bool_exp"] = Field(alias="_not")
    or_: Optional[List["sql_query_relations_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class sql_query_relations_enum_comparison_exp(BaseModel):
    eq: Optional[sql_query_relations_enum] = Field(alias="_eq")
    in_: Optional[List[sql_query_relations_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[sql_query_relations_enum] = Field(alias="_neq")
    nin: Optional[List[sql_query_relations_enum]] = Field(alias="_nin")


class sql_query_relations_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class sql_query_relations_on_conflict(BaseModel):
    constraint: sql_query_relations_constraint
    update_columns: List[sql_query_relations_update_column]
    where: Optional["sql_query_relations_bool_exp"]


class sql_query_relations_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class sql_query_relations_pk_columns_input(BaseModel):
    value: str


class sql_query_relations_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class sql_query_relations_stream_cursor_input(BaseModel):
    initial_value: "sql_query_relations_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class sql_query_relations_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class sql_query_relations_updates(BaseModel):
    set: Optional["sql_query_relations_set_input"] = Field(alias="_set")
    where: "sql_query_relations_bool_exp"


class status_bool_exp(BaseModel):
    and_: Optional[List["status_bool_exp"]] = Field(alias="_and")
    not_: Optional["status_bool_exp"] = Field(alias="_not")
    or_: Optional[List["status_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class status_enum_comparison_exp(BaseModel):
    eq: Optional[status_enum] = Field(alias="_eq")
    in_: Optional[List[status_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[status_enum] = Field(alias="_neq")
    nin: Optional[List[status_enum]] = Field(alias="_nin")


class status_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class status_on_conflict(BaseModel):
    constraint: status_constraint
    update_columns: List[status_update_column]
    where: Optional["status_bool_exp"]


class status_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class status_pk_columns_input(BaseModel):
    value: str


class status_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class status_stream_cursor_input(BaseModel):
    initial_value: "status_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class status_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class status_updates(BaseModel):
    set: Optional["status_set_input"] = Field(alias="_set")
    where: "status_bool_exp"


class table_team_permissions_aggregate_bool_exp(BaseModel):
    bool_and: Optional["table_team_permissions_aggregate_bool_exp_bool_and"]
    bool_or: Optional["table_team_permissions_aggregate_bool_exp_bool_or"]
    count: Optional["table_team_permissions_aggregate_bool_exp_count"]


class table_team_permissions_aggregate_bool_exp_bool_and(BaseModel):
    arguments: table_team_permissions_select_column_table_team_permissions_aggregate_bool_exp_bool_and_arguments_columns
    distinct: Optional[bool]
    filter: Optional["table_team_permissions_bool_exp"]
    predicate: "Boolean_comparison_exp"


class table_team_permissions_aggregate_bool_exp_bool_or(BaseModel):
    arguments: table_team_permissions_select_column_table_team_permissions_aggregate_bool_exp_bool_or_arguments_columns
    distinct: Optional[bool]
    filter: Optional["table_team_permissions_bool_exp"]
    predicate: "Boolean_comparison_exp"


class table_team_permissions_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[table_team_permissions_select_column]]
    distinct: Optional[bool]
    filter: Optional["table_team_permissions_bool_exp"]
    predicate: "Int_comparison_exp"


class table_team_permissions_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["table_team_permissions_max_order_by"]
    min: Optional["table_team_permissions_min_order_by"]


class table_team_permissions_arr_rel_insert_input(BaseModel):
    data: List["table_team_permissions_insert_input"]


class table_team_permissions_bool_exp(BaseModel):
    and_: Optional[List["table_team_permissions_bool_exp"]] = Field(alias="_and")
    not_: Optional["table_team_permissions_bool_exp"] = Field(alias="_not")
    or_: Optional[List["table_team_permissions_bool_exp"]] = Field(alias="_or")
    can_edit: Optional["Boolean_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    table_id: Optional["uuid_comparison_exp"]
    team: Optional["team_bool_exp"]
    team_id: Optional["uuid_comparison_exp"]


class table_team_permissions_insert_input(BaseModel):
    can_edit: Optional[bool]
    created_at: Optional[Any]
    id: Optional[Any]
    table_id: Optional[Any]
    team: Optional["team_obj_rel_insert_input"]
    team_id: Optional[Any]


class table_team_permissions_max_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    table_id: Optional[order_by]
    team_id: Optional[order_by]


class table_team_permissions_min_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    table_id: Optional[order_by]
    team_id: Optional[order_by]


class table_team_permissions_order_by(BaseModel):
    can_edit: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    table_id: Optional[order_by]
    team: Optional["team_order_by"]
    team_id: Optional[order_by]


class table_team_permissions_set_input(BaseModel):
    can_edit: Optional[bool]
    created_at: Optional[Any]
    id: Optional[Any]
    table_id: Optional[Any]
    team_id: Optional[Any]


class table_team_permissions_stream_cursor_input(BaseModel):
    initial_value: "table_team_permissions_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class table_team_permissions_stream_cursor_value_input(BaseModel):
    can_edit: Optional[bool]
    created_at: Optional[Any]
    id: Optional[Any]
    table_id: Optional[Any]
    team_id: Optional[Any]


class table_team_permissions_updates(BaseModel):
    set: Optional["table_team_permissions_set_input"] = Field(alias="_set")
    where: "table_team_permissions_bool_exp"


class tag_aggregate_bool_exp(BaseModel):
    count: Optional["tag_aggregate_bool_exp_count"]


class tag_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[tag_select_column]]
    distinct: Optional[bool]
    filter: Optional["tag_bool_exp"]
    predicate: "Int_comparison_exp"


class tag_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["tag_max_order_by"]
    min: Optional["tag_min_order_by"]


class tag_arr_rel_insert_input(BaseModel):
    data: List["tag_insert_input"]
    on_conflict: Optional["tag_on_conflict"]


class tag_bool_exp(BaseModel):
    and_: Optional[List["tag_bool_exp"]] = Field(alias="_and")
    not_: Optional["tag_bool_exp"] = Field(alias="_not")
    or_: Optional[List["tag_bool_exp"]] = Field(alias="_or")
    activity: Optional["activity_bool_exp"]
    company_tag: Optional["company_tags_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    dataset: Optional["dataset_bool_exp"]
    id: Optional["uuid_comparison_exp"]
    metric: Optional["metric_bool_exp"]
    narrative: Optional["narrative_bool_exp"]
    related_id: Optional["uuid_comparison_exp"]
    related_to: Optional["tag_relations_enum_comparison_exp"]
    tag_id: Optional["uuid_comparison_exp"]
    transformation: Optional["transformation_bool_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class tag_insert_input(BaseModel):
    activity: Optional["activity_obj_rel_insert_input"]
    company_tag: Optional["company_tags_obj_rel_insert_input"]
    created_at: Optional[Any]
    dataset: Optional["dataset_obj_rel_insert_input"]
    id: Optional[Any]
    metric: Optional["metric_obj_rel_insert_input"]
    narrative: Optional["narrative_obj_rel_insert_input"]
    related_id: Optional[Any]
    related_to: Optional[tag_relations_enum]
    tag_id: Optional[Any]
    transformation: Optional["transformation_obj_rel_insert_input"]
    updated_at: Optional[Any]


class tag_max_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    related_id: Optional[order_by]
    tag_id: Optional[order_by]
    updated_at: Optional[order_by]


class tag_min_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    related_id: Optional[order_by]
    tag_id: Optional[order_by]
    updated_at: Optional[order_by]


class tag_on_conflict(BaseModel):
    constraint: tag_constraint
    update_columns: List[tag_update_column]
    where: Optional["tag_bool_exp"]


class tag_order_by(BaseModel):
    activity: Optional["activity_order_by"]
    company_tag: Optional["company_tags_order_by"]
    created_at: Optional[order_by]
    dataset: Optional["dataset_order_by"]
    id: Optional[order_by]
    metric: Optional["metric_order_by"]
    narrative: Optional["narrative_order_by"]
    related_id: Optional[order_by]
    related_to: Optional[order_by]
    tag_id: Optional[order_by]
    transformation: Optional["transformation_order_by"]
    updated_at: Optional[order_by]


class tag_pk_columns_input(BaseModel):
    id: Any


class tag_relations_bool_exp(BaseModel):
    and_: Optional[List["tag_relations_bool_exp"]] = Field(alias="_and")
    not_: Optional["tag_relations_bool_exp"] = Field(alias="_not")
    or_: Optional[List["tag_relations_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class tag_relations_enum_comparison_exp(BaseModel):
    eq: Optional[tag_relations_enum] = Field(alias="_eq")
    in_: Optional[List[tag_relations_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[tag_relations_enum] = Field(alias="_neq")
    nin: Optional[List[tag_relations_enum]] = Field(alias="_nin")


class tag_relations_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class tag_relations_on_conflict(BaseModel):
    constraint: tag_relations_constraint
    update_columns: List[tag_relations_update_column]
    where: Optional["tag_relations_bool_exp"]


class tag_relations_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class tag_relations_pk_columns_input(BaseModel):
    value: str


class tag_relations_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class tag_relations_stream_cursor_input(BaseModel):
    initial_value: "tag_relations_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class tag_relations_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class tag_relations_updates(BaseModel):
    set: Optional["tag_relations_set_input"] = Field(alias="_set")
    where: "tag_relations_bool_exp"


class tag_set_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    related_id: Optional[Any]
    related_to: Optional[tag_relations_enum]
    tag_id: Optional[Any]
    updated_at: Optional[Any]


class tag_stream_cursor_input(BaseModel):
    initial_value: "tag_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class tag_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    related_id: Optional[Any]
    related_to: Optional[tag_relations_enum]
    tag_id: Optional[Any]
    updated_at: Optional[Any]


class tag_updates(BaseModel):
    set: Optional["tag_set_input"] = Field(alias="_set")
    where: "tag_bool_exp"


class task_execution_aggregate_bool_exp(BaseModel):
    bool_and: Optional["task_execution_aggregate_bool_exp_bool_and"]
    bool_or: Optional["task_execution_aggregate_bool_exp_bool_or"]
    count: Optional["task_execution_aggregate_bool_exp_count"]


class task_execution_aggregate_bool_exp_bool_and(BaseModel):
    arguments: task_execution_select_column_task_execution_aggregate_bool_exp_bool_and_arguments_columns
    distinct: Optional[bool]
    filter: Optional["task_execution_bool_exp"]
    predicate: "Boolean_comparison_exp"


class task_execution_aggregate_bool_exp_bool_or(BaseModel):
    arguments: task_execution_select_column_task_execution_aggregate_bool_exp_bool_or_arguments_columns
    distinct: Optional[bool]
    filter: Optional["task_execution_bool_exp"]
    predicate: "Boolean_comparison_exp"


class task_execution_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[task_execution_select_column]]
    distinct: Optional[bool]
    filter: Optional["task_execution_bool_exp"]
    predicate: "Int_comparison_exp"


class task_execution_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["task_execution_max_order_by"]
    min: Optional["task_execution_min_order_by"]


class task_execution_append_input(BaseModel):
    details: Optional[Any]


class task_execution_arr_rel_insert_input(BaseModel):
    data: List["task_execution_insert_input"]
    on_conflict: Optional["task_execution_on_conflict"]


class task_execution_bool_exp(BaseModel):
    and_: Optional[List["task_execution_bool_exp"]] = Field(alias="_and")
    not_: Optional["task_execution_bool_exp"] = Field(alias="_not")
    or_: Optional[List["task_execution_bool_exp"]] = Field(alias="_or")
    by_user: Optional["uuid_comparison_exp"]
    completed_at: Optional["timestamptz_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    details: Optional["jsonb_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    is_running: Optional["Boolean_comparison_exp"]
    orchestration_id: Optional["String_comparison_exp"]
    started_at: Optional["timestamptz_comparison_exp"]
    status: Optional["task_execution_status_enum_comparison_exp"]
    task: Optional["company_task_bool_exp"]
    task_id: Optional["uuid_comparison_exp"]
    trace_id: Optional["String_comparison_exp"]
    trace_parent_id: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class task_execution_delete_at_path_input(BaseModel):
    details: Optional[List[str]]


class task_execution_delete_elem_input(BaseModel):
    details: Optional[int]


class task_execution_delete_key_input(BaseModel):
    details: Optional[str]


class task_execution_insert_input(BaseModel):
    by_user: Optional[Any]
    completed_at: Optional[Any]
    created_at: Optional[Any]
    details: Optional[Any]
    id: Optional[Any]
    is_running: Optional[bool]
    orchestration_id: Optional[str]
    started_at: Optional[Any]
    status: Optional[task_execution_status_enum]
    task: Optional["company_task_obj_rel_insert_input"]
    task_id: Optional[Any]
    trace_id: Optional[str]
    trace_parent_id: Optional[str]
    updated_at: Optional[Any]


class task_execution_max_order_by(BaseModel):
    by_user: Optional[order_by]
    completed_at: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    orchestration_id: Optional[order_by]
    started_at: Optional[order_by]
    task_id: Optional[order_by]
    trace_id: Optional[order_by]
    trace_parent_id: Optional[order_by]
    updated_at: Optional[order_by]


class task_execution_min_order_by(BaseModel):
    by_user: Optional[order_by]
    completed_at: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    orchestration_id: Optional[order_by]
    started_at: Optional[order_by]
    task_id: Optional[order_by]
    trace_id: Optional[order_by]
    trace_parent_id: Optional[order_by]
    updated_at: Optional[order_by]


class task_execution_on_conflict(BaseModel):
    constraint: task_execution_constraint
    update_columns: List[task_execution_update_column]
    where: Optional["task_execution_bool_exp"]


class task_execution_order_by(BaseModel):
    by_user: Optional[order_by]
    completed_at: Optional[order_by]
    created_at: Optional[order_by]
    details: Optional[order_by]
    id: Optional[order_by]
    is_running: Optional[order_by]
    orchestration_id: Optional[order_by]
    started_at: Optional[order_by]
    status: Optional[order_by]
    task: Optional["company_task_order_by"]
    task_id: Optional[order_by]
    trace_id: Optional[order_by]
    trace_parent_id: Optional[order_by]
    updated_at: Optional[order_by]


class task_execution_pk_columns_input(BaseModel):
    id: Any


class task_execution_prepend_input(BaseModel):
    details: Optional[Any]


class task_execution_set_input(BaseModel):
    by_user: Optional[Any]
    completed_at: Optional[Any]
    created_at: Optional[Any]
    details: Optional[Any]
    id: Optional[Any]
    is_running: Optional[bool]
    orchestration_id: Optional[str]
    started_at: Optional[Any]
    status: Optional[task_execution_status_enum]
    task_id: Optional[Any]
    trace_id: Optional[str]
    trace_parent_id: Optional[str]
    updated_at: Optional[Any]


class task_execution_status_bool_exp(BaseModel):
    and_: Optional[List["task_execution_status_bool_exp"]] = Field(alias="_and")
    not_: Optional["task_execution_status_bool_exp"] = Field(alias="_not")
    or_: Optional[List["task_execution_status_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class task_execution_status_enum_comparison_exp(BaseModel):
    eq: Optional[task_execution_status_enum] = Field(alias="_eq")
    in_: Optional[List[task_execution_status_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[task_execution_status_enum] = Field(alias="_neq")
    nin: Optional[List[task_execution_status_enum]] = Field(alias="_nin")


class task_execution_status_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class task_execution_status_on_conflict(BaseModel):
    constraint: task_execution_status_constraint
    update_columns: List[task_execution_status_update_column]
    where: Optional["task_execution_status_bool_exp"]


class task_execution_status_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class task_execution_status_pk_columns_input(BaseModel):
    value: str


class task_execution_status_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class task_execution_status_stream_cursor_input(BaseModel):
    initial_value: "task_execution_status_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class task_execution_status_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class task_execution_status_updates(BaseModel):
    set: Optional["task_execution_status_set_input"] = Field(alias="_set")
    where: "task_execution_status_bool_exp"


class task_execution_stream_cursor_input(BaseModel):
    initial_value: "task_execution_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class task_execution_stream_cursor_value_input(BaseModel):
    by_user: Optional[Any]
    completed_at: Optional[Any]
    created_at: Optional[Any]
    details: Optional[Any]
    id: Optional[Any]
    is_running: Optional[bool]
    orchestration_id: Optional[str]
    started_at: Optional[Any]
    status: Optional[task_execution_status_enum]
    task_id: Optional[Any]
    trace_id: Optional[str]
    trace_parent_id: Optional[str]
    updated_at: Optional[Any]


class task_execution_updates(BaseModel):
    append: Optional["task_execution_append_input"] = Field(alias="_append")
    delete_at_path: Optional["task_execution_delete_at_path_input"] = Field(alias="_delete_at_path")
    delete_elem: Optional["task_execution_delete_elem_input"] = Field(alias="_delete_elem")
    delete_key: Optional["task_execution_delete_key_input"] = Field(alias="_delete_key")
    prepend: Optional["task_execution_prepend_input"] = Field(alias="_prepend")
    set: Optional["task_execution_set_input"] = Field(alias="_set")
    where: "task_execution_bool_exp"


class team_aggregate_bool_exp(BaseModel):
    count: Optional["team_aggregate_bool_exp_count"]


class team_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[team_select_column]]
    distinct: Optional[bool]
    filter: Optional["team_bool_exp"]
    predicate: "Int_comparison_exp"


class team_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["team_max_order_by"]
    min: Optional["team_min_order_by"]


class team_arr_rel_insert_input(BaseModel):
    data: List["team_insert_input"]
    on_conflict: Optional["team_on_conflict"]


class team_bool_exp(BaseModel):
    and_: Optional[List["team_bool_exp"]] = Field(alias="_and")
    not_: Optional["team_bool_exp"] = Field(alias="_not")
    or_: Optional[List["team_bool_exp"]] = Field(alias="_or")
    company: Optional["company_bool_exp"]
    company_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    name: Optional["String_comparison_exp"]
    users: Optional["team_user_bool_exp"]
    users_aggregate: Optional["team_user_aggregate_bool_exp"]


class team_insert_input(BaseModel):
    company: Optional["company_obj_rel_insert_input"]
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]
    users: Optional["team_user_arr_rel_insert_input"]


class team_max_order_by(BaseModel):
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]


class team_min_order_by(BaseModel):
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]


class team_obj_rel_insert_input(BaseModel):
    data: "team_insert_input"
    on_conflict: Optional["team_on_conflict"]


class team_on_conflict(BaseModel):
    constraint: team_constraint
    update_columns: List[team_update_column]
    where: Optional["team_bool_exp"]


class team_order_by(BaseModel):
    company: Optional["company_order_by"]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]
    users_aggregate: Optional["team_user_aggregate_order_by"]


class team_permission_bool_exp(BaseModel):
    and_: Optional[List["team_permission_bool_exp"]] = Field(alias="_and")
    not_: Optional["team_permission_bool_exp"] = Field(alias="_not")
    or_: Optional[List["team_permission_bool_exp"]] = Field(alias="_or")
    can_edit: Optional["Boolean_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    related_id: Optional["uuid_comparison_exp"]
    related_to: Optional["String_comparison_exp"]
    team: Optional["team_bool_exp"]
    team_id: Optional["uuid_comparison_exp"]


class team_permission_insert_input(BaseModel):
    can_edit: Optional[bool]
    created_at: Optional[Any]
    id: Optional[Any]
    related_id: Optional[Any]
    related_to: Optional[str]
    team: Optional["team_obj_rel_insert_input"]
    team_id: Optional[Any]


class team_permission_on_conflict(BaseModel):
    constraint: team_permission_constraint
    update_columns: List[team_permission_update_column]
    where: Optional["team_permission_bool_exp"]


class team_permission_order_by(BaseModel):
    can_edit: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    related_id: Optional[order_by]
    related_to: Optional[order_by]
    team: Optional["team_order_by"]
    team_id: Optional[order_by]


class team_permission_pk_columns_input(BaseModel):
    id: Any


class team_permission_set_input(BaseModel):
    can_edit: Optional[bool]
    created_at: Optional[Any]
    id: Optional[Any]
    related_id: Optional[Any]
    related_to: Optional[str]
    team_id: Optional[Any]


class team_permission_stream_cursor_input(BaseModel):
    initial_value: "team_permission_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class team_permission_stream_cursor_value_input(BaseModel):
    can_edit: Optional[bool]
    created_at: Optional[Any]
    id: Optional[Any]
    related_id: Optional[Any]
    related_to: Optional[str]
    team_id: Optional[Any]


class team_permission_updates(BaseModel):
    set: Optional["team_permission_set_input"] = Field(alias="_set")
    where: "team_permission_bool_exp"


class team_pk_columns_input(BaseModel):
    id: Any


class team_set_input(BaseModel):
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]


class team_stream_cursor_input(BaseModel):
    initial_value: "team_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class team_stream_cursor_value_input(BaseModel):
    company_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    name: Optional[str]


class team_updates(BaseModel):
    set: Optional["team_set_input"] = Field(alias="_set")
    where: "team_bool_exp"


class team_user_aggregate_bool_exp(BaseModel):
    count: Optional["team_user_aggregate_bool_exp_count"]


class team_user_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[team_user_select_column]]
    distinct: Optional[bool]
    filter: Optional["team_user_bool_exp"]
    predicate: "Int_comparison_exp"


class team_user_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["team_user_max_order_by"]
    min: Optional["team_user_min_order_by"]


class team_user_arr_rel_insert_input(BaseModel):
    data: List["team_user_insert_input"]
    on_conflict: Optional["team_user_on_conflict"]


class team_user_bool_exp(BaseModel):
    and_: Optional[List["team_user_bool_exp"]] = Field(alias="_and")
    not_: Optional["team_user_bool_exp"] = Field(alias="_not")
    or_: Optional[List["team_user_bool_exp"]] = Field(alias="_or")
    company_user: Optional["company_user_bool_exp"]
    company_user_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    team: Optional["team_bool_exp"]
    team_id: Optional["uuid_comparison_exp"]


class team_user_insert_input(BaseModel):
    company_user: Optional["company_user_obj_rel_insert_input"]
    company_user_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    team: Optional["team_obj_rel_insert_input"]
    team_id: Optional[Any]


class team_user_max_order_by(BaseModel):
    company_user_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    team_id: Optional[order_by]


class team_user_min_order_by(BaseModel):
    company_user_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    team_id: Optional[order_by]


class team_user_on_conflict(BaseModel):
    constraint: team_user_constraint
    update_columns: List[team_user_update_column]
    where: Optional["team_user_bool_exp"]


class team_user_order_by(BaseModel):
    company_user: Optional["company_user_order_by"]
    company_user_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    team: Optional["team_order_by"]
    team_id: Optional[order_by]


class team_user_pk_columns_input(BaseModel):
    id: Any


class team_user_set_input(BaseModel):
    company_user_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    team_id: Optional[Any]


class team_user_stream_cursor_input(BaseModel):
    initial_value: "team_user_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class team_user_stream_cursor_value_input(BaseModel):
    company_user_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    team_id: Optional[Any]


class team_user_updates(BaseModel):
    set: Optional["team_user_set_input"] = Field(alias="_set")
    where: "team_user_bool_exp"


class timestamptz_comparison_exp(BaseModel):
    eq: Optional[Any] = Field(alias="_eq")
    gt: Optional[Any] = Field(alias="_gt")
    gte: Optional[Any] = Field(alias="_gte")
    in_: Optional[List[Any]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    lt: Optional[Any] = Field(alias="_lt")
    lte: Optional[Any] = Field(alias="_lte")
    neq: Optional[Any] = Field(alias="_neq")
    nin: Optional[List[Any]] = Field(alias="_nin")


class training_request_aggregate_bool_exp(BaseModel):
    bool_and: Optional["training_request_aggregate_bool_exp_bool_and"]
    bool_or: Optional["training_request_aggregate_bool_exp_bool_or"]
    count: Optional["training_request_aggregate_bool_exp_count"]


class training_request_aggregate_bool_exp_bool_and(BaseModel):
    arguments: training_request_select_column_training_request_aggregate_bool_exp_bool_and_arguments_columns
    distinct: Optional[bool]
    filter: Optional["training_request_bool_exp"]
    predicate: "Boolean_comparison_exp"


class training_request_aggregate_bool_exp_bool_or(BaseModel):
    arguments: training_request_select_column_training_request_aggregate_bool_exp_bool_or_arguments_columns
    distinct: Optional[bool]
    filter: Optional["training_request_bool_exp"]
    predicate: "Boolean_comparison_exp"


class training_request_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[training_request_select_column]]
    distinct: Optional[bool]
    filter: Optional["training_request_bool_exp"]
    predicate: "Int_comparison_exp"


class training_request_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["training_request_max_order_by"]
    min: Optional["training_request_min_order_by"]


class training_request_arr_rel_insert_input(BaseModel):
    data: List["training_request_insert_input"]
    on_conflict: Optional["training_request_on_conflict"]


class training_request_bool_exp(BaseModel):
    and_: Optional[List["training_request_bool_exp"]] = Field(alias="_and")
    not_: Optional["training_request_bool_exp"] = Field(alias="_not")
    or_: Optional[List["training_request_bool_exp"]] = Field(alias="_or")
    assigned_to: Optional["uuid_comparison_exp"]
    assignee: Optional["user_bool_exp"]
    chat: Optional["chat_bool_exp"]
    chat_id: Optional["uuid_comparison_exp"]
    company: Optional["company_bool_exp"]
    company_id: Optional["uuid_comparison_exp"]
    context: Optional["String_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    created_by: Optional["uuid_comparison_exp"]
    dataset: Optional["dataset_bool_exp"]
    dataset_id: Optional["uuid_comparison_exp"]
    email_context: Optional["String_comparison_exp"]
    email_requester: Optional["Boolean_comparison_exp"]
    email_sent_at: Optional["timestamptz_comparison_exp"]
    group_slug: Optional["String_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    llm_training: Optional["llm_training_bool_exp"]
    plot_slug: Optional["String_comparison_exp"]
    status: Optional["trainining_request_status_enum_comparison_exp"]
    status_updated_at: Optional["timestamptz_comparison_exp"]
    training_id: Optional["uuid_comparison_exp"]
    type: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    user: Optional["user_bool_exp"]


class training_request_insert_input(BaseModel):
    assigned_to: Optional[Any]
    assignee: Optional["user_obj_rel_insert_input"]
    chat: Optional["chat_obj_rel_insert_input"]
    chat_id: Optional[Any]
    company: Optional["company_obj_rel_insert_input"]
    company_id: Optional[Any]
    context: Optional[str]
    created_at: Optional[Any]
    created_by: Optional[Any]
    dataset: Optional["dataset_obj_rel_insert_input"]
    dataset_id: Optional[Any]
    email_context: Optional[str]
    email_requester: Optional[bool]
    email_sent_at: Optional[Any]
    group_slug: Optional[str]
    id: Optional[Any]
    llm_training: Optional["llm_training_obj_rel_insert_input"]
    plot_slug: Optional[str]
    status: Optional[trainining_request_status_enum]
    status_updated_at: Optional[Any]
    training_id: Optional[Any]
    type: Optional[str]
    updated_at: Optional[Any]
    user: Optional["user_obj_rel_insert_input"]


class training_request_max_order_by(BaseModel):
    assigned_to: Optional[order_by]
    chat_id: Optional[order_by]
    company_id: Optional[order_by]
    context: Optional[order_by]
    created_at: Optional[order_by]
    created_by: Optional[order_by]
    dataset_id: Optional[order_by]
    email_context: Optional[order_by]
    email_sent_at: Optional[order_by]
    group_slug: Optional[order_by]
    id: Optional[order_by]
    plot_slug: Optional[order_by]
    status_updated_at: Optional[order_by]
    training_id: Optional[order_by]
    type: Optional[order_by]
    updated_at: Optional[order_by]


class training_request_min_order_by(BaseModel):
    assigned_to: Optional[order_by]
    chat_id: Optional[order_by]
    company_id: Optional[order_by]
    context: Optional[order_by]
    created_at: Optional[order_by]
    created_by: Optional[order_by]
    dataset_id: Optional[order_by]
    email_context: Optional[order_by]
    email_sent_at: Optional[order_by]
    group_slug: Optional[order_by]
    id: Optional[order_by]
    plot_slug: Optional[order_by]
    status_updated_at: Optional[order_by]
    training_id: Optional[order_by]
    type: Optional[order_by]
    updated_at: Optional[order_by]


class training_request_on_conflict(BaseModel):
    constraint: training_request_constraint
    update_columns: List[training_request_update_column]
    where: Optional["training_request_bool_exp"]


class training_request_order_by(BaseModel):
    assigned_to: Optional[order_by]
    assignee: Optional["user_order_by"]
    chat: Optional["chat_order_by"]
    chat_id: Optional[order_by]
    company: Optional["company_order_by"]
    company_id: Optional[order_by]
    context: Optional[order_by]
    created_at: Optional[order_by]
    created_by: Optional[order_by]
    dataset: Optional["dataset_order_by"]
    dataset_id: Optional[order_by]
    email_context: Optional[order_by]
    email_requester: Optional[order_by]
    email_sent_at: Optional[order_by]
    group_slug: Optional[order_by]
    id: Optional[order_by]
    llm_training: Optional["llm_training_order_by"]
    plot_slug: Optional[order_by]
    status: Optional[order_by]
    status_updated_at: Optional[order_by]
    training_id: Optional[order_by]
    type: Optional[order_by]
    updated_at: Optional[order_by]
    user: Optional["user_order_by"]


class training_request_pk_columns_input(BaseModel):
    id: Any


class training_request_set_input(BaseModel):
    assigned_to: Optional[Any]
    chat_id: Optional[Any]
    company_id: Optional[Any]
    context: Optional[str]
    created_at: Optional[Any]
    created_by: Optional[Any]
    dataset_id: Optional[Any]
    email_context: Optional[str]
    email_requester: Optional[bool]
    email_sent_at: Optional[Any]
    group_slug: Optional[str]
    id: Optional[Any]
    plot_slug: Optional[str]
    status: Optional[trainining_request_status_enum]
    status_updated_at: Optional[Any]
    training_id: Optional[Any]
    type: Optional[str]
    updated_at: Optional[Any]


class training_request_stream_cursor_input(BaseModel):
    initial_value: "training_request_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class training_request_stream_cursor_value_input(BaseModel):
    assigned_to: Optional[Any]
    chat_id: Optional[Any]
    company_id: Optional[Any]
    context: Optional[str]
    created_at: Optional[Any]
    created_by: Optional[Any]
    dataset_id: Optional[Any]
    email_context: Optional[str]
    email_requester: Optional[bool]
    email_sent_at: Optional[Any]
    group_slug: Optional[str]
    id: Optional[Any]
    plot_slug: Optional[str]
    status: Optional[trainining_request_status_enum]
    status_updated_at: Optional[Any]
    training_id: Optional[Any]
    type: Optional[str]
    updated_at: Optional[Any]


class training_request_updates(BaseModel):
    set: Optional["training_request_set_input"] = Field(alias="_set")
    where: "training_request_bool_exp"


class trainining_request_status_bool_exp(BaseModel):
    and_: Optional[List["trainining_request_status_bool_exp"]] = Field(alias="_and")
    not_: Optional["trainining_request_status_bool_exp"] = Field(alias="_not")
    or_: Optional[List["trainining_request_status_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class trainining_request_status_enum_comparison_exp(BaseModel):
    eq: Optional[trainining_request_status_enum] = Field(alias="_eq")
    in_: Optional[List[trainining_request_status_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[trainining_request_status_enum] = Field(alias="_neq")
    nin: Optional[List[trainining_request_status_enum]] = Field(alias="_nin")


class trainining_request_status_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class trainining_request_status_on_conflict(BaseModel):
    constraint: trainining_request_status_constraint
    update_columns: List[trainining_request_status_update_column]
    where: Optional["trainining_request_status_bool_exp"]


class trainining_request_status_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class trainining_request_status_pk_columns_input(BaseModel):
    value: str


class trainining_request_status_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class trainining_request_status_stream_cursor_input(BaseModel):
    initial_value: "trainining_request_status_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class trainining_request_status_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class trainining_request_status_updates(BaseModel):
    set: Optional["trainining_request_status_set_input"] = Field(alias="_set")
    where: "trainining_request_status_bool_exp"


class tranformation_enriched_activities_aggregate_bool_exp(BaseModel):
    count: Optional["tranformation_enriched_activities_aggregate_bool_exp_count"]


class tranformation_enriched_activities_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[tranformation_enriched_activities_select_column]]
    distinct: Optional[bool]
    filter: Optional["tranformation_enriched_activities_bool_exp"]
    predicate: "Int_comparison_exp"


class tranformation_enriched_activities_aggregate_order_by(BaseModel):
    avg: Optional["tranformation_enriched_activities_avg_order_by"]
    count: Optional[order_by]
    max: Optional["tranformation_enriched_activities_max_order_by"]
    min: Optional["tranformation_enriched_activities_min_order_by"]
    stddev: Optional["tranformation_enriched_activities_stddev_order_by"]
    stddev_pop: Optional["tranformation_enriched_activities_stddev_pop_order_by"]
    stddev_samp: Optional["tranformation_enriched_activities_stddev_samp_order_by"]
    sum: Optional["tranformation_enriched_activities_sum_order_by"]
    var_pop: Optional["tranformation_enriched_activities_var_pop_order_by"]
    var_samp: Optional["tranformation_enriched_activities_var_samp_order_by"]
    variance: Optional["tranformation_enriched_activities_variance_order_by"]


class tranformation_enriched_activities_arr_rel_insert_input(BaseModel):
    data: List["tranformation_enriched_activities_insert_input"]
    on_conflict: Optional["tranformation_enriched_activities_on_conflict"]


class tranformation_enriched_activities_avg_order_by(BaseModel):
    id: Optional[order_by]


class tranformation_enriched_activities_bool_exp(BaseModel):
    and_: Optional[List["tranformation_enriched_activities_bool_exp"]] = Field(alias="_and")
    not_: Optional["tranformation_enriched_activities_bool_exp"] = Field(alias="_not")
    or_: Optional[List["tranformation_enriched_activities_bool_exp"]] = Field(alias="_or")
    activity: Optional["activity_bool_exp"]
    activity_id: Optional["uuid_comparison_exp"]
    column: Optional["String_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["Int_comparison_exp"]
    transformation: Optional["transformation_bool_exp"]
    transformation_id: Optional["uuid_comparison_exp"]


class tranformation_enriched_activities_inc_input(BaseModel):
    id: Optional[int]


class tranformation_enriched_activities_insert_input(BaseModel):
    activity: Optional["activity_obj_rel_insert_input"]
    activity_id: Optional[Any]
    column: Optional[str]
    created_at: Optional[Any]
    id: Optional[int]
    transformation: Optional["transformation_obj_rel_insert_input"]
    transformation_id: Optional[Any]


class tranformation_enriched_activities_max_order_by(BaseModel):
    activity_id: Optional[order_by]
    column: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    transformation_id: Optional[order_by]


class tranformation_enriched_activities_min_order_by(BaseModel):
    activity_id: Optional[order_by]
    column: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    transformation_id: Optional[order_by]


class tranformation_enriched_activities_on_conflict(BaseModel):
    constraint: tranformation_enriched_activities_constraint
    update_columns: List[tranformation_enriched_activities_update_column]
    where: Optional["tranformation_enriched_activities_bool_exp"]


class tranformation_enriched_activities_order_by(BaseModel):
    activity: Optional["activity_order_by"]
    activity_id: Optional[order_by]
    column: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    transformation: Optional["transformation_order_by"]
    transformation_id: Optional[order_by]


class tranformation_enriched_activities_pk_columns_input(BaseModel):
    id: int


class tranformation_enriched_activities_set_input(BaseModel):
    activity_id: Optional[Any]
    column: Optional[str]
    created_at: Optional[Any]
    id: Optional[int]
    transformation_id: Optional[Any]


class tranformation_enriched_activities_stddev_order_by(BaseModel):
    id: Optional[order_by]


class tranformation_enriched_activities_stddev_pop_order_by(BaseModel):
    id: Optional[order_by]


class tranformation_enriched_activities_stddev_samp_order_by(BaseModel):
    id: Optional[order_by]


class tranformation_enriched_activities_stream_cursor_input(BaseModel):
    initial_value: "tranformation_enriched_activities_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class tranformation_enriched_activities_stream_cursor_value_input(BaseModel):
    activity_id: Optional[Any]
    column: Optional[str]
    created_at: Optional[Any]
    id: Optional[int]
    transformation_id: Optional[Any]


class tranformation_enriched_activities_sum_order_by(BaseModel):
    id: Optional[order_by]


class tranformation_enriched_activities_updates(BaseModel):
    inc: Optional["tranformation_enriched_activities_inc_input"] = Field(alias="_inc")
    set: Optional["tranformation_enriched_activities_set_input"] = Field(alias="_set")
    where: "tranformation_enriched_activities_bool_exp"


class tranformation_enriched_activities_var_pop_order_by(BaseModel):
    id: Optional[order_by]


class tranformation_enriched_activities_var_samp_order_by(BaseModel):
    id: Optional[order_by]


class tranformation_enriched_activities_variance_order_by(BaseModel):
    id: Optional[order_by]


class transformation_activities_aggregate_bool_exp(BaseModel):
    count: Optional["transformation_activities_aggregate_bool_exp_count"]


class transformation_activities_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[transformation_activities_select_column]]
    distinct: Optional[bool]
    filter: Optional["transformation_activities_bool_exp"]
    predicate: "Int_comparison_exp"


class transformation_activities_aggregate_order_by(BaseModel):
    avg: Optional["transformation_activities_avg_order_by"]
    count: Optional[order_by]
    max: Optional["transformation_activities_max_order_by"]
    min: Optional["transformation_activities_min_order_by"]
    stddev: Optional["transformation_activities_stddev_order_by"]
    stddev_pop: Optional["transformation_activities_stddev_pop_order_by"]
    stddev_samp: Optional["transformation_activities_stddev_samp_order_by"]
    sum: Optional["transformation_activities_sum_order_by"]
    var_pop: Optional["transformation_activities_var_pop_order_by"]
    var_samp: Optional["transformation_activities_var_samp_order_by"]
    variance: Optional["transformation_activities_variance_order_by"]


class transformation_activities_arr_rel_insert_input(BaseModel):
    data: List["transformation_activities_insert_input"]
    on_conflict: Optional["transformation_activities_on_conflict"]


class transformation_activities_avg_order_by(BaseModel):
    id: Optional[order_by]


class transformation_activities_bool_exp(BaseModel):
    and_: Optional[List["transformation_activities_bool_exp"]] = Field(alias="_and")
    not_: Optional["transformation_activities_bool_exp"] = Field(alias="_not")
    or_: Optional[List["transformation_activities_bool_exp"]] = Field(alias="_or")
    activity: Optional["activity_bool_exp"]
    activity_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["Int_comparison_exp"]
    transformation: Optional["transformation_bool_exp"]
    transformation_id: Optional["uuid_comparison_exp"]


class transformation_activities_inc_input(BaseModel):
    id: Optional[int]


class transformation_activities_insert_input(BaseModel):
    activity: Optional["activity_obj_rel_insert_input"]
    activity_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[int]
    transformation: Optional["transformation_obj_rel_insert_input"]
    transformation_id: Optional[Any]


class transformation_activities_max_order_by(BaseModel):
    activity_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    transformation_id: Optional[order_by]


class transformation_activities_min_order_by(BaseModel):
    activity_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    transformation_id: Optional[order_by]


class transformation_activities_on_conflict(BaseModel):
    constraint: transformation_activities_constraint
    update_columns: List[transformation_activities_update_column]
    where: Optional["transformation_activities_bool_exp"]


class transformation_activities_order_by(BaseModel):
    activity: Optional["activity_order_by"]
    activity_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    transformation: Optional["transformation_order_by"]
    transformation_id: Optional[order_by]


class transformation_activities_pk_columns_input(BaseModel):
    id: int


class transformation_activities_set_input(BaseModel):
    activity_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[int]
    transformation_id: Optional[Any]


class transformation_activities_stddev_order_by(BaseModel):
    id: Optional[order_by]


class transformation_activities_stddev_pop_order_by(BaseModel):
    id: Optional[order_by]


class transformation_activities_stddev_samp_order_by(BaseModel):
    id: Optional[order_by]


class transformation_activities_stream_cursor_input(BaseModel):
    initial_value: "transformation_activities_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class transformation_activities_stream_cursor_value_input(BaseModel):
    activity_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[int]
    transformation_id: Optional[Any]


class transformation_activities_sum_order_by(BaseModel):
    id: Optional[order_by]


class transformation_activities_updates(BaseModel):
    inc: Optional["transformation_activities_inc_input"] = Field(alias="_inc")
    set: Optional["transformation_activities_set_input"] = Field(alias="_set")
    where: "transformation_activities_bool_exp"


class transformation_activities_var_pop_order_by(BaseModel):
    id: Optional[order_by]


class transformation_activities_var_samp_order_by(BaseModel):
    id: Optional[order_by]


class transformation_activities_variance_order_by(BaseModel):
    id: Optional[order_by]


class transformation_aggregate_bool_exp(BaseModel):
    bool_and: Optional["transformation_aggregate_bool_exp_bool_and"]
    bool_or: Optional["transformation_aggregate_bool_exp_bool_or"]
    count: Optional["transformation_aggregate_bool_exp_count"]


class transformation_aggregate_bool_exp_bool_and(BaseModel):
    arguments: transformation_select_column_transformation_aggregate_bool_exp_bool_and_arguments_columns
    distinct: Optional[bool]
    filter: Optional["transformation_bool_exp"]
    predicate: "Boolean_comparison_exp"


class transformation_aggregate_bool_exp_bool_or(BaseModel):
    arguments: transformation_select_column_transformation_aggregate_bool_exp_bool_or_arguments_columns
    distinct: Optional[bool]
    filter: Optional["transformation_bool_exp"]
    predicate: "Boolean_comparison_exp"


class transformation_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[transformation_select_column]]
    distinct: Optional[bool]
    filter: Optional["transformation_bool_exp"]
    predicate: "Int_comparison_exp"


class transformation_aggregate_order_by(BaseModel):
    avg: Optional["transformation_avg_order_by"]
    count: Optional[order_by]
    max: Optional["transformation_max_order_by"]
    min: Optional["transformation_min_order_by"]
    stddev: Optional["transformation_stddev_order_by"]
    stddev_pop: Optional["transformation_stddev_pop_order_by"]
    stddev_samp: Optional["transformation_stddev_samp_order_by"]
    sum: Optional["transformation_sum_order_by"]
    var_pop: Optional["transformation_var_pop_order_by"]
    var_samp: Optional["transformation_var_samp_order_by"]
    variance: Optional["transformation_variance_order_by"]


class transformation_arr_rel_insert_input(BaseModel):
    data: List["transformation_insert_input"]
    on_conflict: Optional["transformation_on_conflict"]


class transformation_avg_order_by(BaseModel):
    delete_window: Optional[order_by]
    max_days_to_insert: Optional[order_by]
    mutable_day_window: Optional[order_by]
    notify_row_count_percent_change: Optional[order_by]


class transformation_bool_exp(BaseModel):
    and_: Optional[List["transformation_bool_exp"]] = Field(alias="_and")
    not_: Optional["transformation_bool_exp"] = Field(alias="_not")
    or_: Optional[List["transformation_bool_exp"]] = Field(alias="_or")
    activities: Optional["transformation_activities_bool_exp"]
    activities_aggregate: Optional["transformation_activities_aggregate_bool_exp"]
    allow_future_data: Optional["Boolean_comparison_exp"]
    category_id: Optional["uuid_comparison_exp"]
    column_renames: Optional["transformation_column_renames_bool_exp"]
    column_renames_aggregate: Optional["transformation_column_renames_aggregate_bool_exp"]
    company: Optional["company_bool_exp"]
    company_category: Optional["company_categories_bool_exp"]
    company_id: Optional["uuid_comparison_exp"]
    company_task: Optional["company_task_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    current_query: Optional["current_tranformation_sql_queries_bool_exp"]
    delete_window: Optional["Int_comparison_exp"]
    depends_on_transformations: Optional["transformation_depends_on_bool_exp"]
    depends_on_transformations_aggregate: Optional["transformation_depends_on_aggregate_bool_exp"]
    do_not_delete_on_resync: Optional["Boolean_comparison_exp"]
    do_not_update_on_percent_change: Optional["Boolean_comparison_exp"]
    enriched_activities: Optional["tranformation_enriched_activities_bool_exp"]
    enriched_activities_aggregate: Optional["tranformation_enriched_activities_aggregate_bool_exp"]
    has_source: Optional["Boolean_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    is_aliasing: Optional["Boolean_comparison_exp"]
    kind: Optional["transformation_kinds_enum_comparison_exp"]
    last_diff_data_and_insert_at: Optional["timestamptz_comparison_exp"]
    last_identity_resolution_updated_at: Optional["timestamptz_comparison_exp"]
    last_resynced_at: Optional["timestamptz_comparison_exp"]
    max_days_to_insert: Optional["Int_comparison_exp"]
    mutable_day_window: Optional["Int_comparison_exp"]
    name: Optional["String_comparison_exp"]
    next_resync_at: Optional["timestamptz_comparison_exp"]
    notes: Optional["String_comparison_exp"]
    notify_row_count_percent_change: Optional["numeric_comparison_exp"]
    production_queries: Optional["production_tranformation_sql_queries_bool_exp"]
    production_queries_aggregate: Optional["production_tranformation_sql_queries_aggregate_bool_exp"]
    query_updates: Optional["query_updates_bool_exp"]
    query_updates_aggregate: Optional["query_updates_aggregate_bool_exp"]
    question_answers: Optional["transformation_questions_bool_exp"]
    question_answers_aggregate: Optional["transformation_questions_aggregate_bool_exp"]
    remove_customers: Optional["Boolean_comparison_exp"]
    run_after_transformations: Optional["transformation_run_after_bool_exp"]
    run_after_transformations_aggregate: Optional["transformation_run_after_aggregate_bool_exp"]
    scratchpad_queries: Optional["scratchpad_tranformation_sql_queries_bool_exp"]
    scratchpad_queries_aggregate: Optional["scratchpad_tranformation_sql_queries_aggregate_bool_exp"]
    single_activity: Optional["Boolean_comparison_exp"]
    slug: Optional["String_comparison_exp"]
    start_data_after: Optional["date_comparison_exp"]
    table: Optional["String_comparison_exp"]
    task_id: Optional["uuid_comparison_exp"]
    tests: Optional["transformation_test_bool_exp"]
    tests_aggregate: Optional["transformation_test_aggregate_bool_exp"]
    transformation_maintenances: Optional["transformation_maintenance_bool_exp"]
    transformation_maintenances_aggregate: Optional["transformation_maintenance_aggregate_bool_exp"]
    update_type: Optional["transformation_update_types_enum_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    updated_by: Optional["uuid_comparison_exp"]
    validation_queries: Optional["validation_tranformation_sql_queries_bool_exp"]
    validation_queries_aggregate: Optional["validation_tranformation_sql_queries_aggregate_bool_exp"]


class transformation_column_renames_aggregate_bool_exp(BaseModel):
    bool_and: Optional["transformation_column_renames_aggregate_bool_exp_bool_and"]
    bool_or: Optional["transformation_column_renames_aggregate_bool_exp_bool_or"]
    count: Optional["transformation_column_renames_aggregate_bool_exp_count"]


class transformation_column_renames_aggregate_bool_exp_bool_and(BaseModel):
    arguments: transformation_column_renames_select_column_transformation_column_renames_aggregate_bool_exp_bool_and_arguments_columns
    distinct: Optional[bool]
    filter: Optional["transformation_column_renames_bool_exp"]
    predicate: "Boolean_comparison_exp"


class transformation_column_renames_aggregate_bool_exp_bool_or(BaseModel):
    arguments: transformation_column_renames_select_column_transformation_column_renames_aggregate_bool_exp_bool_or_arguments_columns
    distinct: Optional[bool]
    filter: Optional["transformation_column_renames_bool_exp"]
    predicate: "Boolean_comparison_exp"


class transformation_column_renames_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[transformation_column_renames_select_column]]
    distinct: Optional[bool]
    filter: Optional["transformation_column_renames_bool_exp"]
    predicate: "Int_comparison_exp"


class transformation_column_renames_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["transformation_column_renames_max_order_by"]
    min: Optional["transformation_column_renames_min_order_by"]


class transformation_column_renames_arr_rel_insert_input(BaseModel):
    data: List["transformation_column_renames_insert_input"]


class transformation_column_renames_bool_exp(BaseModel):
    and_: Optional[List["transformation_column_renames_bool_exp"]] = Field(alias="_and")
    not_: Optional["transformation_column_renames_bool_exp"] = Field(alias="_not")
    or_: Optional[List["transformation_column_renames_bool_exp"]] = Field(alias="_or")
    casting: Optional["String_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    description: Optional["String_comparison_exp"]
    has_data: Optional["Boolean_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    label: Optional["String_comparison_exp"]
    name: Optional["String_comparison_exp"]
    related_to: Optional["String_comparison_exp"]
    related_to_id: Optional["uuid_comparison_exp"]
    transformation: Optional["transformation_bool_exp"]
    transformation_id: Optional["uuid_comparison_exp"]
    type: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class transformation_column_renames_insert_input(BaseModel):
    casting: Optional[str]
    created_at: Optional[Any]
    description: Optional[str]
    has_data: Optional[bool]
    id: Optional[Any]
    label: Optional[str]
    name: Optional[str]
    related_to: Optional[str]
    related_to_id: Optional[Any]
    transformation: Optional["transformation_obj_rel_insert_input"]
    transformation_id: Optional[Any]
    type: Optional[str]
    updated_at: Optional[Any]


class transformation_column_renames_max_order_by(BaseModel):
    casting: Optional[order_by]
    created_at: Optional[order_by]
    description: Optional[order_by]
    id: Optional[order_by]
    label: Optional[order_by]
    name: Optional[order_by]
    related_to: Optional[order_by]
    related_to_id: Optional[order_by]
    transformation_id: Optional[order_by]
    type: Optional[order_by]
    updated_at: Optional[order_by]


class transformation_column_renames_min_order_by(BaseModel):
    casting: Optional[order_by]
    created_at: Optional[order_by]
    description: Optional[order_by]
    id: Optional[order_by]
    label: Optional[order_by]
    name: Optional[order_by]
    related_to: Optional[order_by]
    related_to_id: Optional[order_by]
    transformation_id: Optional[order_by]
    type: Optional[order_by]
    updated_at: Optional[order_by]


class transformation_column_renames_order_by(BaseModel):
    casting: Optional[order_by]
    created_at: Optional[order_by]
    description: Optional[order_by]
    has_data: Optional[order_by]
    id: Optional[order_by]
    label: Optional[order_by]
    name: Optional[order_by]
    related_to: Optional[order_by]
    related_to_id: Optional[order_by]
    transformation: Optional["transformation_order_by"]
    transformation_id: Optional[order_by]
    type: Optional[order_by]
    updated_at: Optional[order_by]


class transformation_column_renames_set_input(BaseModel):
    casting: Optional[str]
    created_at: Optional[Any]
    description: Optional[str]
    has_data: Optional[bool]
    id: Optional[Any]
    label: Optional[str]
    name: Optional[str]
    related_to: Optional[str]
    related_to_id: Optional[Any]
    transformation_id: Optional[Any]
    type: Optional[str]
    updated_at: Optional[Any]


class transformation_column_renames_stream_cursor_input(BaseModel):
    initial_value: "transformation_column_renames_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class transformation_column_renames_stream_cursor_value_input(BaseModel):
    casting: Optional[str]
    created_at: Optional[Any]
    description: Optional[str]
    has_data: Optional[bool]
    id: Optional[Any]
    label: Optional[str]
    name: Optional[str]
    related_to: Optional[str]
    related_to_id: Optional[Any]
    transformation_id: Optional[Any]
    type: Optional[str]
    updated_at: Optional[Any]


class transformation_column_renames_updates(BaseModel):
    set: Optional["transformation_column_renames_set_input"] = Field(alias="_set")
    where: "transformation_column_renames_bool_exp"


class transformation_depends_on_aggregate_bool_exp(BaseModel):
    count: Optional["transformation_depends_on_aggregate_bool_exp_count"]


class transformation_depends_on_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[transformation_depends_on_select_column]]
    distinct: Optional[bool]
    filter: Optional["transformation_depends_on_bool_exp"]
    predicate: "Int_comparison_exp"


class transformation_depends_on_aggregate_order_by(BaseModel):
    avg: Optional["transformation_depends_on_avg_order_by"]
    count: Optional[order_by]
    max: Optional["transformation_depends_on_max_order_by"]
    min: Optional["transformation_depends_on_min_order_by"]
    stddev: Optional["transformation_depends_on_stddev_order_by"]
    stddev_pop: Optional["transformation_depends_on_stddev_pop_order_by"]
    stddev_samp: Optional["transformation_depends_on_stddev_samp_order_by"]
    sum: Optional["transformation_depends_on_sum_order_by"]
    var_pop: Optional["transformation_depends_on_var_pop_order_by"]
    var_samp: Optional["transformation_depends_on_var_samp_order_by"]
    variance: Optional["transformation_depends_on_variance_order_by"]


class transformation_depends_on_arr_rel_insert_input(BaseModel):
    data: List["transformation_depends_on_insert_input"]
    on_conflict: Optional["transformation_depends_on_on_conflict"]


class transformation_depends_on_avg_order_by(BaseModel):
    id: Optional[order_by]


class transformation_depends_on_bool_exp(BaseModel):
    and_: Optional[List["transformation_depends_on_bool_exp"]] = Field(alias="_and")
    not_: Optional["transformation_depends_on_bool_exp"] = Field(alias="_not")
    or_: Optional[List["transformation_depends_on_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    depends_on_transformation_id: Optional["uuid_comparison_exp"]
    depends_on_transformations: Optional["transformation_bool_exp"]
    id: Optional["Int_comparison_exp"]
    transformation_id: Optional["uuid_comparison_exp"]


class transformation_depends_on_inc_input(BaseModel):
    id: Optional[int]


class transformation_depends_on_insert_input(BaseModel):
    created_at: Optional[Any]
    depends_on_transformation_id: Optional[Any]
    depends_on_transformations: Optional["transformation_obj_rel_insert_input"]
    id: Optional[int]
    transformation_id: Optional[Any]


class transformation_depends_on_max_order_by(BaseModel):
    created_at: Optional[order_by]
    depends_on_transformation_id: Optional[order_by]
    id: Optional[order_by]
    transformation_id: Optional[order_by]


class transformation_depends_on_min_order_by(BaseModel):
    created_at: Optional[order_by]
    depends_on_transformation_id: Optional[order_by]
    id: Optional[order_by]
    transformation_id: Optional[order_by]


class transformation_depends_on_on_conflict(BaseModel):
    constraint: transformation_depends_on_constraint
    update_columns: List[transformation_depends_on_update_column]
    where: Optional["transformation_depends_on_bool_exp"]


class transformation_depends_on_order_by(BaseModel):
    created_at: Optional[order_by]
    depends_on_transformation_id: Optional[order_by]
    depends_on_transformations: Optional["transformation_order_by"]
    id: Optional[order_by]
    transformation_id: Optional[order_by]


class transformation_depends_on_pk_columns_input(BaseModel):
    id: int


class transformation_depends_on_set_input(BaseModel):
    created_at: Optional[Any]
    depends_on_transformation_id: Optional[Any]
    id: Optional[int]
    transformation_id: Optional[Any]


class transformation_depends_on_stddev_order_by(BaseModel):
    id: Optional[order_by]


class transformation_depends_on_stddev_pop_order_by(BaseModel):
    id: Optional[order_by]


class transformation_depends_on_stddev_samp_order_by(BaseModel):
    id: Optional[order_by]


class transformation_depends_on_stream_cursor_input(BaseModel):
    initial_value: "transformation_depends_on_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class transformation_depends_on_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    depends_on_transformation_id: Optional[Any]
    id: Optional[int]
    transformation_id: Optional[Any]


class transformation_depends_on_sum_order_by(BaseModel):
    id: Optional[order_by]


class transformation_depends_on_updates(BaseModel):
    inc: Optional["transformation_depends_on_inc_input"] = Field(alias="_inc")
    set: Optional["transformation_depends_on_set_input"] = Field(alias="_set")
    where: "transformation_depends_on_bool_exp"


class transformation_depends_on_var_pop_order_by(BaseModel):
    id: Optional[order_by]


class transformation_depends_on_var_samp_order_by(BaseModel):
    id: Optional[order_by]


class transformation_depends_on_variance_order_by(BaseModel):
    id: Optional[order_by]


class transformation_inc_input(BaseModel):
    delete_window: Optional[int]
    max_days_to_insert: Optional[int]
    mutable_day_window: Optional[int]
    notify_row_count_percent_change: Optional[Any]


class transformation_insert_input(BaseModel):
    activities: Optional["transformation_activities_arr_rel_insert_input"]
    allow_future_data: Optional[bool]
    category_id: Optional[Any]
    column_renames: Optional["transformation_column_renames_arr_rel_insert_input"]
    company: Optional["company_obj_rel_insert_input"]
    company_category: Optional["company_categories_obj_rel_insert_input"]
    company_id: Optional[Any]
    company_task: Optional["company_task_obj_rel_insert_input"]
    created_at: Optional[Any]
    current_query: Optional["current_tranformation_sql_queries_obj_rel_insert_input"]
    delete_window: Optional[int]
    depends_on_transformations: Optional["transformation_depends_on_arr_rel_insert_input"]
    do_not_delete_on_resync: Optional[bool]
    do_not_update_on_percent_change: Optional[bool]
    enriched_activities: Optional["tranformation_enriched_activities_arr_rel_insert_input"]
    has_source: Optional[bool]
    id: Optional[Any]
    is_aliasing: Optional[bool]
    kind: Optional[transformation_kinds_enum]
    last_diff_data_and_insert_at: Optional[Any]
    last_identity_resolution_updated_at: Optional[Any]
    last_resynced_at: Optional[Any]
    max_days_to_insert: Optional[int]
    mutable_day_window: Optional[int]
    name: Optional[str]
    next_resync_at: Optional[Any]
    notes: Optional[str]
    notify_row_count_percent_change: Optional[Any]
    production_queries: Optional["production_tranformation_sql_queries_arr_rel_insert_input"]
    query_updates: Optional["query_updates_arr_rel_insert_input"]
    question_answers: Optional["transformation_questions_arr_rel_insert_input"]
    remove_customers: Optional[bool]
    run_after_transformations: Optional["transformation_run_after_arr_rel_insert_input"]
    scratchpad_queries: Optional["scratchpad_tranformation_sql_queries_arr_rel_insert_input"]
    single_activity: Optional[bool]
    slug: Optional[str]
    start_data_after: Optional[Any]
    table: Optional[str]
    task_id: Optional[Any]
    tests: Optional["transformation_test_arr_rel_insert_input"]
    transformation_maintenances: Optional["transformation_maintenance_arr_rel_insert_input"]
    update_type: Optional[transformation_update_types_enum]
    updated_at: Optional[Any]
    updated_by: Optional[Any]
    validation_queries: Optional["validation_tranformation_sql_queries_arr_rel_insert_input"]


class transformation_kinds_bool_exp(BaseModel):
    and_: Optional[List["transformation_kinds_bool_exp"]] = Field(alias="_and")
    not_: Optional["transformation_kinds_bool_exp"] = Field(alias="_not")
    or_: Optional[List["transformation_kinds_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class transformation_kinds_enum_comparison_exp(BaseModel):
    eq: Optional[transformation_kinds_enum] = Field(alias="_eq")
    in_: Optional[List[transformation_kinds_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[transformation_kinds_enum] = Field(alias="_neq")
    nin: Optional[List[transformation_kinds_enum]] = Field(alias="_nin")


class transformation_kinds_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class transformation_kinds_on_conflict(BaseModel):
    constraint: transformation_kinds_constraint
    update_columns: List[transformation_kinds_update_column]
    where: Optional["transformation_kinds_bool_exp"]


class transformation_kinds_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class transformation_kinds_pk_columns_input(BaseModel):
    value: str


class transformation_kinds_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class transformation_kinds_stream_cursor_input(BaseModel):
    initial_value: "transformation_kinds_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class transformation_kinds_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class transformation_kinds_updates(BaseModel):
    set: Optional["transformation_kinds_set_input"] = Field(alias="_set")
    where: "transformation_kinds_bool_exp"


class transformation_maintenance_aggregate_bool_exp(BaseModel):
    count: Optional["transformation_maintenance_aggregate_bool_exp_count"]


class transformation_maintenance_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[transformation_maintenance_select_column]]
    distinct: Optional[bool]
    filter: Optional["transformation_maintenance_bool_exp"]
    predicate: "Int_comparison_exp"


class transformation_maintenance_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["transformation_maintenance_max_order_by"]
    min: Optional["transformation_maintenance_min_order_by"]


class transformation_maintenance_arr_rel_insert_input(BaseModel):
    data: List["transformation_maintenance_insert_input"]
    on_conflict: Optional["transformation_maintenance_on_conflict"]


class transformation_maintenance_bool_exp(BaseModel):
    and_: Optional[List["transformation_maintenance_bool_exp"]] = Field(alias="_and")
    not_: Optional["transformation_maintenance_bool_exp"] = Field(alias="_not")
    or_: Optional[List["transformation_maintenance_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    ended_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    kind: Optional["maintenance_kinds_enum_comparison_exp"]
    maintenance_kind: Optional["maintenance_kinds_bool_exp"]
    notes: Optional["String_comparison_exp"]
    started_at: Optional["timestamptz_comparison_exp"]
    transformation: Optional["transformation_bool_exp"]
    transformation_id: Optional["uuid_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class transformation_maintenance_insert_input(BaseModel):
    created_at: Optional[Any]
    ended_at: Optional[Any]
    id: Optional[Any]
    kind: Optional[maintenance_kinds_enum]
    maintenance_kind: Optional["maintenance_kinds_obj_rel_insert_input"]
    notes: Optional[str]
    started_at: Optional[Any]
    transformation: Optional["transformation_obj_rel_insert_input"]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]


class transformation_maintenance_max_order_by(BaseModel):
    created_at: Optional[order_by]
    ended_at: Optional[order_by]
    id: Optional[order_by]
    notes: Optional[order_by]
    started_at: Optional[order_by]
    transformation_id: Optional[order_by]
    updated_at: Optional[order_by]


class transformation_maintenance_min_order_by(BaseModel):
    created_at: Optional[order_by]
    ended_at: Optional[order_by]
    id: Optional[order_by]
    notes: Optional[order_by]
    started_at: Optional[order_by]
    transformation_id: Optional[order_by]
    updated_at: Optional[order_by]


class transformation_maintenance_on_conflict(BaseModel):
    constraint: transformation_maintenance_constraint
    update_columns: List[transformation_maintenance_update_column]
    where: Optional["transformation_maintenance_bool_exp"]


class transformation_maintenance_order_by(BaseModel):
    created_at: Optional[order_by]
    ended_at: Optional[order_by]
    id: Optional[order_by]
    kind: Optional[order_by]
    maintenance_kind: Optional["maintenance_kinds_order_by"]
    notes: Optional[order_by]
    started_at: Optional[order_by]
    transformation: Optional["transformation_order_by"]
    transformation_id: Optional[order_by]
    updated_at: Optional[order_by]


class transformation_maintenance_pk_columns_input(BaseModel):
    id: Any


class transformation_maintenance_set_input(BaseModel):
    created_at: Optional[Any]
    ended_at: Optional[Any]
    id: Optional[Any]
    kind: Optional[maintenance_kinds_enum]
    notes: Optional[str]
    started_at: Optional[Any]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]


class transformation_maintenance_stream_cursor_input(BaseModel):
    initial_value: "transformation_maintenance_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class transformation_maintenance_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    ended_at: Optional[Any]
    id: Optional[Any]
    kind: Optional[maintenance_kinds_enum]
    notes: Optional[str]
    started_at: Optional[Any]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]


class transformation_maintenance_updates(BaseModel):
    set: Optional["transformation_maintenance_set_input"] = Field(alias="_set")
    where: "transformation_maintenance_bool_exp"


class transformation_max_order_by(BaseModel):
    category_id: Optional[order_by]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    delete_window: Optional[order_by]
    id: Optional[order_by]
    last_diff_data_and_insert_at: Optional[order_by]
    last_identity_resolution_updated_at: Optional[order_by]
    last_resynced_at: Optional[order_by]
    max_days_to_insert: Optional[order_by]
    mutable_day_window: Optional[order_by]
    name: Optional[order_by]
    next_resync_at: Optional[order_by]
    notes: Optional[order_by]
    notify_row_count_percent_change: Optional[order_by]
    slug: Optional[order_by]
    start_data_after: Optional[order_by]
    table: Optional[order_by]
    task_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class transformation_min_order_by(BaseModel):
    category_id: Optional[order_by]
    company_id: Optional[order_by]
    created_at: Optional[order_by]
    delete_window: Optional[order_by]
    id: Optional[order_by]
    last_diff_data_and_insert_at: Optional[order_by]
    last_identity_resolution_updated_at: Optional[order_by]
    last_resynced_at: Optional[order_by]
    max_days_to_insert: Optional[order_by]
    mutable_day_window: Optional[order_by]
    name: Optional[order_by]
    next_resync_at: Optional[order_by]
    notes: Optional[order_by]
    notify_row_count_percent_change: Optional[order_by]
    slug: Optional[order_by]
    start_data_after: Optional[order_by]
    table: Optional[order_by]
    task_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class transformation_obj_rel_insert_input(BaseModel):
    data: "transformation_insert_input"
    on_conflict: Optional["transformation_on_conflict"]


class transformation_on_conflict(BaseModel):
    constraint: transformation_constraint
    update_columns: List[transformation_update_column]
    where: Optional["transformation_bool_exp"]


class transformation_order_by(BaseModel):
    activities_aggregate: Optional["transformation_activities_aggregate_order_by"]
    allow_future_data: Optional[order_by]
    category_id: Optional[order_by]
    column_renames_aggregate: Optional["transformation_column_renames_aggregate_order_by"]
    company: Optional["company_order_by"]
    company_category: Optional["company_categories_order_by"]
    company_id: Optional[order_by]
    company_task: Optional["company_task_order_by"]
    created_at: Optional[order_by]
    current_query: Optional["current_tranformation_sql_queries_order_by"]
    delete_window: Optional[order_by]
    depends_on_transformations_aggregate: Optional["transformation_depends_on_aggregate_order_by"]
    do_not_delete_on_resync: Optional[order_by]
    do_not_update_on_percent_change: Optional[order_by]
    enriched_activities_aggregate: Optional["tranformation_enriched_activities_aggregate_order_by"]
    has_source: Optional[order_by]
    id: Optional[order_by]
    is_aliasing: Optional[order_by]
    kind: Optional[order_by]
    last_diff_data_and_insert_at: Optional[order_by]
    last_identity_resolution_updated_at: Optional[order_by]
    last_resynced_at: Optional[order_by]
    max_days_to_insert: Optional[order_by]
    mutable_day_window: Optional[order_by]
    name: Optional[order_by]
    next_resync_at: Optional[order_by]
    notes: Optional[order_by]
    notify_row_count_percent_change: Optional[order_by]
    production_queries_aggregate: Optional["production_tranformation_sql_queries_aggregate_order_by"]
    query_updates_aggregate: Optional["query_updates_aggregate_order_by"]
    question_answers_aggregate: Optional["transformation_questions_aggregate_order_by"]
    remove_customers: Optional[order_by]
    run_after_transformations_aggregate: Optional["transformation_run_after_aggregate_order_by"]
    scratchpad_queries_aggregate: Optional["scratchpad_tranformation_sql_queries_aggregate_order_by"]
    single_activity: Optional[order_by]
    slug: Optional[order_by]
    start_data_after: Optional[order_by]
    table: Optional[order_by]
    task_id: Optional[order_by]
    tests_aggregate: Optional["transformation_test_aggregate_order_by"]
    transformation_maintenances_aggregate: Optional["transformation_maintenance_aggregate_order_by"]
    update_type: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]
    validation_queries_aggregate: Optional["validation_tranformation_sql_queries_aggregate_order_by"]


class transformation_pk_columns_input(BaseModel):
    id: Any


class transformation_questions_aggregate_bool_exp(BaseModel):
    count: Optional["transformation_questions_aggregate_bool_exp_count"]


class transformation_questions_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[transformation_questions_select_column]]
    distinct: Optional[bool]
    filter: Optional["transformation_questions_bool_exp"]
    predicate: "Int_comparison_exp"


class transformation_questions_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["transformation_questions_max_order_by"]
    min: Optional["transformation_questions_min_order_by"]


class transformation_questions_arr_rel_insert_input(BaseModel):
    data: List["transformation_questions_insert_input"]


class transformation_questions_bool_exp(BaseModel):
    and_: Optional[List["transformation_questions_bool_exp"]] = Field(alias="_and")
    not_: Optional["transformation_questions_bool_exp"] = Field(alias="_not")
    or_: Optional[List["transformation_questions_bool_exp"]] = Field(alias="_or")
    answer: Optional["String_comparison_exp"]
    answered_by: Optional["String_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    question: Optional["String_comparison_exp"]
    transformation_id: Optional["uuid_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class transformation_questions_insert_input(BaseModel):
    answer: Optional[str]
    answered_by: Optional[str]
    created_at: Optional[Any]
    id: Optional[Any]
    question: Optional[str]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]


class transformation_questions_max_order_by(BaseModel):
    answer: Optional[order_by]
    answered_by: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    question: Optional[order_by]
    transformation_id: Optional[order_by]
    updated_at: Optional[order_by]


class transformation_questions_min_order_by(BaseModel):
    answer: Optional[order_by]
    answered_by: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    question: Optional[order_by]
    transformation_id: Optional[order_by]
    updated_at: Optional[order_by]


class transformation_questions_order_by(BaseModel):
    answer: Optional[order_by]
    answered_by: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    question: Optional[order_by]
    transformation_id: Optional[order_by]
    updated_at: Optional[order_by]


class transformation_questions_set_input(BaseModel):
    answer: Optional[str]
    answered_by: Optional[str]
    created_at: Optional[Any]
    id: Optional[Any]
    question: Optional[str]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]


class transformation_questions_stream_cursor_input(BaseModel):
    initial_value: "transformation_questions_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class transformation_questions_stream_cursor_value_input(BaseModel):
    answer: Optional[str]
    answered_by: Optional[str]
    created_at: Optional[Any]
    id: Optional[Any]
    question: Optional[str]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]


class transformation_questions_updates(BaseModel):
    set: Optional["transformation_questions_set_input"] = Field(alias="_set")
    where: "transformation_questions_bool_exp"


class transformation_run_after_aggregate_bool_exp(BaseModel):
    count: Optional["transformation_run_after_aggregate_bool_exp_count"]


class transformation_run_after_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[transformation_run_after_select_column]]
    distinct: Optional[bool]
    filter: Optional["transformation_run_after_bool_exp"]
    predicate: "Int_comparison_exp"


class transformation_run_after_aggregate_order_by(BaseModel):
    avg: Optional["transformation_run_after_avg_order_by"]
    count: Optional[order_by]
    max: Optional["transformation_run_after_max_order_by"]
    min: Optional["transformation_run_after_min_order_by"]
    stddev: Optional["transformation_run_after_stddev_order_by"]
    stddev_pop: Optional["transformation_run_after_stddev_pop_order_by"]
    stddev_samp: Optional["transformation_run_after_stddev_samp_order_by"]
    sum: Optional["transformation_run_after_sum_order_by"]
    var_pop: Optional["transformation_run_after_var_pop_order_by"]
    var_samp: Optional["transformation_run_after_var_samp_order_by"]
    variance: Optional["transformation_run_after_variance_order_by"]


class transformation_run_after_arr_rel_insert_input(BaseModel):
    data: List["transformation_run_after_insert_input"]
    on_conflict: Optional["transformation_run_after_on_conflict"]


class transformation_run_after_avg_order_by(BaseModel):
    id: Optional[order_by]


class transformation_run_after_bool_exp(BaseModel):
    and_: Optional[List["transformation_run_after_bool_exp"]] = Field(alias="_and")
    not_: Optional["transformation_run_after_bool_exp"] = Field(alias="_not")
    or_: Optional[List["transformation_run_after_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["Int_comparison_exp"]
    run_after_transformation_id: Optional["uuid_comparison_exp"]
    run_after_transformations: Optional["transformation_bool_exp"]
    transformation_id: Optional["uuid_comparison_exp"]


class transformation_run_after_inc_input(BaseModel):
    id: Optional[int]


class transformation_run_after_insert_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[int]
    run_after_transformation_id: Optional[Any]
    run_after_transformations: Optional["transformation_obj_rel_insert_input"]
    transformation_id: Optional[Any]


class transformation_run_after_max_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    run_after_transformation_id: Optional[order_by]
    transformation_id: Optional[order_by]


class transformation_run_after_min_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    run_after_transformation_id: Optional[order_by]
    transformation_id: Optional[order_by]


class transformation_run_after_on_conflict(BaseModel):
    constraint: transformation_run_after_constraint
    update_columns: List[transformation_run_after_update_column]
    where: Optional["transformation_run_after_bool_exp"]


class transformation_run_after_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    run_after_transformation_id: Optional[order_by]
    run_after_transformations: Optional["transformation_order_by"]
    transformation_id: Optional[order_by]


class transformation_run_after_pk_columns_input(BaseModel):
    id: int


class transformation_run_after_set_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[int]
    run_after_transformation_id: Optional[Any]
    transformation_id: Optional[Any]


class transformation_run_after_stddev_order_by(BaseModel):
    id: Optional[order_by]


class transformation_run_after_stddev_pop_order_by(BaseModel):
    id: Optional[order_by]


class transformation_run_after_stddev_samp_order_by(BaseModel):
    id: Optional[order_by]


class transformation_run_after_stream_cursor_input(BaseModel):
    initial_value: "transformation_run_after_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class transformation_run_after_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[int]
    run_after_transformation_id: Optional[Any]
    transformation_id: Optional[Any]


class transformation_run_after_sum_order_by(BaseModel):
    id: Optional[order_by]


class transformation_run_after_updates(BaseModel):
    inc: Optional["transformation_run_after_inc_input"] = Field(alias="_inc")
    set: Optional["transformation_run_after_set_input"] = Field(alias="_set")
    where: "transformation_run_after_bool_exp"


class transformation_run_after_var_pop_order_by(BaseModel):
    id: Optional[order_by]


class transformation_run_after_var_samp_order_by(BaseModel):
    id: Optional[order_by]


class transformation_run_after_variance_order_by(BaseModel):
    id: Optional[order_by]


class transformation_set_input(BaseModel):
    allow_future_data: Optional[bool]
    category_id: Optional[Any]
    company_id: Optional[Any]
    created_at: Optional[Any]
    delete_window: Optional[int]
    do_not_delete_on_resync: Optional[bool]
    do_not_update_on_percent_change: Optional[bool]
    has_source: Optional[bool]
    id: Optional[Any]
    is_aliasing: Optional[bool]
    kind: Optional[transformation_kinds_enum]
    last_diff_data_and_insert_at: Optional[Any]
    last_identity_resolution_updated_at: Optional[Any]
    last_resynced_at: Optional[Any]
    max_days_to_insert: Optional[int]
    mutable_day_window: Optional[int]
    name: Optional[str]
    next_resync_at: Optional[Any]
    notes: Optional[str]
    notify_row_count_percent_change: Optional[Any]
    remove_customers: Optional[bool]
    single_activity: Optional[bool]
    slug: Optional[str]
    start_data_after: Optional[Any]
    table: Optional[str]
    task_id: Optional[Any]
    update_type: Optional[transformation_update_types_enum]
    updated_at: Optional[Any]
    updated_by: Optional[Any]


class transformation_stddev_order_by(BaseModel):
    delete_window: Optional[order_by]
    max_days_to_insert: Optional[order_by]
    mutable_day_window: Optional[order_by]
    notify_row_count_percent_change: Optional[order_by]


class transformation_stddev_pop_order_by(BaseModel):
    delete_window: Optional[order_by]
    max_days_to_insert: Optional[order_by]
    mutable_day_window: Optional[order_by]
    notify_row_count_percent_change: Optional[order_by]


class transformation_stddev_samp_order_by(BaseModel):
    delete_window: Optional[order_by]
    max_days_to_insert: Optional[order_by]
    mutable_day_window: Optional[order_by]
    notify_row_count_percent_change: Optional[order_by]


class transformation_stream_cursor_input(BaseModel):
    initial_value: "transformation_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class transformation_stream_cursor_value_input(BaseModel):
    allow_future_data: Optional[bool]
    category_id: Optional[Any]
    company_id: Optional[Any]
    created_at: Optional[Any]
    delete_window: Optional[int]
    do_not_delete_on_resync: Optional[bool]
    do_not_update_on_percent_change: Optional[bool]
    has_source: Optional[bool]
    id: Optional[Any]
    is_aliasing: Optional[bool]
    kind: Optional[transformation_kinds_enum]
    last_diff_data_and_insert_at: Optional[Any]
    last_identity_resolution_updated_at: Optional[Any]
    last_resynced_at: Optional[Any]
    max_days_to_insert: Optional[int]
    mutable_day_window: Optional[int]
    name: Optional[str]
    next_resync_at: Optional[Any]
    notes: Optional[str]
    notify_row_count_percent_change: Optional[Any]
    remove_customers: Optional[bool]
    single_activity: Optional[bool]
    slug: Optional[str]
    start_data_after: Optional[Any]
    table: Optional[str]
    task_id: Optional[Any]
    update_type: Optional[transformation_update_types_enum]
    updated_at: Optional[Any]
    updated_by: Optional[Any]


class transformation_sum_order_by(BaseModel):
    delete_window: Optional[order_by]
    max_days_to_insert: Optional[order_by]
    mutable_day_window: Optional[order_by]
    notify_row_count_percent_change: Optional[order_by]


class transformation_test_aggregate_bool_exp(BaseModel):
    count: Optional["transformation_test_aggregate_bool_exp_count"]


class transformation_test_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[transformation_test_select_column]]
    distinct: Optional[bool]
    filter: Optional["transformation_test_bool_exp"]
    predicate: "Int_comparison_exp"


class transformation_test_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["transformation_test_max_order_by"]
    min: Optional["transformation_test_min_order_by"]


class transformation_test_arr_rel_insert_input(BaseModel):
    data: List["transformation_test_insert_input"]
    on_conflict: Optional["transformation_test_on_conflict"]


class transformation_test_bool_exp(BaseModel):
    and_: Optional[List["transformation_test_bool_exp"]] = Field(alias="_and")
    not_: Optional["transformation_test_bool_exp"] = Field(alias="_not")
    or_: Optional[List["transformation_test_bool_exp"]] = Field(alias="_or")
    content: Optional["String_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    data: Optional["String_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    name: Optional["String_comparison_exp"]
    query: Optional["String_comparison_exp"]
    ran_data_from: Optional["timestamptz_comparison_exp"]
    status: Optional["transformation_test_status_enum_comparison_exp"]
    transformation: Optional["transformation_bool_exp"]
    transformation_id: Optional["uuid_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    updated_by: Optional["uuid_comparison_exp"]


class transformation_test_insert_input(BaseModel):
    content: Optional[str]
    created_at: Optional[Any]
    data: Optional[str]
    id: Optional[Any]
    name: Optional[str]
    query: Optional[str]
    ran_data_from: Optional[Any]
    status: Optional[transformation_test_status_enum]
    transformation: Optional["transformation_obj_rel_insert_input"]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]
    updated_by: Optional[Any]


class transformation_test_max_order_by(BaseModel):
    content: Optional[order_by]
    created_at: Optional[order_by]
    data: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]
    query: Optional[order_by]
    ran_data_from: Optional[order_by]
    transformation_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class transformation_test_min_order_by(BaseModel):
    content: Optional[order_by]
    created_at: Optional[order_by]
    data: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]
    query: Optional[order_by]
    ran_data_from: Optional[order_by]
    transformation_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class transformation_test_on_conflict(BaseModel):
    constraint: transformation_test_constraint
    update_columns: List[transformation_test_update_column]
    where: Optional["transformation_test_bool_exp"]


class transformation_test_order_by(BaseModel):
    content: Optional[order_by]
    created_at: Optional[order_by]
    data: Optional[order_by]
    id: Optional[order_by]
    name: Optional[order_by]
    query: Optional[order_by]
    ran_data_from: Optional[order_by]
    status: Optional[order_by]
    transformation: Optional["transformation_order_by"]
    transformation_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class transformation_test_pk_columns_input(BaseModel):
    id: Any


class transformation_test_set_input(BaseModel):
    content: Optional[str]
    created_at: Optional[Any]
    data: Optional[str]
    id: Optional[Any]
    name: Optional[str]
    query: Optional[str]
    ran_data_from: Optional[Any]
    status: Optional[transformation_test_status_enum]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]
    updated_by: Optional[Any]


class transformation_test_status_bool_exp(BaseModel):
    and_: Optional[List["transformation_test_status_bool_exp"]] = Field(alias="_and")
    not_: Optional["transformation_test_status_bool_exp"] = Field(alias="_not")
    or_: Optional[List["transformation_test_status_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class transformation_test_status_enum_comparison_exp(BaseModel):
    eq: Optional[transformation_test_status_enum] = Field(alias="_eq")
    in_: Optional[List[transformation_test_status_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[transformation_test_status_enum] = Field(alias="_neq")
    nin: Optional[List[transformation_test_status_enum]] = Field(alias="_nin")


class transformation_test_status_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class transformation_test_status_on_conflict(BaseModel):
    constraint: transformation_test_status_constraint
    update_columns: List[transformation_test_status_update_column]
    where: Optional["transformation_test_status_bool_exp"]


class transformation_test_status_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class transformation_test_status_pk_columns_input(BaseModel):
    value: str


class transformation_test_status_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class transformation_test_status_stream_cursor_input(BaseModel):
    initial_value: "transformation_test_status_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class transformation_test_status_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class transformation_test_status_updates(BaseModel):
    set: Optional["transformation_test_status_set_input"] = Field(alias="_set")
    where: "transformation_test_status_bool_exp"


class transformation_test_stream_cursor_input(BaseModel):
    initial_value: "transformation_test_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class transformation_test_stream_cursor_value_input(BaseModel):
    content: Optional[str]
    created_at: Optional[Any]
    data: Optional[str]
    id: Optional[Any]
    name: Optional[str]
    query: Optional[str]
    ran_data_from: Optional[Any]
    status: Optional[transformation_test_status_enum]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]
    updated_by: Optional[Any]


class transformation_test_updates(BaseModel):
    set: Optional["transformation_test_set_input"] = Field(alias="_set")
    where: "transformation_test_bool_exp"


class transformation_update_types_bool_exp(BaseModel):
    and_: Optional[List["transformation_update_types_bool_exp"]] = Field(alias="_and")
    not_: Optional["transformation_update_types_bool_exp"] = Field(alias="_not")
    or_: Optional[List["transformation_update_types_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class transformation_update_types_enum_comparison_exp(BaseModel):
    eq: Optional[transformation_update_types_enum] = Field(alias="_eq")
    in_: Optional[List[transformation_update_types_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[transformation_update_types_enum] = Field(alias="_neq")
    nin: Optional[List[transformation_update_types_enum]] = Field(alias="_nin")


class transformation_update_types_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class transformation_update_types_on_conflict(BaseModel):
    constraint: transformation_update_types_constraint
    update_columns: List[transformation_update_types_update_column]
    where: Optional["transformation_update_types_bool_exp"]


class transformation_update_types_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class transformation_update_types_pk_columns_input(BaseModel):
    value: str


class transformation_update_types_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class transformation_update_types_stream_cursor_input(BaseModel):
    initial_value: "transformation_update_types_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class transformation_update_types_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class transformation_update_types_updates(BaseModel):
    set: Optional["transformation_update_types_set_input"] = Field(alias="_set")
    where: "transformation_update_types_bool_exp"


class transformation_updates(BaseModel):
    inc: Optional["transformation_inc_input"] = Field(alias="_inc")
    set: Optional["transformation_set_input"] = Field(alias="_set")
    where: "transformation_bool_exp"


class transformation_var_pop_order_by(BaseModel):
    delete_window: Optional[order_by]
    max_days_to_insert: Optional[order_by]
    mutable_day_window: Optional[order_by]
    notify_row_count_percent_change: Optional[order_by]


class transformation_var_samp_order_by(BaseModel):
    delete_window: Optional[order_by]
    max_days_to_insert: Optional[order_by]
    mutable_day_window: Optional[order_by]
    notify_row_count_percent_change: Optional[order_by]


class transformation_variance_order_by(BaseModel):
    delete_window: Optional[order_by]
    max_days_to_insert: Optional[order_by]
    mutable_day_window: Optional[order_by]
    notify_row_count_percent_change: Optional[order_by]


class user_access_role_aggregate_bool_exp(BaseModel):
    count: Optional["user_access_role_aggregate_bool_exp_count"]


class user_access_role_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[user_access_role_select_column]]
    distinct: Optional[bool]
    filter: Optional["user_access_role_bool_exp"]
    predicate: "Int_comparison_exp"


class user_access_role_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["user_access_role_max_order_by"]
    min: Optional["user_access_role_min_order_by"]


class user_access_role_arr_rel_insert_input(BaseModel):
    data: List["user_access_role_insert_input"]
    on_conflict: Optional["user_access_role_on_conflict"]


class user_access_role_bool_exp(BaseModel):
    and_: Optional[List["user_access_role_bool_exp"]] = Field(alias="_and")
    not_: Optional["user_access_role_bool_exp"] = Field(alias="_not")
    or_: Optional[List["user_access_role_bool_exp"]] = Field(alias="_or")
    access_role: Optional["access_role_bool_exp"]
    company_user: Optional["company_user_bool_exp"]
    company_user_id: Optional["uuid_comparison_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    role: Optional["access_role_enum_comparison_exp"]


class user_access_role_insert_input(BaseModel):
    access_role: Optional["access_role_obj_rel_insert_input"]
    company_user: Optional["company_user_obj_rel_insert_input"]
    company_user_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    role: Optional[access_role_enum]


class user_access_role_max_order_by(BaseModel):
    company_user_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]


class user_access_role_min_order_by(BaseModel):
    company_user_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]


class user_access_role_on_conflict(BaseModel):
    constraint: user_access_role_constraint
    update_columns: List[user_access_role_update_column]
    where: Optional["user_access_role_bool_exp"]


class user_access_role_order_by(BaseModel):
    access_role: Optional["access_role_order_by"]
    company_user: Optional["company_user_order_by"]
    company_user_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    role: Optional[order_by]


class user_access_role_pk_columns_input(BaseModel):
    id: Any


class user_access_role_set_input(BaseModel):
    company_user_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    role: Optional[access_role_enum]


class user_access_role_stream_cursor_input(BaseModel):
    initial_value: "user_access_role_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class user_access_role_stream_cursor_value_input(BaseModel):
    company_user_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    role: Optional[access_role_enum]


class user_access_role_updates(BaseModel):
    set: Optional["user_access_role_set_input"] = Field(alias="_set")
    where: "user_access_role_bool_exp"


class user_bool_exp(BaseModel):
    and_: Optional[List["user_bool_exp"]] = Field(alias="_and")
    not_: Optional["user_bool_exp"] = Field(alias="_not")
    or_: Optional[List["user_bool_exp"]] = Field(alias="_or")
    accepted_terms_at: Optional["timestamptz_comparison_exp"]
    accepted_terms_version: Optional["uuid_comparison_exp"]
    company_users: Optional["company_user_bool_exp"]
    company_users_aggregate: Optional["company_user_aggregate_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    email: Optional["String_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    role: Optional["user_role_enum_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    user_activities: Optional["activity_bool_exp"]
    user_activities_aggregate: Optional["activity_aggregate_bool_exp"]
    user_company_tables: Optional["company_table_bool_exp"]
    user_company_tables_aggregate: Optional["company_table_aggregate_bool_exp"]
    user_datasets: Optional["dataset_bool_exp"]
    user_datasets_aggregate: Optional["dataset_aggregate_bool_exp"]
    user_narrative_templates: Optional["narrative_template_bool_exp"]
    user_narrative_templates_aggregate: Optional["narrative_template_aggregate_bool_exp"]
    user_narratives: Optional["narrative_bool_exp"]
    user_narratives_aggregate: Optional["narrative_aggregate_bool_exp"]


class user_insert_input(BaseModel):
    accepted_terms_at: Optional[Any]
    accepted_terms_version: Optional[Any]
    company_users: Optional["company_user_arr_rel_insert_input"]
    created_at: Optional[Any]
    email: Optional[str]
    id: Optional[Any]
    role: Optional[user_role_enum]
    updated_at: Optional[Any]
    user_activities: Optional["activity_arr_rel_insert_input"]
    user_company_tables: Optional["company_table_arr_rel_insert_input"]
    user_datasets: Optional["dataset_arr_rel_insert_input"]
    user_narrative_templates: Optional["narrative_template_arr_rel_insert_input"]
    user_narratives: Optional["narrative_arr_rel_insert_input"]


class user_obj_rel_insert_input(BaseModel):
    data: "user_insert_input"
    on_conflict: Optional["user_on_conflict"]


class user_on_conflict(BaseModel):
    constraint: user_constraint
    update_columns: List[user_update_column]
    where: Optional["user_bool_exp"]


class user_order_by(BaseModel):
    accepted_terms_at: Optional[order_by]
    accepted_terms_version: Optional[order_by]
    company_users_aggregate: Optional["company_user_aggregate_order_by"]
    created_at: Optional[order_by]
    email: Optional[order_by]
    id: Optional[order_by]
    role: Optional[order_by]
    updated_at: Optional[order_by]
    user_activities_aggregate: Optional["activity_aggregate_order_by"]
    user_company_tables_aggregate: Optional["company_table_aggregate_order_by"]
    user_datasets_aggregate: Optional["dataset_aggregate_order_by"]
    user_narrative_templates_aggregate: Optional["narrative_template_aggregate_order_by"]
    user_narratives_aggregate: Optional["narrative_aggregate_order_by"]


class user_pk_columns_input(BaseModel):
    id: Any


class user_role_bool_exp(BaseModel):
    and_: Optional[List["user_role_bool_exp"]] = Field(alias="_and")
    not_: Optional["user_role_bool_exp"] = Field(alias="_not")
    or_: Optional[List["user_role_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class user_role_enum_comparison_exp(BaseModel):
    eq: Optional[user_role_enum] = Field(alias="_eq")
    in_: Optional[List[user_role_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[user_role_enum] = Field(alias="_neq")
    nin: Optional[List[user_role_enum]] = Field(alias="_nin")


class user_role_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class user_role_on_conflict(BaseModel):
    constraint: user_role_constraint
    update_columns: List[user_role_update_column]
    where: Optional["user_role_bool_exp"]


class user_role_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class user_role_pk_columns_input(BaseModel):
    value: str


class user_role_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class user_role_stream_cursor_input(BaseModel):
    initial_value: "user_role_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class user_role_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class user_role_updates(BaseModel):
    set: Optional["user_role_set_input"] = Field(alias="_set")
    where: "user_role_bool_exp"


class user_set_input(BaseModel):
    accepted_terms_at: Optional[Any]
    accepted_terms_version: Optional[Any]
    created_at: Optional[Any]
    email: Optional[str]
    id: Optional[Any]
    role: Optional[user_role_enum]
    updated_at: Optional[Any]


class user_stream_cursor_input(BaseModel):
    initial_value: "user_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class user_stream_cursor_value_input(BaseModel):
    accepted_terms_at: Optional[Any]
    accepted_terms_version: Optional[Any]
    created_at: Optional[Any]
    email: Optional[str]
    id: Optional[Any]
    role: Optional[user_role_enum]
    updated_at: Optional[Any]


class user_training_question_aggregate_bool_exp(BaseModel):
    count: Optional["user_training_question_aggregate_bool_exp_count"]


class user_training_question_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[user_training_question_select_column]]
    distinct: Optional[bool]
    filter: Optional["user_training_question_bool_exp"]
    predicate: "Int_comparison_exp"


class user_training_question_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["user_training_question_max_order_by"]
    min: Optional["user_training_question_min_order_by"]


class user_training_question_arr_rel_insert_input(BaseModel):
    data: List["user_training_question_insert_input"]
    on_conflict: Optional["user_training_question_on_conflict"]


class user_training_question_bool_exp(BaseModel):
    and_: Optional[List["user_training_question_bool_exp"]] = Field(alias="_and")
    not_: Optional["user_training_question_bool_exp"] = Field(alias="_not")
    or_: Optional[List["user_training_question_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    created_by: Optional["uuid_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    llm_training_id: Optional["uuid_comparison_exp"]
    question: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]


class user_training_question_insert_input(BaseModel):
    created_at: Optional[Any]
    created_by: Optional[Any]
    id: Optional[Any]
    llm_training_id: Optional[Any]
    question: Optional[str]
    updated_at: Optional[Any]


class user_training_question_max_order_by(BaseModel):
    created_at: Optional[order_by]
    created_by: Optional[order_by]
    id: Optional[order_by]
    llm_training_id: Optional[order_by]
    question: Optional[order_by]
    updated_at: Optional[order_by]


class user_training_question_min_order_by(BaseModel):
    created_at: Optional[order_by]
    created_by: Optional[order_by]
    id: Optional[order_by]
    llm_training_id: Optional[order_by]
    question: Optional[order_by]
    updated_at: Optional[order_by]


class user_training_question_on_conflict(BaseModel):
    constraint: user_training_question_constraint
    update_columns: List[user_training_question_update_column]
    where: Optional["user_training_question_bool_exp"]


class user_training_question_order_by(BaseModel):
    created_at: Optional[order_by]
    created_by: Optional[order_by]
    id: Optional[order_by]
    llm_training_id: Optional[order_by]
    question: Optional[order_by]
    updated_at: Optional[order_by]


class user_training_question_pk_columns_input(BaseModel):
    id: Any


class user_training_question_set_input(BaseModel):
    created_at: Optional[Any]
    created_by: Optional[Any]
    id: Optional[Any]
    llm_training_id: Optional[Any]
    question: Optional[str]
    updated_at: Optional[Any]


class user_training_question_stream_cursor_input(BaseModel):
    initial_value: "user_training_question_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class user_training_question_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    created_by: Optional[Any]
    id: Optional[Any]
    llm_training_id: Optional[Any]
    question: Optional[str]
    updated_at: Optional[Any]


class user_training_question_updates(BaseModel):
    set: Optional["user_training_question_set_input"] = Field(alias="_set")
    where: "user_training_question_bool_exp"


class user_updates(BaseModel):
    set: Optional["user_set_input"] = Field(alias="_set")
    where: "user_bool_exp"


class uuid_comparison_exp(BaseModel):
    eq: Optional[Any] = Field(alias="_eq")
    gt: Optional[Any] = Field(alias="_gt")
    gte: Optional[Any] = Field(alias="_gte")
    in_: Optional[List[Any]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    lt: Optional[Any] = Field(alias="_lt")
    lte: Optional[Any] = Field(alias="_lte")
    neq: Optional[Any] = Field(alias="_neq")
    nin: Optional[List[Any]] = Field(alias="_nin")


class validation_activity_sql_queries_aggregate_bool_exp(BaseModel):
    count: Optional["validation_activity_sql_queries_aggregate_bool_exp_count"]


class validation_activity_sql_queries_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[validation_activity_sql_queries_select_column]]
    distinct: Optional[bool]
    filter: Optional["validation_activity_sql_queries_bool_exp"]
    predicate: "Int_comparison_exp"


class validation_activity_sql_queries_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["validation_activity_sql_queries_max_order_by"]
    min: Optional["validation_activity_sql_queries_min_order_by"]


class validation_activity_sql_queries_arr_rel_insert_input(BaseModel):
    data: List["validation_activity_sql_queries_insert_input"]


class validation_activity_sql_queries_bool_exp(BaseModel):
    and_: Optional[List["validation_activity_sql_queries_bool_exp"]] = Field(alias="_and")
    not_: Optional["validation_activity_sql_queries_bool_exp"] = Field(alias="_not")
    or_: Optional[List["validation_activity_sql_queries_bool_exp"]] = Field(alias="_or")
    activity_id: Optional["uuid_comparison_exp"]
    alert: Optional["company_query_alert_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    notes: Optional["String_comparison_exp"]
    related_kind: Optional["String_comparison_exp"]
    sql: Optional["String_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    updated_by: Optional["String_comparison_exp"]


class validation_activity_sql_queries_insert_input(BaseModel):
    activity_id: Optional[Any]
    alert: Optional["company_query_alert_obj_rel_insert_input"]
    created_at: Optional[Any]
    id: Optional[Any]
    notes: Optional[str]
    related_kind: Optional[str]
    sql: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class validation_activity_sql_queries_max_order_by(BaseModel):
    activity_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    notes: Optional[order_by]
    related_kind: Optional[order_by]
    sql: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class validation_activity_sql_queries_min_order_by(BaseModel):
    activity_id: Optional[order_by]
    created_at: Optional[order_by]
    id: Optional[order_by]
    notes: Optional[order_by]
    related_kind: Optional[order_by]
    sql: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class validation_activity_sql_queries_order_by(BaseModel):
    activity_id: Optional[order_by]
    alert: Optional["company_query_alert_order_by"]
    created_at: Optional[order_by]
    id: Optional[order_by]
    notes: Optional[order_by]
    related_kind: Optional[order_by]
    sql: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class validation_activity_sql_queries_set_input(BaseModel):
    activity_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    notes: Optional[str]
    related_kind: Optional[str]
    sql: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class validation_activity_sql_queries_stream_cursor_input(BaseModel):
    initial_value: "validation_activity_sql_queries_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class validation_activity_sql_queries_stream_cursor_value_input(BaseModel):
    activity_id: Optional[Any]
    created_at: Optional[Any]
    id: Optional[Any]
    notes: Optional[str]
    related_kind: Optional[str]
    sql: Optional[str]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class validation_activity_sql_queries_updates(BaseModel):
    set: Optional["validation_activity_sql_queries_set_input"] = Field(alias="_set")
    where: "validation_activity_sql_queries_bool_exp"


class validation_tranformation_sql_queries_aggregate_bool_exp(BaseModel):
    count: Optional["validation_tranformation_sql_queries_aggregate_bool_exp_count"]


class validation_tranformation_sql_queries_aggregate_bool_exp_count(BaseModel):
    arguments: Optional[List[validation_tranformation_sql_queries_select_column]]
    distinct: Optional[bool]
    filter: Optional["validation_tranformation_sql_queries_bool_exp"]
    predicate: "Int_comparison_exp"


class validation_tranformation_sql_queries_aggregate_order_by(BaseModel):
    count: Optional[order_by]
    max: Optional["validation_tranformation_sql_queries_max_order_by"]
    min: Optional["validation_tranformation_sql_queries_min_order_by"]


class validation_tranformation_sql_queries_arr_rel_insert_input(BaseModel):
    data: List["validation_tranformation_sql_queries_insert_input"]


class validation_tranformation_sql_queries_bool_exp(BaseModel):
    and_: Optional[List["validation_tranformation_sql_queries_bool_exp"]] = Field(alias="_and")
    not_: Optional["validation_tranformation_sql_queries_bool_exp"] = Field(alias="_not")
    or_: Optional[List["validation_tranformation_sql_queries_bool_exp"]] = Field(alias="_or")
    alert: Optional["company_query_alert_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    notes: Optional["String_comparison_exp"]
    related_kind: Optional["String_comparison_exp"]
    sql: Optional["String_comparison_exp"]
    transformation: Optional["transformation_bool_exp"]
    transformation_id: Optional["uuid_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    updated_by: Optional["String_comparison_exp"]


class validation_tranformation_sql_queries_insert_input(BaseModel):
    alert: Optional["company_query_alert_obj_rel_insert_input"]
    created_at: Optional[Any]
    id: Optional[Any]
    notes: Optional[str]
    related_kind: Optional[str]
    sql: Optional[str]
    transformation: Optional["transformation_obj_rel_insert_input"]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class validation_tranformation_sql_queries_max_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    notes: Optional[order_by]
    related_kind: Optional[order_by]
    sql: Optional[order_by]
    transformation_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class validation_tranformation_sql_queries_min_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    notes: Optional[order_by]
    related_kind: Optional[order_by]
    sql: Optional[order_by]
    transformation_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class validation_tranformation_sql_queries_order_by(BaseModel):
    alert: Optional["company_query_alert_order_by"]
    created_at: Optional[order_by]
    id: Optional[order_by]
    notes: Optional[order_by]
    related_kind: Optional[order_by]
    sql: Optional[order_by]
    transformation: Optional["transformation_order_by"]
    transformation_id: Optional[order_by]
    updated_at: Optional[order_by]
    updated_by: Optional[order_by]


class validation_tranformation_sql_queries_set_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    notes: Optional[str]
    related_kind: Optional[str]
    sql: Optional[str]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class validation_tranformation_sql_queries_stream_cursor_input(BaseModel):
    initial_value: "validation_tranformation_sql_queries_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class validation_tranformation_sql_queries_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    notes: Optional[str]
    related_kind: Optional[str]
    sql: Optional[str]
    transformation_id: Optional[Any]
    updated_at: Optional[Any]
    updated_by: Optional[str]


class validation_tranformation_sql_queries_updates(BaseModel):
    set: Optional["validation_tranformation_sql_queries_set_input"] = Field(alias="_set")
    where: "validation_tranformation_sql_queries_bool_exp"


class versions_bool_exp(BaseModel):
    and_: Optional[List["versions_bool_exp"]] = Field(alias="_and")
    not_: Optional["versions_bool_exp"] = Field(alias="_not")
    or_: Optional[List["versions_bool_exp"]] = Field(alias="_or")
    created_at: Optional["timestamptz_comparison_exp"]
    id: Optional["uuid_comparison_exp"]
    related_id: Optional["uuid_comparison_exp"]
    related_to: Optional["tag_relations_enum_comparison_exp"]
    s3_key: Optional["String_comparison_exp"]


class versions_insert_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    related_id: Optional[Any]
    related_to: Optional[tag_relations_enum]
    s3_key: Optional[str]


class versions_on_conflict(BaseModel):
    constraint: versions_constraint
    update_columns: List[versions_update_column]
    where: Optional["versions_bool_exp"]


class versions_order_by(BaseModel):
    created_at: Optional[order_by]
    id: Optional[order_by]
    related_id: Optional[order_by]
    related_to: Optional[order_by]
    s3_key: Optional[order_by]


class versions_pk_columns_input(BaseModel):
    id: Any


class versions_set_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    related_id: Optional[Any]
    related_to: Optional[tag_relations_enum]
    s3_key: Optional[str]


class versions_stream_cursor_input(BaseModel):
    initial_value: "versions_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class versions_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    related_id: Optional[Any]
    related_to: Optional[tag_relations_enum]
    s3_key: Optional[str]


class versions_updates(BaseModel):
    set: Optional["versions_set_input"] = Field(alias="_set")
    where: "versions_bool_exp"


class watcher_bool_exp(BaseModel):
    and_: Optional[List["watcher_bool_exp"]] = Field(alias="_and")
    not_: Optional["watcher_bool_exp"] = Field(alias="_not")
    or_: Optional[List["watcher_bool_exp"]] = Field(alias="_or")
    company_task: Optional["company_task_bool_exp"]
    created_at: Optional["timestamptz_comparison_exp"]
    dataset: Optional["dataset_bool_exp"]
    id: Optional["uuid_comparison_exp"]
    narrative: Optional["narrative_bool_exp"]
    related_id: Optional["uuid_comparison_exp"]
    related_to: Optional["watcher_relation_enum_comparison_exp"]
    updated_at: Optional["timestamptz_comparison_exp"]
    user: Optional["user_bool_exp"]
    user_id: Optional["uuid_comparison_exp"]


class watcher_insert_input(BaseModel):
    company_task: Optional["company_task_obj_rel_insert_input"]
    created_at: Optional[Any]
    dataset: Optional["dataset_obj_rel_insert_input"]
    id: Optional[Any]
    narrative: Optional["narrative_obj_rel_insert_input"]
    related_id: Optional[Any]
    related_to: Optional[watcher_relation_enum]
    updated_at: Optional[Any]
    user: Optional["user_obj_rel_insert_input"]
    user_id: Optional[Any]


class watcher_on_conflict(BaseModel):
    constraint: watcher_constraint
    update_columns: List[watcher_update_column]
    where: Optional["watcher_bool_exp"]


class watcher_order_by(BaseModel):
    company_task: Optional["company_task_order_by"]
    created_at: Optional[order_by]
    dataset: Optional["dataset_order_by"]
    id: Optional[order_by]
    narrative: Optional["narrative_order_by"]
    related_id: Optional[order_by]
    related_to: Optional[order_by]
    updated_at: Optional[order_by]
    user: Optional["user_order_by"]
    user_id: Optional[order_by]


class watcher_pk_columns_input(BaseModel):
    id: Any


class watcher_relation_bool_exp(BaseModel):
    and_: Optional[List["watcher_relation_bool_exp"]] = Field(alias="_and")
    not_: Optional["watcher_relation_bool_exp"] = Field(alias="_not")
    or_: Optional[List["watcher_relation_bool_exp"]] = Field(alias="_or")
    description: Optional["String_comparison_exp"]
    value: Optional["String_comparison_exp"]


class watcher_relation_enum_comparison_exp(BaseModel):
    eq: Optional[watcher_relation_enum] = Field(alias="_eq")
    in_: Optional[List[watcher_relation_enum]] = Field(alias="_in")
    is_null: Optional[bool] = Field(alias="_is_null")
    neq: Optional[watcher_relation_enum] = Field(alias="_neq")
    nin: Optional[List[watcher_relation_enum]] = Field(alias="_nin")


class watcher_relation_insert_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class watcher_relation_on_conflict(BaseModel):
    constraint: watcher_relation_constraint
    update_columns: List[watcher_relation_update_column]
    where: Optional["watcher_relation_bool_exp"]


class watcher_relation_order_by(BaseModel):
    description: Optional[order_by]
    value: Optional[order_by]


class watcher_relation_pk_columns_input(BaseModel):
    value: str


class watcher_relation_set_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class watcher_relation_stream_cursor_input(BaseModel):
    initial_value: "watcher_relation_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class watcher_relation_stream_cursor_value_input(BaseModel):
    description: Optional[str]
    value: Optional[str]


class watcher_relation_updates(BaseModel):
    set: Optional["watcher_relation_set_input"] = Field(alias="_set")
    where: "watcher_relation_bool_exp"


class watcher_set_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    related_id: Optional[Any]
    related_to: Optional[watcher_relation_enum]
    updated_at: Optional[Any]
    user_id: Optional[Any]


class watcher_stream_cursor_input(BaseModel):
    initial_value: "watcher_stream_cursor_value_input"
    ordering: Optional[cursor_ordering]


class watcher_stream_cursor_value_input(BaseModel):
    created_at: Optional[Any]
    id: Optional[Any]
    related_id: Optional[Any]
    related_to: Optional[watcher_relation_enum]
    updated_at: Optional[Any]
    user_id: Optional[Any]


class watcher_updates(BaseModel):
    set: Optional["watcher_set_input"] = Field(alias="_set")
    where: "watcher_bool_exp"


Boolean_comparison_exp.update_forward_refs()
Int_comparison_exp.update_forward_refs()
String_comparison_exp.update_forward_refs()
access_role_bool_exp.update_forward_refs()
access_role_enum_comparison_exp.update_forward_refs()
access_role_insert_input.update_forward_refs()
access_role_obj_rel_insert_input.update_forward_refs()
access_role_on_conflict.update_forward_refs()
access_role_order_by.update_forward_refs()
access_role_pk_columns_input.update_forward_refs()
access_role_set_input.update_forward_refs()
access_role_stream_cursor_input.update_forward_refs()
access_role_stream_cursor_value_input.update_forward_refs()
access_role_updates.update_forward_refs()
activity_aggregate_bool_exp.update_forward_refs()
activity_aggregate_bool_exp_bool_and.update_forward_refs()
activity_aggregate_bool_exp_bool_or.update_forward_refs()
activity_aggregate_bool_exp_count.update_forward_refs()
activity_aggregate_order_by.update_forward_refs()
activity_arr_rel_insert_input.update_forward_refs()
activity_avg_order_by.update_forward_refs()
activity_bool_exp.update_forward_refs()
activity_column_renames_aggregate_bool_exp.update_forward_refs()
activity_column_renames_aggregate_bool_exp_bool_and.update_forward_refs()
activity_column_renames_aggregate_bool_exp_bool_or.update_forward_refs()
activity_column_renames_aggregate_bool_exp_count.update_forward_refs()
activity_column_renames_aggregate_order_by.update_forward_refs()
activity_column_renames_arr_rel_insert_input.update_forward_refs()
activity_column_renames_bool_exp.update_forward_refs()
activity_column_renames_insert_input.update_forward_refs()
activity_column_renames_max_order_by.update_forward_refs()
activity_column_renames_min_order_by.update_forward_refs()
activity_column_renames_order_by.update_forward_refs()
activity_column_renames_set_input.update_forward_refs()
activity_column_renames_stream_cursor_input.update_forward_refs()
activity_column_renames_stream_cursor_value_input.update_forward_refs()
activity_column_renames_updates.update_forward_refs()
activity_company_timelines_aggregate_bool_exp.update_forward_refs()
activity_company_timelines_aggregate_bool_exp_count.update_forward_refs()
activity_company_timelines_aggregate_order_by.update_forward_refs()
activity_company_timelines_arr_rel_insert_input.update_forward_refs()
activity_company_timelines_bool_exp.update_forward_refs()
activity_company_timelines_insert_input.update_forward_refs()
activity_company_timelines_max_order_by.update_forward_refs()
activity_company_timelines_min_order_by.update_forward_refs()
activity_company_timelines_order_by.update_forward_refs()
activity_company_timelines_set_input.update_forward_refs()
activity_company_timelines_stream_cursor_input.update_forward_refs()
activity_company_timelines_stream_cursor_value_input.update_forward_refs()
activity_company_timelines_updates.update_forward_refs()
activity_dim_aggregate_bool_exp.update_forward_refs()
activity_dim_aggregate_bool_exp_count.update_forward_refs()
activity_dim_aggregate_order_by.update_forward_refs()
activity_dim_arr_rel_insert_input.update_forward_refs()
activity_dim_bool_exp.update_forward_refs()
activity_dim_insert_input.update_forward_refs()
activity_dim_max_order_by.update_forward_refs()
activity_dim_min_order_by.update_forward_refs()
activity_dim_on_conflict.update_forward_refs()
activity_dim_order_by.update_forward_refs()
activity_dim_pk_columns_input.update_forward_refs()
activity_dim_set_input.update_forward_refs()
activity_dim_stream_cursor_input.update_forward_refs()
activity_dim_stream_cursor_value_input.update_forward_refs()
activity_dim_updates.update_forward_refs()
activity_inc_input.update_forward_refs()
activity_insert_input.update_forward_refs()
activity_maintenance_aggregate_bool_exp.update_forward_refs()
activity_maintenance_aggregate_bool_exp_count.update_forward_refs()
activity_maintenance_aggregate_order_by.update_forward_refs()
activity_maintenance_arr_rel_insert_input.update_forward_refs()
activity_maintenance_bool_exp.update_forward_refs()
activity_maintenance_insert_input.update_forward_refs()
activity_maintenance_max_order_by.update_forward_refs()
activity_maintenance_min_order_by.update_forward_refs()
activity_maintenance_on_conflict.update_forward_refs()
activity_maintenance_order_by.update_forward_refs()
activity_maintenance_pk_columns_input.update_forward_refs()
activity_maintenance_set_input.update_forward_refs()
activity_maintenance_stream_cursor_input.update_forward_refs()
activity_maintenance_stream_cursor_value_input.update_forward_refs()
activity_maintenance_updates.update_forward_refs()
activity_max_order_by.update_forward_refs()
activity_min_order_by.update_forward_refs()
activity_obj_rel_insert_input.update_forward_refs()
activity_on_conflict.update_forward_refs()
activity_order_by.update_forward_refs()
activity_pk_columns_input.update_forward_refs()
activity_questions_aggregate_bool_exp.update_forward_refs()
activity_questions_aggregate_bool_exp_count.update_forward_refs()
activity_questions_aggregate_order_by.update_forward_refs()
activity_questions_arr_rel_insert_input.update_forward_refs()
activity_questions_bool_exp.update_forward_refs()
activity_questions_insert_input.update_forward_refs()
activity_questions_max_order_by.update_forward_refs()
activity_questions_min_order_by.update_forward_refs()
activity_questions_order_by.update_forward_refs()
activity_questions_set_input.update_forward_refs()
activity_questions_stream_cursor_input.update_forward_refs()
activity_questions_stream_cursor_value_input.update_forward_refs()
activity_questions_updates.update_forward_refs()
activity_set_input.update_forward_refs()
activity_status_bool_exp.update_forward_refs()
activity_status_enum_comparison_exp.update_forward_refs()
activity_status_insert_input.update_forward_refs()
activity_status_on_conflict.update_forward_refs()
activity_status_order_by.update_forward_refs()
activity_status_pk_columns_input.update_forward_refs()
activity_status_set_input.update_forward_refs()
activity_status_stream_cursor_input.update_forward_refs()
activity_status_stream_cursor_value_input.update_forward_refs()
activity_status_updates.update_forward_refs()
activity_stddev_order_by.update_forward_refs()
activity_stddev_pop_order_by.update_forward_refs()
activity_stddev_samp_order_by.update_forward_refs()
activity_stream_cursor_input.update_forward_refs()
activity_stream_cursor_value_input.update_forward_refs()
activity_sum_order_by.update_forward_refs()
activity_tags_aggregate_bool_exp.update_forward_refs()
activity_tags_aggregate_bool_exp_count.update_forward_refs()
activity_tags_aggregate_order_by.update_forward_refs()
activity_tags_arr_rel_insert_input.update_forward_refs()
activity_tags_bool_exp.update_forward_refs()
activity_tags_insert_input.update_forward_refs()
activity_tags_max_order_by.update_forward_refs()
activity_tags_min_order_by.update_forward_refs()
activity_tags_order_by.update_forward_refs()
activity_tags_set_input.update_forward_refs()
activity_tags_stream_cursor_input.update_forward_refs()
activity_tags_stream_cursor_value_input.update_forward_refs()
activity_tags_updates.update_forward_refs()
activity_team_permissions_aggregate_bool_exp.update_forward_refs()
activity_team_permissions_aggregate_bool_exp_bool_and.update_forward_refs()
activity_team_permissions_aggregate_bool_exp_bool_or.update_forward_refs()
activity_team_permissions_aggregate_bool_exp_count.update_forward_refs()
activity_team_permissions_aggregate_order_by.update_forward_refs()
activity_team_permissions_arr_rel_insert_input.update_forward_refs()
activity_team_permissions_bool_exp.update_forward_refs()
activity_team_permissions_insert_input.update_forward_refs()
activity_team_permissions_max_order_by.update_forward_refs()
activity_team_permissions_min_order_by.update_forward_refs()
activity_team_permissions_order_by.update_forward_refs()
activity_team_permissions_set_input.update_forward_refs()
activity_team_permissions_stream_cursor_input.update_forward_refs()
activity_team_permissions_stream_cursor_value_input.update_forward_refs()
activity_team_permissions_updates.update_forward_refs()
activity_updates.update_forward_refs()
activity_var_pop_order_by.update_forward_refs()
activity_var_samp_order_by.update_forward_refs()
activity_variance_order_by.update_forward_refs()
bigint_comparison_exp.update_forward_refs()
chat_append_input.update_forward_refs()
chat_bool_exp.update_forward_refs()
chat_delete_at_path_input.update_forward_refs()
chat_delete_elem_input.update_forward_refs()
chat_delete_key_input.update_forward_refs()
chat_inc_input.update_forward_refs()
chat_insert_input.update_forward_refs()
chat_obj_rel_insert_input.update_forward_refs()
chat_on_conflict.update_forward_refs()
chat_order_by.update_forward_refs()
chat_pk_columns_input.update_forward_refs()
chat_prepend_input.update_forward_refs()
chat_set_input.update_forward_refs()
chat_stream_cursor_input.update_forward_refs()
chat_stream_cursor_value_input.update_forward_refs()
chat_tags_aggregate_bool_exp.update_forward_refs()
chat_tags_aggregate_bool_exp_count.update_forward_refs()
chat_tags_aggregate_order_by.update_forward_refs()
chat_tags_arr_rel_insert_input.update_forward_refs()
chat_tags_bool_exp.update_forward_refs()
chat_tags_insert_input.update_forward_refs()
chat_tags_max_order_by.update_forward_refs()
chat_tags_min_order_by.update_forward_refs()
chat_tags_order_by.update_forward_refs()
chat_tags_set_input.update_forward_refs()
chat_tags_stream_cursor_input.update_forward_refs()
chat_tags_stream_cursor_value_input.update_forward_refs()
chat_tags_updates.update_forward_refs()
chat_updates.update_forward_refs()
column_rename_relations_bool_exp.update_forward_refs()
column_rename_relations_enum_comparison_exp.update_forward_refs()
column_rename_relations_insert_input.update_forward_refs()
column_rename_relations_on_conflict.update_forward_refs()
column_rename_relations_order_by.update_forward_refs()
column_rename_relations_pk_columns_input.update_forward_refs()
column_rename_relations_set_input.update_forward_refs()
column_rename_relations_stream_cursor_input.update_forward_refs()
column_rename_relations_stream_cursor_value_input.update_forward_refs()
column_rename_relations_updates.update_forward_refs()
column_renames_bool_exp.update_forward_refs()
column_renames_insert_input.update_forward_refs()
column_renames_on_conflict.update_forward_refs()
column_renames_order_by.update_forward_refs()
column_renames_pk_columns_input.update_forward_refs()
column_renames_set_input.update_forward_refs()
column_renames_stream_cursor_input.update_forward_refs()
column_renames_stream_cursor_value_input.update_forward_refs()
column_renames_updates.update_forward_refs()
company_auth0_bool_exp.update_forward_refs()
company_auth0_insert_input.update_forward_refs()
company_auth0_obj_rel_insert_input.update_forward_refs()
company_auth0_on_conflict.update_forward_refs()
company_auth0_order_by.update_forward_refs()
company_auth0_pk_columns_input.update_forward_refs()
company_auth0_set_input.update_forward_refs()
company_auth0_stream_cursor_input.update_forward_refs()
company_auth0_stream_cursor_value_input.update_forward_refs()
company_auth0_updates.update_forward_refs()
company_bool_exp.update_forward_refs()
company_categories_bool_exp.update_forward_refs()
company_categories_insert_input.update_forward_refs()
company_categories_obj_rel_insert_input.update_forward_refs()
company_categories_on_conflict.update_forward_refs()
company_categories_order_by.update_forward_refs()
company_categories_pk_columns_input.update_forward_refs()
company_categories_set_input.update_forward_refs()
company_categories_stream_cursor_input.update_forward_refs()
company_categories_stream_cursor_value_input.update_forward_refs()
company_categories_updates.update_forward_refs()
company_config_batch_version_bool_exp.update_forward_refs()
company_config_batch_version_insert_input.update_forward_refs()
company_config_batch_version_on_conflict.update_forward_refs()
company_config_batch_version_order_by.update_forward_refs()
company_config_batch_version_pk_columns_input.update_forward_refs()
company_config_batch_version_set_input.update_forward_refs()
company_config_batch_version_stream_cursor_input.update_forward_refs()
company_config_batch_version_stream_cursor_value_input.update_forward_refs()
company_config_batch_version_updates.update_forward_refs()
company_config_core_version_bool_exp.update_forward_refs()
company_config_core_version_insert_input.update_forward_refs()
company_config_core_version_on_conflict.update_forward_refs()
company_config_core_version_order_by.update_forward_refs()
company_config_core_version_pk_columns_input.update_forward_refs()
company_config_core_version_set_input.update_forward_refs()
company_config_core_version_stream_cursor_input.update_forward_refs()
company_config_core_version_stream_cursor_value_input.update_forward_refs()
company_config_core_version_updates.update_forward_refs()
company_config_warehouse_language_bool_exp.update_forward_refs()
company_config_warehouse_language_enum_comparison_exp.update_forward_refs()
company_config_warehouse_language_insert_input.update_forward_refs()
company_config_warehouse_language_on_conflict.update_forward_refs()
company_config_warehouse_language_order_by.update_forward_refs()
company_config_warehouse_language_pk_columns_input.update_forward_refs()
company_config_warehouse_language_set_input.update_forward_refs()
company_config_warehouse_language_stream_cursor_input.update_forward_refs()
company_config_warehouse_language_stream_cursor_value_input.update_forward_refs()
company_config_warehouse_language_updates.update_forward_refs()
company_github_sync_aggregate_bool_exp.update_forward_refs()
company_github_sync_aggregate_bool_exp_count.update_forward_refs()
company_github_sync_aggregate_order_by.update_forward_refs()
company_github_sync_arr_rel_insert_input.update_forward_refs()
company_github_sync_avg_order_by.update_forward_refs()
company_github_sync_bool_exp.update_forward_refs()
company_github_sync_inc_input.update_forward_refs()
company_github_sync_insert_input.update_forward_refs()
company_github_sync_max_order_by.update_forward_refs()
company_github_sync_min_order_by.update_forward_refs()
company_github_sync_on_conflict.update_forward_refs()
company_github_sync_order_by.update_forward_refs()
company_github_sync_pk_columns_input.update_forward_refs()
company_github_sync_set_input.update_forward_refs()
company_github_sync_stddev_order_by.update_forward_refs()
company_github_sync_stddev_pop_order_by.update_forward_refs()
company_github_sync_stddev_samp_order_by.update_forward_refs()
company_github_sync_stream_cursor_input.update_forward_refs()
company_github_sync_stream_cursor_value_input.update_forward_refs()
company_github_sync_sum_order_by.update_forward_refs()
company_github_sync_updates.update_forward_refs()
company_github_sync_var_pop_order_by.update_forward_refs()
company_github_sync_var_samp_order_by.update_forward_refs()
company_github_sync_variance_order_by.update_forward_refs()
company_inc_input.update_forward_refs()
company_insert_input.update_forward_refs()
company_narrative_templates_bool_exp.update_forward_refs()
company_narrative_templates_insert_input.update_forward_refs()
company_narrative_templates_on_conflict.update_forward_refs()
company_narrative_templates_order_by.update_forward_refs()
company_narrative_templates_pk_columns_input.update_forward_refs()
company_narrative_templates_set_input.update_forward_refs()
company_narrative_templates_stream_cursor_input.update_forward_refs()
company_narrative_templates_stream_cursor_value_input.update_forward_refs()
company_narrative_templates_updates.update_forward_refs()
company_obj_rel_insert_input.update_forward_refs()
company_on_conflict.update_forward_refs()
company_order_by.update_forward_refs()
company_pk_columns_input.update_forward_refs()
company_prototypes_bool_exp.update_forward_refs()
company_prototypes_insert_input.update_forward_refs()
company_prototypes_on_conflict.update_forward_refs()
company_prototypes_order_by.update_forward_refs()
company_prototypes_pk_columns_input.update_forward_refs()
company_prototypes_set_input.update_forward_refs()
company_prototypes_stream_cursor_input.update_forward_refs()
company_prototypes_stream_cursor_value_input.update_forward_refs()
company_prototypes_updates.update_forward_refs()
company_query_alert_aggregate_bool_exp.update_forward_refs()
company_query_alert_aggregate_bool_exp_count.update_forward_refs()
company_query_alert_aggregate_order_by.update_forward_refs()
company_query_alert_arr_rel_insert_input.update_forward_refs()
company_query_alert_bool_exp.update_forward_refs()
company_query_alert_insert_input.update_forward_refs()
company_query_alert_kinds_bool_exp.update_forward_refs()
company_query_alert_kinds_enum_comparison_exp.update_forward_refs()
company_query_alert_kinds_insert_input.update_forward_refs()
company_query_alert_kinds_on_conflict.update_forward_refs()
company_query_alert_kinds_order_by.update_forward_refs()
company_query_alert_kinds_pk_columns_input.update_forward_refs()
company_query_alert_kinds_set_input.update_forward_refs()
company_query_alert_kinds_stream_cursor_input.update_forward_refs()
company_query_alert_kinds_stream_cursor_value_input.update_forward_refs()
company_query_alert_kinds_updates.update_forward_refs()
company_query_alert_max_order_by.update_forward_refs()
company_query_alert_min_order_by.update_forward_refs()
company_query_alert_obj_rel_insert_input.update_forward_refs()
company_query_alert_on_conflict.update_forward_refs()
company_query_alert_order_by.update_forward_refs()
company_query_alert_pk_columns_input.update_forward_refs()
company_query_alert_set_input.update_forward_refs()
company_query_alert_stream_cursor_input.update_forward_refs()
company_query_alert_stream_cursor_value_input.update_forward_refs()
company_query_alert_updates.update_forward_refs()
company_resources_bool_exp.update_forward_refs()
company_resources_inc_input.update_forward_refs()
company_resources_insert_input.update_forward_refs()
company_resources_obj_rel_insert_input.update_forward_refs()
company_resources_on_conflict.update_forward_refs()
company_resources_order_by.update_forward_refs()
company_resources_pk_columns_input.update_forward_refs()
company_resources_set_input.update_forward_refs()
company_resources_stream_cursor_input.update_forward_refs()
company_resources_stream_cursor_value_input.update_forward_refs()
company_resources_updates.update_forward_refs()
company_set_input.update_forward_refs()
company_sql_queries_bool_exp.update_forward_refs()
company_sql_queries_insert_input.update_forward_refs()
company_sql_queries_order_by.update_forward_refs()
company_sql_queries_set_input.update_forward_refs()
company_sql_queries_stream_cursor_input.update_forward_refs()
company_sql_queries_stream_cursor_value_input.update_forward_refs()
company_sql_queries_updates.update_forward_refs()
company_status_bool_exp.update_forward_refs()
company_status_enum_comparison_exp.update_forward_refs()
company_status_insert_input.update_forward_refs()
company_status_on_conflict.update_forward_refs()
company_status_order_by.update_forward_refs()
company_status_pk_columns_input.update_forward_refs()
company_status_set_input.update_forward_refs()
company_status_stream_cursor_input.update_forward_refs()
company_status_stream_cursor_value_input.update_forward_refs()
company_status_updates.update_forward_refs()
company_stream_cursor_input.update_forward_refs()
company_stream_cursor_value_input.update_forward_refs()
company_table_aggregate_bool_exp.update_forward_refs()
company_table_aggregate_bool_exp_bool_and.update_forward_refs()
company_table_aggregate_bool_exp_bool_or.update_forward_refs()
company_table_aggregate_bool_exp_count.update_forward_refs()
company_table_aggregate_order_by.update_forward_refs()
company_table_aggregation_dim_aggregate_bool_exp.update_forward_refs()
company_table_aggregation_dim_aggregate_bool_exp_count.update_forward_refs()
company_table_aggregation_dim_aggregate_order_by.update_forward_refs()
company_table_aggregation_dim_arr_rel_insert_input.update_forward_refs()
company_table_aggregation_dim_bool_exp.update_forward_refs()
company_table_aggregation_dim_insert_input.update_forward_refs()
company_table_aggregation_dim_max_order_by.update_forward_refs()
company_table_aggregation_dim_min_order_by.update_forward_refs()
company_table_aggregation_dim_on_conflict.update_forward_refs()
company_table_aggregation_dim_order_by.update_forward_refs()
company_table_aggregation_dim_pk_columns_input.update_forward_refs()
company_table_aggregation_dim_set_input.update_forward_refs()
company_table_aggregation_dim_stream_cursor_input.update_forward_refs()
company_table_aggregation_dim_stream_cursor_value_input.update_forward_refs()
company_table_aggregation_dim_updates.update_forward_refs()
company_table_arr_rel_insert_input.update_forward_refs()
company_table_avg_order_by.update_forward_refs()
company_table_bool_exp.update_forward_refs()
company_table_inc_input.update_forward_refs()
company_table_insert_input.update_forward_refs()
company_table_max_order_by.update_forward_refs()
company_table_min_order_by.update_forward_refs()
company_table_obj_rel_insert_input.update_forward_refs()
company_table_on_conflict.update_forward_refs()
company_table_order_by.update_forward_refs()
company_table_pk_columns_input.update_forward_refs()
company_table_set_input.update_forward_refs()
company_table_stddev_order_by.update_forward_refs()
company_table_stddev_pop_order_by.update_forward_refs()
company_table_stddev_samp_order_by.update_forward_refs()
company_table_stream_cursor_input.update_forward_refs()
company_table_stream_cursor_value_input.update_forward_refs()
company_table_sum_order_by.update_forward_refs()
company_table_updates.update_forward_refs()
company_table_var_pop_order_by.update_forward_refs()
company_table_var_samp_order_by.update_forward_refs()
company_table_variance_order_by.update_forward_refs()
company_tags_aggregate_bool_exp.update_forward_refs()
company_tags_aggregate_bool_exp_count.update_forward_refs()
company_tags_aggregate_order_by.update_forward_refs()
company_tags_arr_rel_insert_input.update_forward_refs()
company_tags_bool_exp.update_forward_refs()
company_tags_insert_input.update_forward_refs()
company_tags_max_order_by.update_forward_refs()
company_tags_min_order_by.update_forward_refs()
company_tags_obj_rel_insert_input.update_forward_refs()
company_tags_on_conflict.update_forward_refs()
company_tags_order_by.update_forward_refs()
company_tags_pk_columns_input.update_forward_refs()
company_tags_set_input.update_forward_refs()
company_tags_stream_cursor_input.update_forward_refs()
company_tags_stream_cursor_value_input.update_forward_refs()
company_tags_updates.update_forward_refs()
company_task_aggregate_bool_exp.update_forward_refs()
company_task_aggregate_bool_exp_bool_and.update_forward_refs()
company_task_aggregate_bool_exp_bool_or.update_forward_refs()
company_task_aggregate_bool_exp_count.update_forward_refs()
company_task_aggregate_order_by.update_forward_refs()
company_task_arr_rel_insert_input.update_forward_refs()
company_task_bool_exp.update_forward_refs()
company_task_category_bool_exp.update_forward_refs()
company_task_category_enum_comparison_exp.update_forward_refs()
company_task_category_insert_input.update_forward_refs()
company_task_category_on_conflict.update_forward_refs()
company_task_category_order_by.update_forward_refs()
company_task_category_pk_columns_input.update_forward_refs()
company_task_category_set_input.update_forward_refs()
company_task_category_stream_cursor_input.update_forward_refs()
company_task_category_stream_cursor_value_input.update_forward_refs()
company_task_category_updates.update_forward_refs()
company_task_insert_input.update_forward_refs()
company_task_max_order_by.update_forward_refs()
company_task_min_order_by.update_forward_refs()
company_task_obj_rel_insert_input.update_forward_refs()
company_task_on_conflict.update_forward_refs()
company_task_order_by.update_forward_refs()
company_task_pk_columns_input.update_forward_refs()
company_task_set_input.update_forward_refs()
company_task_stream_cursor_input.update_forward_refs()
company_task_stream_cursor_value_input.update_forward_refs()
company_task_updates.update_forward_refs()
company_timeline_bool_exp.update_forward_refs()
company_timeline_insert_input.update_forward_refs()
company_timeline_on_conflict.update_forward_refs()
company_timeline_order_by.update_forward_refs()
company_timeline_pk_columns_input.update_forward_refs()
company_timeline_relations_bool_exp.update_forward_refs()
company_timeline_relations_enum_comparison_exp.update_forward_refs()
company_timeline_relations_insert_input.update_forward_refs()
company_timeline_relations_on_conflict.update_forward_refs()
company_timeline_relations_order_by.update_forward_refs()
company_timeline_relations_pk_columns_input.update_forward_refs()
company_timeline_relations_set_input.update_forward_refs()
company_timeline_relations_stream_cursor_input.update_forward_refs()
company_timeline_relations_stream_cursor_value_input.update_forward_refs()
company_timeline_relations_updates.update_forward_refs()
company_timeline_set_input.update_forward_refs()
company_timeline_stream_cursor_input.update_forward_refs()
company_timeline_stream_cursor_value_input.update_forward_refs()
company_timeline_updates.update_forward_refs()
company_updates.update_forward_refs()
company_user_aggregate_bool_exp.update_forward_refs()
company_user_aggregate_bool_exp_bool_and.update_forward_refs()
company_user_aggregate_bool_exp_bool_or.update_forward_refs()
company_user_aggregate_bool_exp_count.update_forward_refs()
company_user_aggregate_order_by.update_forward_refs()
company_user_api_key_bool_exp.update_forward_refs()
company_user_api_key_insert_input.update_forward_refs()
company_user_api_key_on_conflict.update_forward_refs()
company_user_api_key_order_by.update_forward_refs()
company_user_api_key_pk_columns_input.update_forward_refs()
company_user_api_key_set_input.update_forward_refs()
company_user_api_key_stream_cursor_input.update_forward_refs()
company_user_api_key_stream_cursor_value_input.update_forward_refs()
company_user_api_key_updates.update_forward_refs()
company_user_arr_rel_insert_input.update_forward_refs()
company_user_bool_exp.update_forward_refs()
company_user_insert_input.update_forward_refs()
company_user_max_order_by.update_forward_refs()
company_user_min_order_by.update_forward_refs()
company_user_notifications_aggregate_bool_exp.update_forward_refs()
company_user_notifications_aggregate_bool_exp_count.update_forward_refs()
company_user_notifications_aggregate_order_by.update_forward_refs()
company_user_notifications_append_input.update_forward_refs()
company_user_notifications_arr_rel_insert_input.update_forward_refs()
company_user_notifications_bool_exp.update_forward_refs()
company_user_notifications_delete_at_path_input.update_forward_refs()
company_user_notifications_delete_elem_input.update_forward_refs()
company_user_notifications_delete_key_input.update_forward_refs()
company_user_notifications_insert_input.update_forward_refs()
company_user_notifications_max_order_by.update_forward_refs()
company_user_notifications_min_order_by.update_forward_refs()
company_user_notifications_on_conflict.update_forward_refs()
company_user_notifications_order_by.update_forward_refs()
company_user_notifications_pk_columns_input.update_forward_refs()
company_user_notifications_prepend_input.update_forward_refs()
company_user_notifications_set_input.update_forward_refs()
company_user_notifications_stream_cursor_input.update_forward_refs()
company_user_notifications_stream_cursor_value_input.update_forward_refs()
company_user_notifications_updates.update_forward_refs()
company_user_obj_rel_insert_input.update_forward_refs()
company_user_on_conflict.update_forward_refs()
company_user_order_by.update_forward_refs()
company_user_pk_columns_input.update_forward_refs()
company_user_preferences_bool_exp.update_forward_refs()
company_user_preferences_insert_input.update_forward_refs()
company_user_preferences_obj_rel_insert_input.update_forward_refs()
company_user_preferences_on_conflict.update_forward_refs()
company_user_preferences_order_by.update_forward_refs()
company_user_preferences_pk_columns_input.update_forward_refs()
company_user_preferences_set_input.update_forward_refs()
company_user_preferences_stream_cursor_input.update_forward_refs()
company_user_preferences_stream_cursor_value_input.update_forward_refs()
company_user_preferences_updates.update_forward_refs()
company_user_role_bool_exp.update_forward_refs()
company_user_role_enum_comparison_exp.update_forward_refs()
company_user_role_insert_input.update_forward_refs()
company_user_role_on_conflict.update_forward_refs()
company_user_role_order_by.update_forward_refs()
company_user_role_pk_columns_input.update_forward_refs()
company_user_role_set_input.update_forward_refs()
company_user_role_stream_cursor_input.update_forward_refs()
company_user_role_stream_cursor_value_input.update_forward_refs()
company_user_role_updates.update_forward_refs()
company_user_set_input.update_forward_refs()
company_user_stream_cursor_input.update_forward_refs()
company_user_stream_cursor_value_input.update_forward_refs()
company_user_updates.update_forward_refs()
compiled_narratives_aggregate_bool_exp.update_forward_refs()
compiled_narratives_aggregate_bool_exp_count.update_forward_refs()
compiled_narratives_aggregate_order_by.update_forward_refs()
compiled_narratives_arr_rel_insert_input.update_forward_refs()
compiled_narratives_bool_exp.update_forward_refs()
compiled_narratives_insert_input.update_forward_refs()
compiled_narratives_max_order_by.update_forward_refs()
compiled_narratives_min_order_by.update_forward_refs()
compiled_narratives_order_by.update_forward_refs()
compiled_narratives_set_input.update_forward_refs()
compiled_narratives_stream_cursor_input.update_forward_refs()
compiled_narratives_stream_cursor_value_input.update_forward_refs()
compiled_narratives_updates.update_forward_refs()
current_tranformation_sql_queries_bool_exp.update_forward_refs()
current_tranformation_sql_queries_insert_input.update_forward_refs()
current_tranformation_sql_queries_obj_rel_insert_input.update_forward_refs()
current_tranformation_sql_queries_order_by.update_forward_refs()
current_tranformation_sql_queries_set_input.update_forward_refs()
current_tranformation_sql_queries_stream_cursor_input.update_forward_refs()
current_tranformation_sql_queries_stream_cursor_value_input.update_forward_refs()
current_tranformation_sql_queries_updates.update_forward_refs()
custom_function_bool_exp.update_forward_refs()
custom_function_inc_input.update_forward_refs()
custom_function_insert_input.update_forward_refs()
custom_function_on_conflict.update_forward_refs()
custom_function_order_by.update_forward_refs()
custom_function_pk_columns_input.update_forward_refs()
custom_function_set_input.update_forward_refs()
custom_function_stream_cursor_input.update_forward_refs()
custom_function_stream_cursor_value_input.update_forward_refs()
custom_function_updates.update_forward_refs()
datacenter_region_bool_exp.update_forward_refs()
datacenter_region_enum_comparison_exp.update_forward_refs()
datacenter_region_insert_input.update_forward_refs()
datacenter_region_on_conflict.update_forward_refs()
datacenter_region_order_by.update_forward_refs()
datacenter_region_pk_columns_input.update_forward_refs()
datacenter_region_set_input.update_forward_refs()
datacenter_region_stream_cursor_input.update_forward_refs()
datacenter_region_stream_cursor_value_input.update_forward_refs()
datacenter_region_updates.update_forward_refs()
dataset_activities_aggregate_bool_exp.update_forward_refs()
dataset_activities_aggregate_bool_exp_count.update_forward_refs()
dataset_activities_aggregate_order_by.update_forward_refs()
dataset_activities_arr_rel_insert_input.update_forward_refs()
dataset_activities_bool_exp.update_forward_refs()
dataset_activities_insert_input.update_forward_refs()
dataset_activities_max_order_by.update_forward_refs()
dataset_activities_min_order_by.update_forward_refs()
dataset_activities_on_conflict.update_forward_refs()
dataset_activities_order_by.update_forward_refs()
dataset_activities_pk_columns_input.update_forward_refs()
dataset_activities_set_input.update_forward_refs()
dataset_activities_stream_cursor_input.update_forward_refs()
dataset_activities_stream_cursor_value_input.update_forward_refs()
dataset_activities_updates.update_forward_refs()
dataset_aggregate_bool_exp.update_forward_refs()
dataset_aggregate_bool_exp_bool_and.update_forward_refs()
dataset_aggregate_bool_exp_bool_or.update_forward_refs()
dataset_aggregate_bool_exp_count.update_forward_refs()
dataset_aggregate_order_by.update_forward_refs()
dataset_arr_rel_insert_input.update_forward_refs()
dataset_bool_exp.update_forward_refs()
dataset_insert_input.update_forward_refs()
dataset_materialization_aggregate_bool_exp.update_forward_refs()
dataset_materialization_aggregate_bool_exp_count.update_forward_refs()
dataset_materialization_aggregate_order_by.update_forward_refs()
dataset_materialization_arr_rel_insert_input.update_forward_refs()
dataset_materialization_avg_order_by.update_forward_refs()
dataset_materialization_bool_exp.update_forward_refs()
dataset_materialization_inc_input.update_forward_refs()
dataset_materialization_insert_input.update_forward_refs()
dataset_materialization_max_order_by.update_forward_refs()
dataset_materialization_min_order_by.update_forward_refs()
dataset_materialization_on_conflict.update_forward_refs()
dataset_materialization_order_by.update_forward_refs()
dataset_materialization_pk_columns_input.update_forward_refs()
dataset_materialization_set_input.update_forward_refs()
dataset_materialization_stddev_order_by.update_forward_refs()
dataset_materialization_stddev_pop_order_by.update_forward_refs()
dataset_materialization_stddev_samp_order_by.update_forward_refs()
dataset_materialization_stream_cursor_input.update_forward_refs()
dataset_materialization_stream_cursor_value_input.update_forward_refs()
dataset_materialization_sum_order_by.update_forward_refs()
dataset_materialization_updates.update_forward_refs()
dataset_materialization_var_pop_order_by.update_forward_refs()
dataset_materialization_var_samp_order_by.update_forward_refs()
dataset_materialization_variance_order_by.update_forward_refs()
dataset_max_order_by.update_forward_refs()
dataset_min_order_by.update_forward_refs()
dataset_obj_rel_insert_input.update_forward_refs()
dataset_on_conflict.update_forward_refs()
dataset_order_by.update_forward_refs()
dataset_pk_columns_input.update_forward_refs()
dataset_set_input.update_forward_refs()
dataset_stream_cursor_input.update_forward_refs()
dataset_stream_cursor_value_input.update_forward_refs()
dataset_tags_aggregate_bool_exp.update_forward_refs()
dataset_tags_aggregate_bool_exp_count.update_forward_refs()
dataset_tags_aggregate_order_by.update_forward_refs()
dataset_tags_arr_rel_insert_input.update_forward_refs()
dataset_tags_bool_exp.update_forward_refs()
dataset_tags_insert_input.update_forward_refs()
dataset_tags_max_order_by.update_forward_refs()
dataset_tags_min_order_by.update_forward_refs()
dataset_tags_order_by.update_forward_refs()
dataset_tags_set_input.update_forward_refs()
dataset_tags_stream_cursor_input.update_forward_refs()
dataset_tags_stream_cursor_value_input.update_forward_refs()
dataset_tags_updates.update_forward_refs()
dataset_team_permissions_aggregate_bool_exp.update_forward_refs()
dataset_team_permissions_aggregate_bool_exp_bool_and.update_forward_refs()
dataset_team_permissions_aggregate_bool_exp_bool_or.update_forward_refs()
dataset_team_permissions_aggregate_bool_exp_count.update_forward_refs()
dataset_team_permissions_aggregate_order_by.update_forward_refs()
dataset_team_permissions_arr_rel_insert_input.update_forward_refs()
dataset_team_permissions_bool_exp.update_forward_refs()
dataset_team_permissions_insert_input.update_forward_refs()
dataset_team_permissions_max_order_by.update_forward_refs()
dataset_team_permissions_min_order_by.update_forward_refs()
dataset_team_permissions_order_by.update_forward_refs()
dataset_team_permissions_set_input.update_forward_refs()
dataset_team_permissions_stream_cursor_input.update_forward_refs()
dataset_team_permissions_stream_cursor_value_input.update_forward_refs()
dataset_team_permissions_updates.update_forward_refs()
dataset_updates.update_forward_refs()
dataset_versions_aggregate_bool_exp.update_forward_refs()
dataset_versions_aggregate_bool_exp_count.update_forward_refs()
dataset_versions_aggregate_order_by.update_forward_refs()
dataset_versions_arr_rel_insert_input.update_forward_refs()
dataset_versions_bool_exp.update_forward_refs()
dataset_versions_insert_input.update_forward_refs()
dataset_versions_max_order_by.update_forward_refs()
dataset_versions_min_order_by.update_forward_refs()
dataset_versions_order_by.update_forward_refs()
dataset_versions_set_input.update_forward_refs()
dataset_versions_stream_cursor_input.update_forward_refs()
dataset_versions_stream_cursor_value_input.update_forward_refs()
dataset_versions_updates.update_forward_refs()
date_comparison_exp.update_forward_refs()
dim_table_bool_exp.update_forward_refs()
dim_table_columns_aggregate_bool_exp.update_forward_refs()
dim_table_columns_aggregate_bool_exp_bool_and.update_forward_refs()
dim_table_columns_aggregate_bool_exp_bool_or.update_forward_refs()
dim_table_columns_aggregate_bool_exp_count.update_forward_refs()
dim_table_columns_aggregate_order_by.update_forward_refs()
dim_table_columns_arr_rel_insert_input.update_forward_refs()
dim_table_columns_bool_exp.update_forward_refs()
dim_table_columns_insert_input.update_forward_refs()
dim_table_columns_max_order_by.update_forward_refs()
dim_table_columns_min_order_by.update_forward_refs()
dim_table_columns_order_by.update_forward_refs()
dim_table_columns_set_input.update_forward_refs()
dim_table_columns_stream_cursor_input.update_forward_refs()
dim_table_columns_stream_cursor_value_input.update_forward_refs()
dim_table_columns_updates.update_forward_refs()
dim_table_insert_input.update_forward_refs()
dim_table_obj_rel_insert_input.update_forward_refs()
dim_table_on_conflict.update_forward_refs()
dim_table_order_by.update_forward_refs()
dim_table_pk_columns_input.update_forward_refs()
dim_table_set_input.update_forward_refs()
dim_table_stream_cursor_input.update_forward_refs()
dim_table_stream_cursor_value_input.update_forward_refs()
dim_table_updates.update_forward_refs()
dim_team_permissions_aggregate_bool_exp.update_forward_refs()
dim_team_permissions_aggregate_bool_exp_bool_and.update_forward_refs()
dim_team_permissions_aggregate_bool_exp_bool_or.update_forward_refs()
dim_team_permissions_aggregate_bool_exp_count.update_forward_refs()
dim_team_permissions_aggregate_order_by.update_forward_refs()
dim_team_permissions_arr_rel_insert_input.update_forward_refs()
dim_team_permissions_bool_exp.update_forward_refs()
dim_team_permissions_insert_input.update_forward_refs()
dim_team_permissions_max_order_by.update_forward_refs()
dim_team_permissions_min_order_by.update_forward_refs()
dim_team_permissions_order_by.update_forward_refs()
dim_team_permissions_set_input.update_forward_refs()
dim_team_permissions_stream_cursor_input.update_forward_refs()
dim_team_permissions_stream_cursor_value_input.update_forward_refs()
dim_team_permissions_updates.update_forward_refs()
document_live_bool_exp.update_forward_refs()
document_live_order_by.update_forward_refs()
document_live_stream_cursor_input.update_forward_refs()
document_live_stream_cursor_value_input.update_forward_refs()
document_revision_bool_exp.update_forward_refs()
document_revision_insert_input.update_forward_refs()
document_revision_on_conflict.update_forward_refs()
document_revision_order_by.update_forward_refs()
document_revision_pk_columns_input.update_forward_refs()
document_revision_set_input.update_forward_refs()
document_revision_stream_cursor_input.update_forward_refs()
document_revision_stream_cursor_value_input.update_forward_refs()
document_revision_updates.update_forward_refs()
float8_comparison_exp.update_forward_refs()
group_aggregate_bool_exp.update_forward_refs()
group_aggregate_bool_exp_count.update_forward_refs()
group_aggregate_order_by.update_forward_refs()
group_arr_rel_insert_input.update_forward_refs()
group_bool_exp.update_forward_refs()
group_insert_input.update_forward_refs()
group_max_order_by.update_forward_refs()
group_min_order_by.update_forward_refs()
group_on_conflict.update_forward_refs()
group_order_by.update_forward_refs()
group_pk_columns_input.update_forward_refs()
group_set_input.update_forward_refs()
group_stream_cursor_input.update_forward_refs()
group_stream_cursor_value_input.update_forward_refs()
group_updates.update_forward_refs()
jsonb_cast_exp.update_forward_refs()
jsonb_comparison_exp.update_forward_refs()
llm_training_bool_exp.update_forward_refs()
llm_training_insert_input.update_forward_refs()
llm_training_obj_rel_insert_input.update_forward_refs()
llm_training_on_conflict.update_forward_refs()
llm_training_order_by.update_forward_refs()
llm_training_pk_columns_input.update_forward_refs()
llm_training_set_input.update_forward_refs()
llm_training_stream_cursor_input.update_forward_refs()
llm_training_stream_cursor_value_input.update_forward_refs()
llm_training_updates.update_forward_refs()
maintenance_kinds_bool_exp.update_forward_refs()
maintenance_kinds_enum_comparison_exp.update_forward_refs()
maintenance_kinds_insert_input.update_forward_refs()
maintenance_kinds_obj_rel_insert_input.update_forward_refs()
maintenance_kinds_on_conflict.update_forward_refs()
maintenance_kinds_order_by.update_forward_refs()
maintenance_kinds_pk_columns_input.update_forward_refs()
maintenance_kinds_set_input.update_forward_refs()
maintenance_kinds_stream_cursor_input.update_forward_refs()
maintenance_kinds_stream_cursor_value_input.update_forward_refs()
maintenance_kinds_updates.update_forward_refs()
materialization_type_bool_exp.update_forward_refs()
materialization_type_enum_comparison_exp.update_forward_refs()
materialization_type_insert_input.update_forward_refs()
materialization_type_on_conflict.update_forward_refs()
materialization_type_order_by.update_forward_refs()
materialization_type_pk_columns_input.update_forward_refs()
materialization_type_set_input.update_forward_refs()
materialization_type_stream_cursor_input.update_forward_refs()
materialization_type_stream_cursor_value_input.update_forward_refs()
materialization_type_updates.update_forward_refs()
metric_bool_exp.update_forward_refs()
metric_insert_input.update_forward_refs()
metric_obj_rel_insert_input.update_forward_refs()
metric_on_conflict.update_forward_refs()
metric_order_by.update_forward_refs()
metric_pk_columns_input.update_forward_refs()
metric_set_input.update_forward_refs()
metric_stream_cursor_input.update_forward_refs()
metric_stream_cursor_value_input.update_forward_refs()
metric_tags_aggregate_bool_exp.update_forward_refs()
metric_tags_aggregate_bool_exp_count.update_forward_refs()
metric_tags_aggregate_order_by.update_forward_refs()
metric_tags_arr_rel_insert_input.update_forward_refs()
metric_tags_bool_exp.update_forward_refs()
metric_tags_insert_input.update_forward_refs()
metric_tags_max_order_by.update_forward_refs()
metric_tags_min_order_by.update_forward_refs()
metric_tags_order_by.update_forward_refs()
metric_tags_set_input.update_forward_refs()
metric_tags_stream_cursor_input.update_forward_refs()
metric_tags_stream_cursor_value_input.update_forward_refs()
metric_tags_updates.update_forward_refs()
metric_timelines_aggregate_bool_exp.update_forward_refs()
metric_timelines_aggregate_bool_exp_count.update_forward_refs()
metric_timelines_aggregate_order_by.update_forward_refs()
metric_timelines_arr_rel_insert_input.update_forward_refs()
metric_timelines_bool_exp.update_forward_refs()
metric_timelines_insert_input.update_forward_refs()
metric_timelines_max_order_by.update_forward_refs()
metric_timelines_min_order_by.update_forward_refs()
metric_timelines_order_by.update_forward_refs()
metric_timelines_set_input.update_forward_refs()
metric_timelines_stream_cursor_input.update_forward_refs()
metric_timelines_stream_cursor_value_input.update_forward_refs()
metric_timelines_updates.update_forward_refs()
metric_updates.update_forward_refs()
narrative_aggregate_bool_exp.update_forward_refs()
narrative_aggregate_bool_exp_count.update_forward_refs()
narrative_aggregate_order_by.update_forward_refs()
narrative_arr_rel_insert_input.update_forward_refs()
narrative_bool_exp.update_forward_refs()
narrative_company_timelines_aggregate_bool_exp.update_forward_refs()
narrative_company_timelines_aggregate_bool_exp_count.update_forward_refs()
narrative_company_timelines_aggregate_order_by.update_forward_refs()
narrative_company_timelines_arr_rel_insert_input.update_forward_refs()
narrative_company_timelines_bool_exp.update_forward_refs()
narrative_company_timelines_insert_input.update_forward_refs()
narrative_company_timelines_max_order_by.update_forward_refs()
narrative_company_timelines_min_order_by.update_forward_refs()
narrative_company_timelines_order_by.update_forward_refs()
narrative_company_timelines_set_input.update_forward_refs()
narrative_company_timelines_stream_cursor_input.update_forward_refs()
narrative_company_timelines_stream_cursor_value_input.update_forward_refs()
narrative_company_timelines_updates.update_forward_refs()
narrative_datasets_aggregate_bool_exp.update_forward_refs()
narrative_datasets_aggregate_bool_exp_count.update_forward_refs()
narrative_datasets_aggregate_order_by.update_forward_refs()
narrative_datasets_arr_rel_insert_input.update_forward_refs()
narrative_datasets_bool_exp.update_forward_refs()
narrative_datasets_insert_input.update_forward_refs()
narrative_datasets_max_order_by.update_forward_refs()
narrative_datasets_min_order_by.update_forward_refs()
narrative_datasets_on_conflict.update_forward_refs()
narrative_datasets_order_by.update_forward_refs()
narrative_datasets_pk_columns_input.update_forward_refs()
narrative_datasets_set_input.update_forward_refs()
narrative_datasets_stream_cursor_input.update_forward_refs()
narrative_datasets_stream_cursor_value_input.update_forward_refs()
narrative_datasets_updates.update_forward_refs()
narrative_insert_input.update_forward_refs()
narrative_integration_kind_bool_exp.update_forward_refs()
narrative_integration_kind_enum_comparison_exp.update_forward_refs()
narrative_integration_kind_insert_input.update_forward_refs()
narrative_integration_kind_on_conflict.update_forward_refs()
narrative_integration_kind_order_by.update_forward_refs()
narrative_integration_kind_pk_columns_input.update_forward_refs()
narrative_integration_kind_set_input.update_forward_refs()
narrative_integration_kind_stream_cursor_input.update_forward_refs()
narrative_integration_kind_stream_cursor_value_input.update_forward_refs()
narrative_integration_kind_updates.update_forward_refs()
narrative_integrations_aggregate_bool_exp.update_forward_refs()
narrative_integrations_aggregate_bool_exp_count.update_forward_refs()
narrative_integrations_aggregate_order_by.update_forward_refs()
narrative_integrations_arr_rel_insert_input.update_forward_refs()
narrative_integrations_bool_exp.update_forward_refs()
narrative_integrations_insert_input.update_forward_refs()
narrative_integrations_max_order_by.update_forward_refs()
narrative_integrations_min_order_by.update_forward_refs()
narrative_integrations_on_conflict.update_forward_refs()
narrative_integrations_order_by.update_forward_refs()
narrative_integrations_pk_columns_input.update_forward_refs()
narrative_integrations_set_input.update_forward_refs()
narrative_integrations_stream_cursor_input.update_forward_refs()
narrative_integrations_stream_cursor_value_input.update_forward_refs()
narrative_integrations_updates.update_forward_refs()
narrative_max_order_by.update_forward_refs()
narrative_min_order_by.update_forward_refs()
narrative_narratives_aggregate_bool_exp.update_forward_refs()
narrative_narratives_aggregate_bool_exp_count.update_forward_refs()
narrative_narratives_aggregate_order_by.update_forward_refs()
narrative_narratives_arr_rel_insert_input.update_forward_refs()
narrative_narratives_bool_exp.update_forward_refs()
narrative_narratives_insert_input.update_forward_refs()
narrative_narratives_max_order_by.update_forward_refs()
narrative_narratives_min_order_by.update_forward_refs()
narrative_narratives_on_conflict.update_forward_refs()
narrative_narratives_order_by.update_forward_refs()
narrative_narratives_pk_columns_input.update_forward_refs()
narrative_narratives_set_input.update_forward_refs()
narrative_narratives_stream_cursor_input.update_forward_refs()
narrative_narratives_stream_cursor_value_input.update_forward_refs()
narrative_narratives_updates.update_forward_refs()
narrative_obj_rel_insert_input.update_forward_refs()
narrative_on_conflict.update_forward_refs()
narrative_order_by.update_forward_refs()
narrative_pk_columns_input.update_forward_refs()
narrative_runs_aggregate_bool_exp.update_forward_refs()
narrative_runs_aggregate_bool_exp_avg.update_forward_refs()
narrative_runs_aggregate_bool_exp_bool_and.update_forward_refs()
narrative_runs_aggregate_bool_exp_bool_or.update_forward_refs()
narrative_runs_aggregate_bool_exp_corr.update_forward_refs()
narrative_runs_aggregate_bool_exp_corr_arguments.update_forward_refs()
narrative_runs_aggregate_bool_exp_count.update_forward_refs()
narrative_runs_aggregate_bool_exp_covar_samp.update_forward_refs()
narrative_runs_aggregate_bool_exp_covar_samp_arguments.update_forward_refs()
narrative_runs_aggregate_bool_exp_max.update_forward_refs()
narrative_runs_aggregate_bool_exp_min.update_forward_refs()
narrative_runs_aggregate_bool_exp_stddev_samp.update_forward_refs()
narrative_runs_aggregate_bool_exp_sum.update_forward_refs()
narrative_runs_aggregate_bool_exp_var_samp.update_forward_refs()
narrative_runs_aggregate_order_by.update_forward_refs()
narrative_runs_arr_rel_insert_input.update_forward_refs()
narrative_runs_avg_order_by.update_forward_refs()
narrative_runs_bool_exp.update_forward_refs()
narrative_runs_inc_input.update_forward_refs()
narrative_runs_insert_input.update_forward_refs()
narrative_runs_max_order_by.update_forward_refs()
narrative_runs_min_order_by.update_forward_refs()
narrative_runs_on_conflict.update_forward_refs()
narrative_runs_order_by.update_forward_refs()
narrative_runs_pk_columns_input.update_forward_refs()
narrative_runs_set_input.update_forward_refs()
narrative_runs_stddev_order_by.update_forward_refs()
narrative_runs_stddev_pop_order_by.update_forward_refs()
narrative_runs_stddev_samp_order_by.update_forward_refs()
narrative_runs_stream_cursor_input.update_forward_refs()
narrative_runs_stream_cursor_value_input.update_forward_refs()
narrative_runs_sum_order_by.update_forward_refs()
narrative_runs_updates.update_forward_refs()
narrative_runs_var_pop_order_by.update_forward_refs()
narrative_runs_var_samp_order_by.update_forward_refs()
narrative_runs_variance_order_by.update_forward_refs()
narrative_set_input.update_forward_refs()
narrative_stream_cursor_input.update_forward_refs()
narrative_stream_cursor_value_input.update_forward_refs()
narrative_tags_aggregate_bool_exp.update_forward_refs()
narrative_tags_aggregate_bool_exp_count.update_forward_refs()
narrative_tags_aggregate_order_by.update_forward_refs()
narrative_tags_arr_rel_insert_input.update_forward_refs()
narrative_tags_bool_exp.update_forward_refs()
narrative_tags_insert_input.update_forward_refs()
narrative_tags_max_order_by.update_forward_refs()
narrative_tags_min_order_by.update_forward_refs()
narrative_tags_order_by.update_forward_refs()
narrative_tags_set_input.update_forward_refs()
narrative_tags_stream_cursor_input.update_forward_refs()
narrative_tags_stream_cursor_value_input.update_forward_refs()
narrative_tags_updates.update_forward_refs()
narrative_team_permissions_aggregate_bool_exp.update_forward_refs()
narrative_team_permissions_aggregate_bool_exp_bool_and.update_forward_refs()
narrative_team_permissions_aggregate_bool_exp_bool_or.update_forward_refs()
narrative_team_permissions_aggregate_bool_exp_count.update_forward_refs()
narrative_team_permissions_aggregate_order_by.update_forward_refs()
narrative_team_permissions_arr_rel_insert_input.update_forward_refs()
narrative_team_permissions_bool_exp.update_forward_refs()
narrative_team_permissions_insert_input.update_forward_refs()
narrative_team_permissions_max_order_by.update_forward_refs()
narrative_team_permissions_min_order_by.update_forward_refs()
narrative_team_permissions_order_by.update_forward_refs()
narrative_team_permissions_set_input.update_forward_refs()
narrative_team_permissions_stream_cursor_input.update_forward_refs()
narrative_team_permissions_stream_cursor_value_input.update_forward_refs()
narrative_team_permissions_updates.update_forward_refs()
narrative_template_aggregate_bool_exp.update_forward_refs()
narrative_template_aggregate_bool_exp_bool_and.update_forward_refs()
narrative_template_aggregate_bool_exp_bool_or.update_forward_refs()
narrative_template_aggregate_bool_exp_count.update_forward_refs()
narrative_template_aggregate_order_by.update_forward_refs()
narrative_template_arr_rel_insert_input.update_forward_refs()
narrative_template_avg_order_by.update_forward_refs()
narrative_template_bool_exp.update_forward_refs()
narrative_template_inc_input.update_forward_refs()
narrative_template_insert_input.update_forward_refs()
narrative_template_kinds_bool_exp.update_forward_refs()
narrative_template_kinds_enum_comparison_exp.update_forward_refs()
narrative_template_kinds_insert_input.update_forward_refs()
narrative_template_kinds_obj_rel_insert_input.update_forward_refs()
narrative_template_kinds_on_conflict.update_forward_refs()
narrative_template_kinds_order_by.update_forward_refs()
narrative_template_kinds_pk_columns_input.update_forward_refs()
narrative_template_kinds_set_input.update_forward_refs()
narrative_template_kinds_stream_cursor_input.update_forward_refs()
narrative_template_kinds_stream_cursor_value_input.update_forward_refs()
narrative_template_kinds_updates.update_forward_refs()
narrative_template_max_order_by.update_forward_refs()
narrative_template_min_order_by.update_forward_refs()
narrative_template_on_conflict.update_forward_refs()
narrative_template_order_by.update_forward_refs()
narrative_template_pk_columns_input.update_forward_refs()
narrative_template_set_input.update_forward_refs()
narrative_template_states_bool_exp.update_forward_refs()
narrative_template_states_enum_comparison_exp.update_forward_refs()
narrative_template_states_insert_input.update_forward_refs()
narrative_template_states_on_conflict.update_forward_refs()
narrative_template_states_order_by.update_forward_refs()
narrative_template_states_pk_columns_input.update_forward_refs()
narrative_template_states_set_input.update_forward_refs()
narrative_template_states_stream_cursor_input.update_forward_refs()
narrative_template_states_stream_cursor_value_input.update_forward_refs()
narrative_template_states_updates.update_forward_refs()
narrative_template_stddev_order_by.update_forward_refs()
narrative_template_stddev_pop_order_by.update_forward_refs()
narrative_template_stddev_samp_order_by.update_forward_refs()
narrative_template_stream_cursor_input.update_forward_refs()
narrative_template_stream_cursor_value_input.update_forward_refs()
narrative_template_sum_order_by.update_forward_refs()
narrative_template_updates.update_forward_refs()
narrative_template_var_pop_order_by.update_forward_refs()
narrative_template_var_samp_order_by.update_forward_refs()
narrative_template_variance_order_by.update_forward_refs()
narrative_types_bool_exp.update_forward_refs()
narrative_types_enum_comparison_exp.update_forward_refs()
narrative_types_insert_input.update_forward_refs()
narrative_types_on_conflict.update_forward_refs()
narrative_types_order_by.update_forward_refs()
narrative_types_pk_columns_input.update_forward_refs()
narrative_types_set_input.update_forward_refs()
narrative_types_stream_cursor_input.update_forward_refs()
narrative_types_stream_cursor_value_input.update_forward_refs()
narrative_types_updates.update_forward_refs()
narrative_updates.update_forward_refs()
narrative_versions_aggregate_bool_exp.update_forward_refs()
narrative_versions_aggregate_bool_exp_count.update_forward_refs()
narrative_versions_aggregate_order_by.update_forward_refs()
narrative_versions_arr_rel_insert_input.update_forward_refs()
narrative_versions_bool_exp.update_forward_refs()
narrative_versions_insert_input.update_forward_refs()
narrative_versions_max_order_by.update_forward_refs()
narrative_versions_min_order_by.update_forward_refs()
narrative_versions_order_by.update_forward_refs()
narrative_versions_set_input.update_forward_refs()
narrative_versions_stream_cursor_input.update_forward_refs()
narrative_versions_stream_cursor_value_input.update_forward_refs()
narrative_versions_updates.update_forward_refs()
numeric_comparison_exp.update_forward_refs()
package_bool_exp.update_forward_refs()
package_insert_input.update_forward_refs()
package_on_conflict.update_forward_refs()
package_order_by.update_forward_refs()
package_pk_columns_input.update_forward_refs()
package_set_input.update_forward_refs()
package_stream_cursor_input.update_forward_refs()
package_stream_cursor_value_input.update_forward_refs()
package_updates.update_forward_refs()
production_tranformation_sql_queries_aggregate_bool_exp.update_forward_refs()
production_tranformation_sql_queries_aggregate_bool_exp_count.update_forward_refs()
production_tranformation_sql_queries_aggregate_order_by.update_forward_refs()
production_tranformation_sql_queries_arr_rel_insert_input.update_forward_refs()
production_tranformation_sql_queries_bool_exp.update_forward_refs()
production_tranformation_sql_queries_insert_input.update_forward_refs()
production_tranformation_sql_queries_max_order_by.update_forward_refs()
production_tranformation_sql_queries_min_order_by.update_forward_refs()
production_tranformation_sql_queries_order_by.update_forward_refs()
production_tranformation_sql_queries_set_input.update_forward_refs()
production_tranformation_sql_queries_stream_cursor_input.update_forward_refs()
production_tranformation_sql_queries_stream_cursor_value_input.update_forward_refs()
production_tranformation_sql_queries_updates.update_forward_refs()
query_template_bool_exp.update_forward_refs()
query_template_insert_input.update_forward_refs()
query_template_on_conflict.update_forward_refs()
query_template_order_by.update_forward_refs()
query_template_pk_columns_input.update_forward_refs()
query_template_set_input.update_forward_refs()
query_template_stream_cursor_input.update_forward_refs()
query_template_stream_cursor_value_input.update_forward_refs()
query_template_updates.update_forward_refs()
query_updates_aggregate_bool_exp.update_forward_refs()
query_updates_aggregate_bool_exp_count.update_forward_refs()
query_updates_aggregate_order_by.update_forward_refs()
query_updates_arr_rel_insert_input.update_forward_refs()
query_updates_avg_order_by.update_forward_refs()
query_updates_bool_exp.update_forward_refs()
query_updates_inc_input.update_forward_refs()
query_updates_insert_input.update_forward_refs()
query_updates_max_order_by.update_forward_refs()
query_updates_min_order_by.update_forward_refs()
query_updates_on_conflict.update_forward_refs()
query_updates_order_by.update_forward_refs()
query_updates_pk_columns_input.update_forward_refs()
query_updates_set_input.update_forward_refs()
query_updates_stddev_order_by.update_forward_refs()
query_updates_stddev_pop_order_by.update_forward_refs()
query_updates_stddev_samp_order_by.update_forward_refs()
query_updates_stream_cursor_input.update_forward_refs()
query_updates_stream_cursor_value_input.update_forward_refs()
query_updates_sum_order_by.update_forward_refs()
query_updates_updates.update_forward_refs()
query_updates_var_pop_order_by.update_forward_refs()
query_updates_var_samp_order_by.update_forward_refs()
query_updates_variance_order_by.update_forward_refs()
question_answer_bool_exp.update_forward_refs()
question_answer_insert_input.update_forward_refs()
question_answer_on_conflict.update_forward_refs()
question_answer_order_by.update_forward_refs()
question_answer_pk_columns_input.update_forward_refs()
question_answer_relations_bool_exp.update_forward_refs()
question_answer_relations_enum_comparison_exp.update_forward_refs()
question_answer_relations_insert_input.update_forward_refs()
question_answer_relations_on_conflict.update_forward_refs()
question_answer_relations_order_by.update_forward_refs()
question_answer_relations_pk_columns_input.update_forward_refs()
question_answer_relations_set_input.update_forward_refs()
question_answer_relations_stream_cursor_input.update_forward_refs()
question_answer_relations_stream_cursor_value_input.update_forward_refs()
question_answer_relations_updates.update_forward_refs()
question_answer_set_input.update_forward_refs()
question_answer_stream_cursor_input.update_forward_refs()
question_answer_stream_cursor_value_input.update_forward_refs()
question_answer_updates.update_forward_refs()
scratchpad_tranformation_sql_queries_aggregate_bool_exp.update_forward_refs()
scratchpad_tranformation_sql_queries_aggregate_bool_exp_count.update_forward_refs()
scratchpad_tranformation_sql_queries_aggregate_order_by.update_forward_refs()
scratchpad_tranformation_sql_queries_arr_rel_insert_input.update_forward_refs()
scratchpad_tranformation_sql_queries_bool_exp.update_forward_refs()
scratchpad_tranformation_sql_queries_insert_input.update_forward_refs()
scratchpad_tranformation_sql_queries_max_order_by.update_forward_refs()
scratchpad_tranformation_sql_queries_min_order_by.update_forward_refs()
scratchpad_tranformation_sql_queries_order_by.update_forward_refs()
scratchpad_tranformation_sql_queries_set_input.update_forward_refs()
scratchpad_tranformation_sql_queries_stream_cursor_input.update_forward_refs()
scratchpad_tranformation_sql_queries_stream_cursor_value_input.update_forward_refs()
scratchpad_tranformation_sql_queries_updates.update_forward_refs()
service_limit_aggregate_bool_exp.update_forward_refs()
service_limit_aggregate_bool_exp_avg.update_forward_refs()
service_limit_aggregate_bool_exp_corr.update_forward_refs()
service_limit_aggregate_bool_exp_corr_arguments.update_forward_refs()
service_limit_aggregate_bool_exp_count.update_forward_refs()
service_limit_aggregate_bool_exp_covar_samp.update_forward_refs()
service_limit_aggregate_bool_exp_covar_samp_arguments.update_forward_refs()
service_limit_aggregate_bool_exp_max.update_forward_refs()
service_limit_aggregate_bool_exp_min.update_forward_refs()
service_limit_aggregate_bool_exp_stddev_samp.update_forward_refs()
service_limit_aggregate_bool_exp_sum.update_forward_refs()
service_limit_aggregate_bool_exp_var_samp.update_forward_refs()
service_limit_aggregate_order_by.update_forward_refs()
service_limit_arr_rel_insert_input.update_forward_refs()
service_limit_avg_order_by.update_forward_refs()
service_limit_bool_exp.update_forward_refs()
service_limit_inc_input.update_forward_refs()
service_limit_insert_input.update_forward_refs()
service_limit_max_order_by.update_forward_refs()
service_limit_min_order_by.update_forward_refs()
service_limit_on_conflict.update_forward_refs()
service_limit_order_by.update_forward_refs()
service_limit_pk_columns_input.update_forward_refs()
service_limit_set_input.update_forward_refs()
service_limit_stddev_order_by.update_forward_refs()
service_limit_stddev_pop_order_by.update_forward_refs()
service_limit_stddev_samp_order_by.update_forward_refs()
service_limit_stream_cursor_input.update_forward_refs()
service_limit_stream_cursor_value_input.update_forward_refs()
service_limit_sum_order_by.update_forward_refs()
service_limit_updates.update_forward_refs()
service_limit_var_pop_order_by.update_forward_refs()
service_limit_var_samp_order_by.update_forward_refs()
service_limit_variance_order_by.update_forward_refs()
slowly_changing_customer_dims_aggregate_bool_exp.update_forward_refs()
slowly_changing_customer_dims_aggregate_bool_exp_count.update_forward_refs()
slowly_changing_customer_dims_aggregate_order_by.update_forward_refs()
slowly_changing_customer_dims_arr_rel_insert_input.update_forward_refs()
slowly_changing_customer_dims_bool_exp.update_forward_refs()
slowly_changing_customer_dims_insert_input.update_forward_refs()
slowly_changing_customer_dims_max_order_by.update_forward_refs()
slowly_changing_customer_dims_min_order_by.update_forward_refs()
slowly_changing_customer_dims_on_conflict.update_forward_refs()
slowly_changing_customer_dims_order_by.update_forward_refs()
slowly_changing_customer_dims_pk_columns_input.update_forward_refs()
slowly_changing_customer_dims_set_input.update_forward_refs()
slowly_changing_customer_dims_stream_cursor_input.update_forward_refs()
slowly_changing_customer_dims_stream_cursor_value_input.update_forward_refs()
slowly_changing_customer_dims_updates.update_forward_refs()
sql_queries_bool_exp.update_forward_refs()
sql_queries_insert_input.update_forward_refs()
sql_queries_obj_rel_insert_input.update_forward_refs()
sql_queries_on_conflict.update_forward_refs()
sql_queries_order_by.update_forward_refs()
sql_queries_pk_columns_input.update_forward_refs()
sql_queries_set_input.update_forward_refs()
sql_queries_stream_cursor_input.update_forward_refs()
sql_queries_stream_cursor_value_input.update_forward_refs()
sql_queries_updates.update_forward_refs()
sql_query_kinds_bool_exp.update_forward_refs()
sql_query_kinds_enum_comparison_exp.update_forward_refs()
sql_query_kinds_insert_input.update_forward_refs()
sql_query_kinds_on_conflict.update_forward_refs()
sql_query_kinds_order_by.update_forward_refs()
sql_query_kinds_pk_columns_input.update_forward_refs()
sql_query_kinds_set_input.update_forward_refs()
sql_query_kinds_stream_cursor_input.update_forward_refs()
sql_query_kinds_stream_cursor_value_input.update_forward_refs()
sql_query_kinds_updates.update_forward_refs()
sql_query_relations_bool_exp.update_forward_refs()
sql_query_relations_enum_comparison_exp.update_forward_refs()
sql_query_relations_insert_input.update_forward_refs()
sql_query_relations_on_conflict.update_forward_refs()
sql_query_relations_order_by.update_forward_refs()
sql_query_relations_pk_columns_input.update_forward_refs()
sql_query_relations_set_input.update_forward_refs()
sql_query_relations_stream_cursor_input.update_forward_refs()
sql_query_relations_stream_cursor_value_input.update_forward_refs()
sql_query_relations_updates.update_forward_refs()
status_bool_exp.update_forward_refs()
status_enum_comparison_exp.update_forward_refs()
status_insert_input.update_forward_refs()
status_on_conflict.update_forward_refs()
status_order_by.update_forward_refs()
status_pk_columns_input.update_forward_refs()
status_set_input.update_forward_refs()
status_stream_cursor_input.update_forward_refs()
status_stream_cursor_value_input.update_forward_refs()
status_updates.update_forward_refs()
table_team_permissions_aggregate_bool_exp.update_forward_refs()
table_team_permissions_aggregate_bool_exp_bool_and.update_forward_refs()
table_team_permissions_aggregate_bool_exp_bool_or.update_forward_refs()
table_team_permissions_aggregate_bool_exp_count.update_forward_refs()
table_team_permissions_aggregate_order_by.update_forward_refs()
table_team_permissions_arr_rel_insert_input.update_forward_refs()
table_team_permissions_bool_exp.update_forward_refs()
table_team_permissions_insert_input.update_forward_refs()
table_team_permissions_max_order_by.update_forward_refs()
table_team_permissions_min_order_by.update_forward_refs()
table_team_permissions_order_by.update_forward_refs()
table_team_permissions_set_input.update_forward_refs()
table_team_permissions_stream_cursor_input.update_forward_refs()
table_team_permissions_stream_cursor_value_input.update_forward_refs()
table_team_permissions_updates.update_forward_refs()
tag_aggregate_bool_exp.update_forward_refs()
tag_aggregate_bool_exp_count.update_forward_refs()
tag_aggregate_order_by.update_forward_refs()
tag_arr_rel_insert_input.update_forward_refs()
tag_bool_exp.update_forward_refs()
tag_insert_input.update_forward_refs()
tag_max_order_by.update_forward_refs()
tag_min_order_by.update_forward_refs()
tag_on_conflict.update_forward_refs()
tag_order_by.update_forward_refs()
tag_pk_columns_input.update_forward_refs()
tag_relations_bool_exp.update_forward_refs()
tag_relations_enum_comparison_exp.update_forward_refs()
tag_relations_insert_input.update_forward_refs()
tag_relations_on_conflict.update_forward_refs()
tag_relations_order_by.update_forward_refs()
tag_relations_pk_columns_input.update_forward_refs()
tag_relations_set_input.update_forward_refs()
tag_relations_stream_cursor_input.update_forward_refs()
tag_relations_stream_cursor_value_input.update_forward_refs()
tag_relations_updates.update_forward_refs()
tag_set_input.update_forward_refs()
tag_stream_cursor_input.update_forward_refs()
tag_stream_cursor_value_input.update_forward_refs()
tag_updates.update_forward_refs()
task_execution_aggregate_bool_exp.update_forward_refs()
task_execution_aggregate_bool_exp_bool_and.update_forward_refs()
task_execution_aggregate_bool_exp_bool_or.update_forward_refs()
task_execution_aggregate_bool_exp_count.update_forward_refs()
task_execution_aggregate_order_by.update_forward_refs()
task_execution_append_input.update_forward_refs()
task_execution_arr_rel_insert_input.update_forward_refs()
task_execution_bool_exp.update_forward_refs()
task_execution_delete_at_path_input.update_forward_refs()
task_execution_delete_elem_input.update_forward_refs()
task_execution_delete_key_input.update_forward_refs()
task_execution_insert_input.update_forward_refs()
task_execution_max_order_by.update_forward_refs()
task_execution_min_order_by.update_forward_refs()
task_execution_on_conflict.update_forward_refs()
task_execution_order_by.update_forward_refs()
task_execution_pk_columns_input.update_forward_refs()
task_execution_prepend_input.update_forward_refs()
task_execution_set_input.update_forward_refs()
task_execution_status_bool_exp.update_forward_refs()
task_execution_status_enum_comparison_exp.update_forward_refs()
task_execution_status_insert_input.update_forward_refs()
task_execution_status_on_conflict.update_forward_refs()
task_execution_status_order_by.update_forward_refs()
task_execution_status_pk_columns_input.update_forward_refs()
task_execution_status_set_input.update_forward_refs()
task_execution_status_stream_cursor_input.update_forward_refs()
task_execution_status_stream_cursor_value_input.update_forward_refs()
task_execution_status_updates.update_forward_refs()
task_execution_stream_cursor_input.update_forward_refs()
task_execution_stream_cursor_value_input.update_forward_refs()
task_execution_updates.update_forward_refs()
team_aggregate_bool_exp.update_forward_refs()
team_aggregate_bool_exp_count.update_forward_refs()
team_aggregate_order_by.update_forward_refs()
team_arr_rel_insert_input.update_forward_refs()
team_bool_exp.update_forward_refs()
team_insert_input.update_forward_refs()
team_max_order_by.update_forward_refs()
team_min_order_by.update_forward_refs()
team_obj_rel_insert_input.update_forward_refs()
team_on_conflict.update_forward_refs()
team_order_by.update_forward_refs()
team_permission_bool_exp.update_forward_refs()
team_permission_insert_input.update_forward_refs()
team_permission_on_conflict.update_forward_refs()
team_permission_order_by.update_forward_refs()
team_permission_pk_columns_input.update_forward_refs()
team_permission_set_input.update_forward_refs()
team_permission_stream_cursor_input.update_forward_refs()
team_permission_stream_cursor_value_input.update_forward_refs()
team_permission_updates.update_forward_refs()
team_pk_columns_input.update_forward_refs()
team_set_input.update_forward_refs()
team_stream_cursor_input.update_forward_refs()
team_stream_cursor_value_input.update_forward_refs()
team_updates.update_forward_refs()
team_user_aggregate_bool_exp.update_forward_refs()
team_user_aggregate_bool_exp_count.update_forward_refs()
team_user_aggregate_order_by.update_forward_refs()
team_user_arr_rel_insert_input.update_forward_refs()
team_user_bool_exp.update_forward_refs()
team_user_insert_input.update_forward_refs()
team_user_max_order_by.update_forward_refs()
team_user_min_order_by.update_forward_refs()
team_user_on_conflict.update_forward_refs()
team_user_order_by.update_forward_refs()
team_user_pk_columns_input.update_forward_refs()
team_user_set_input.update_forward_refs()
team_user_stream_cursor_input.update_forward_refs()
team_user_stream_cursor_value_input.update_forward_refs()
team_user_updates.update_forward_refs()
timestamptz_comparison_exp.update_forward_refs()
training_request_aggregate_bool_exp.update_forward_refs()
training_request_aggregate_bool_exp_bool_and.update_forward_refs()
training_request_aggregate_bool_exp_bool_or.update_forward_refs()
training_request_aggregate_bool_exp_count.update_forward_refs()
training_request_aggregate_order_by.update_forward_refs()
training_request_arr_rel_insert_input.update_forward_refs()
training_request_bool_exp.update_forward_refs()
training_request_insert_input.update_forward_refs()
training_request_max_order_by.update_forward_refs()
training_request_min_order_by.update_forward_refs()
training_request_on_conflict.update_forward_refs()
training_request_order_by.update_forward_refs()
training_request_pk_columns_input.update_forward_refs()
training_request_set_input.update_forward_refs()
training_request_stream_cursor_input.update_forward_refs()
training_request_stream_cursor_value_input.update_forward_refs()
training_request_updates.update_forward_refs()
trainining_request_status_bool_exp.update_forward_refs()
trainining_request_status_enum_comparison_exp.update_forward_refs()
trainining_request_status_insert_input.update_forward_refs()
trainining_request_status_on_conflict.update_forward_refs()
trainining_request_status_order_by.update_forward_refs()
trainining_request_status_pk_columns_input.update_forward_refs()
trainining_request_status_set_input.update_forward_refs()
trainining_request_status_stream_cursor_input.update_forward_refs()
trainining_request_status_stream_cursor_value_input.update_forward_refs()
trainining_request_status_updates.update_forward_refs()
tranformation_enriched_activities_aggregate_bool_exp.update_forward_refs()
tranformation_enriched_activities_aggregate_bool_exp_count.update_forward_refs()
tranformation_enriched_activities_aggregate_order_by.update_forward_refs()
tranformation_enriched_activities_arr_rel_insert_input.update_forward_refs()
tranformation_enriched_activities_avg_order_by.update_forward_refs()
tranformation_enriched_activities_bool_exp.update_forward_refs()
tranformation_enriched_activities_inc_input.update_forward_refs()
tranformation_enriched_activities_insert_input.update_forward_refs()
tranformation_enriched_activities_max_order_by.update_forward_refs()
tranformation_enriched_activities_min_order_by.update_forward_refs()
tranformation_enriched_activities_on_conflict.update_forward_refs()
tranformation_enriched_activities_order_by.update_forward_refs()
tranformation_enriched_activities_pk_columns_input.update_forward_refs()
tranformation_enriched_activities_set_input.update_forward_refs()
tranformation_enriched_activities_stddev_order_by.update_forward_refs()
tranformation_enriched_activities_stddev_pop_order_by.update_forward_refs()
tranformation_enriched_activities_stddev_samp_order_by.update_forward_refs()
tranformation_enriched_activities_stream_cursor_input.update_forward_refs()
tranformation_enriched_activities_stream_cursor_value_input.update_forward_refs()
tranformation_enriched_activities_sum_order_by.update_forward_refs()
tranformation_enriched_activities_updates.update_forward_refs()
tranformation_enriched_activities_var_pop_order_by.update_forward_refs()
tranformation_enriched_activities_var_samp_order_by.update_forward_refs()
tranformation_enriched_activities_variance_order_by.update_forward_refs()
transformation_activities_aggregate_bool_exp.update_forward_refs()
transformation_activities_aggregate_bool_exp_count.update_forward_refs()
transformation_activities_aggregate_order_by.update_forward_refs()
transformation_activities_arr_rel_insert_input.update_forward_refs()
transformation_activities_avg_order_by.update_forward_refs()
transformation_activities_bool_exp.update_forward_refs()
transformation_activities_inc_input.update_forward_refs()
transformation_activities_insert_input.update_forward_refs()
transformation_activities_max_order_by.update_forward_refs()
transformation_activities_min_order_by.update_forward_refs()
transformation_activities_on_conflict.update_forward_refs()
transformation_activities_order_by.update_forward_refs()
transformation_activities_pk_columns_input.update_forward_refs()
transformation_activities_set_input.update_forward_refs()
transformation_activities_stddev_order_by.update_forward_refs()
transformation_activities_stddev_pop_order_by.update_forward_refs()
transformation_activities_stddev_samp_order_by.update_forward_refs()
transformation_activities_stream_cursor_input.update_forward_refs()
transformation_activities_stream_cursor_value_input.update_forward_refs()
transformation_activities_sum_order_by.update_forward_refs()
transformation_activities_updates.update_forward_refs()
transformation_activities_var_pop_order_by.update_forward_refs()
transformation_activities_var_samp_order_by.update_forward_refs()
transformation_activities_variance_order_by.update_forward_refs()
transformation_aggregate_bool_exp.update_forward_refs()
transformation_aggregate_bool_exp_bool_and.update_forward_refs()
transformation_aggregate_bool_exp_bool_or.update_forward_refs()
transformation_aggregate_bool_exp_count.update_forward_refs()
transformation_aggregate_order_by.update_forward_refs()
transformation_arr_rel_insert_input.update_forward_refs()
transformation_avg_order_by.update_forward_refs()
transformation_bool_exp.update_forward_refs()
transformation_column_renames_aggregate_bool_exp.update_forward_refs()
transformation_column_renames_aggregate_bool_exp_bool_and.update_forward_refs()
transformation_column_renames_aggregate_bool_exp_bool_or.update_forward_refs()
transformation_column_renames_aggregate_bool_exp_count.update_forward_refs()
transformation_column_renames_aggregate_order_by.update_forward_refs()
transformation_column_renames_arr_rel_insert_input.update_forward_refs()
transformation_column_renames_bool_exp.update_forward_refs()
transformation_column_renames_insert_input.update_forward_refs()
transformation_column_renames_max_order_by.update_forward_refs()
transformation_column_renames_min_order_by.update_forward_refs()
transformation_column_renames_order_by.update_forward_refs()
transformation_column_renames_set_input.update_forward_refs()
transformation_column_renames_stream_cursor_input.update_forward_refs()
transformation_column_renames_stream_cursor_value_input.update_forward_refs()
transformation_column_renames_updates.update_forward_refs()
transformation_depends_on_aggregate_bool_exp.update_forward_refs()
transformation_depends_on_aggregate_bool_exp_count.update_forward_refs()
transformation_depends_on_aggregate_order_by.update_forward_refs()
transformation_depends_on_arr_rel_insert_input.update_forward_refs()
transformation_depends_on_avg_order_by.update_forward_refs()
transformation_depends_on_bool_exp.update_forward_refs()
transformation_depends_on_inc_input.update_forward_refs()
transformation_depends_on_insert_input.update_forward_refs()
transformation_depends_on_max_order_by.update_forward_refs()
transformation_depends_on_min_order_by.update_forward_refs()
transformation_depends_on_on_conflict.update_forward_refs()
transformation_depends_on_order_by.update_forward_refs()
transformation_depends_on_pk_columns_input.update_forward_refs()
transformation_depends_on_set_input.update_forward_refs()
transformation_depends_on_stddev_order_by.update_forward_refs()
transformation_depends_on_stddev_pop_order_by.update_forward_refs()
transformation_depends_on_stddev_samp_order_by.update_forward_refs()
transformation_depends_on_stream_cursor_input.update_forward_refs()
transformation_depends_on_stream_cursor_value_input.update_forward_refs()
transformation_depends_on_sum_order_by.update_forward_refs()
transformation_depends_on_updates.update_forward_refs()
transformation_depends_on_var_pop_order_by.update_forward_refs()
transformation_depends_on_var_samp_order_by.update_forward_refs()
transformation_depends_on_variance_order_by.update_forward_refs()
transformation_inc_input.update_forward_refs()
transformation_insert_input.update_forward_refs()
transformation_kinds_bool_exp.update_forward_refs()
transformation_kinds_enum_comparison_exp.update_forward_refs()
transformation_kinds_insert_input.update_forward_refs()
transformation_kinds_on_conflict.update_forward_refs()
transformation_kinds_order_by.update_forward_refs()
transformation_kinds_pk_columns_input.update_forward_refs()
transformation_kinds_set_input.update_forward_refs()
transformation_kinds_stream_cursor_input.update_forward_refs()
transformation_kinds_stream_cursor_value_input.update_forward_refs()
transformation_kinds_updates.update_forward_refs()
transformation_maintenance_aggregate_bool_exp.update_forward_refs()
transformation_maintenance_aggregate_bool_exp_count.update_forward_refs()
transformation_maintenance_aggregate_order_by.update_forward_refs()
transformation_maintenance_arr_rel_insert_input.update_forward_refs()
transformation_maintenance_bool_exp.update_forward_refs()
transformation_maintenance_insert_input.update_forward_refs()
transformation_maintenance_max_order_by.update_forward_refs()
transformation_maintenance_min_order_by.update_forward_refs()
transformation_maintenance_on_conflict.update_forward_refs()
transformation_maintenance_order_by.update_forward_refs()
transformation_maintenance_pk_columns_input.update_forward_refs()
transformation_maintenance_set_input.update_forward_refs()
transformation_maintenance_stream_cursor_input.update_forward_refs()
transformation_maintenance_stream_cursor_value_input.update_forward_refs()
transformation_maintenance_updates.update_forward_refs()
transformation_max_order_by.update_forward_refs()
transformation_min_order_by.update_forward_refs()
transformation_obj_rel_insert_input.update_forward_refs()
transformation_on_conflict.update_forward_refs()
transformation_order_by.update_forward_refs()
transformation_pk_columns_input.update_forward_refs()
transformation_questions_aggregate_bool_exp.update_forward_refs()
transformation_questions_aggregate_bool_exp_count.update_forward_refs()
transformation_questions_aggregate_order_by.update_forward_refs()
transformation_questions_arr_rel_insert_input.update_forward_refs()
transformation_questions_bool_exp.update_forward_refs()
transformation_questions_insert_input.update_forward_refs()
transformation_questions_max_order_by.update_forward_refs()
transformation_questions_min_order_by.update_forward_refs()
transformation_questions_order_by.update_forward_refs()
transformation_questions_set_input.update_forward_refs()
transformation_questions_stream_cursor_input.update_forward_refs()
transformation_questions_stream_cursor_value_input.update_forward_refs()
transformation_questions_updates.update_forward_refs()
transformation_run_after_aggregate_bool_exp.update_forward_refs()
transformation_run_after_aggregate_bool_exp_count.update_forward_refs()
transformation_run_after_aggregate_order_by.update_forward_refs()
transformation_run_after_arr_rel_insert_input.update_forward_refs()
transformation_run_after_avg_order_by.update_forward_refs()
transformation_run_after_bool_exp.update_forward_refs()
transformation_run_after_inc_input.update_forward_refs()
transformation_run_after_insert_input.update_forward_refs()
transformation_run_after_max_order_by.update_forward_refs()
transformation_run_after_min_order_by.update_forward_refs()
transformation_run_after_on_conflict.update_forward_refs()
transformation_run_after_order_by.update_forward_refs()
transformation_run_after_pk_columns_input.update_forward_refs()
transformation_run_after_set_input.update_forward_refs()
transformation_run_after_stddev_order_by.update_forward_refs()
transformation_run_after_stddev_pop_order_by.update_forward_refs()
transformation_run_after_stddev_samp_order_by.update_forward_refs()
transformation_run_after_stream_cursor_input.update_forward_refs()
transformation_run_after_stream_cursor_value_input.update_forward_refs()
transformation_run_after_sum_order_by.update_forward_refs()
transformation_run_after_updates.update_forward_refs()
transformation_run_after_var_pop_order_by.update_forward_refs()
transformation_run_after_var_samp_order_by.update_forward_refs()
transformation_run_after_variance_order_by.update_forward_refs()
transformation_set_input.update_forward_refs()
transformation_stddev_order_by.update_forward_refs()
transformation_stddev_pop_order_by.update_forward_refs()
transformation_stddev_samp_order_by.update_forward_refs()
transformation_stream_cursor_input.update_forward_refs()
transformation_stream_cursor_value_input.update_forward_refs()
transformation_sum_order_by.update_forward_refs()
transformation_test_aggregate_bool_exp.update_forward_refs()
transformation_test_aggregate_bool_exp_count.update_forward_refs()
transformation_test_aggregate_order_by.update_forward_refs()
transformation_test_arr_rel_insert_input.update_forward_refs()
transformation_test_bool_exp.update_forward_refs()
transformation_test_insert_input.update_forward_refs()
transformation_test_max_order_by.update_forward_refs()
transformation_test_min_order_by.update_forward_refs()
transformation_test_on_conflict.update_forward_refs()
transformation_test_order_by.update_forward_refs()
transformation_test_pk_columns_input.update_forward_refs()
transformation_test_set_input.update_forward_refs()
transformation_test_status_bool_exp.update_forward_refs()
transformation_test_status_enum_comparison_exp.update_forward_refs()
transformation_test_status_insert_input.update_forward_refs()
transformation_test_status_on_conflict.update_forward_refs()
transformation_test_status_order_by.update_forward_refs()
transformation_test_status_pk_columns_input.update_forward_refs()
transformation_test_status_set_input.update_forward_refs()
transformation_test_status_stream_cursor_input.update_forward_refs()
transformation_test_status_stream_cursor_value_input.update_forward_refs()
transformation_test_status_updates.update_forward_refs()
transformation_test_stream_cursor_input.update_forward_refs()
transformation_test_stream_cursor_value_input.update_forward_refs()
transformation_test_updates.update_forward_refs()
transformation_update_types_bool_exp.update_forward_refs()
transformation_update_types_enum_comparison_exp.update_forward_refs()
transformation_update_types_insert_input.update_forward_refs()
transformation_update_types_on_conflict.update_forward_refs()
transformation_update_types_order_by.update_forward_refs()
transformation_update_types_pk_columns_input.update_forward_refs()
transformation_update_types_set_input.update_forward_refs()
transformation_update_types_stream_cursor_input.update_forward_refs()
transformation_update_types_stream_cursor_value_input.update_forward_refs()
transformation_update_types_updates.update_forward_refs()
transformation_updates.update_forward_refs()
transformation_var_pop_order_by.update_forward_refs()
transformation_var_samp_order_by.update_forward_refs()
transformation_variance_order_by.update_forward_refs()
user_access_role_aggregate_bool_exp.update_forward_refs()
user_access_role_aggregate_bool_exp_count.update_forward_refs()
user_access_role_aggregate_order_by.update_forward_refs()
user_access_role_arr_rel_insert_input.update_forward_refs()
user_access_role_bool_exp.update_forward_refs()
user_access_role_insert_input.update_forward_refs()
user_access_role_max_order_by.update_forward_refs()
user_access_role_min_order_by.update_forward_refs()
user_access_role_on_conflict.update_forward_refs()
user_access_role_order_by.update_forward_refs()
user_access_role_pk_columns_input.update_forward_refs()
user_access_role_set_input.update_forward_refs()
user_access_role_stream_cursor_input.update_forward_refs()
user_access_role_stream_cursor_value_input.update_forward_refs()
user_access_role_updates.update_forward_refs()
user_bool_exp.update_forward_refs()
user_insert_input.update_forward_refs()
user_obj_rel_insert_input.update_forward_refs()
user_on_conflict.update_forward_refs()
user_order_by.update_forward_refs()
user_pk_columns_input.update_forward_refs()
user_role_bool_exp.update_forward_refs()
user_role_enum_comparison_exp.update_forward_refs()
user_role_insert_input.update_forward_refs()
user_role_on_conflict.update_forward_refs()
user_role_order_by.update_forward_refs()
user_role_pk_columns_input.update_forward_refs()
user_role_set_input.update_forward_refs()
user_role_stream_cursor_input.update_forward_refs()
user_role_stream_cursor_value_input.update_forward_refs()
user_role_updates.update_forward_refs()
user_set_input.update_forward_refs()
user_stream_cursor_input.update_forward_refs()
user_stream_cursor_value_input.update_forward_refs()
user_training_question_aggregate_bool_exp.update_forward_refs()
user_training_question_aggregate_bool_exp_count.update_forward_refs()
user_training_question_aggregate_order_by.update_forward_refs()
user_training_question_arr_rel_insert_input.update_forward_refs()
user_training_question_bool_exp.update_forward_refs()
user_training_question_insert_input.update_forward_refs()
user_training_question_max_order_by.update_forward_refs()
user_training_question_min_order_by.update_forward_refs()
user_training_question_on_conflict.update_forward_refs()
user_training_question_order_by.update_forward_refs()
user_training_question_pk_columns_input.update_forward_refs()
user_training_question_set_input.update_forward_refs()
user_training_question_stream_cursor_input.update_forward_refs()
user_training_question_stream_cursor_value_input.update_forward_refs()
user_training_question_updates.update_forward_refs()
user_updates.update_forward_refs()
uuid_comparison_exp.update_forward_refs()
validation_activity_sql_queries_aggregate_bool_exp.update_forward_refs()
validation_activity_sql_queries_aggregate_bool_exp_count.update_forward_refs()
validation_activity_sql_queries_aggregate_order_by.update_forward_refs()
validation_activity_sql_queries_arr_rel_insert_input.update_forward_refs()
validation_activity_sql_queries_bool_exp.update_forward_refs()
validation_activity_sql_queries_insert_input.update_forward_refs()
validation_activity_sql_queries_max_order_by.update_forward_refs()
validation_activity_sql_queries_min_order_by.update_forward_refs()
validation_activity_sql_queries_order_by.update_forward_refs()
validation_activity_sql_queries_set_input.update_forward_refs()
validation_activity_sql_queries_stream_cursor_input.update_forward_refs()
validation_activity_sql_queries_stream_cursor_value_input.update_forward_refs()
validation_activity_sql_queries_updates.update_forward_refs()
validation_tranformation_sql_queries_aggregate_bool_exp.update_forward_refs()
validation_tranformation_sql_queries_aggregate_bool_exp_count.update_forward_refs()
validation_tranformation_sql_queries_aggregate_order_by.update_forward_refs()
validation_tranformation_sql_queries_arr_rel_insert_input.update_forward_refs()
validation_tranformation_sql_queries_bool_exp.update_forward_refs()
validation_tranformation_sql_queries_insert_input.update_forward_refs()
validation_tranformation_sql_queries_max_order_by.update_forward_refs()
validation_tranformation_sql_queries_min_order_by.update_forward_refs()
validation_tranformation_sql_queries_order_by.update_forward_refs()
validation_tranformation_sql_queries_set_input.update_forward_refs()
validation_tranformation_sql_queries_stream_cursor_input.update_forward_refs()
validation_tranformation_sql_queries_stream_cursor_value_input.update_forward_refs()
validation_tranformation_sql_queries_updates.update_forward_refs()
versions_bool_exp.update_forward_refs()
versions_insert_input.update_forward_refs()
versions_on_conflict.update_forward_refs()
versions_order_by.update_forward_refs()
versions_pk_columns_input.update_forward_refs()
versions_set_input.update_forward_refs()
versions_stream_cursor_input.update_forward_refs()
versions_stream_cursor_value_input.update_forward_refs()
versions_updates.update_forward_refs()
watcher_bool_exp.update_forward_refs()
watcher_insert_input.update_forward_refs()
watcher_on_conflict.update_forward_refs()
watcher_order_by.update_forward_refs()
watcher_pk_columns_input.update_forward_refs()
watcher_relation_bool_exp.update_forward_refs()
watcher_relation_enum_comparison_exp.update_forward_refs()
watcher_relation_insert_input.update_forward_refs()
watcher_relation_on_conflict.update_forward_refs()
watcher_relation_order_by.update_forward_refs()
watcher_relation_pk_columns_input.update_forward_refs()
watcher_relation_set_input.update_forward_refs()
watcher_relation_stream_cursor_input.update_forward_refs()
watcher_relation_stream_cursor_value_input.update_forward_refs()
watcher_relation_updates.update_forward_refs()
watcher_set_input.update_forward_refs()
watcher_stream_cursor_input.update_forward_refs()
watcher_stream_cursor_value_input.update_forward_refs()
watcher_updates.update_forward_refs()
