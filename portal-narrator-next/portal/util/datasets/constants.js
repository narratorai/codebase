import _ from 'lodash'
import { COLUMN_KIND_BOOLEAN, COLUMN_KIND_NUMBER, COLUMN_KIND_STRING, COLUMN_KIND_TIMESTAMP } from 'util/manage'
import { IStatus_Enum } from 'graph/generated'

// Used for info panel scroll support!
export const INFO_PANEL_CONTAINER_ID = 'info-panel-container'

//////////////////////// COLUMN CONSTANTS ////////////////////////

export const RAW_DATASET_KEY = '__raw'

// FIXME - this is gross we should fix it!
// Note MAVIS's/manage column.kind === dataset's column.type
export const COLUMN_TYPE_BOOLEAN = COLUMN_KIND_BOOLEAN
export const COLUMN_TYPE_NUMBER = COLUMN_KIND_NUMBER
export const COLUMN_TYPE_STRING = COLUMN_KIND_STRING
export const COLUMN_TYPE_TIMESTAMP = COLUMN_KIND_TIMESTAMP
export const COLUMN_TYPE_COLUMN_ID = 'column_id'

// Extra column types supported in new query mapper:
export const COLUMN_TYPE_TEXT = 'text'
export const COLUMN_TYPE_FLOAT = 'float'
export const COLUMN_TYPE_INTEGER = 'integer'
export const COLUMN_TYPE_BIG_INTEGER = 'bigint'

// Column type null currently only used for IFTTT
export const COLUMN_TYPE_NULL = 'null'

export const ALL_COLUMN_TYPES = [
  COLUMN_TYPE_BOOLEAN,
  COLUMN_TYPE_TIMESTAMP,
  COLUMN_TYPE_STRING,
  COLUMN_TYPE_TEXT,
  COLUMN_TYPE_NUMBER,
  COLUMN_TYPE_FLOAT,
  COLUMN_TYPE_INTEGER,
  COLUMN_TYPE_BIG_INTEGER,
]
export const STRING_COLUMN_TYPES = [COLUMN_TYPE_STRING, COLUMN_TYPE_TEXT]
export const NUMBER_COLUMN_TYPES = [COLUMN_TYPE_NUMBER, COLUMN_TYPE_FLOAT, COLUMN_TYPE_INTEGER, COLUMN_TYPE_BIG_INTEGER]

export const METRICS_TYPE_DISTRIBUTION = 'distribution'
export const METRICS_TYPE_DUPLICATES = 'duplicates'
export const METRICS_TYPE_MIN_MAX = 'min_max'
export const METRICS_TYPE_PERCENTILE = 'percentile'

export const AGG_FUNCTION_AVERAGE = 'AVERAGE'
export const AGG_FUNCTION_COUNT = 'COUNT'

// RECORD_COUNT, COUNT_RECORDS, AND COUNT_ALL are used for the same actions
// COUNT_ALL is what we send to mavis
export const AGG_FUNCTION_COUNT_ALL = 'COUNT_ALL'
// RECORD_COUNT is what the user will see in dropdown
export const AGG_FUNCTION_COUNT_ALL_DROPDOWN_LABEL = 'RECORD_COUNT'
// COUNT_RECORDS is what the user will see in the sidebar
export const AGG_FUNCTION_COUNT_ALL_LABEL = 'COUNT_RECORDS'

export const AGG_FUNCTION_COUNT_DISTINCT = 'COUNT_DISTINCT'
export const AGG_FUNCTION_MAX = 'MAX'
export const AGG_FUNCTION_MIN = 'MIN'
export const AGG_FUNCTION_MEDIAN = 'MEDIAN'
export const AGG_FUNCTION_PERCENTILE_CONT = 'PERCENTILE_CONT'
export const AGG_FUNCTION_RATE = 'RATE'
export const AGG_FUNCTION_SUM = 'SUM'
export const AGG_FUNCTION_STDDEV = 'STDDEV'
export const NUMBER_ONLY_AGG_FUNCTIONS = [
  AGG_FUNCTION_AVERAGE,
  AGG_FUNCTION_MEDIAN,
  AGG_FUNCTION_PERCENTILE_CONT,
  AGG_FUNCTION_RATE,
  AGG_FUNCTION_SUM,
  AGG_FUNCTION_STDDEV,
]
export const AGG_FUNCTIONS = _.sortBy([
  ...NUMBER_ONLY_AGG_FUNCTIONS,
  AGG_FUNCTION_COUNT,
  AGG_FUNCTION_COUNT_DISTINCT,
  AGG_FUNCTION_MIN,
  AGG_FUNCTION_MAX,
])

