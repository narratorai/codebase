from enum import Enum


class access_role_constraint(str, Enum):
    access_role_pkey = "access_role_pkey"


class access_role_enum(str, Enum):
    admin = "admin"
    can_use_sql = "can_use_sql"
    create_chat = "create_chat"
    create_dataset = "create_dataset"
    create_dataset_integeration = "create_dataset_integeration"
    create_dataset_materialize_view = "create_dataset_materialize_view"
    create_dataset_training = "create_dataset_training"
    create_report = "create_report"
    download_data = "download_data"
    manage_api = "manage_api"
    manage_billing = "manage_billing"
    manage_connection = "manage_connection"
    manage_custom_function = "manage_custom_function"
    manage_processing = "manage_processing"
    manage_processing_config = "manage_processing_config"
    manage_tags = "manage_tags"
    manage_tickets = "manage_tickets"
    manage_transformations = "manage_transformations"
    manage_users = "manage_users"
    update_private = "update_private"
    view_activities = "view_activities"
    view_billing = "view_billing"
    view_chat = "view_chat"
    view_customer_journey = "view_customer_journey"
    view_dataset = "view_dataset"
    view_private = "view_private"
    view_processing = "view_processing"
    view_report = "view_report"


class access_role_select_column(str, Enum):
    description = "description"
    value = "value"


class access_role_update_column(str, Enum):
    description = "description"
    value = "value"


class activity_column_renames_select_column(str, Enum):
    casting = "casting"
    created_at = "created_at"
    description = "description"
    has_data = "has_data"
    id = "id"
    label = "label"
    name = "name"
    related_to = "related_to"
    related_to_id = "related_to_id"
    type = "type"
    updated_at = "updated_at"


class activity_column_renames_select_column_activity_column_renames_aggregate_bool_exp_bool_and_arguments_columns(
    str, Enum
):
    has_data = "has_data"


class activity_column_renames_select_column_activity_column_renames_aggregate_bool_exp_bool_or_arguments_columns(
    str, Enum
):
    has_data = "has_data"


class activity_company_timelines_select_column(str, Enum):
    created_at = "created_at"
    description = "description"
    happened_at = "happened_at"
    id = "id"
    name = "name"
    related_to = "related_to"
    related_to_id = "related_to_id"
    updated_at = "updated_at"


class activity_constraint(str, Enum):
    activity_pkey = "activity_pkey"
    activity_table_id_slug_key = "activity_table_id_slug_key"


class activity_dim_constraint(str, Enum):
    activity_dim_activity_id_dim_table_id_key = "activity_dim_activity_id_dim_table_id_key"
    activity_dim_pkey = "activity_dim_pkey"


class activity_dim_select_column(str, Enum):
    activity_id = "activity_id"
    activity_join_column = "activity_join_column"
    created_at = "created_at"
    dim_table_id = "dim_table_id"
    id = "id"
    slowly_changing_ts_column = "slowly_changing_ts_column"


class activity_dim_update_column(str, Enum):
    activity_id = "activity_id"
    activity_join_column = "activity_join_column"
    created_at = "created_at"
    dim_table_id = "dim_table_id"
    id = "id"
    slowly_changing_ts_column = "slowly_changing_ts_column"


class activity_maintenance_constraint(str, Enum):
    activity_maintenance_ended_at_activity_id_dim_table_id_key = (
        "activity_maintenance_ended_at_activity_id_dim_table_id_key"
    )
    activity_maintenance_pkey = "activity_maintenance_pkey"


class activity_maintenance_select_column(str, Enum):
    activity_id = "activity_id"
    created_at = "created_at"
    dim_table_id = "dim_table_id"
    ended_at = "ended_at"
    id = "id"
    kind = "kind"
    notes = "notes"
    started_at = "started_at"
    updated_at = "updated_at"


class activity_maintenance_update_column(str, Enum):
    activity_id = "activity_id"
    created_at = "created_at"
    dim_table_id = "dim_table_id"
    ended_at = "ended_at"
    id = "id"
    kind = "kind"
    notes = "notes"
    started_at = "started_at"
    updated_at = "updated_at"


class activity_questions_select_column(str, Enum):
    activity_id = "activity_id"
    answer = "answer"
    answered_by = "answered_by"
    created_at = "created_at"
    id = "id"
    question = "question"
    updated_at = "updated_at"


class activity_select_column(str, Enum):
    category = "category"
    category_id = "category_id"
    company_id = "company_id"
    created_at = "created_at"
    description = "description"
    feature_distributions = "feature_distributions"
    id = "id"
    last_indexed_at = "last_indexed_at"
    maintainer_id = "maintainer_id"
    maintenance_ended_at = "maintenance_ended_at"
    maintenance_started_at = "maintenance_started_at"
    name = "name"
    next_index_at = "next_index_at"
    row_count = "row_count"
    sensitive_name_alternative = "sensitive_name_alternative"
    slug = "slug"
    status = "status"
    table_id = "table_id"
    time_plots = "time_plots"
    updated_at = "updated_at"
    updated_by = "updated_by"
    validated = "validated"


class activity_select_column_activity_aggregate_bool_exp_bool_and_arguments_columns(str, Enum):
    validated = "validated"


class activity_select_column_activity_aggregate_bool_exp_bool_or_arguments_columns(str, Enum):
    validated = "validated"


class activity_status_constraint(str, Enum):
    activity_status_pkey = "activity_status_pkey"


class activity_status_enum(str, Enum):
    ignored = "ignored"
    live = "live"


class activity_status_select_column(str, Enum):
    description = "description"
    value = "value"


class activity_status_update_column(str, Enum):
    description = "description"
    value = "value"


class activity_tags_select_column(str, Enum):
    activity_id = "activity_id"
    created_at = "created_at"
    id = "id"
    tag_id = "tag_id"


class activity_team_permissions_select_column(str, Enum):
    activity_id = "activity_id"
    can_edit = "can_edit"
    created_at = "created_at"
    id = "id"
    team_id = "team_id"


class activity_team_permissions_select_column_activity_team_permissions_aggregate_bool_exp_bool_and_arguments_columns(
    str, Enum
):
    can_edit = "can_edit"


class activity_team_permissions_select_column_activity_team_permissions_aggregate_bool_exp_bool_or_arguments_columns(
    str, Enum
):
    can_edit = "can_edit"


class activity_update_column(str, Enum):
    category = "category"
    category_id = "category_id"
    company_id = "company_id"
    created_at = "created_at"
    description = "description"
    feature_distributions = "feature_distributions"
    id = "id"
    last_indexed_at = "last_indexed_at"
    maintainer_id = "maintainer_id"
    maintenance_ended_at = "maintenance_ended_at"
    maintenance_started_at = "maintenance_started_at"
    name = "name"
    next_index_at = "next_index_at"
    row_count = "row_count"
    sensitive_name_alternative = "sensitive_name_alternative"
    slug = "slug"
    status = "status"
    table_id = "table_id"
    time_plots = "time_plots"
    updated_at = "updated_at"
    updated_by = "updated_by"
    validated = "validated"


class chat_constraint(str, Enum):
    chat_pkey = "chat_pkey"


class chat_select_column(str, Enum):
    created_at = "created_at"
    created_by = "created_by"
    detailed_summary = "detailed_summary"
    id = "id"
    messages = "messages"
    question = "question"
    rating = "rating"
    summary = "summary"
    table_id = "table_id"
    updated_at = "updated_at"


class chat_tags_select_column(str, Enum):
    chat_id = "chat_id"
    created_at = "created_at"
    id = "id"
    tag_id = "tag_id"
    updated_at = "updated_at"


class chat_update_column(str, Enum):
    created_at = "created_at"
    created_by = "created_by"
    detailed_summary = "detailed_summary"
    id = "id"
    messages = "messages"
    question = "question"
    rating = "rating"
    summary = "summary"
    table_id = "table_id"
    updated_at = "updated_at"


class column_rename_relations_constraint(str, Enum):
    column_rename_relations_pkey = "column_rename_relations_pkey"


class column_rename_relations_enum(str, Enum):
    activity = "activity"
    activity_dim = "activity_dim"
    dim_table = "dim_table"
    transformation = "transformation"


class column_rename_relations_select_column(str, Enum):
    description = "description"
    value = "value"


class column_rename_relations_update_column(str, Enum):
    description = "description"
    value = "value"


class column_renames_constraint(str, Enum):
    column_renames_pkey = "column_renames_pkey"
    column_renames_related_to_related_to_id_name_key = "column_renames_related_to_related_to_id_name_key"


class column_renames_select_column(str, Enum):
    casting = "casting"
    created_at = "created_at"
    description = "description"
    has_data = "has_data"
    id = "id"
    label = "label"
    name = "name"
    related_to = "related_to"
    related_to_id = "related_to_id"
    sensitive_label_alternative = "sensitive_label_alternative"
    type = "type"
    updated_at = "updated_at"


class column_renames_update_column(str, Enum):
    casting = "casting"
    created_at = "created_at"
    description = "description"
    has_data = "has_data"
    id = "id"
    label = "label"
    name = "name"
    related_to = "related_to"
    related_to_id = "related_to_id"
    sensitive_label_alternative = "sensitive_label_alternative"
    type = "type"
    updated_at = "updated_at"


class company_auth0_constraint(str, Enum):
    company_auth0_connection_id_key = "company_auth0_connection_id_key"
    company_sso_company_id_key = "company_sso_company_id_key"
    company_sso_org_id_key = "company_sso_org_id_key"
    company_sso_pkey = "company_sso_pkey"


class company_auth0_select_column(str, Enum):
    assign_membership_on_login = "assign_membership_on_login"
    company_id = "company_id"
    connection_id = "connection_id"
    created_at = "created_at"
    disable_sso = "disable_sso"
    enforce_sso = "enforce_sso"
    id = "id"
    org_id = "org_id"
    updated_at = "updated_at"


class company_auth0_update_column(str, Enum):
    assign_membership_on_login = "assign_membership_on_login"
    company_id = "company_id"
    connection_id = "connection_id"
    created_at = "created_at"
    disable_sso = "disable_sso"
    enforce_sso = "enforce_sso"
    id = "id"
    org_id = "org_id"
    updated_at = "updated_at"


class company_categories_constraint(str, Enum):
    company_categories_category_company_id_key = "company_categories_category_company_id_key"
    company_categories_pkey = "company_categories_pkey"


