import { Column } from '@ag-grid-community/core'
import {
  ColumnOptionWithId,
  SpendJoin,
  TableOption,
} from 'components/Datasets/BuildDataset/tools/SpendConfig/interfaces'
import { AntVPlotConfigs, AntVPlotTypes } from 'components/shared/AntVPlots/interfaces'
import { IActivity, IDataset, IMetric } from 'graph/generated'
import { FormState as BlockFormState } from 'util/blocks/interfaces'
import { MavisError } from 'util/useCallMavis'
import { State, Typestate } from 'xstate'
//////////////////////// State Machine ////////////////////////

// The hierarchical (recursive) schema for the states
export interface DatasetStates extends Typestate<DatasetContext> {
  states: {
    main: {
      states: {
        idle: {}
        new: {}
        loading: {}
        ready: {}
        processing: {}
        updating: {}
        error: {}
      }
    }
    api: {
      // API STATES:
      states: {
        idle: {}
        // definition ui:
        loading_definition: {}
        loading_add_column_options: {}
        updating_definition: {}
        submitting_definition: {}
        submitting_activity_columns: {}
        // group:
        submitting_create_group: {}
        adding_group_columns: {}
        // right click column shortcuts:
        submitting_column_shortcut: {}
        submitting_row_shortcut: {}
        submitting_swap_group_column: {}
        // reconciler:
        submitting_plan: {}
        reconciling_response: {}
        submitting_delete_columns: {}
        submitting_edit_spend_columns: {}
        submitting_delete_spend_columns: {}
        // plotting:
        loading_plot_form: {}
        loading_plot_data: {}
        // freehand:
        validating_freehand_function: {}

        // TODO:
        // // save/update:
        // saving_dataset: {}
        error: {}
      }
    }
    edit: {
      states: {
        idle: {}
        reconciler: {}
        definition: {}
        create_group: {}
        create_dataset_narrative: {}
        add_columns_to_group: {}
        activity_stream: {}
        swap_group_column: {}
        column_pivot: {}
        group_plot: {}

        // Still maintained by UI (state machine source of truth):
        delete_group: {}
        rename_group: {}
        create_spend: {}
        metrics: {}
        order_by: {}
        filter_column: {}
        parent_filters: {}
        computation: {}
      }
    }
  }
}