// Right click options
export const COLUMN_OPTIONS_DATE_DIFF = 'right_click_date_diff'
export const COLUMN_OPTIONS_TIME_TRUNCATE = 'right_click_truncate_time'
export const COLUMN_OPTIONS_DUPLICATE_COLUMN = 'right_click_duplicate_column'

//////////////////////// TABLE CONSTANTS ////////////////////////

// FIXME - this should be more intelligent once we change to the value accessor
// being column.id not column.label
export const OBSCURABLE_COLUMN_LABELS = ['email', 'customer']

// Shared Constants
export const INFO_PANEL_WIDTH = 335

export const COLUMN_CONTENT_WIDTH = 160
export const ROW_NUMBER_WIDTH = 40
export const DEFAULT_X_PADDING = 16
export const DEFAULT_COLUMN_WIDTH = COLUMN_CONTENT_WIDTH + DEFAULT_X_PADDING * 2

export const SCROLLBAR_WIDTH = 16 // matches system default for Mac

export const GLOBAL_CTA_HEIGHT = 168

// Cell/Body Constants
export const CONTENT_HEIGHT = 24
export const DEFAULT_Y_PADDING = 8
export const BORDER_WIDTH = 1
export const DEFAULT_ROW_HEIGHT = CONTENT_HEIGHT + DEFAULT_Y_PADDING * 2

// Header Constants
export const HEADER_SECTION_TITLE_HEIGHT = 28
export const HEADER_SECTION_TITLE_HEIGHT_V2 = 8
export const HEADER_COLUMN_NAME_HEIGHT = 48
export const HEADER_ROW_HEIGHT = HEADER_COLUMN_NAME_HEIGHT + 98
export const HEADER_HEIGHT = HEADER_SECTION_TITLE_HEIGHT + HEADER_ROW_HEIGHT

// UI Constants
export const ATTRIBUTE_COLOR = 'magenta600'
export const ATTRIBUTE_COLOR_BG = 'magenta600'

export const BEHAVIOR_COLOR = 'purple600'
export const BEHAVIOR_COLOR_BG = 'purple600'

export const COMPUTATION_COLOR = 'orange600'
export const COMPUTATION_COLOR_BG = 'orange600'

export const CONVERSION_COLOR = 'magenta600'
export const CONVERSION_COLOR_BG = 'magenta600'

export const GROUP_BY_COLOR = 'teal600'
export const GROUP_BY_COLOR_BG = 'teal600'

export const GROUP_METRIC_COLOR = 'yellow600'
export const GROUP_METRIC_COLOR_BG = 'yellow600'

export const GROUP_CAC_COLOR = 'red800'
export const GROUP_CAC_COLOR_BG = 'red800'

export const GROUP_PARENT_DATASET_COLOR = 'blurple600'
export const GROUP_PARENT_DATASET_COLOR_BG = 'blurple600'

//////////////////////// FINAL FORM CONSTANTS ////////////////////////