class company_categories_select_column(str, Enum):
    category = "category"
    color = "color"
    company_id = "company_id"
    created_at = "created_at"
    id = "id"


class company_categories_update_column(str, Enum):
    category = "category"
    color = "color"
    company_id = "company_id"
    created_at = "created_at"
    id = "id"


class company_config_batch_version_constraint(str, Enum):
    company_config_batch_version_pkey = "company_config_batch_version_pkey"


class company_config_batch_version_select_column(str, Enum):
    description = "description"
    value = "value"


class company_config_batch_version_update_column(str, Enum):
    description = "description"
    value = "value"


class company_config_core_version_constraint(str, Enum):
    company_config_core_version_pkey = "company_config_core_version_pkey"


class company_config_core_version_select_column(str, Enum):
    description = "description"
    value = "value"


class company_config_core_version_update_column(str, Enum):
    description = "description"
    value = "value"


class company_config_warehouse_language_constraint(str, Enum):
    company_config_warehouse_language_pkey = "company_config_warehouse_language_pkey"


class company_config_warehouse_language_enum(str, Enum):
    athena = "athena"
    bigquery = "bigquery"
    clickhouse = "clickhouse"
    databricks = "databricks"
    druid = "druid"
    mssql_odbc = "mssql_odbc"
    mysql = "mysql"
    pg = "pg"
    redshift = "redshift"
    snowflake = "snowflake"


class company_config_warehouse_language_select_column(str, Enum):
    description = "description"
    value = "value"


class company_config_warehouse_language_update_column(str, Enum):
    description = "description"
    value = "value"


class company_constraint(str, Enum):
    companies_pkey = "companies_pkey"
    companies_slug_key = "companies_slug_key"
    company_id_key = "company_id_key"


class company_github_sync_constraint(str, Enum):
    company_github_sync_installation_id_key = "company_github_sync_installation_id_key"
    company_github_sync_pkey = "company_github_sync_pkey"


class company_github_sync_select_column(str, Enum):
    company_id = "company_id"
    created_at = "created_at"
    id = "id"
    installation_id = "installation_id"
    target_repo = "target_repo"
    updated_at = "updated_at"
    user_id = "user_id"


class company_github_sync_update_column(str, Enum):
    company_id = "company_id"
    created_at = "created_at"
    id = "id"
    installation_id = "installation_id"
    target_repo = "target_repo"
    updated_at = "updated_at"
    user_id = "user_id"


class company_narrative_templates_constraint(str, Enum):
    company_narrative_templates_company_id_template_name_key = (
        "company_narrative_templates_company_id_template_name_key"
    )
    company_narrative_templates_pkey = "company_narrative_templates_pkey"


class company_narrative_templates_select_column(str, Enum):
    company_id = "company_id"
    created_at = "created_at"
    id = "id"
    template_name = "template_name"
    updated_at = "updated_at"


class company_narrative_templates_update_column(str, Enum):
    company_id = "company_id"
    created_at = "created_at"
    id = "id"
    template_name = "template_name"
    updated_at = "updated_at"


class company_prototypes_constraint(str, Enum):
    company_prototypes_company_id_block_slug_key = "company_prototypes_company_id_block_slug_key"
    company_prototypes_pkey = "company_prototypes_pkey"


class company_prototypes_select_column(str, Enum):
    block_slug = "block_slug"
    company_id = "company_id"
    created_at = "created_at"
    id = "id"


class company_prototypes_update_column(str, Enum):
    block_slug = "block_slug"
    company_id = "company_id"
    created_at = "created_at"
    id = "id"


class company_query_alert_constraint(str, Enum):
    company_query_alert_pkey = "company_query_alert_pkey"
    company_query_alert_query_id_key = "company_query_alert_query_id_key"


class company_query_alert_kinds_constraint(str, Enum):
    company_query_alert_kinds_pkey = "company_query_alert_kinds_pkey"


class company_query_alert_kinds_enum(str, Enum):
    returns_no_rows = "returns_no_rows"
    returns_rows = "returns_rows"


class company_query_alert_kinds_select_column(str, Enum):
    description = "description"
    value = "value"


class company_query_alert_kinds_update_column(str, Enum):
    description = "description"
    value = "value"


class company_query_alert_select_column(str, Enum):
    alert_kind = "alert_kind"
    created_at = "created_at"
    email = "email"
    id = "id"
    query_id = "query_id"
    task_id = "task_id"
    updated_at = "updated_at"
    updated_by = "updated_by"


class company_query_alert_update_column(str, Enum):
    alert_kind = "alert_kind"
    created_at = "created_at"
    email = "email"
    id = "id"
    query_id = "query_id"
    task_id = "task_id"
    updated_at = "updated_at"
    updated_by = "updated_by"


class company_resources_constraint(str, Enum):
    company_resources_company_id_key = "company_resources_company_id_key"
    company_resources_pkey = "company_resources_pkey"


class company_resources_select_column(str, Enum):
    company_id = "company_id"
    company_role = "company_role"
    created_at = "created_at"
    dedicated_redash_admin_datasource_id = "dedicated_redash_admin_datasource_id"
    id = "id"
    kms_key = "kms_key"
    read_policy = "read_policy"
    s3_bucket = "s3_bucket"
    updated_at = "updated_at"
    updated_by = "updated_by"
    write_policy = "write_policy"


class company_resources_update_column(str, Enum):
    company_id = "company_id"
    company_role = "company_role"
    created_at = "created_at"
    dedicated_redash_admin_datasource_id = "dedicated_redash_admin_datasource_id"
    id = "id"
    kms_key = "kms_key"
    read_policy = "read_policy"
    s3_bucket = "s3_bucket"
    updated_at = "updated_at"
    updated_by = "updated_by"
    write_policy = "write_policy"


class company_select_column(str, Enum):
    allow_narrator_employee_access = "allow_narrator_employee_access"
    batch_halt = "batch_halt"
    batch_halted_at = "batch_halted_at"
    batch_halted_by = "batch_halted_by"
    branding_color = "branding_color"
    cache_minutes = "cache_minutes"
    created_at = "created_at"
    created_by = "created_by"
    created_for = "created_for"
    currency_used = "currency_used"
    datacenter_region = "datacenter_region"
    dataset_default_filter_days = "dataset_default_filter_days"
    dataset_default_filter_months = "dataset_default_filter_months"
    dataset_row_threshold = "dataset_row_threshold"
    demo_company = "demo_company"
    description = "description"
    fivetran_destination_id = "fivetran_destination_id"
    id = "id"
    ignore_in_reporting = "ignore_in_reporting"
    logo_url = "logo_url"
    materialize_schema = "materialize_schema"
    max_inserts = "max_inserts"
    name = "name"
    plot_colors = "plot_colors"
    production_schema = "production_schema"
    project_id = "project_id"
    removed_at = "removed_at"
    select_wlm_count = "select_wlm_count"
    skip_automated_archive = "skip_automated_archive"
    slug = "slug"
    spend_table = "spend_table"
    start_data_on = "start_data_on"
    status = "status"
    timezone = "timezone"
    updated_at = "updated_at"
    use_time_boundary = "use_time_boundary"
    validation_months = "validation_months"
    warehouse_default_schemas = "warehouse_default_schemas"
    warehouse_language = "warehouse_language"
    website = "website"
    week_day_offset = "week_day_offset"


class company_sql_queries_select_column(str, Enum):
    created_at = "created_at"
    id = "id"
    name = "name"
    notes = "notes"
    related_id = "related_id"
    related_kind = "related_kind"
    related_to = "related_to"
    sql = "sql"
    updated_at = "updated_at"
    updated_by = "updated_by"


class company_status_constraint(str, Enum):
    company_status_pkey = "company_status_pkey"


class company_status_enum(str, Enum):
    active = "active"
    archived = "archived"
    missing_payment = "missing_payment"
    new = "new"
    onboarding = "onboarding"


class company_status_select_column(str, Enum):
    description = "description"
    value = "value"


class company_status_update_column(str, Enum):
    description = "description"
    value = "value"


class company_table_aggregation_dim_constraint(str, Enum):
    company_table_aggregation_dim_company_table_id_dim_table_id_key = (
        "company_table_aggregation_dim_company_table_id_dim_table_id_key"
    )
    company_table_aggregation_dim_pkey = "company_table_aggregation_dim_pkey"


class company_table_aggregation_dim_select_column(str, Enum):
    company_table_id = "company_table_id"
    created_at = "created_at"
    dim_table_id = "dim_table_id"
    id = "id"


class company_table_aggregation_dim_update_column(str, Enum):
    company_table_id = "company_table_id"
    created_at = "created_at"
    dim_table_id = "dim_table_id"
    id = "id"


class company_table_constraint(str, Enum):
    company_table_activity_stream_company_id_key = "company_table_activity_stream_company_id_key"
    company_table_company_id_identifier_key = "company_table_company_id_identifier_key"
    company_table_pkey = "company_table_pkey"


class company_table_select_column(str, Enum):
    activity_stream = "activity_stream"
    company_id = "company_id"
    created_at = "created_at"
    customer_dim_table_id = "customer_dim_table_id"
    customer_label = "customer_label"
    customer_table = "customer_table"
    default_time_between = "default_time_between"
    id = "id"
    identifier = "identifier"
    index_table = "index_table"
    is_imported = "is_imported"
    maintainer_id = "maintainer_id"
    manually_partition_activity = "manually_partition_activity"
    row_count = "row_count"
    schema_name = "schema_name"
    updated_at = "updated_at"


class company_table_select_column_company_table_aggregate_bool_exp_bool_and_arguments_columns(str, Enum):
    index_table = "index_table"
    is_imported = "is_imported"
    manually_partition_activity = "manually_partition_activity"


class company_table_select_column_company_table_aggregate_bool_exp_bool_or_arguments_columns(str, Enum):
    index_table = "index_table"
    is_imported = "is_imported"
    manually_partition_activity = "manually_partition_activity"


class company_table_update_column(str, Enum):
    activity_stream = "activity_stream"
    company_id = "company_id"
    created_at = "created_at"
    customer_dim_table_id = "customer_dim_table_id"
    customer_label = "customer_label"
    customer_table = "customer_table"
    default_time_between = "default_time_between"
    id = "id"
    identifier = "identifier"
    index_table = "index_table"
    is_imported = "is_imported"
    maintainer_id = "maintainer_id"
    manually_partition_activity = "manually_partition_activity"
    row_count = "row_count"
    schema_name = "schema_name"
    updated_at = "updated_at"