// The events that the machine handles
export type DatasetEvent =
  // Support transient and eventless transitions:
  // https://xstate.js.org/docs/guides/transitions.html#transient-transitions
  // https://xstate.js.org/docs/guides/transitions.html#eventless-always-transitions
  | { type: '' }
  // State machine actions
  | { type: 'NEW'; tables: any[] }
  | { type: 'DUPLICATE'; slug: string; data: IDatasetQuery }
  | {
      type: 'LOAD'
      slug: string
      groupSlugFromSearch?: string
      isDuplicate?: boolean
      view?: viewTypeConstants
      upload_key?: string
      narrative_slug?: string
    }
  | { type: 'SET_DATASET_DIRTY'; dirty: boolean }
  | { type: 'SET_COLUMNS_ORDER'; groupSlug?: string; agGridColumns: Column[] }
  | { type: 'SET_COLUMNS_ORDER_OVERRIDE'; groupSlug?: string; colIds: string[] }
  | { type: 'RESTORE_COLUMNS_ORDER_DEFAULTS'; groupSlug?: string }
  | { type: 'SET_STALE_TABS'; staleTabs: string[] }
  | { type: 'SWITCH_MAIN_VIEW'; view: viewTypeConstants }
  | { type: 'DATASET_RUN' }
  | { type: 'DATASET_RUN_DONE'; groupSlug?: string; notification?: INotification }
  | { type: 'SAVE_CREATE_SUCCESS'; slug: string; notification?: INotification }
  | { type: 'SAVE_UPDATE_SUCCESS'; slug: string; notification?: INotification; silenceUpdateSuccess?: boolean }
  | {
      type: 'UPDATE_QUERY_DEFINITION'
      // match done.invoke.LOADING_DATASET response:
      data: {
        queryDefinition: IDatasetQueryDefinition
      }
    }
  | { type: 'SAVE_FAILURE'; error: MavisError }
  | { type: 'CANCEL' }
  // Reconciler actions
  | { type: 'PERSIST_PLAN_EXECUTION' }
  | { type: 'UNDO_PLAN_EXECUTION' }
  | { type: 'UPDATE_RECONCILER_PLAN'; plan: IPlan[] }
  // Create definition actions
  | { type: 'SELECT_COHORT_ACTIVITY'; activityIds: string; formValue: any }
  | { type: 'SELECT_TIME_COHORT_RESOLUTION'; timeResolution: string; formValue: any; isAllTimeResolution: boolean }
  | {
      type: 'SELECT_COHORT_OCCURRENCE'
      occurrence: string
      formValue: any
      changedFromNormalToTimeOccurrence?: boolean
      changedFromTimeToNormalOccurrence?: boolean
    }
  | {
      type: 'SELECT_APPEND_ACTIVITY'
      activityIds: string
      relationshipSlug: string
      fieldIndex: number | string
      formValue: any
    }
  | {
      type: 'MOVE_APPEND_ACTIVITY'
      to: number
      from: number
      activities: IAppendActivity[]
    }
  | {
      type: 'LOADING_PIVOT_COLUMN'
      columnId: string
    }
  | { type: 'SELECT_RELATIONSHIP'; activityIds: string; relationshipSlug: string; fieldIndex: number; formValue: any }
  | { type: 'SUBMIT_DEFINITION'; formValue: any }
  | { type: 'ADD_ACTIVITY_COLUMNS' }
  | { type: 'SUBMITTING_ACTIVITY_COLUMNS'; formValue: any }
  | { type: 'EDIT_DEFINITION' }
  | { type: 'CANCEL_EDIT_DEFINITION' }
  // Plotter actions
  | { type: 'EDIT_PLOT'; groupSlug: string; plotSlug: string }
  | { type: 'EDIT_PLOT_CANCEL' }
  | { type: 'NEW_PLOT'; groupSlug: string }
  | { type: 'REMOVE_PLOT'; groupSlug: string; plotSlug: string }
  | { type: 'REFRESH_PLOT'; groupSlug: string; plotSlug: string }
  | { type: 'SELECT_PLOT'; groupSlug: string; plotSlug: string }
  | { type: 'SUBMIT_PLOT_SUCCESS'; plotConfig: IPlotConfig; groupSlug: string; plotSlug?: string }
  // api actions
  | { type: 'CLEAR_ERROR' }
  | { type: 'error.execution'; data: MavisError }
  | { type: 'error.platform.LOADING_DATASET'; data: MavisError }
  | { type: 'error.platform.LOADING_DEFINITION'; data: MavisError }
  | { type: 'error.platform.UPDATING_DEFINITION'; data: MavisError }
  | { type: 'error.platform.SUBMITTING_DEFINITION'; data: MavisError }
  | { type: 'error.platform.SUBMITTING_ACTIVITY_COLUMNS'; data: MavisError }
  | { type: 'error.platform.SUBMITTING_RECONCILER'; data: MavisError }
  | { type: 'error.platform.SUBMITTING_COLUMN_SHORTCUT'; data: MavisError }
  | { type: 'error.platform.SUBMITTING_ROW_SHORTCUT'; data: MavisError }
  | { type: 'error.platform.SUBMITTING_EDIT_SPEND_COLUMNS'; data: MavisError }
  | { type: 'error.platform.SUBMITTING_DELETE_SPEND_COLUMNS'; data: MavisError }
  | { type: 'error.platform.SUBMITTING_SWAP_GROUP_COLUMN'; data: MavisError }
  | { type: 'error.platform.SUBMITTING_CREATE_GROUP'; data: MavisError }
  | { type: 'error.platform.FETCHING_GRAPH_DATASET'; data: MavisError }
  | { type: 'error.platform.LOADING_PLOT_FORM'; data: MavisError }
  | { type: 'error.platform.LOADING_PLOT_DATA'; data: MavisError }
  | { type: 'error.platform.LOADING_PIVOT_COLUMN'; data: MavisError }
  | { type: 'error.platform.VALIDATING_FREEHAND_FUNCTION'; data: MavisError }
  | { type: 'error.platform.SUBMITTING_DELETE_COLUMNS'; data: MavisError }
  | { type: 'error.platform.UPDATING_INTEGRATIONS'; data: MavisError }
  | { type: 'done.invoke.LOADING_DATASET'; data: any } //TODO: type data
  | { type: 'done.invoke.LOADING_DEFINITION'; data: any } //TODO: type data
  | { type: 'done.invoke.LOADING_ADD_COLUMN_OPTIONS'; data: any } //TODO: type data
  | { type: 'done.invoke.UPDATING_DEFINITION'; data: any } //TODO: type data
  | { type: 'done.invoke.SUBMITTING_DEFINITION'; data: any } //TODO: type data
  | { type: 'done.invoke.SUBMITTING_ACTIVITY_COLUMNS'; data: any } //TODO: type data
  | { type: 'done.invoke.SUBMITTING_RECONCILER'; data: { planExecution: IPlanExecution } }
  | { type: 'done.invoke.SUBMITTING_DELETE_COLUMNS'; data: { planExecution: IPlanExecution } }
  | { type: 'done.invoke.SUBMITTING_COLUMN_SHORTCUT'; data: { planExecution: IPlanExecution } }
  | { type: 'done.invoke.SUBMITTING_ROW_SHORTCUT'; data: { planExecution: IPlanExecution } }
  | {
      type: 'done.invoke.SUBMITTING_EDIT_SPEND_COLUMNS'
      data: {
        planExecution: IPlanExecution
      }
    }
  | {
      type: 'done.invoke.SUBMITTING_DELETE_SPEND_COLUMNS'
      data: {
        planExecution: IPlanExecution
      }
    }
  | { type: 'done.invoke.SUBMITTING_SWAP_GROUP_COLUMN'; data: { planExecution: IPlanExecution } }
  | { type: 'done.invoke.SUBMITTING_CREATE_GROUP'; data: any } //TODO: type data
  | { type: 'done.invoke.FETCHING_GRAPH_DATASET'; data: any } //TODO: type data
  | { type: 'done.invoke.LOADING_PLOT_FORM'; data: any } //TODO: type data
  | { type: 'done.invoke.LOADING_PLOT_DATA'; data: any } //TODO: type data
  | { type: 'DUPLICATE_PLOT'; groupSlug: string; plotSlug: string }
  | { type: 'done.invoke.VALIDATING_FREEHAND_FUNCTION'; data: any } //TODO: type data
  | { type: 'done.invoke.LOADING_PIVOT_COLUMN'; data: any } //TODO: type data
  | { type: 'done.invoke.UPDATING_INTEGRATIONS'; data: { slug: string; notification?: INotification } }
  // Edit actions
  | { type: 'SET_ACTIVITY_STREAM'; activityStream: string }
  | { type: 'EDIT_DATASET_STORY' }
  | { type: 'EDIT_DATASET_STORY_CANCEL'; story: IStory }
  | { type: 'UPDATE_DATASET_STORY'; story: IStory }
  | { type: 'EDIT_INTEGRATIONS' }
  | { type: 'EDIT_INTEGRATIONS_CANCEL' }
  | {
      type: 'EDIT_INTEGRATIONS_SUBMIT'
      formValue: any
      dataset: IDataset
    }
  | { type: 'SET_ACTIVITY_STREAM_ONLY'; activityStream: string }
  | { type: 'EXPLORER_RESET_DATASET_DEFINITION'; cohort?: any; appendActivities?: any }
  | {
      type: 'CHAT_RESET_DATASET_DEFINITION'
      cohort?: any
      appendActivities?: any
      column_options?: IActivityColumnOptions[]
    }
  | { type: 'EDIT_COMPUTATION'; column?: DatasetColumnType }
  | { type: 'EDIT_DUPLICATE_PARENT_MARKDOWN'; groupSlug: string; markdown: string }
  | { type: 'CLOSE_FROM_NARRATIVE_BANNER' }
  | { type: 'CREATE_DATASET_NARRATIVE' }
  | { type: 'CREATE_DATASET_NARRATIVE_CANCEL' }
  | { type: 'SELECT_GROUP'; groupSlug: string }
  | { type: 'CREATE_GROUP' }
  | { type: 'ADD_COLUMNS_TO_GROUP' }
  | { type: 'DELETE_GROUP' }
  | { type: 'RENAME_GROUP' }
  | { type: 'EDIT_ORDER_BY' }
  | { type: 'EDIT_FILTER_COLUMN' }
  | { type: 'APPLY_COLUMN_SHORTCUT'; column: DatasetColumnType; key: string; option?: string }
  | { type: 'APPLY_ROW_SHORTCUT'; row: any; key: string; columnId: string; shortcutColumnId?: string }
  | { type: 'TOGGLE_COLUMN_VISIBILITY'; groupSlug: string; columnId: string }
  | { type: 'CREATE_GROUP_CANCEL' }
  | { type: 'CREATE_GROUP_SUBMIT'; column_ids: string[]; time_window?: ITimeWindowConfig }
  | { type: 'ADD_COLUMNS_TO_GROUP_CANCEL' }
  | { type: 'ADD_COLUMNS_TO_GROUP_SUBMIT'; groupSlug: string; columnIds: string[] }
  | { type: 'DELETE_GROUP_CANCEL' }
  | { type: 'DELETE_GROUP_SUBMIT'; groupSlug: string }
  | { type: 'RENAME_GROUP_CANCEL' }
  | { type: 'RENAME_GROUP_SUBMIT'; groupSlug: string; name: string }
  | { type: 'DUPLICATE_PARENT' }
  | { type: 'DUPLICATE_GROUP'; groupSlug: string }
  | { type: 'VALIDATE_FREEHAND_FUNCTION'; groupSlug: string; freehandString: string }
  | { type: 'EDIT_COMPUTATION_CANCEL' }
  | {
      type: 'EDIT_COMPUTATION_SUBMIT'
      column: IDatasetQueryColumn | IDatasetQueryGroupComputedColumn
      groupSlug: string
      isEdit: boolean
    }
  | { type: 'EDIT_ORDER_BY_CANCEL' }
  | { type: 'EDIT_ORDER_BY_SUBMIT'; orderBy: IDatasetQueryOrder[]; groupSlug: string }
  | { type: 'EDIT_FILTER_COLUMN_CANCEL' }
  | {
      type: 'EDIT_FILTER_COLUMN_SUBMIT'
      column_id: string
      filters: IDatasetQueryFilter[]
      groupSlug: string
    }
  | {
      type: 'ADD_TABLE_CELL_FILTER'
      column_id: string
      filter: IDatasetQueryFilter
      groupSlug: string | null
    }
  | { type: 'EDIT_METRIC_COLUMN'; column?: DatasetColumnType }
  | { type: 'EDIT_METRIC_COLUMN_CANCEL' }
  | { type: 'UPDATE_GROUP_TAB_ORDER'; fromSlug: string; toSlug: string }
  | { type: 'EDIT_SWAP_GROUP_COLUMN'; column: DatasetColumnType; groupSlug: string }
  | { type: 'EDIT_SWAP_GROUP_COLUMN_CANCEL' }
  | {
      type: 'EDIT_SWAP_GROUP_COLUMN_SUBMIT'
      groupSlug: string
      column: DatasetColumnType
      parentColumnId: string
    }
  | {
      type: 'EDIT_METRIC_COLUMN_SUBMIT'
      isEdit: boolean
      groupSlug: string
      metricColumn: IDatasetQueryGroupMetric
    }
  | { type: 'DELETE_COLUMN'; column: DatasetColumnType; groupSlug: string }
  | { type: 'EDIT_COLUMN_LABEL'; columnId: string; groupSlug: string; label: string }
  | { type: 'EDIT_ACTIVITY_NAME'; id: string; name: string }
  | {
      type: 'CREATE_TRUNCATE_COLUMN'
      timeOption: string
      columnLabel: string
      columnId: string
      // TODO: remove truncatedColumnId and handle business logic in action when we remove logic from UI components
      truncatedColumnId: string
    }
  | { type: 'EDIT_DATE_DIFF_COLUMN'; timeOption: string; column: IDatasetQueryColumn }
  | { type: 'DUPLICATE_COLUMN'; groupSlug: string; columnId: string }
  | { type: 'EDIT_SPEND' }
  | { type: 'EDIT_SPEND_CANCEL' }
  | { type: 'EDIT_QUICK_REORDER_COLUMNS' }
  | { type: 'EDIT_QUICK_REORDER_COLUMNS_CANCEL' }
  | { type: 'EDIT_QUICK_REORDER_COLUMNS_SUBMIT'; groupSlug?: string; colIds: string[] }
  | { type: 'EDIT_PARENT_FILTERS' }
  | { type: 'EDIT_PARENT_FILTERS_CANCEL' }
  | { type: 'EDIT_PARENT_FILTERS_SUBMIT'; groupSlug: string; filters: IDatasetQueryGroupParentFilters[] }
  | { type: 'EDIT_HIDE_DUPLICATE_PARENT_COLUMNS' }
  | {
      type: 'EDIT_HIDE_DUPLICATE_PARENT_COLUMNS_SUBMIT'
      groupSlug: string
      hiddenColumnIds: string[]
      isShowMode: boolean
    }
  | { type: 'EDIT_HIDE_DUPLICATE_PARENT_COLUMNS_CANCEL' }
  | { type: 'EDIT_COLUMN_PIVOT'; column: IDatasetQueryColumn }
  | { type: 'EDIT_REVERSE_COLUMN_PIVOT'; column: IDatasetQueryColumn }
  | { type: 'EDIT_COLUMN_PIVOT_CANCEL' }
  | {
      type: 'EDIT_COLUMN_PIVOT_SUBMIT'
      columnId: string
      groupSlug: string
      orderedPivotedMetrics: IDatasetQueryGroupMetric[]
      pivotValues: string[]
    }
  | { type: 'EDIT_COLUMN_PIVOT_REVERSE_SUBMIT'; groupSlug: string; columnId: string }
  | { type: 'TOGGLE_DELETE_COLUMNS_MODE'; tabName: string }
  | { type: 'TOGGLE_SELECT_COLUMN_FOR_DELETE'; tabName: string; columnId: string }
  | { type: 'DELETE_EDIT_MODE_COLUMNS'; groupSlug: string }
  | {
      type: 'SUBMITTING_EDIT_SPEND_COLUMNS'
      groupSlug: string
      joins: SpendJoin[]
      metrics?: ColumnOptionWithId[]
      table?: TableOption
    }
  | { type: 'SUBMITTING_DELETE_SPEND_COLUMNS'; groupSlug: string }