// UI SPECIFIC Modal/Tool kinds
export const TOOL_COMPUTED = '_tool_computed_'
export const TOOL_DELETE_GROUP = '_tool_delete_group_'
export const TOOL_DELETE_DATASET = '_tool_delete_dataset_'
export const TOOL_DUPLICATE_DATASET = '_tool_duplicate_dataset_'
export const TOOL_FILTER = '_tool_filter_'
export const TOOL_SAVE_DATASET = '_tool_save_dataset_'
export const TOOL_GROUP_COLUMNS = '_tool_group_columns_'
export const TOOL_GROUP_BY_METRIC = '_tool_group_by_metric_'
export const TOOL_ORDER_BY = '_tool_order_by_'
export const TOOL_PIVOT = '_tool_pivot_'
export const TOOL_SWAP_GROUP = '_tool_swap_group_'
export const TOOL_GROUP_PLOTTER = '_tool_group_plotter_'
export const TOOL_CUSTOM_PLOT = '_tool_custom_plot_'
export const TOOL_ACTIVITY_PRE_FILTERS = '_tool_activity_pre_filters_'
export const TOOL_SPEND_CONFIG = '_tool_spend_config_'
export const TOOL_GROUP_PARENT_FILTER = '_tool_group_parent_filters_'
export const TOOL_SELECT_STREAM = '_tool_select_stream_'
export const TOOL_COPY_FROM_NARRATIVE_DATASET = '_tool_copy_from_narrative_dataset_'

// DEPRECATED Modal/Tool kinds
export const TOOL_SELECT_ACTIVITY = '_tool_select_activity_'
export const TOOL_ADD_ACTIVITY_ATTRIBUTES = '_tool_add_activity_attributes_'
export const TOOL_ADD_CUSTOMER_ATTRIBUTES = '_tool_add_customer_attributes_'

// UI SPECIFIC Column _kind
export const COLUMN_KIND_BEHAVIOR = '_behavior_'
export const COLUMN_KIND_CONVERSION = '_conversion_'
export const COLUMN_KIND_ATTRIBUTE = '_attribute_'
export const COLUMN_KIND_COMPUTED = '_computed_'
export const COLUMN_KIND_GROUP_BY = '_group_by_'
export const COLUMN_KIND_GROUP_METRIC = '_group_metric_'
export const COLUMN_KIND_CAC = '_group_cac_'

//////////////////////// FORM FIELD CONSTANTS ////////////////////////

// Activity Kinds
export const DATASET_ACTIVITY_KIND_BEHAVIOR = 'limiting'
export const DATASET_ACTIVITY_KIND_CONVERSION = 'conversion'
export const DATASET_ACTIVITY_KIND_ATTRIBUTE = 'append'

// Column Source Kinds
export const COLUMN_SOURCE_KIND_ACTIVITY = 'activity'
export const COLUMN_SOURCE_KIND_ENRICHMENT = 'enrichment'
export const COLUMN_SOURCE_KIND_COMPUTED = 'computed'
export const COLUMN_SOURCE_KIND_CUSTOMER = 'customer'

// Column Auto Generated By
export const AUTO_GEN_CREATE_PIVOT = 'create-pivot'
export const AUTO_GEN_CREATE_GROUP_BY = 'create-group-by'

// Occurrences
export const OCCURRENCE_FIRST = 'first'
export const OCCURRENCE_LAST = 'last'
export const OCCURRENCE_ALL = 'all'
export const OCCURRENCE_CUSTOM = 'custom'
export const OCCURRENCE_TIME = 'time'
export const OCCURRENCE_METRIC = 'metric'
// cohort occurrences that we shouldn't allow "between" relationships
// i.e. "First In Between", "Aggregate In Between"...
export const BETWEEN_NOT_ALLOWED_OCCURENCES = [OCCURRENCE_FIRST, OCCURRENCE_LAST, OCCURRENCE_CUSTOM]

// Relationships
export const RELATIONSHIP_AFTER = 'after'
export const RELATIONSHIP_BEFORE = 'before'
export const RELATIONSHIP_BEFORE_NEXT = 'after_before_next'

export const RELATIONSHIP_KEY_JOIN = 'column'

export const RELATIONSHIP_TIME_VALUE = 'relationship_time_value'
export const RELATIONSHIP_TIME = 'relationship_time'

export const RELATIONSHIP_AT_LEAST_TIME = 'at_least_time'
export const RELATIONSHIP_WITHIN_TIME = 'within_time'