class company_tags_constraint(str, Enum):
    company_tags_pkey = "company_tags_pkey"
    company_tags_tag_company_id_key_unique = "company_tags_tag_company_id_key_unique"
    company_tags_tag_company_id_user_id_key = "company_tags_tag_company_id_user_id_key"
    company_tags_tag_company_id_user_id_key_unique = "company_tags_tag_company_id_user_id_key_unique"


class company_tags_select_column(str, Enum):
    color = "color"
    company_id = "company_id"
    created_at = "created_at"
    description = "description"
    id = "id"
    tag = "tag"
    user_id = "user_id"


class company_tags_update_column(str, Enum):
    color = "color"
    company_id = "company_id"
    created_at = "created_at"
    description = "description"
    id = "id"
    tag = "tag"
    user_id = "user_id"


class company_task_category_constraint(str, Enum):
    company_task_category_pkey = "company_task_category_pkey"


class company_task_category_enum(str, Enum):
    alerts = "alerts"
    materializations = "materializations"
    narratives = "narratives"
    processing = "processing"


class company_task_category_select_column(str, Enum):
    description = "description"
    value = "value"


class company_task_category_update_column(str, Enum):
    description = "description"
    value = "value"


class company_task_constraint(str, Enum):
    company_task_company_id_function_name_function_path_kwargs_key = (
        "company_task_company_id_function_name_function_path_kwargs_key"
    )
    company_task_company_id_task_slug_key = "company_task_company_id_task_slug_key"
    company_task_pkey = "company_task_pkey"


class company_task_select_column(str, Enum):
    category = "category"
    company_id = "company_id"
    created_at = "created_at"
    description = "description"
    function_name = "function_name"
    function_path = "function_path"
    id = "id"
    internal_only = "internal_only"
    kwargs = "kwargs"
    label = "label"
    schedule = "schedule"
    task_slug = "task_slug"
    updated_at = "updated_at"


class company_task_select_column_company_task_aggregate_bool_exp_bool_and_arguments_columns(str, Enum):
    internal_only = "internal_only"


class company_task_select_column_company_task_aggregate_bool_exp_bool_or_arguments_columns(str, Enum):
    internal_only = "internal_only"


class company_task_update_column(str, Enum):
    category = "category"
    company_id = "company_id"
    created_at = "created_at"
    description = "description"
    function_name = "function_name"
    function_path = "function_path"
    id = "id"
    internal_only = "internal_only"
    kwargs = "kwargs"
    label = "label"
    schedule = "schedule"
    task_slug = "task_slug"
    updated_at = "updated_at"


class company_timeline_constraint(str, Enum):
    events_pkey = "events_pkey"


class company_timeline_relations_constraint(str, Enum):
    event_relations_pkey = "event_relations_pkey"


class company_timeline_relations_enum(str, Enum):
    activity = "activity"
    company = "company"
    metric = "metric"
    narrative = "narrative"


class company_timeline_relations_select_column(str, Enum):
    description = "description"
    value = "value"


class company_timeline_relations_update_column(str, Enum):
    description = "description"
    value = "value"


class company_timeline_select_column(str, Enum):
    created_at = "created_at"
    description = "description"
    happened_at = "happened_at"
    id = "id"
    name = "name"
    related_to = "related_to"
    related_to_id = "related_to_id"
    updated_at = "updated_at"


class company_timeline_update_column(str, Enum):
    created_at = "created_at"
    description = "description"
    happened_at = "happened_at"
    id = "id"
    name = "name"
    related_to = "related_to"
    related_to_id = "related_to_id"
    updated_at = "updated_at"


class company_update_column(str, Enum):
    allow_narrator_employee_access = "allow_narrator_employee_access"
    batch_halt = "batch_halt"
    batch_halted_at = "batch_halted_at"
    batch_halted_by = "batch_halted_by"
    branding_color = "branding_color"
    cache_minutes = "cache_minutes"
    created_at = "created_at"
    created_by = "created_by"
    created_for = "created_for"
    currency_used = "currency_used"
    datacenter_region = "datacenter_region"
    dataset_default_filter_days = "dataset_default_filter_days"
    dataset_default_filter_months = "dataset_default_filter_months"
    dataset_row_threshold = "dataset_row_threshold"
    demo_company = "demo_company"
    description = "description"
    fivetran_destination_id = "fivetran_destination_id"
    id = "id"
    ignore_in_reporting = "ignore_in_reporting"
    logo_url = "logo_url"
    materialize_schema = "materialize_schema"
    max_inserts = "max_inserts"
    name = "name"
    plot_colors = "plot_colors"
    production_schema = "production_schema"
    project_id = "project_id"
    removed_at = "removed_at"
    select_wlm_count = "select_wlm_count"
    skip_automated_archive = "skip_automated_archive"
    slug = "slug"
    spend_table = "spend_table"
    start_data_on = "start_data_on"
    status = "status"
    timezone = "timezone"
    updated_at = "updated_at"
    use_time_boundary = "use_time_boundary"
    validation_months = "validation_months"
    warehouse_default_schemas = "warehouse_default_schemas"
    warehouse_language = "warehouse_language"
    website = "website"
    week_day_offset = "week_day_offset"


class company_user_api_key_constraint(str, Enum):
    company_user_api_key_pkey = "company_user_api_key_pkey"


class company_user_api_key_select_column(str, Enum):
    company_user_id = "company_user_id"
    created_at = "created_at"
    id = "id"
    label = "label"
    last_used_at = "last_used_at"
    revoked_at = "revoked_at"


class company_user_api_key_update_column(str, Enum):
    company_user_id = "company_user_id"
    created_at = "created_at"
    id = "id"
    label = "label"
    last_used_at = "last_used_at"
    revoked_at = "revoked_at"


class company_user_constraint(str, Enum):
    company_user_company_id_user_id_key = "company_user_company_id_user_id_key"
    company_user_pkey = "company_user_pkey"


class company_user_notifications_constraint(str, Enum):
    company_user_notifications_pkey = "company_user_notifications_pkey"


class company_user_notifications_select_column(str, Enum):
    company_user_id = "company_user_id"
    created_at = "created_at"
    id = "id"
    template_data = "template_data"
    template_slug = "template_slug"


class company_user_notifications_update_column(str, Enum):
    company_user_id = "company_user_id"
    created_at = "created_at"
    id = "id"
    template_data = "template_data"
    template_slug = "template_slug"


class company_user_preferences_constraint(str, Enum):
    company_user_preferences_pkey = "company_user_preferences_pkey"
    company_user_preferences_user_id_key = "company_user_preferences_user_id_key"


class company_user_preferences_select_column(str, Enum):
    company_user_id = "company_user_id"
    created_at = "created_at"
    email_opt_out = "email_opt_out"
    id = "id"
    profile_picture = "profile_picture"
    updated_at = "updated_at"


class company_user_preferences_update_column(str, Enum):
    company_user_id = "company_user_id"
    created_at = "created_at"
    email_opt_out = "email_opt_out"
    id = "id"
    profile_picture = "profile_picture"
    updated_at = "updated_at"


class company_user_role_constraint(str, Enum):
    company_user_role_pkey = "company_user_role_pkey"


class company_user_role_enum(str, Enum):
    admin = "admin"
    user = "user"


class company_user_role_select_column(str, Enum):
    description = "description"
    value = "value"


class company_user_role_update_column(str, Enum):
    description = "description"
    value = "value"


class company_user_select_column(str, Enum):
    company_context = "company_context"
    company_id = "company_id"
    created_at = "created_at"
    first_name = "first_name"
    from_sso = "from_sso"
    id = "id"
    job_title = "job_title"
    last_name = "last_name"
    metrics_context = "metrics_context"
    phone = "phone"
    role = "role"
    updated_at = "updated_at"
    user_context = "user_context"
    user_id = "user_id"


class company_user_select_column_company_user_aggregate_bool_exp_bool_and_arguments_columns(str, Enum):
    from_sso = "from_sso"


class company_user_select_column_company_user_aggregate_bool_exp_bool_or_arguments_columns(str, Enum):
    from_sso = "from_sso"


class company_user_update_column(str, Enum):
    company_context = "company_context"
    company_id = "company_id"
    created_at = "created_at"
    first_name = "first_name"
    from_sso = "from_sso"
    id = "id"
    job_title = "job_title"
    last_name = "last_name"
    metrics_context = "metrics_context"
    phone = "phone"
    role = "role"
    updated_at = "updated_at"
    user_context = "user_context"
    user_id = "user_id"


class compiled_narratives_select_column(str, Enum):
    created_at = "created_at"
    id = "id"
    narrative_id = "narrative_id"
    s3_key = "s3_key"


class current_tranformation_sql_queries_select_column(str, Enum):
    created_at = "created_at"
    id = "id"
    notes = "notes"
    related_kind = "related_kind"
    sql = "sql"
    transformation_id = "transformation_id"
    updated_at = "updated_at"
    updated_by = "updated_by"


class cursor_ordering(str, Enum):
    ASC = "ASC"
    DESC = "DESC"


class custom_function_constraint(str, Enum):
    custom_functions_company_id_name_key = "custom_functions_company_id_name_key"
    custom_functions_pkey = "custom_functions_pkey"


class custom_function_select_column(str, Enum):
    company_id = "company_id"
    created_at = "created_at"
    description = "description"
    id = "id"
    input_count = "input_count"
    name = "name"
    text_to_replace = "text_to_replace"
    updated_at = "updated_at"


class custom_function_update_column(str, Enum):
    company_id = "company_id"
    created_at = "created_at"
    description = "description"
    id = "id"
    input_count = "input_count"
    name = "name"
    text_to_replace = "text_to_replace"
    updated_at = "updated_at"


class datacenter_region_constraint(str, Enum):
    datacenter_region_pkey = "datacenter_region_pkey"


class datacenter_region_enum(str, Enum):
    EU = "EU"
    US = "US"


class datacenter_region_select_column(str, Enum):
    description = "description"
    value = "value"


class datacenter_region_update_column(str, Enum):
    description = "description"
    value = "value"


