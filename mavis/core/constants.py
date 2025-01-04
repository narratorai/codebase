# from core.models.settings import settings

AHMED_USER_ID = "5d8fd6f3-b5d9-42fd-a04a-7ecaa8883aa1"
SEED_TABLE_ID = "928e013a-2a95-4497-b17e-487b70817202"


TEXT_EMBEDDING_MODEL = "text-embedding-3-small"
LLM_AGENT_MODEL = "gpt-4o-2024-11-20"
LLM_SMALL_AGENT_MODEL = "gpt-4o-mini-2024-07-18"


DOC_URL = "https://docs.narrator.ai/"
MAX_TASK_EXECUTION_SECONDS = 6 * 60 * 60  # 6 hrs


RESERVED_TAGS = ("popular", "recently_viewed", "favorite", "draft")
CREATE_USER_TAGS = ("recently_viewed", "favorite")

RESYNC_SCHEDULE = "*/9 * * * *"

START_TIME = "1900-01-01T01:00:00"
END_TIME = "2100-01-01T01:00:00"

GLAM_NARATIVE = "GLAM Dataset Narrative"
TIME_TO_CONVERT_GROUP = "days_to_completed_orderdb098ab9"
GLAM_NARATIVE_V2 = "Analyze Button Narrative"
TIME_TO_CONVERT_GROUP_V2 = "days_to_completed_order68aa59f2"

MAX_INT = 2147483640
STRING_CHAR = 4096
BEFORE_WLM_COUNT = 4
GSHEET_ROW_LIMIT = 15000

DATASET_LIMIT = 2000

DEFAULT_DAYS = 30 * 6

DATASET_KEYS = ["slug", "dataset_slug", "left_dataset_slug", "right_dataset_slug"]

NORMAL_TRANSFORMATION_PROCESS = "run_transformations"
MV_TRANSFORMATION_PROCESS = "run_async_transformations"
RECONCILE_TRANSFORMATION_PROCESS = "reconcile_stream_processing"

RUN_TRANSFORMATION_PATH = "batch_jobs.data_management.run_transformations"

# OLD TEMPLATES
ACTIVITY_DUPLICATION_RESOLVED_EMAIL_TEMPLATE = 27455181
DUPLICATE_TRANSFORMATION_ID_TEMPLATE = 29595075


# ALL NEW TEMPLATES
DUPLICATION_RESOLVED_EMAIL_TEMPLATE = 30250502
DUPLICATION_FOUND_EMAIL_TEMPLATE = 30250498
MISSING_DATA_EMAIL_TEMPLATE = 29601528

# TEMPLATES FOR PROCESSING
TRANSFORMATION_FAILURE_EMAIL_TEMPLATE = 27456704
TRANSFORMATION_RESYNC_EMAIL_TEMPLATE = 27455180
TRANSFORMATION_UP_TO_DATE_EMAIL_TEMPLATE = 27456706

DUPLICATE_ACTIVITY_ID_EMAIL_TEMPLATE = 27456710

SQL_ALERT_EMAIL_TEMPLATE = 18563683
FIVETRAN_AUDIT_EMAIL_TEMPLATE = 30928954

# DATASET EMAILS
DATASET_CSV_DOWNLOAD_EMAIL = 8924978

# NARRATIVE_EMAIL
NARRATIVE_EMAIL_TEMPLATE = 24903205

# NARRATIVE ADDED TO YOUR ACCOUNT TEMPLATE
GETTING_STARTED_EMAIL_TEMPLATE = 32004848
NARRATIVE_ADDED_EMAIL_TEMPLATE = 32037685
FIRST_ACTIVITY_EMAIL_TEMPLATE = 31993957
ALL_TEMPORAL_JOIN_EMAIL_TEMPLATE = 33703617

# TEMPLATE REQUEST TEMPLATE
TEMPLATE_REQUEST_EMAIL_TEMPLATE = 31708649