// DEPRECATED, use within_time, at_least_time instead:
export const RELATIONSHIP_WITHIN_MINUTES = 'within_minutes'
export const RELATIONSHIP_TIME_MINUTE = 'minute'

export const RELATIONSHIP_WITHIN_COHORT = 'within_cohort'
export const RELATIONSHIP_BEFORE_COHORT = 'before'

export const FILTER_KIND_VALUE = 'value'
export const FILTER_KIND_COLUMN = 'column_id'
export const FILTER_KIND_FIELD = 'field'

// Run Dataset / Metrics override
export const RUN_DATASET_OVERRIDE_ALL = 'run_all_please'

// Filters
export const DEFAULT_FILTER = {
  operator: '',
  value: '',
  kind: FILTER_KIND_VALUE,
  or_null: false,
}

export const DEFAULT_IS_DOES_EXIST_COLUMN_FILTER = {
  operator: 'equal',
  value: 1,
  kind: FILTER_KIND_VALUE,
  or_null: false,
}

export const TIME_FILTER_KIND_BEGINNING = 'start_of_time'
export const TIME_FILTER_KIND_NOW = 'now'
export const TIME_FILTER_KIND_ABSOLUTE = 'absolute'
export const TIME_FILTER_KIND_COLLOQUIAL = 'colloquial'
export const TIME_FILTER_KIND_RELATIVE = 'relative'