class dataset_activities_constraint(str, Enum):
    dataset_activities_dataset_id_activity_id_key = "dataset_activities_dataset_id_activity_id_key"
    dataset_activities_pkey = "dataset_activities_pkey"


class dataset_activities_select_column(str, Enum):
    activity_id = "activity_id"
    created_at = "created_at"
    dataset_id = "dataset_id"
    id = "id"
    updated_at = "updated_at"


class dataset_activities_update_column(str, Enum):
    activity_id = "activity_id"
    created_at = "created_at"
    dataset_id = "dataset_id"
    id = "id"
    updated_at = "updated_at"


class dataset_constraint(str, Enum):
    dataset_company_id_slug_key = "dataset_company_id_slug_key"
    dataset_pkey = "dataset_pkey"


class dataset_materialization_constraint(str, Enum):
    dataset_materialization_pkey = "dataset_materialization_pkey"


class dataset_materialization_select_column(str, Enum):
    column_id = "column_id"
    created_at = "created_at"
    dataset_id = "dataset_id"
    days_to_resync = "days_to_resync"
    external_link = "external_link"
    group_slug = "group_slug"
    id = "id"
    label = "label"
    postmark_from = "postmark_from"
    s3_secret_key = "s3_secret_key"
    sheet_key = "sheet_key"
    task_id = "task_id"
    template_id = "template_id"
    type = "type"
    updated_at = "updated_at"
    updated_by = "updated_by"
    user_ids = "user_ids"
    webhook_url = "webhook_url"


class dataset_materialization_update_column(str, Enum):
    column_id = "column_id"
    created_at = "created_at"
    dataset_id = "dataset_id"
    days_to_resync = "days_to_resync"
    external_link = "external_link"
    group_slug = "group_slug"
    id = "id"
    label = "label"
    postmark_from = "postmark_from"
    s3_secret_key = "s3_secret_key"
    sheet_key = "sheet_key"
    task_id = "task_id"
    template_id = "template_id"
    type = "type"
    updated_at = "updated_at"
    updated_by = "updated_by"
    user_ids = "user_ids"
    webhook_url = "webhook_url"


class dataset_select_column(str, Enum):
    category = "category"
    category_id = "category_id"
    company_id = "company_id"
    created_at = "created_at"
    created_by = "created_by"
    description = "description"
    has_training = "has_training"
    hide_from_index = "hide_from_index"
    id = "id"
    last_config_updated_at = "last_config_updated_at"
    last_viewed_at = "last_viewed_at"
    locked = "locked"
    metric_id = "metric_id"
    name = "name"
    slug = "slug"
    status = "status"
    updated_at = "updated_at"
    updated_by = "updated_by"


class dataset_select_column_dataset_aggregate_bool_exp_bool_and_arguments_columns(str, Enum):
    has_training = "has_training"
    hide_from_index = "hide_from_index"
    locked = "locked"


class dataset_select_column_dataset_aggregate_bool_exp_bool_or_arguments_columns(str, Enum):
    has_training = "has_training"
    hide_from_index = "hide_from_index"
    locked = "locked"


class dataset_tags_select_column(str, Enum):
    created_at = "created_at"
    dataset_id = "dataset_id"
    id = "id"
    tag_id = "tag_id"
    updated_at = "updated_at"


class dataset_team_permissions_select_column(str, Enum):
    can_edit = "can_edit"
    created_at = "created_at"
    dataset_id = "dataset_id"
    id = "id"
    team_id = "team_id"


class dataset_team_permissions_select_column_dataset_team_permissions_aggregate_bool_exp_bool_and_arguments_columns(
    str, Enum
):
    can_edit = "can_edit"


class dataset_team_permissions_select_column_dataset_team_permissions_aggregate_bool_exp_bool_or_arguments_columns(
    str, Enum
):
    can_edit = "can_edit"


class dataset_update_column(str, Enum):
    category = "category"
    category_id = "category_id"
    company_id = "company_id"
    created_at = "created_at"
    created_by = "created_by"
    description = "description"
    has_training = "has_training"
    hide_from_index = "hide_from_index"
    id = "id"
    last_config_updated_at = "last_config_updated_at"
    last_viewed_at = "last_viewed_at"
    locked = "locked"
    metric_id = "metric_id"
    name = "name"
    slug = "slug"
    status = "status"
    updated_at = "updated_at"
    updated_by = "updated_by"


class dataset_versions_select_column(str, Enum):
    created_at = "created_at"
    dataset_id = "dataset_id"
    id = "id"
    s3_key = "s3_key"


class dim_table_columns_select_column(str, Enum):
    casting = "casting"
    created_at = "created_at"
    description = "description"
    dim_table_id = "dim_table_id"
    has_data = "has_data"
    id = "id"
    label = "label"
    name = "name"
    related_to = "related_to"
    related_to_id = "related_to_id"
    type = "type"
    updated_at = "updated_at"


class dim_table_columns_select_column_dim_table_columns_aggregate_bool_exp_bool_and_arguments_columns(str, Enum):
    has_data = "has_data"


class dim_table_columns_select_column_dim_table_columns_aggregate_bool_exp_bool_or_arguments_columns(str, Enum):
    has_data = "has_data"


class dim_table_constraint(str, Enum):
    dim_table_pkey = "dim_table_pkey"
    dim_table_table_schema_company_id_key = "dim_table_table_schema_company_id_key"


class dim_table_select_column(str, Enum):
    company_id = "company_id"
    created_at = "created_at"
    description = "description"
    id = "id"
    join_key = "join_key"
    schema = "schema"
    table = "table"
    updated_at = "updated_at"


class dim_table_update_column(str, Enum):
    company_id = "company_id"
    created_at = "created_at"
    description = "description"
    id = "id"
    join_key = "join_key"
    schema = "schema"
    table = "table"
    updated_at = "updated_at"


class dim_team_permissions_select_column(str, Enum):
    can_edit = "can_edit"
    created_at = "created_at"
    dim_id = "dim_id"
    id = "id"
    team_id = "team_id"


class dim_team_permissions_select_column_dim_team_permissions_aggregate_bool_exp_bool_and_arguments_columns(str, Enum):
    can_edit = "can_edit"


class dim_team_permissions_select_column_dim_team_permissions_aggregate_bool_exp_bool_or_arguments_columns(str, Enum):
    can_edit = "can_edit"


class document_live_select_column(str, Enum):
    created_at = "created_at"
    id = "id"
    markdown = "markdown"
    name = "name"
    published = "published"
    slug = "slug"
    updated_at = "updated_at"


class document_revision_constraint(str, Enum):
    document_revision_pkey = "document_revision_pkey"


class document_revision_select_column(str, Enum):
    created_at = "created_at"
    id = "id"
    markdown = "markdown"
    name = "name"
    published = "published"
    slug = "slug"
    updated_at = "updated_at"


class document_revision_update_column(str, Enum):
    created_at = "created_at"
    id = "id"
    markdown = "markdown"
    name = "name"
    published = "published"
    slug = "slug"
    updated_at = "updated_at"


class group_constraint(str, Enum):
    group_company_id_name_key = "group_company_id_name_key"
    groups_pkey = "groups_pkey"


class group_select_column(str, Enum):
    company_id = "company_id"
    created_at = "created_at"
    id = "id"
    name = "name"
    updated_at = "updated_at"


class group_update_column(str, Enum):
    company_id = "company_id"
    created_at = "created_at"
    id = "id"
    name = "name"
    updated_at = "updated_at"


class llm_training_constraint(str, Enum):
    llm_training_pkey = "llm_training_pkey"


class llm_training_select_column(str, Enum):
    answer = "answer"
    created_at = "created_at"
    created_by = "created_by"
    custom_definition = "custom_definition"
    dataset_id = "dataset_id"
    id = "id"
    in_production = "in_production"
    question = "question"
    table_id = "table_id"
    updated_at = "updated_at"
    use_for_seed = "use_for_seed"


class llm_training_update_column(str, Enum):
    answer = "answer"
    created_at = "created_at"
    created_by = "created_by"
    custom_definition = "custom_definition"
    dataset_id = "dataset_id"
    id = "id"
    in_production = "in_production"
    question = "question"
    table_id = "table_id"
    updated_at = "updated_at"
    use_for_seed = "use_for_seed"


class maintenance_kinds_constraint(str, Enum):
    maintenance_kinds_pkey = "maintenance_kinds_pkey"


class maintenance_kinds_enum(str, Enum):
    anomaly_detected = "anomaly_detected"
    cascade_resynced = "cascade_resynced"
    custom_alert = "custom_alert"
    duplicated_id = "duplicated_id"
    manually_added = "manually_added"
    query_failed = "query_failed"
    resynced = "resynced"


class maintenance_kinds_select_column(str, Enum):
    description = "description"
    value = "value"


class maintenance_kinds_update_column(str, Enum):
    description = "description"
    value = "value"


class materialization_type_constraint(str, Enum):
    materialization_types_pkey = "materialization_types_pkey"


class materialization_type_enum(str, Enum):
    cached = "cached"
    clearfind_software_match = "clearfind_software_match"
    csv = "csv"
    gsheets = "gsheets"
    klaviyo = "klaviyo"
    materialized_view = "materialized_view"
    postmark = "postmark"
    sendgrid = "sendgrid"
    text = "text"
    view = "view"
    webhook = "webhook"


class materialization_type_select_column(str, Enum):
    description = "description"
    value = "value"


class materialization_type_update_column(str, Enum):
    description = "description"
    value = "value"


class metric_constraint(str, Enum):
    metric_name_idx = "metric_name_idx"
    metric_name_idx2 = "metric_name_idx2"
    metric_pkey = "metric_pkey"


class metric_select_column(str, Enum):
    agg_function = "agg_function"
    analyzable = "analyzable"
    archived_at = "archived_at"
    column_id = "column_id"
    company_id = "company_id"
    created_at = "created_at"
    created_by = "created_by"
    dataset_slug = "dataset_slug"
    format = "format"
    id = "id"
    is_increase = "is_increase"
    name = "name"
    status = "status"
    table_id = "table_id"
    task_id = "task_id"
    time_resolution = "time_resolution"
    time_to_convert_column_id = "time_to_convert_column_id"
    unit_name = "unit_name"
    updated_at = "updated_at"
    updated_by = "updated_by"