export interface ITimeWindowConfig {
  date_part: string
  from_column_id: string
  to_column_id: string
}

export interface IPlan {
  group_slug?: string
  mavis_created: boolean
  mutation:
    | 'add_activity'
    | 'delete_activity'
    | 'add'
    | 'delete'
    | 'swap_id'
    | 'add_group'
    | 'add_order'
    | 'reset_spend'
    | 'add_spend_join'
    | 'add_spend_column'
  column?: DatasetColumnType
  new_column?: DatasetColumnType
  activity?: IDatasetQueryActivity
  group_name?: string
  limited_types?: []
  allowed_columns?: DatasetColumnType[]
  // For group specific columns so we know what type of group column it is:
  column_kind?: string
}

export interface IResponseMetric {
  id: string // column id
  kind: string // ex: "approx"
  label: string
  metrics: any[]
  metrics_type: string
  type: string // ex: "string"
}

export interface IRequestApiData {
  canceled: boolean
  response: null | any
  error: null | any
  loaded: boolean
  loading: boolean
  requestStartedAt: null | number
  requestCompletedAt: null | number
  queryDefinition: null | IDatasetQueryDefinition
}

export interface ITabApiData {
  total_rows?: number
  metrics?: IResponseMetric[]
  column_mapping?: IDatasetColumnMapping[]
  table_rows?: any[]
  is_approx?: boolean