export const SIMPLE_TIME_FILTER_OPTIONS = ['day', 'week', 'month', 'year']
export const TIME_FILTER_COLLOQUIAL_OPTIONS = ['hour', 'day', 'week', 'month', 'quarter', 'year']
export const TIME_FILTER_ALL_OPTIONS = ['second', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year']
export const TIME_FILTER_ALL_OPTIONS_DATE_PART = [
  'second',
  'minute',
  'hour',
  'day',
  'day of week',
  'week',
  'month',
  'quarter',
  'year',
]

export const ALL_TIME_RESOLUTION_VALUES = ['year', 'quarter', 'month', 'week', 'day', 'hour']
export const TIME_COHORT_RESOLUTION_FILTER_FIELDNAME = 'cohort.occurrence_filter.resolution_filter'

export const DEFAULT_COLUMN = {
  id: null,
  filters: [],
  label: '',
  name: '',
  output: true,
  source_details: {},
  source_kind: null,
  type: COLUMN_TYPE_STRING,
}

export const INVALID_SPEND_COLUMN_OPTIONS = ['spend', 'clicks', 'impressions']

export const DEFAULT_SPEND_COLUMNS = [
  {
    id: '_spend_column_spend',
    filters: [],
    label: 'Spend',
    name: 'spend',
    output: true,
    type: COLUMN_TYPE_FLOAT,
  },
  {
    id: '_spend_column_clicks',
    filters: [],
    label: 'Clicks',
    name: 'clicks',
    output: true,
    type: COLUMN_TYPE_INTEGER,
  },
  {
    id: '_spend_column_impressions',
    filters: [],
    label: 'Impressions',
    name: 'impressions',
    output: true,
    type: COLUMN_TYPE_INTEGER,
  },
]

export const DEFAULT_COMPUTED_COLUMN = {
  ...DEFAULT_COLUMN,
  source_kind: COLUMN_SOURCE_KIND_COMPUTED,
  _auto_generated_by: null,
}

export const DEFAULT_ACTIVITY = {
  did: true,
  kind: DATASET_ACTIVITY_KIND_BEHAVIOR,
  occurence_after_time: false,
  occurrence: OCCURRENCE_ALL,
  occurrence_value: 1,
  relationships: [],
  config: {},
  slug: null,
  filters: [],
  _fieldIndex: 0,
  _isEdit: false,
  _columns: [],
}

export const DEFAULT_GROUP_BY_METRIC = {
  _pre_pivot_column_id: undefined,
  _pre_pivot_column_label: undefined,
  id: 'metrics_total_events',
  label: 'Count Records',
  agg_function: 'COUNT_ALL',
  output: true,
  column_id: null,
  filters: [],
  pivot: [],
  type: COLUMN_TYPE_NUMBER,
  _auto_generated_by: null,
}

export const DEFAULT_GROUP_BY = {
  name: '',
  slug: null,
  _column_ids: [],
  columns: [],
  computed_columns: [],
  metrics: [DEFAULT_GROUP_BY_METRIC],
  pivot: [],
  order: [],
  parent_filters: [],
}

//////////////////////// Narrator Grammar - Definition constants ////////////////////////

export const DEFINITION_ACTIVITY_TYPE_COHORT = 'cohort'
export const DEFINITION_ACTIVITY_TYPE_APPEND = 'append'

export const DOES_EXIST_COLUMN_TYPE = 'integer_as_boolean'

export const APPEND_ADVANCED_FILTER_OPTIONS = [
  { label: 'filtered by a specific column', value: 'column_filters' },
  { label: 'in a specific time window', value: 'time_filters' },
  { label: 'before/after another activity (advanced)', value: 'relative_activity_filters' },
  { label: 'columns have a specified relationship (advanced)', value: 'cohort_column_filters' },
]

export const FIRST_EVER_RELATIONSHIP = 'first_ever'
export const LAST_EVER_RELATIONSHIP = 'last_ever'
export const FIRST_BEFORE_RELATIONSHIP = 'first_before'
export const LAST_BEFORE_RELATIONSHIP = 'last_before'
export const FIRST_IN_BETWEEN_RELATIONSHIP = 'first_in_between'
export const FIRST_AFTER_RELATIONSHIP = 'first_after'
export const LAST_IN_BETWEEN_RELATIONSHIP = 'last_in_between'
export const AGG_ALL_IN_BETWEEN_RELATIONSHIP = 'agg_all_in_between'
export const AGG_ALL_EVER_RELATIONSHIP = 'agg_all_ever'
export const AGG_ALL_BEFORE_RELATIONSHIP = 'agg_all_before'
export const AGG_ALL_AFTER_RELATIONSHIP = 'agg_all_after'

export const ALL_BETWEEN_RELATIONSHIPS = [
  FIRST_IN_BETWEEN_RELATIONSHIP,
  LAST_IN_BETWEEN_RELATIONSHIP,
  AGG_ALL_IN_BETWEEN_RELATIONSHIP,
]

// When cohort occurrence is BETWEEN_NOT_ALLOWED_OCCURENCES (i.e. "first")
// update append reltaionships if they are "in between"
export const BETWEEN_RELATIONSHIP_OVERRIDES = {
  [FIRST_IN_BETWEEN_RELATIONSHIP]: FIRST_AFTER_RELATIONSHIP,
  [LAST_IN_BETWEEN_RELATIONSHIP]: LAST_EVER_RELATIONSHIP,
  [AGG_ALL_IN_BETWEEN_RELATIONSHIP]: AGG_ALL_AFTER_RELATIONSHIP,
}
export const ALL_EVER_RELATIONSHIPS = [FIRST_EVER_RELATIONSHIP, LAST_EVER_RELATIONSHIP, AGG_ALL_EVER_RELATIONSHIP]

export const AGGREGATE_ACTIVITY_RELATIONSHIPS = [
  AGG_ALL_IN_BETWEEN_RELATIONSHIP,
  AGG_ALL_EVER_RELATIONSHIP,
  AGG_ALL_BEFORE_RELATIONSHIP,
  AGG_ALL_AFTER_RELATIONSHIP,
]

export const BEFORE_ACTIVITY_RELATIONSHIPS = [
  FIRST_BEFORE_RELATIONSHIP,
  LAST_BEFORE_RELATIONSHIP,
  AGG_ALL_BEFORE_RELATIONSHIP,
]

export const DEFAULT_RELATIONSHIP_SLUG = FIRST_IN_BETWEEN_RELATIONSHIP
export const RELATIONSHIP_OPTIONS = [
  { label: 'First Ever', value: FIRST_EVER_RELATIONSHIP },
  { label: 'Last Ever', value: LAST_EVER_RELATIONSHIP },
  { label: 'First Before', value: FIRST_BEFORE_RELATIONSHIP },
  { label: 'Last Before', value: LAST_BEFORE_RELATIONSHIP },
  { label: 'First In Between', value: FIRST_IN_BETWEEN_RELATIONSHIP },
  { label: 'Last In Between', value: LAST_IN_BETWEEN_RELATIONSHIP },
  { label: 'Aggregate In Between', value: AGG_ALL_IN_BETWEEN_RELATIONSHIP },
  { label: 'Aggregate All Ever', value: AGG_ALL_EVER_RELATIONSHIP },
  { label: 'Aggregate Before', value: AGG_ALL_BEFORE_RELATIONSHIP },
  { label: 'Aggregate After', value: AGG_ALL_AFTER_RELATIONSHIP },
  { label: 'First After', value: FIRST_AFTER_RELATIONSHIP },
]

export const BETWEEN_NOT_ALLOWED_RELATIONSHIP_OPTIONS = [
  { label: 'First Ever', value: FIRST_EVER_RELATIONSHIP },
  { label: 'Last Ever', value: LAST_EVER_RELATIONSHIP },
  { label: 'First Before', value: FIRST_BEFORE_RELATIONSHIP },
  { label: 'Last Before', value: LAST_BEFORE_RELATIONSHIP },
  { label: 'Aggregate All Ever', value: AGG_ALL_EVER_RELATIONSHIP },
  { label: 'Aggregate Before', value: AGG_ALL_BEFORE_RELATIONSHIP },
  { label: 'Aggregate After', value: AGG_ALL_AFTER_RELATIONSHIP },
  { label: 'First After', value: FIRST_AFTER_RELATIONSHIP },
]

// NOTE: using `value` here vs `slug`, since AntD
// select uses label and not slug
export const RELATIVE_RELATIONSHIP_OPTIONS = [
  { label: 'before', value: 'before' },
  { label: 'after', value: 'after' },
]
export const RELATIVE_OCCURRENCE_OPTIONS = [
  { label: 'first', value: 'first' },
  { label: 'last', value: 'last' },
]

export const DEFAULT_APPEND_ACTIVITY = {
  activity_id: null,
  relationship_slug: DEFAULT_RELATIONSHIP_SLUG,
}

export const DEFAULT_COLUMN_FILTER = {
  activity_column_name: null,
  activity_column: null,
  column_type: null,
  enrichment_table: null,
  enrichment_table_column: null,
  filter: DEFAULT_FILTER,
}

export const DEFAULT_TIME_FILTER = {
  time_option: RELATIONSHIP_WITHIN_TIME,
  resolution: 'minute',
  value: 30,
}

export const RELATIVE_ACTIVITY_FILTER = {
  activity_id: null,
  relationship_slug: null,
  relative_relationship: 'before',
  relative_occurrence: 'first',
}

export const COHORT_COLUMN_FILTER = {
  column_name: null,
  cohort_column_name: null,
  cohort_columnn: null,
}

export const DATE_TIME_FIELD_RESOLUTIONS = ['date', 'date_time', 'week', 'month', 'quarter', 'year']

export const CUSTOMER_COLUMN_NAMES = ['customer', 'join_customer', 'source_id']

export const DATASET_STATUS_LABELS = {
  [IStatus_Enum.Live]: 'Shared',
  [IStatus_Enum.InProgress]: 'Private',
  [IStatus_Enum.InternalOnly]: 'Internal Only',
  [IStatus_Enum.Archived]: 'Archived',
}

export const DATASET_STATUS_LABEL_DESCRIPTIONS = {
  [IStatus_Enum.Live]: 'Anyone in your organization can see it',
  [IStatus_Enum.InProgress]: 'Only you can see it',
  [IStatus_Enum.Archived]: 'No one can see it',
  [IStatus_Enum.InternalOnly]: 'Only Narrator can see it',
}