class metric_tags_select_column(str, Enum):
    created_at = "created_at"
    id = "id"
    metric_id = "metric_id"
    tag_id = "tag_id"
    updated_at = "updated_at"


class metric_timelines_select_column(str, Enum):
    created_at = "created_at"
    description = "description"
    happened_at = "happened_at"
    id = "id"
    name = "name"
    related_to = "related_to"
    related_to_id = "related_to_id"
    updated_at = "updated_at"


class metric_update_column(str, Enum):
    agg_function = "agg_function"
    analyzable = "analyzable"
    archived_at = "archived_at"
    column_id = "column_id"
    company_id = "company_id"
    created_at = "created_at"
    created_by = "created_by"
    dataset_slug = "dataset_slug"
    format = "format"
    id = "id"
    is_increase = "is_increase"
    name = "name"
    status = "status"
    table_id = "table_id"
    task_id = "task_id"
    time_resolution = "time_resolution"
    time_to_convert_column_id = "time_to_convert_column_id"
    unit_name = "unit_name"
    updated_at = "updated_at"
    updated_by = "updated_by"


class narrative_company_timelines_select_column(str, Enum):
    created_at = "created_at"
    description = "description"
    happened_at = "happened_at"
    id = "id"
    name = "name"
    related_to = "related_to"
    related_to_id = "related_to_id"
    updated_at = "updated_at"


class narrative_constraint(str, Enum):
    narrative_company_id_slug_key = "narrative_company_id_slug_key"
    narrative_pkey = "narrative_pkey"


class narrative_datasets_constraint(str, Enum):
    narrative_datasets_narrative_id_dataset_id_key = "narrative_datasets_narrative_id_dataset_id_key"
    narrative_datasets_pkey = "narrative_datasets_pkey"


class narrative_datasets_select_column(str, Enum):
    created_at = "created_at"
    dataset_id = "dataset_id"
    id = "id"
    narrative_id = "narrative_id"
    updated_at = "updated_at"


class narrative_datasets_update_column(str, Enum):
    created_at = "created_at"
    dataset_id = "dataset_id"
    id = "id"
    narrative_id = "narrative_id"
    updated_at = "updated_at"


class narrative_integration_kind_constraint(str, Enum):
    narrative_integeration_kind_pkey = "narrative_integeration_kind_pkey"


class narrative_integration_kind_enum(str, Enum):
    email = "email"
    upload_gdrive = "upload_gdrive"
    upload_gdrive_w_email = "upload_gdrive_w_email"


class narrative_integration_kind_select_column(str, Enum):
    description = "description"
    value = "value"


class narrative_integration_kind_update_column(str, Enum):
    description = "description"
    value = "value"


class narrative_integrations_constraint(str, Enum):
    narrative_integrations_pkey = "narrative_integrations_pkey"


class narrative_integrations_select_column(str, Enum):
    created_at = "created_at"
    id = "id"
    kind = "kind"
    narrative_id = "narrative_id"
    task_id = "task_id"


class narrative_integrations_update_column(str, Enum):
    created_at = "created_at"
    id = "id"
    kind = "kind"
    narrative_id = "narrative_id"
    task_id = "task_id"


class narrative_narratives_constraint(str, Enum):
    narrative_narratives_narrative_id_depends_on_narrative_id_key = (
        "narrative_narratives_narrative_id_depends_on_narrative_id_key"
    )
    narrative_narratives_pkey = "narrative_narratives_pkey"


class narrative_narratives_select_column(str, Enum):
    created_at = "created_at"
    depends_on_narrative_id = "depends_on_narrative_id"
    id = "id"
    narrative_id = "narrative_id"
    updated_at = "updated_at"


class narrative_narratives_update_column(str, Enum):
    created_at = "created_at"
    depends_on_narrative_id = "depends_on_narrative_id"
    id = "id"
    narrative_id = "narrative_id"
    updated_at = "updated_at"


class narrative_runs_constraint(str, Enum):
    narrative_runs_pkey = "narrative_runs_pkey"


class narrative_runs_select_column(str, Enum):
    company_id = "company_id"
    created_at = "created_at"
    id = "id"
    is_actionable = "is_actionable"
    narrative_slug = "narrative_slug"
    potential_lift = "potential_lift"
    s3_key = "s3_key"


class narrative_runs_select_column_narrative_runs_aggregate_bool_exp_avg_arguments_columns(str, Enum):
    potential_lift = "potential_lift"


class narrative_runs_select_column_narrative_runs_aggregate_bool_exp_bool_and_arguments_columns(str, Enum):
    is_actionable = "is_actionable"


class narrative_runs_select_column_narrative_runs_aggregate_bool_exp_bool_or_arguments_columns(str, Enum):
    is_actionable = "is_actionable"


class narrative_runs_select_column_narrative_runs_aggregate_bool_exp_corr_arguments_columns(str, Enum):
    potential_lift = "potential_lift"


class narrative_runs_select_column_narrative_runs_aggregate_bool_exp_covar_samp_arguments_columns(str, Enum):
    potential_lift = "potential_lift"


class narrative_runs_select_column_narrative_runs_aggregate_bool_exp_max_arguments_columns(str, Enum):
    potential_lift = "potential_lift"


class narrative_runs_select_column_narrative_runs_aggregate_bool_exp_min_arguments_columns(str, Enum):
    potential_lift = "potential_lift"


class narrative_runs_select_column_narrative_runs_aggregate_bool_exp_stddev_samp_arguments_columns(str, Enum):
    potential_lift = "potential_lift"


class narrative_runs_select_column_narrative_runs_aggregate_bool_exp_sum_arguments_columns(str, Enum):
    potential_lift = "potential_lift"


class narrative_runs_select_column_narrative_runs_aggregate_bool_exp_var_samp_arguments_columns(str, Enum):
    potential_lift = "potential_lift"


class narrative_runs_update_column(str, Enum):
    company_id = "company_id"
    created_at = "created_at"
    id = "id"
    is_actionable = "is_actionable"
    narrative_slug = "narrative_slug"
    potential_lift = "potential_lift"
    s3_key = "s3_key"


class narrative_select_column(str, Enum):
    category_id = "category_id"
    company_id = "company_id"
    created_at = "created_at"
    created_by = "created_by"
    description = "description"
    id = "id"
    last_config_updated_at = "last_config_updated_at"
    last_viewed_at = "last_viewed_at"
    metric_id = "metric_id"
    name = "name"
    requested_by = "requested_by"
    slug = "slug"
    snapshot_updated_at = "snapshot_updated_at"
    state = "state"
    task_id = "task_id"
    template_id = "template_id"
    type = "type"
    updated_at = "updated_at"
    updated_by = "updated_by"


class narrative_tags_select_column(str, Enum):
    created_at = "created_at"
    id = "id"
    narrative_id = "narrative_id"
    tag_id = "tag_id"
    updated_at = "updated_at"


class narrative_team_permissions_select_column(str, Enum):
    can_edit = "can_edit"
    created_at = "created_at"
    id = "id"
    narrative_id = "narrative_id"
    team_id = "team_id"


class narrative_team_permissions_select_column_narrative_team_permissions_aggregate_bool_exp_bool_and_arguments_columns(
    str, Enum
):
    can_edit = "can_edit"


class narrative_team_permissions_select_column_narrative_team_permissions_aggregate_bool_exp_bool_or_arguments_columns(
    str, Enum
):
    can_edit = "can_edit"


class narrative_template_constraint(str, Enum):
    narrative_template_pkey = "narrative_template_pkey"


class narrative_template_kinds_constraint(str, Enum):
    narrative_template_kinds_pkey = "narrative_template_kinds_pkey"


class narrative_template_kinds_enum(str, Enum):
    conditional = "conditional"
    generic = "generic"
    hard_coded = "hard_coded"


class narrative_template_kinds_select_column(str, Enum):
    description = "description"
    value = "value"


class narrative_template_kinds_update_column(str, Enum):
    description = "description"
    value = "value"


class narrative_template_select_column(str, Enum):
    category = "category"
    company_id = "company_id"
    created_at = "created_at"
    created_by = "created_by"
    customer_iteration = "customer_iteration"
    description = "description"
    display_companies_using = "display_companies_using"
    global_version = "global_version"
    id = "id"
    in_free_tier = "in_free_tier"
    kind = "kind"
    local_iteration = "local_iteration"
    name = "name"
    preview_narrative_json = "preview_narrative_json"
    question = "question"
    state = "state"
    template = "template"
    type = "type"
    updated_at = "updated_at"


class narrative_template_select_column_narrative_template_aggregate_bool_exp_bool_and_arguments_columns(str, Enum):
    in_free_tier = "in_free_tier"


class narrative_template_select_column_narrative_template_aggregate_bool_exp_bool_or_arguments_columns(str, Enum):
    in_free_tier = "in_free_tier"


class narrative_template_states_constraint(str, Enum):
    narrative_template_states_pkey = "narrative_template_states_pkey"


class narrative_template_states_enum(str, Enum):
    archived = "archived"
    draft = "draft"
    published = "published"
    published_globally = "published_globally"


class narrative_template_states_select_column(str, Enum):
    description = "description"
    value = "value"


class narrative_template_states_update_column(str, Enum):
    description = "description"
    value = "value"


class narrative_template_update_column(str, Enum):
    category = "category"
    company_id = "company_id"
    created_at = "created_at"
    created_by = "created_by"
    customer_iteration = "customer_iteration"
    description = "description"
    display_companies_using = "display_companies_using"
    global_version = "global_version"
    id = "id"
    in_free_tier = "in_free_tier"
    kind = "kind"
    local_iteration = "local_iteration"
    name = "name"
    preview_narrative_json = "preview_narrative_json"
    question = "question"
    state = "state"
    template = "template"
    type = "type"
    updated_at = "updated_at"


class narrative_types_constraint(str, Enum):
    narrative_types_pkey = "narrative_types_pkey"


class narrative_types_enum(str, Enum):
    Analyses = "Analyses"
    Education = "Education"
    Story = "Story"
    analysis = "analysis"
    dashboard = "dashboard"
    kpi = "kpi"
    lever = "lever"
    standalone = "standalone"


class narrative_types_select_column(str, Enum):
    description = "description"
    value = "value"


class narrative_types_update_column(str, Enum):
    description = "description"
    value = "value"