  // ACTION_TYPE_QUERY
  _query_api_state?: IRequestApiData
  // ACTION_TYPE_COUNT
  _count_api_state?: IRequestApiData
  // ACTION_TYPE_METRICS
  _metrics_api_state?: IRequestApiData
}

export interface IDatasetReducerState {
  [tabKey: string]: ITabApiData
}

export interface INotification {
  message: string
  description?: string | null
  type: 'success' | 'info' | 'warning' | 'error'
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' // TODO - grab from antd
  duration?: number
}

export interface IUiInstructions {
  group_slug: string | null
  kind: 'go_to_group' | 'go_to_plot' | 'push_notification'
  plot_slug: string | null
  notification?: INotification
}

export interface IPlanExecution {
  plan: IPlan[]
  show_user: boolean
  staged_dataset: IDatasetQueryDefinition
  staged_compiled_sql: any[]
  // TODO: eventually let's only support an array of instructions
  ui_instructions?: IUiInstructions | IUiInstructions[]
}

export interface IActivityColumnOptions {
  activity_ids: string[]
  relationship_slug: string | null
  filter_options: IDatasetDefinitionColumn[]
  select_options: IDatasetDefinitionSelectColumn[]
}

export interface IColumnShortcut {
  column_types: string[]
  in_group: boolean
  in_parent: boolean
  key: string
  label: string
  options: {
    key: string
    label: string
  }[]
}