# Welcome emails
INVITED_TO_COMPANY_EMAIL_TEMPLATE = 32370610
ADDED_TO_COMPANY_EMAIL_TEMPLATE = 32447167

# INTERNAL EMAILS
INTERNAL_EMAIL_TEMPLATE = 32436710

# JOB EMAILS
TASK_SUCCESS_EMAIL_TEMPLATE = 32936986
TASK_FAILURE_EMAIL_TEMPLATE = 32936969

# Requests emails
REQUEST_COMPLETED_EMAIL_TEMPLATE = 35117984
REQUEST_SUBMITTED_EMAIL_TEMPLATE = 35117846

# Enterprise Onboarding
ENTERPRISE_ONBOARDING_EMAIL_TEMPLATE = 35285923

# New Table alert
NEW_TABLE_ALERT_EMAIL_TEMPLATE = 37768848

# Enrichment
ENRICHED_ID_COLS = ["enriched_activity_id", "id"]
ENRICHED_TS_COLS = ["enriched_ts", "ts"]


# FIVETRAN
UPDATED_SCHEMA_FT_URL = "https://webhooks.fivetran.com/webhooks/5b18876b-7897-4c6d-95ee-47041ba3374d"
ANALYZE_BUTTON_FT_URL = "https://webhooks.fivetran.com/webhooks/486c3b8f-5ced-4847-8c9d-07ec903e6d51"
PROCESS_TRACKING_FIVETRAN_URL = "https://webhooks.fivetran.com/webhooks/c5f36be6-8bac-426c-bfbd-b16fc8bb6ffb"
CHAT_RESPONSE_URL = "https://webhooks.fivetran.com/webhooks/ff666e7f-c0b1-4dfe-bd23-ca4ee2f2b862"
FIVETRAN_TRACKING_URL = "https://webhooks.fivetran.com/webhooks/db3b131d-ba32-42dc-a4b4-09dba849eb01"


# INTERNAL TRACKING
INTERNAL_TRACKING_URL = "https://webhooks.fivetran.com/webhooks/3f8f648b-8988-45bf-a6f6-0d7626ea17b7"

# Views tracking
VIEW_TRACKING_URL = "https://webhooks.fivetran.com/webhooks/e93b3b82-51ee-4851-9dfa-5fc520363b07"

# NARRATIVE TEMPLATES
FIRST_ACTIVITY_NARRATIVE_TEMPLATE = "Tutorial Your First Activity"
FIRST_DATASET_NARRATIVE_TEMPLATE = "Tutorial - Your First Dataset"
FIRST_ANALYSIS_NARRATIVE_TEMPLATE = "Tutorial - Your First Analysis"
FIRST_CUSTOMER_TABLE = "Tutorial Set up Your Customer Table"
ALL_TEMPORAL_JOIN_TEMPLATES = [
    "Tutorial Apply Last Touch Attribution with LAST BEFORE",
    "Tutorial Calculate Averages Within an Activity with AGG IN BETWEEN",
    "Tutorial Segment Customers on Frequency with ALL EVER",
    "Tutorial Segment Customers on Recency with LAST EVER",
    "Tutorial Calculate Conversion Rate with FIRST IN BETWEEN",
]

# STRIPE
STRIPE_PRICE_ID = "price_1NWq2BFf5ooJLTeuTuN8wfMS"
STRIPE_PRODUCT_ID = "prod_NfHUJxVWBrQdeN"
STRIPE_CONFIGURATION_ID = "bpc_1NtFSgFf5ooJLTeuXHscDADB"
TRIAL_DAYS = 14


# MASKING
MASKED_FIELDS = ("password",)
REMOVE_FIELDS = ("jsonKeyFile",)
MASKED_STR = "*********"

NON_ACTIONABLE_FUNCS = (
    "sum",
    "count",
    "count_all",
    "count_distinct",
    "min",
    "max",
    "stddev",
)