class narrative_update_column(str, Enum):
    category_id = "category_id"
    company_id = "company_id"
    created_at = "created_at"
    created_by = "created_by"
    description = "description"
    id = "id"
    last_config_updated_at = "last_config_updated_at"
    last_viewed_at = "last_viewed_at"
    metric_id = "metric_id"
    name = "name"
    requested_by = "requested_by"
    slug = "slug"
    snapshot_updated_at = "snapshot_updated_at"
    state = "state"
    task_id = "task_id"
    template_id = "template_id"
    type = "type"
    updated_at = "updated_at"
    updated_by = "updated_by"


class narrative_versions_select_column(str, Enum):
    created_at = "created_at"
    id = "id"
    narrative_id = "narrative_id"
    s3_key = "s3_key"


class order_by(str, Enum):
    asc = "asc"
    asc_nulls_first = "asc_nulls_first"
    asc_nulls_last = "asc_nulls_last"
    desc = "desc"
    desc_nulls_first = "desc_nulls_first"
    desc_nulls_last = "desc_nulls_last"


class package_constraint(str, Enum):
    package_pkey = "package_pkey"


class package_select_column(str, Enum):
    created_at = "created_at"
    id = "id"
    name = "name"
    package = "package"
    updated_at = "updated_at"


class package_update_column(str, Enum):
    created_at = "created_at"
    id = "id"
    name = "name"
    package = "package"
    updated_at = "updated_at"


class production_tranformation_sql_queries_select_column(str, Enum):
    created_at = "created_at"
    id = "id"
    notes = "notes"
    related_kind = "related_kind"
    sql = "sql"
    transformation_id = "transformation_id"
    updated_at = "updated_at"
    updated_by = "updated_by"


class query_template_constraint(str, Enum):
    query_template_pkey = "query_template_pkey"
    query_template_warehouse_language_el_source_data_source_tra_key = (
        "query_template_warehouse_language_el_source_data_source_tra_key"
    )


class query_template_select_column(str, Enum):
    created_at = "created_at"
    data_source = "data_source"
    el_source = "el_source"
    id = "id"
    query = "query"
    schema_names = "schema_names"
    transformation_kind = "transformation_kind"
    transformation_name = "transformation_name"
    transformation_update_type = "transformation_update_type"
    updated_at = "updated_at"
    updated_by = "updated_by"
    warehouse_language = "warehouse_language"


class query_template_update_column(str, Enum):
    created_at = "created_at"
    data_source = "data_source"
    el_source = "el_source"
    id = "id"
    query = "query"
    schema_names = "schema_names"
    transformation_kind = "transformation_kind"
    transformation_name = "transformation_name"
    transformation_update_type = "transformation_update_type"
    updated_at = "updated_at"
    updated_by = "updated_by"
    warehouse_language = "warehouse_language"


class query_updates_constraint(str, Enum):
    query_update_pkey = "query_update_pkey"


class query_updates_select_column(str, Enum):
    created_at = "created_at"
    from_sync_time = "from_sync_time"
    id = "id"
    processed_at = "processed_at"
    rows_inserted = "rows_inserted"
    to_sync_time = "to_sync_time"
    transformation_id = "transformation_id"
    update_duration = "update_duration"
    update_kind = "update_kind"
    updated_at = "updated_at"


class query_updates_update_column(str, Enum):
    created_at = "created_at"
    from_sync_time = "from_sync_time"
    id = "id"
    processed_at = "processed_at"
    rows_inserted = "rows_inserted"
    to_sync_time = "to_sync_time"
    transformation_id = "transformation_id"
    update_duration = "update_duration"
    update_kind = "update_kind"
    updated_at = "updated_at"


class question_answer_constraint(str, Enum):
    question_answer_pkey = "question_answer_pkey"


class question_answer_relations_constraint(str, Enum):
    question_answer_relations_pkey = "question_answer_relations_pkey"


class question_answer_relations_enum(str, Enum):
    activity = "activity"
    transformation = "transformation"


class question_answer_relations_select_column(str, Enum):
    description = "description"
    value = "value"


class question_answer_relations_update_column(str, Enum):
    description = "description"
    value = "value"


class question_answer_select_column(str, Enum):
    answer = "answer"
    answered_by = "answered_by"
    created_at = "created_at"
    id = "id"
    question = "question"
    related_id = "related_id"
    related_to = "related_to"
    updated_at = "updated_at"
    updated_by = "updated_by"


class question_answer_update_column(str, Enum):
    answer = "answer"
    answered_by = "answered_by"
    created_at = "created_at"
    id = "id"
    question = "question"
    related_id = "related_id"
    related_to = "related_to"
    updated_at = "updated_at"
    updated_by = "updated_by"


class scratchpad_tranformation_sql_queries_select_column(str, Enum):
    created_at = "created_at"
    id = "id"
    notes = "notes"
    related_kind = "related_kind"
    sql = "sql"
    transformation_id = "transformation_id"
    updated_at = "updated_at"
    updated_by = "updated_by"


class service_limit_constraint(str, Enum):
    service_limit_company_id_deleted_at_key = "service_limit_company_id_deleted_at_key"
    service_limit_company_id_end_on_deleted_at_key = "service_limit_company_id_end_on_deleted_at_key"
    service_limit_pkey = "service_limit_pkey"


class service_limit_select_column(str, Enum):
    activity_limit = "activity_limit"
    activity_stream_limit = "activity_stream_limit"
    admin_user_limit = "admin_user_limit"
    company_id = "company_id"
    created_at = "created_at"
    dataset_limit = "dataset_limit"
    deleted_at = "deleted_at"
    disable_on = "disable_on"
    end_on = "end_on"
    id = "id"
    materialization_limit = "materialization_limit"
    monthly_price = "monthly_price"
    monthly_templates_from_library_limit = "monthly_templates_from_library_limit"
    name = "name"
    narrative_limit = "narrative_limit"
    plan_id = "plan_id"
    row_limit = "row_limit"
    run_transformations_daily_limit = "run_transformations_daily_limit"
    start_on = "start_on"
    total_templates_from_library_limit = "total_templates_from_library_limit"
    transformation_limit = "transformation_limit"
    updated_at = "updated_at"
    user_limit = "user_limit"


class service_limit_select_column_service_limit_aggregate_bool_exp_avg_arguments_columns(str, Enum):
    monthly_price = "monthly_price"


class service_limit_select_column_service_limit_aggregate_bool_exp_corr_arguments_columns(str, Enum):
    monthly_price = "monthly_price"


class service_limit_select_column_service_limit_aggregate_bool_exp_covar_samp_arguments_columns(str, Enum):
    monthly_price = "monthly_price"


class service_limit_select_column_service_limit_aggregate_bool_exp_max_arguments_columns(str, Enum):
    monthly_price = "monthly_price"


class service_limit_select_column_service_limit_aggregate_bool_exp_min_arguments_columns(str, Enum):
    monthly_price = "monthly_price"


class service_limit_select_column_service_limit_aggregate_bool_exp_stddev_samp_arguments_columns(str, Enum):
    monthly_price = "monthly_price"


class service_limit_select_column_service_limit_aggregate_bool_exp_sum_arguments_columns(str, Enum):
    monthly_price = "monthly_price"


class service_limit_select_column_service_limit_aggregate_bool_exp_var_samp_arguments_columns(str, Enum):
    monthly_price = "monthly_price"


class service_limit_update_column(str, Enum):
    activity_limit = "activity_limit"
    activity_stream_limit = "activity_stream_limit"
    admin_user_limit = "admin_user_limit"
    company_id = "company_id"
    created_at = "created_at"
    dataset_limit = "dataset_limit"
    deleted_at = "deleted_at"
    disable_on = "disable_on"
    end_on = "end_on"
    id = "id"
    materialization_limit = "materialization_limit"
    monthly_price = "monthly_price"
    monthly_templates_from_library_limit = "monthly_templates_from_library_limit"
    name = "name"
    narrative_limit = "narrative_limit"
    plan_id = "plan_id"
    row_limit = "row_limit"
    run_transformations_daily_limit = "run_transformations_daily_limit"
    start_on = "start_on"
    total_templates_from_library_limit = "total_templates_from_library_limit"
    transformation_limit = "transformation_limit"
    updated_at = "updated_at"
    user_limit = "user_limit"


class slowly_changing_customer_dims_constraint(str, Enum):
    slowly_changing_customer_dims_pkey = "slowly_changing_customer_dims_pkey"
    slowly_changing_customer_dims_table_id_dim_table_id_key = "slowly_changing_customer_dims_table_id_dim_table_id_key"


class slowly_changing_customer_dims_select_column(str, Enum):
    created_at = "created_at"
    dim_table_id = "dim_table_id"
    id = "id"
    slowly_changing_ts_column = "slowly_changing_ts_column"
    table_id = "table_id"


class slowly_changing_customer_dims_update_column(str, Enum):
    created_at = "created_at"
    dim_table_id = "dim_table_id"
    id = "id"
    slowly_changing_ts_column = "slowly_changing_ts_column"
    table_id = "table_id"


class sql_queries_constraint(str, Enum):
    sql_queries_pkey = "sql_queries_pkey"


class sql_queries_select_column(str, Enum):
    created_at = "created_at"
    id = "id"
    name = "name"
    notes = "notes"
    related_id = "related_id"
    related_kind = "related_kind"
    related_to = "related_to"
    sql = "sql"
    updated_at = "updated_at"
    updated_by = "updated_by"


class sql_queries_update_column(str, Enum):
    created_at = "created_at"
    id = "id"
    name = "name"
    notes = "notes"
    related_id = "related_id"
    related_kind = "related_kind"
    related_to = "related_to"
    sql = "sql"
    updated_at = "updated_at"
    updated_by = "updated_by"


class sql_query_kinds_constraint(str, Enum):
    sql_query_kinds_pkey = "sql_query_kinds_pkey"


class sql_query_kinds_enum(str, Enum):
    current = "current"
    production = "production"
    scratchpad = "scratchpad"
    validation = "validation"


class sql_query_kinds_select_column(str, Enum):
    description = "description"
    value = "value"


class sql_query_kinds_update_column(str, Enum):
    description = "description"
    value = "value"


class sql_query_relations_constraint(str, Enum):
    sql_query_relations_pkey = "sql_query_relations_pkey"