export interface IRowShortcut {
  add_column_value: boolean
  in_group: boolean
  in_parent: boolean
  key: string
  label: string
  select_columns: string
}

export interface IDefinitionColumnFilter {
  activity_column_name: string | null
  activity_column?: IDatasetDefinitionColumn | null
  column_type: string | null
  enrichment_table: string | null
  enrichment_table_column: string | null
  filter: IDatasetQueryFilter
}

export interface IDefinitionTimeFilter {
  resolution: string // FIXME enum
  time_option: string // FIXME enum
  value: number | null
}

export interface IDefinitionRelativeActivityFilter {
  activity_id: string | null
  relationship_slug: string | null
}

export interface IDefinitionCohortColumnFilter {
  cohort_column_name: string | null
  column_name: string | null
  cohort_column?: IDatasetDefinitionColumn | null
}

export interface IDefinitionFormValue {
  cohort: {
    activity_ids: string[]
    occurrence_filter?: {
      occurrence?: string
    }
    column_filters?: IDefinitionColumnFilter[]
  }
  append_activities?: IAppendActivity[]
}

export interface IAppendActivity {
  activity_ids: string[]
  column_filters?: IDefinitionColumnFilter[]
  relative_activity_filters?: IDefinitionRelativeActivityFilter[]
  cohort_column_filters?: IDefinitionCohortColumnFilter[]
  time_filters?: IDefinitionTimeFilter[]
  _unique_key?: string
}