BLANK_TS = "T00:00:00"
LOWER_OPERATORS = (
    "contains",
    "contains_any",
    "ends_with",
    "starts_with",
    "not_contains_any",
    "not_contains",
    "not_ends_with",
    "not_starts_with",
)


CUSTOMER_COLUMN_NAMES = ("join_customer", "customer", "anonymous_customer_id")

# shows up in the index and is white-listed for some users
PROTOTYPE_BLOCKS = [
    "create_narrative_template_v5",
    "use_narrative_template_v5",
    "dataset_narrative_generator",
    "batch_export",
    "batch_create",
    "update_company_table",
    # "dataset_snapshot",
    "create_query_template",
    "use_query_template",
    "batch_task_updates",
    "batch_delete",
    "update_task_cron",
    "resync_time_window",
    "fivetran_audit",
    "grant_template_access",
    "swap_activities",
    "customer_narrative_templater",
    "stream_context",
    "dim_context",
    "customer_journey_visual",
    "narrative_config",
    "new_company",
    # "llm_trainer",
    # "llm_tester",
    # "llm_training_coverage",
    # "question_stemming",
    # "bulk_dataset_trainer",
    # "intention_mapper",
    # "batch_llm_trainer",
]


# THESE can be used by ANY ONE
PRODUCTION_BLOCKS = [
    # "dataset_snapshot",
    "update_company_table",
    "update_column_value",
    # In production blocks (used via other endpoints)
    "dataset_plotter",
    "transformation_tests",
    "use_narrative_template_v5",
    "activity_context_v2",
    # "activity_context",
    "stream_context",
    "dim_context",
    "narrative_integrations",
    "narrative_config",
]

# BLOCKS in the main dropdown
NARRATIVE_BLOCKS_V2 = []
# blocks in the advanced options dropdown
ADVANCED_NARRATIVE_BLOCKS_V2 = [
    "csv_table",
    "narrative_plotter",
    "raw_metric",
]
# Blocks that used to be here and have been moved to the admin/block endpoint
REDIRECT_ADMIN_BLOCKS = ["company_edit", "transformation_context_v2"]

# Fields shown in the Narrative UI
FIELD_BLOCKS_V2 = ["simple_variable", "table_variable", "metric_variable"]
ADVANCED_FIELD_BLOCKS_V2 = [
    "consistency_checker",
    "trend",
    "bucket",
    "labeled_field",
    "dataset_metric",
    "value_field",
    # "combined_dataset",
]

# DEPRECATED
NARRATIVE_BLOCKS = ["narrative_plotter", "raw_metric"]
SUPER_ADMIN_NARRATIVE_BLOCKS = [
    # "analyze_simulator",
    "raw_table",
]
FIELD_BLOCKS = [
    "dataset_metric",
    "value_field",
    "labeled_field",
    "consistency_checker",
    "trend",
    "bucket",
    # "combined_dataset",
]


# for connections
NUMBER_OF_CONNECTIONS_PER_COMPANY = 10

# Mapping to product colors: https://github.com/narratorai/portal-narrator-next/blob/fc34427f590fd91782c51d0166f318c056b78f3a/portal/util/constants.ts#L20-L144
STATUS_COLORS = dict(
    cancelled="#ffb025",
    complete="#117c3e",
    failed="#f04e4f",
    running="#298dcc",
)


COLORS = [
    "#6FB6EA",
    "#dc3912",
    "#ff9900",
    "#aa0dfe",
    "#3283fe",
    "#85660d",
    "#782ab6",
    "#565656",
    "#1c8356",
    "#16ff32",
    "#1cbe4f",
    "#c4451c",
    "#dea0fd",
    "#fe00fa",
    "#325a9b",
    "#feaf16",
    "#f8a195",
    "#90ad1c",
    "#f6222e",
    "#1cffce",
    "#2ed9ff",
    "#b10da1",
    "#c075a6",
    "#fc1cbf",
    "#b00068",
    "#fbe426",
]

PRODUCT_COLORS = [
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
]


TABLE_COLORS = ["white", "stone", "blue", "emerald"]