class sql_query_relations_enum(str, Enum):
    activity = "activity"
    company = "company"
    transformation = "transformation"


class sql_query_relations_select_column(str, Enum):
    description = "description"
    value = "value"


class sql_query_relations_update_column(str, Enum):
    description = "description"
    value = "value"


class status_constraint(str, Enum):
    dataset_status_pkey = "dataset_status_pkey"


class status_enum(str, Enum):
    archived = "archived"
    in_progress = "in_progress"
    internal_only = "internal_only"
    live = "live"


class status_select_column(str, Enum):
    description = "description"
    value = "value"


class status_update_column(str, Enum):
    description = "description"
    value = "value"


class table_team_permissions_select_column(str, Enum):
    can_edit = "can_edit"
    created_at = "created_at"
    id = "id"
    table_id = "table_id"
    team_id = "team_id"


class table_team_permissions_select_column_table_team_permissions_aggregate_bool_exp_bool_and_arguments_columns(
    str, Enum
):
    can_edit = "can_edit"


class table_team_permissions_select_column_table_team_permissions_aggregate_bool_exp_bool_or_arguments_columns(
    str, Enum
):
    can_edit = "can_edit"


class tag_constraint(str, Enum):
    tag_pkey = "tag_pkey"
    tag_tag_id_related_to_related_id_key = "tag_tag_id_related_to_related_id_key"


class tag_relations_constraint(str, Enum):
    tag_relations_pkey = "tag_relations_pkey"


class tag_relations_enum(str, Enum):
    activity = "activity"
    chat = "chat"
    dataset = "dataset"
    metric = "metric"
    narrative = "narrative"
    narrative_run = "narrative_run"
    table = "table"
    transformation = "transformation"


class tag_relations_select_column(str, Enum):
    description = "description"
    value = "value"


class tag_relations_update_column(str, Enum):
    description = "description"
    value = "value"


class tag_select_column(str, Enum):
    created_at = "created_at"
    id = "id"
    related_id = "related_id"
    related_to = "related_to"
    tag_id = "tag_id"
    updated_at = "updated_at"


class tag_update_column(str, Enum):
    created_at = "created_at"
    id = "id"
    related_id = "related_id"
    related_to = "related_to"
    tag_id = "tag_id"
    updated_at = "updated_at"


class task_execution_constraint(str, Enum):
    task_execution_is_running_task_id_key = "task_execution_is_running_task_id_key"
    task_execution_pkey = "task_execution_pkey"


class task_execution_select_column(str, Enum):
    by_user = "by_user"
    completed_at = "completed_at"
    created_at = "created_at"
    details = "details"
    id = "id"
    is_running = "is_running"
    orchestration_id = "orchestration_id"
    started_at = "started_at"
    status = "status"
    task_id = "task_id"
    trace_id = "trace_id"
    trace_parent_id = "trace_parent_id"
    updated_at = "updated_at"


class task_execution_select_column_task_execution_aggregate_bool_exp_bool_and_arguments_columns(str, Enum):
    is_running = "is_running"


class task_execution_select_column_task_execution_aggregate_bool_exp_bool_or_arguments_columns(str, Enum):
    is_running = "is_running"


class task_execution_status_constraint(str, Enum):
    task_execution_status_pkey = "task_execution_status_pkey"


class task_execution_status_enum(str, Enum):
    cancelled = "cancelled"
    cancelling = "cancelling"
    complete = "complete"
    failed = "failed"
    pending = "pending"
    running = "running"


class task_execution_status_select_column(str, Enum):
    description = "description"
    value = "value"


class task_execution_status_update_column(str, Enum):
    description = "description"
    value = "value"


class task_execution_update_column(str, Enum):
    by_user = "by_user"
    completed_at = "completed_at"
    created_at = "created_at"
    details = "details"
    id = "id"
    is_running = "is_running"
    orchestration_id = "orchestration_id"
    started_at = "started_at"
    status = "status"
    task_id = "task_id"
    trace_id = "trace_id"
    trace_parent_id = "trace_parent_id"
    updated_at = "updated_at"


class team_constraint(str, Enum):
    team_company_id_name_key = "team_company_id_name_key"
    team_pkey = "team_pkey"


class team_permission_constraint(str, Enum):
    team_permission_pkey = "team_permission_pkey"
    team_permission_team_id_related_to_related_id_key = "team_permission_team_id_related_to_related_id_key"


class team_permission_select_column(str, Enum):
    can_edit = "can_edit"
    created_at = "created_at"
    id = "id"
    related_id = "related_id"
    related_to = "related_to"
    team_id = "team_id"


class team_permission_update_column(str, Enum):
    can_edit = "can_edit"
    created_at = "created_at"
    id = "id"
    related_id = "related_id"
    related_to = "related_to"
    team_id = "team_id"


class team_select_column(str, Enum):
    company_id = "company_id"
    created_at = "created_at"
    id = "id"
    name = "name"


class team_update_column(str, Enum):
    company_id = "company_id"
    created_at = "created_at"
    id = "id"
    name = "name"


class team_user_constraint(str, Enum):
    team_user_company_user_id_team_id_key = "team_user_company_user_id_team_id_key"
    team_user_pkey = "team_user_pkey"


class team_user_select_column(str, Enum):
    company_user_id = "company_user_id"
    created_at = "created_at"
    id = "id"
    team_id = "team_id"


class team_user_update_column(str, Enum):
    company_user_id = "company_user_id"
    created_at = "created_at"
    id = "id"
    team_id = "team_id"


class training_request_constraint(str, Enum):
    training_request_pkey = "training_request_pkey"


class training_request_select_column(str, Enum):
    assigned_to = "assigned_to"
    chat_id = "chat_id"
    company_id = "company_id"
    context = "context"
    created_at = "created_at"
    created_by = "created_by"
    dataset_id = "dataset_id"
    email_context = "email_context"
    email_requester = "email_requester"
    email_sent_at = "email_sent_at"
    group_slug = "group_slug"
    id = "id"
    plot_slug = "plot_slug"
    status = "status"
    status_updated_at = "status_updated_at"
    training_id = "training_id"
    type = "type"
    updated_at = "updated_at"


class training_request_select_column_training_request_aggregate_bool_exp_bool_and_arguments_columns(str, Enum):
    email_requester = "email_requester"


class training_request_select_column_training_request_aggregate_bool_exp_bool_or_arguments_columns(str, Enum):
    email_requester = "email_requester"


class training_request_update_column(str, Enum):
    assigned_to = "assigned_to"
    chat_id = "chat_id"
    company_id = "company_id"
    context = "context"
    created_at = "created_at"
    created_by = "created_by"
    dataset_id = "dataset_id"
    email_context = "email_context"
    email_requester = "email_requester"
    email_sent_at = "email_sent_at"
    group_slug = "group_slug"
    id = "id"
    plot_slug = "plot_slug"
    status = "status"
    status_updated_at = "status_updated_at"
    training_id = "training_id"
    type = "type"
    updated_at = "updated_at"


class trainining_request_status_constraint(str, Enum):
    trainining_request_status_pkey = "trainining_request_status_pkey"


class trainining_request_status_enum(str, Enum):
    completed = "completed"
    new = "new"
    skipped = "skipped"


class trainining_request_status_select_column(str, Enum):
    description = "description"
    value = "value"


class trainining_request_status_update_column(str, Enum):
    description = "description"
    value = "value"


class tranformation_enriched_activities_constraint(str, Enum):
    tranformation_enriched_activi_transformation_id_activity_id_key = (
        "tranformation_enriched_activi_transformation_id_activity_id_key"
    )
    tranformation_enriched_activities_pkey = "tranformation_enriched_activities_pkey"


class tranformation_enriched_activities_select_column(str, Enum):
    activity_id = "activity_id"
    column = "column"
    created_at = "created_at"
    id = "id"
    transformation_id = "transformation_id"


class tranformation_enriched_activities_update_column(str, Enum):
    activity_id = "activity_id"
    column = "column"
    created_at = "created_at"
    id = "id"
    transformation_id = "transformation_id"


class transformation_activities_constraint(str, Enum):
    transformation_activities_pkey = "transformation_activities_pkey"
    transformation_activities_transformation_id_activity_id_key = (
        "transformation_activities_transformation_id_activity_id_key"
    )


class transformation_activities_select_column(str, Enum):
    activity_id = "activity_id"
    created_at = "created_at"
    id = "id"
    transformation_id = "transformation_id"


class transformation_activities_update_column(str, Enum):
    activity_id = "activity_id"
    created_at = "created_at"
    id = "id"
    transformation_id = "transformation_id"


class transformation_column_renames_select_column(str, Enum):
    casting = "casting"
    created_at = "created_at"
    description = "description"
    has_data = "has_data"
    id = "id"
    label = "label"
    name = "name"
    related_to = "related_to"
    related_to_id = "related_to_id"
    transformation_id = "transformation_id"
    type = "type"
    updated_at = "updated_at"


class transformation_column_renames_select_column_transformation_column_renames_aggregate_bool_exp_bool_and_arguments_columns(
    str, Enum
):
    has_data = "has_data"


class transformation_column_renames_select_column_transformation_column_renames_aggregate_bool_exp_bool_or_arguments_columns(
    str, Enum
):
    has_data = "has_data"


class transformation_constraint(str, Enum):
    transformation_company_id_slug_key = "transformation_company_id_slug_key"
    transformation_pkey = "transformation_pkey"


class transformation_depends_on_constraint(str, Enum):
    transformation_depends_on_pkey = "transformation_depends_on_pkey"


class transformation_depends_on_select_column(str, Enum):
    created_at = "created_at"
    depends_on_transformation_id = "depends_on_transformation_id"
    id = "id"
    transformation_id = "transformation_id"


class transformation_depends_on_update_column(str, Enum):
    created_at = "created_at"
    depends_on_transformation_id = "depends_on_transformation_id"
    id = "id"
    transformation_id = "transformation_id"


class transformation_kinds_constraint(str, Enum):
    transformation_kinds_pkey = "transformation_kinds_pkey"


class transformation_kinds_enum(str, Enum):
    customer_attribute = "customer_attribute"
    enrichment = "enrichment"
    spend = "spend"
    stream = "stream"


class transformation_kinds_select_column(str, Enum):
    description = "description"
    value = "value"