export interface IDefinitionContext {
  column_options: IActivityColumnOptions[]
  form_value: IDefinitionFormValue
}

export interface IDatasetPlotData {
  config: {
    dataset_slug: string
    group_name: string
    group_slug: string
    snapshot_time: string
    question: string
  }
  data: any[] // TODO fill out
  layout: any // TODO fill out
  kpi_locked?: boolean
  chart_type?: AntVPlotTypes
  plot_config?: AntVPlotConfigs
}

export interface IPlotterContext {
  is_edit?: boolean
  form_state?: BlockFormState
  plot_data?: IDatasetPlotData
}

export interface IValidateFreehandResponse {
  column_sql: string
  output_type: string
  raw_string: string
  group_func?: string[]
}

export enum viewTypeConstants {
  TABLE = 'table',
  SQL = 'sql',
  PLOT = 'plot',
  STORY = 'story',
}

export type OccurrenceOptions = 'first' | 'last' | 'all' | 'custom'

// The context (extended state) of the machine
export interface DatasetContext extends IDatasetQuery {
  fields: Object
  kpi?: IMetric
  _view: viewTypeConstants
  _group_slug: string | null
  _is_parent_duplicate: boolean
  _plot_slug?: string

  _has_customer_column: boolean
  _is_running: boolean
  _is_dirty: boolean // Either dirty since load, or dirty since the last save/update
  _from_narrative: {
    // if the user came from a nar/dash (i.e. plot link)
    slug?: string
    upload_key?: string
    open?: boolean
  } | null
  columns_order?: {
    // key is "parent" or group slug
    [key: string]: {
      order?: string[]
      left_pinned?: string[]
      right_pinned?: string[]
    }
  }
  _stale_tabs: string[] // Dirty since last run
  _delete_columns_tabs: {
    tabName: string
    deleteColumnsIds: string[]
  }[]

  _error: MavisError | null
  _notification?: INotification | INotification[]

  _slug: string | null | undefined
  _prev_query?: IDatasetQuery
  _edit_context?: {
    // So overlays can access the event that caused them to open:
    event?: DatasetEvent
    // For freehand validation:
    validate_response?: IValidateFreehandResponse
  }
  _column_shortcuts: IColumnShortcut[]
  _row_shortcuts: IRowShortcut[]
  _definition_context: IDefinitionContext
  _plotter_context: IPlotterContext
  _plan_execution?: IPlanExecution
  _dataset_from_graph?: IDataset
  _pending_run?: boolean
}

export type DatasetMachineState = State<DatasetContext, DatasetEvent>

// Passed into Provider.DatasetFormContext
export interface IDatasetFormContext {
  activityStream: string | null
  activitiesLoading: boolean
  dataset: any //TODO
  datasetSlug?: string
  datasetApiStates: IDatasetReducerState
  groupIndex?: number | null
  groupSlug?: string | null
  handleToggleSensitiveInfo: () => void
  handleToggleShowJson: () => void
  handleOpenIntegrationOverlay: () => void
  hasMultipleStreams: boolean
  obscureSensitiveInfo: boolean
  onOpenToolOverlay: (arg0: { toolType: string; toolOverlayProps?: any }) => void
  onRunDataset: (runOptions?: object) => void
  selectedApiData: ITabApiData
  // parentApiData will only be set when the parent is run
  // useful for autocomplete group parent filters
  parentApiData?: ITabApiData
  streamActivities: IActivity[]
  toolOverlay: string | null
  hasSubmittedDefinition: boolean

  // State Machine:
  machineCurrent: DatasetMachineState
  machineSend: Function

  // DEPRECATED:
  onSetRollbackChange?: (arg0: { fieldName: string; value: any; deleted?: boolean }) => void
  handleSubmitForm?: (formValue: any, runOptions?: object) => void
}

//////////////////////// Query Definition ////////////////////////

export interface IDatasetQueryActivityRelationship {
  slug: string
  relationship_time?: string
  relationship_time_value?: string | number
}

interface IDatasetQueryActivityConfig {
  activity_stream: string
  customer_table: string
}

type FilterKinds = 'value' | 'column_id'

export interface IDatasetQueryFilter {
  operator: string // FIXME enum
  value: string
  kind: FilterKinds
  or_null: boolean
}

type ActivityKinds = 'limiting' | 'conversion' | 'append'

// Individual activity definition inside a dataset's query_definition activities
export interface IDatasetQueryActivity {
  id: string
  name: string
  config: IDatasetQueryActivityConfig
  did: boolean
  kind: ActivityKinds
  occurrence: string
  occurrence_value: number
  relationship_slug?: string
  filters: IDatasetQueryFilter[]
  activity_ids: string[]
  // deprecated:
  slug: string | string[]
  relationships: IDatasetQueryActivityRelationship[]
  kpi_locked?: boolean
  name_override?: string
}

interface IDatasetQueryBaseColumn {
  id: string
  label: string
  name: string
  output: boolean
  filters: IDatasetQueryFilter[]
  type: string // TODO enum
  kpi_locked?: boolean
}

export interface IDatasetDefinitionColumn {
  enrichment_table: string | null
  enrichment_table_column: string | null
  label: string
  name: string
  type: string
  dropdown_label: string | null
  opt_group?: string | null
  values?: {
    key: string
    value: string
  }[]
}

export interface IDatasetDefinitionSelectColumn extends IDatasetDefinitionColumn {
  dropdown_label: string
  values: any[]
  opt_group?: string
}

export interface IComputedColumnCase {
  value: string
  value_kind: string
  filters: {
    column_id: string
    filter: {
      kind: string
      operator: string
      or_null: boolean
      value: string | number | boolean
    }
  }[]
}

export interface IDatasetQueryColumn extends IDatasetQueryBaseColumn {
  source_details: {
    activity_id?: string
    activity_kind?: string // TODO enum
    applied_function?: string | null
    enrichment_table?: string | null
    // resolution and segmentation are in truncated columns (and don't have activity_id, activity_kind, nor enrichemnt_table)
    resolution?: string
    segmentation?: string
    // raw string is on date diff columns
    raw_string?: string
    // kind is on computed_columns:
    kind?: string // TODO enum
    // value and value_kind are in IFTTT:
    value?: string
    value_kind?: string // TODO enum
    cases?: IComputedColumnCase[]
  }
  source_kind: string // TODO enum
  // Truncated compute columns don't have mavis_type
  mavis_type?: string // TODO enum
  group_func?: string[]
}

export interface IDatasetQueryGroupColumn extends IDatasetQueryBaseColumn {
  column_id: string
  pivoted: boolean
}

export interface IDatasetQueryGroupComputedColumn extends IDatasetQueryBaseColumn {
  source_details: {
    kind: string // TODO enum
    raw_string?: string
    // column_id, operation, second_column_id are used in spend created compute columns
    column_id?: string
    operation?: string
    second_column_id?: string
    // value and value_kind are in IFTTT:
    value?: string
    value_kind?: string // TODO enum
    cases?: IComputedColumnCase[]
  }
  source_kind: string // TODO enum
  _auto_generated_by: string | null
  group_func?: string[]
}

export type IDatasetQueryGroupSpendColumn = IDatasetQueryBaseColumn

interface GroupMetricsPivot {
  column_id: string
  value: string
}
export interface IDatasetQueryGroupMetric {
  _pre_pivot_column_id?: string
  _pre_pivot_column_label?: string
  id: string
  label: string
  agg_function: string // TODO enum
  output: boolean
  column_id: string | null
  filters: IDatasetQueryFilter[]
  pivot: GroupMetricsPivot[]
  type: string // TODO enum
  _auto_generated_by?: string | null
}