class transformation_kinds_update_column(str, Enum):
    description = "description"
    value = "value"


class transformation_maintenance_constraint(str, Enum):
    transformation_maintenance_pkey = "transformation_maintenance_pkey"
    transformation_maintenance_transformation_id_ended_at_key = (
        "transformation_maintenance_transformation_id_ended_at_key"
    )


class transformation_maintenance_select_column(str, Enum):
    created_at = "created_at"
    ended_at = "ended_at"
    id = "id"
    kind = "kind"
    notes = "notes"
    started_at = "started_at"
    transformation_id = "transformation_id"
    updated_at = "updated_at"


class transformation_maintenance_update_column(str, Enum):
    created_at = "created_at"
    ended_at = "ended_at"
    id = "id"
    kind = "kind"
    notes = "notes"
    started_at = "started_at"
    transformation_id = "transformation_id"
    updated_at = "updated_at"


class transformation_questions_select_column(str, Enum):
    answer = "answer"
    answered_by = "answered_by"
    created_at = "created_at"
    id = "id"
    question = "question"
    transformation_id = "transformation_id"
    updated_at = "updated_at"


class transformation_run_after_constraint(str, Enum):
    transformation_run_after_pkey = "transformation_run_after_pkey"


class transformation_run_after_select_column(str, Enum):
    created_at = "created_at"
    id = "id"
    run_after_transformation_id = "run_after_transformation_id"
    transformation_id = "transformation_id"


class transformation_run_after_update_column(str, Enum):
    created_at = "created_at"
    id = "id"
    run_after_transformation_id = "run_after_transformation_id"
    transformation_id = "transformation_id"


class transformation_select_column(str, Enum):
    allow_future_data = "allow_future_data"
    category_id = "category_id"
    company_id = "company_id"
    created_at = "created_at"
    delete_window = "delete_window"
    do_not_delete_on_resync = "do_not_delete_on_resync"
    do_not_update_on_percent_change = "do_not_update_on_percent_change"
    has_source = "has_source"
    id = "id"
    is_aliasing = "is_aliasing"
    kind = "kind"
    last_diff_data_and_insert_at = "last_diff_data_and_insert_at"
    last_identity_resolution_updated_at = "last_identity_resolution_updated_at"
    last_resynced_at = "last_resynced_at"
    max_days_to_insert = "max_days_to_insert"
    mutable_day_window = "mutable_day_window"
    name = "name"
    next_resync_at = "next_resync_at"
    notes = "notes"
    notify_row_count_percent_change = "notify_row_count_percent_change"
    remove_customers = "remove_customers"
    single_activity = "single_activity"
    slug = "slug"
    start_data_after = "start_data_after"
    table = "table"
    task_id = "task_id"
    update_type = "update_type"
    updated_at = "updated_at"
    updated_by = "updated_by"


class transformation_select_column_transformation_aggregate_bool_exp_bool_and_arguments_columns(str, Enum):
    allow_future_data = "allow_future_data"
    do_not_delete_on_resync = "do_not_delete_on_resync"
    do_not_update_on_percent_change = "do_not_update_on_percent_change"
    has_source = "has_source"
    is_aliasing = "is_aliasing"
    remove_customers = "remove_customers"
    single_activity = "single_activity"


class transformation_select_column_transformation_aggregate_bool_exp_bool_or_arguments_columns(str, Enum):
    allow_future_data = "allow_future_data"
    do_not_delete_on_resync = "do_not_delete_on_resync"
    do_not_update_on_percent_change = "do_not_update_on_percent_change"
    has_source = "has_source"
    is_aliasing = "is_aliasing"
    remove_customers = "remove_customers"
    single_activity = "single_activity"


class transformation_test_constraint(str, Enum):
    tests_pkey = "tests_pkey"


class transformation_test_select_column(str, Enum):
    content = "content"
    created_at = "created_at"
    data = "data"
    id = "id"
    name = "name"
    query = "query"
    ran_data_from = "ran_data_from"
    status = "status"
    transformation_id = "transformation_id"
    updated_at = "updated_at"
    updated_by = "updated_by"


class transformation_test_status_constraint(str, Enum):
    test_status_pkey = "test_status_pkey"


class transformation_test_status_enum(str, Enum):
    Failed = "Failed"
    Passed = "Passed"
    Running = "Running"


class transformation_test_status_select_column(str, Enum):
    description = "description"
    value = "value"


class transformation_test_status_update_column(str, Enum):
    description = "description"
    value = "value"


class transformation_test_update_column(str, Enum):
    content = "content"
    created_at = "created_at"
    data = "data"
    id = "id"
    name = "name"
    query = "query"
    ran_data_from = "ran_data_from"
    status = "status"
    transformation_id = "transformation_id"
    updated_at = "updated_at"
    updated_by = "updated_by"


class transformation_update_column(str, Enum):
    allow_future_data = "allow_future_data"
    category_id = "category_id"
    company_id = "company_id"
    created_at = "created_at"
    delete_window = "delete_window"
    do_not_delete_on_resync = "do_not_delete_on_resync"
    do_not_update_on_percent_change = "do_not_update_on_percent_change"
    has_source = "has_source"
    id = "id"
    is_aliasing = "is_aliasing"
    kind = "kind"
    last_diff_data_and_insert_at = "last_diff_data_and_insert_at"
    last_identity_resolution_updated_at = "last_identity_resolution_updated_at"
    last_resynced_at = "last_resynced_at"
    max_days_to_insert = "max_days_to_insert"
    mutable_day_window = "mutable_day_window"
    name = "name"
    next_resync_at = "next_resync_at"
    notes = "notes"
    notify_row_count_percent_change = "notify_row_count_percent_change"
    remove_customers = "remove_customers"
    single_activity = "single_activity"
    slug = "slug"
    start_data_after = "start_data_after"
    table = "table"
    task_id = "task_id"
    update_type = "update_type"
    updated_at = "updated_at"
    updated_by = "updated_by"


class transformation_update_types_constraint(str, Enum):
    transformation_update_types_pkey = "transformation_update_types_pkey"


class transformation_update_types_enum(str, Enum):
    materialized_view = "materialized_view"
    mutable = "mutable"
    regular = "regular"
    single_run = "single_run"
    view = "view"


class transformation_update_types_select_column(str, Enum):
    description = "description"
    value = "value"


class transformation_update_types_update_column(str, Enum):
    description = "description"
    value = "value"


class user_access_role_constraint(str, Enum):
    user_access_role_company_user_id_role_key = "user_access_role_company_user_id_role_key"
    user_access_role_pkey = "user_access_role_pkey"


class user_access_role_select_column(str, Enum):
    company_user_id = "company_user_id"
    created_at = "created_at"
    id = "id"
    role = "role"


class user_access_role_update_column(str, Enum):
    company_user_id = "company_user_id"
    created_at = "created_at"
    id = "id"
    role = "role"


class user_constraint(str, Enum):
    user_email_key = "user_email_key"
    user_pkey = "user_pkey"


class user_role_constraint(str, Enum):
    user_role_pkey = "user_role_pkey"


class user_role_enum(str, Enum):
    internal = "internal"
    internal_admin = "internal_admin"
    user = "user"


class user_role_select_column(str, Enum):
    description = "description"
    value = "value"


class user_role_update_column(str, Enum):
    description = "description"
    value = "value"


class user_select_column(str, Enum):
    accepted_terms_at = "accepted_terms_at"
    accepted_terms_version = "accepted_terms_version"
    created_at = "created_at"
    email = "email"
    id = "id"
    role = "role"
    updated_at = "updated_at"


class user_training_question_constraint(str, Enum):
    user_training_question_pkey = "user_training_question_pkey"


class user_training_question_select_column(str, Enum):
    created_at = "created_at"
    created_by = "created_by"
    id = "id"
    llm_training_id = "llm_training_id"
    question = "question"
    updated_at = "updated_at"


class user_training_question_update_column(str, Enum):
    created_at = "created_at"
    created_by = "created_by"
    id = "id"
    llm_training_id = "llm_training_id"
    question = "question"
    updated_at = "updated_at"


class user_update_column(str, Enum):
    accepted_terms_at = "accepted_terms_at"
    accepted_terms_version = "accepted_terms_version"
    created_at = "created_at"
    email = "email"
    id = "id"
    role = "role"
    updated_at = "updated_at"


class validation_activity_sql_queries_select_column(str, Enum):
    activity_id = "activity_id"
    created_at = "created_at"
    id = "id"
    notes = "notes"
    related_kind = "related_kind"
    sql = "sql"
    updated_at = "updated_at"
    updated_by = "updated_by"


class validation_tranformation_sql_queries_select_column(str, Enum):
    created_at = "created_at"
    id = "id"
    notes = "notes"
    related_kind = "related_kind"
    sql = "sql"
    transformation_id = "transformation_id"
    updated_at = "updated_at"
    updated_by = "updated_by"


class versions_constraint(str, Enum):
    versions_pkey = "versions_pkey"


class versions_select_column(str, Enum):
    created_at = "created_at"
    id = "id"
    related_id = "related_id"
    related_to = "related_to"
    s3_key = "s3_key"
    user_id = "user_id"


class versions_update_column(str, Enum):
    created_at = "created_at"
    id = "id"
    related_id = "related_id"
    related_to = "related_to"
    s3_key = "s3_key"
    user_id = "user_id"


class watcher_constraint(str, Enum):
    watcher_pkey = "watcher_pkey"
    watchers_related_to_related_id_user_id_key = "watchers_related_to_related_id_user_id_key"


class watcher_relation_constraint(str, Enum):
    watcher_relation_pkey = "watcher_relation_pkey"


class watcher_relation_enum(str, Enum):
    company_task = "company_task"
    dataset = "dataset"
    narrative = "narrative"


class watcher_relation_select_column(str, Enum):
    description = "description"
    value = "value"


class watcher_relation_update_column(str, Enum):
    description = "description"
    value = "value"


class watcher_select_column(str, Enum):
    created_at = "created_at"
    id = "id"
    related_id = "related_id"
    related_to = "related_to"
    updated_at = "updated_at"
    user_id = "user_id"


class watcher_update_column(str, Enum):
    created_at = "created_at"
    id = "id"
    related_id = "related_id"
    related_to = "related_to"
    updated_at = "updated_at"
    user_id = "user_id"