type OrderDirections = 'asc' | 'desc'

export type DatasetColumnType =
  | IDatasetQueryColumn
  | IDatasetQueryGroupComputedColumn
  | IDatasetQueryGroupColumn
  | IDatasetQueryGroupMetric
  | IDatasetQueryGroupSpendColumn

export interface IDatasetQueryOrder {
  column_id: string
  order_direction: OrderDirections
}

interface IDatasetQueryGroupSpendJoin {
  column_id?: string
  spend_column?: string
}

export interface IDatasetQueryGroupSpend {
  joins?: IDatasetQueryGroupSpendJoin[]
  columns?: IDatasetQueryGroupSpendColumn[]
}

interface IDatasetQueryGroupParentFiltersFilter {
  operator: string
  value: string
  kind: string
  or_null: boolean
}
export interface IDatasetQueryGroupParentFilters {
  filter: IDatasetQueryGroupParentFiltersFilter
  column_id: string
}

export interface IPlotConfig {
  annotations: any[] // TODO, fill this out
  axes: any // TODO, fill this out
  columns: any // TODO, fill this out
  dataset: any // TODO, fill this out
  traces: any[] // TODO, fill this out
}

export interface IGroupPlotConfig {
  name: string
  slug: string
  // new plots don't have configs yet, hence why it's optional:
  config?: IPlotConfig
}

// Individual group query inside a dataset's query_definition all_groups
export interface IDatasetQueryGroup {
  slug: string
  name: string
  columns: IDatasetQueryGroupColumn[]
  computed_columns: IDatasetQueryGroupComputedColumn[]
  metrics: IDatasetQueryGroupMetric[]
  spend?: IDatasetQueryGroupSpend | null
  pivot: any[] // FIXME
  order: IDatasetQueryOrder[]
  parent_filters: IDatasetQueryGroupParentFilters[]
  plots?: IGroupPlotConfig[]
  is_parent?: boolean
  _column_ids: string[]
  duplicated_from_group?: string
  duplicate_parent_markdown?: string
  hidden_column_ids?: string[]
  is_show_mode?: boolean
  kpi_locked?: boolean
}

type IStoryContentMarkdown = {
  type: 'markdown'
  markdown: string
}

export type IStoryContentPlot = {
  type: 'plot'
  plot: {
    slug: string
    group_slug: string
  }
}

// content can be either a plot or markdown
export type IStoryContent = IStoryContentMarkdown | IStoryContentPlot

export interface IStory {
  title?: string
  content?: IStoryContent[]
}

export interface IDatasetQuery {
  activity_stream: string | null
  activities: IDatasetQueryActivity[]
  columns: IDatasetQueryColumn[]
  all_groups: IDatasetQueryGroup[]
  order: IDatasetQueryOrder[]
  swapped_ids?: any[]
  kpi?: IMetric
  name?: string
  story?: IStory
}

export interface IDatasetQueryDefinition {
  fields?: any
  override_sql?: string
  query: IDatasetQuery
}

//////////////////////// Dataset Results ////////////////////////

export interface IDatasetColumnMapping {
  id: string
  label: string
  format: string
  pinned?: 'left' | 'right' | null
}

// Interface for an individual column
export interface IDatasetResponseColumn {
  friendly_name: string
  name: string
  type: string
}

// Interface for metrics from response (selectedApiData.metrics.response.columns)
export interface IDatasetResponseMetricsColumn {
  id: string
  label: string
  type: string
  kind: string
  metrics_type: string
  metrics: IDatasetResponseMetricsColumnsMetrics[]
}

interface IDatasetResponseMetricsColumnsMetrics {
  name: string
  value: number
}

// Interface for what comes back from the dataset response in the "data" key
export interface IDatasetResultsData {
  columns: IDatasetResponseColumn[]
  retrieved_at: string
  job_id: string
  rows: IDatasetResultRow[]
}

export interface IDatasetResultRow {
  [key: string]: string
}

// What comes back from a dataset response (results)!
export interface IDatasetResults {
  query: string
  column_mapping: IDatasetColumnMapping[]
  data: IDatasetResultsData
}

//////////////////////// Form Values ////////////////////////

export interface IColumn {
  label: string
  id: string
  type: string
}

export interface IFormValue {
  _staged_computed_column: IColumn
}
