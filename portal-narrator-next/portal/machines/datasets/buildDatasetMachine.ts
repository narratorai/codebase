import { find, get, isArray, isEmpty } from 'lodash'
import { OCCURRENCE_TIME } from 'util/datasets'
import { DatasetContext, DatasetEvent, DatasetStates, IDatasetQuery, viewTypeConstants } from 'util/datasets/interfaces'
import { createMachine } from 'xstate'

import actions from './actions'
import { getGroupIndex } from './helpers'

const {
  addColumnPivot,
  addEventToEditContext,
  handleLoadingDefinitionResponse,
  deleteGroup,
  renameGroup,
  duplicateColumn,
  duplicateGroup,
  duplicateParent,
  editColumnLabel,
  editActivityName,
  editParentFilters,
  handleUpdatingDefinitionResponse,
  reverseColumnPivot,
  selectLastGroup,
  maintainDuplicateGroupColumnOrder,
  maintainDuplicateParentColumnOrder,
  selectLastDuplicateParent,
  setDefaultConfig,
  setError,
  setNotification,
  clearError,
  clearEditContext,
  persistPlanExecution,
  handlePostSaveResponse,
  handleLoadingDatasetResponse,
  setRunning,
  setPendingRun,
  setSelectedGroup,
  handleSubmittingCreateGroupResponse,
  handleLoadingPlotFormResponse,
  handleLoadingPlotDataResponse,
  handleLoadingPivotColumnResponse,
  updateColumnFilter,
  addTableCellFilter,
  updateColumnVisible,
  updateComputation,
  updateMetricColumn,
  updateOrderBy,
  moveAppendActivity,
  setActivityStream,
  setPlanExecution,
  setHasCustomerColumn,
  executeUiInstructions,
  setNotDirty,
  setIsDirty,
  setColumnsOrder,
  setColumnsOrderOverride,
  restoreColumnOrderDefaults,
  setStaleTabs,
  unsetStaleTab,
  switchMainView,
  switchToTableView,
  switchToStoryView,
  updateDatasetStory,
  resetDatasetStory,
  clearPlotterContext,
  clearPlotterContextFormState,
  resetPlotSlug,
  removePlot,
  updateGroupPlot,
  updateGroupTabOrder,
  selectPlot,
  selectFirstPlot,
  handleValidatingFreehandFunctionResponse,
  trackEvent,
  scrollActivityIntoView,
  scrollToTopOfInfoPanel,
  toggleEditMode,
  toggleEditModeColumDelete,
  editDuplicateParentMarkdown,
  closeFromNarrativeBanner,
  clearEditModeForGroup,
  clearDatasetDefintionMinusOccurrence,
  setDefaultView,
  editHideDuplicateParentColumns,
  explorerResetDatasetDefinition,
  chatResetDatasetDefinition,
} = actions

const defaultQuery: IDatasetQuery = {
  activity_stream: null,
  activities: [],
  columns: [],
  all_groups: [],
  order: [],
  swapped_ids: [],
  story: {
    content: [],
  },
}

const buildDatasetMachine = createMachine<DatasetContext, DatasetEvent, DatasetStates>(
  {
    id: 'root',
    strict: true,
    type: 'parallel',
    context: {
      _has_customer_column: false,
      _pending_run: false,
      _is_running: false,
      _is_dirty: false,
      _from_narrative: null,
      columns_order: {},
      _stale_tabs: [],
      _delete_columns_tabs: [],
      _view: viewTypeConstants.TABLE,
      _slug: null,
      _group_slug: null,
      _is_parent_duplicate: false,
      _plot_slug: undefined,
      // FIXME: is _prev_query is actually used???
      _prev_query: defaultQuery,
      _error: null,
      _notification: undefined,
      _column_shortcuts: [],
      _row_shortcuts: [],
      // Context for all edit overlays/modals/popovers:
      _edit_context: undefined,
      _dataset_from_graph: undefined,
      // Context for "Plotting UI"
      _plotter_context: {},
      // Context for "Definition UI"
      _definition_context: {
        column_options: [],
        form_value: {
          cohort: {
            activity_ids: [],
            occurrence_filter: {},
          },
        },
      },
      // Context for "staged" query definition changes and reconciler PlanExecution
      // as a consequence of the "Definition UI" and other form changes
      _plan_execution: undefined,
      //
      fields: {},
      ...defaultQuery,
    },
    states: {
      main: {
        initial: 'idle',
        states: {
          idle: {
            on: {
              // Handle multiple activity streams
              // - if multiple activity streams, force the user to choose
              // - if only 1 activity stream, go right to the definition ui
              NEW: [
                {
                  target: ['new', '#root.edit.definition'],
                  actions: ['setDefaultConfig'],
                },
              ],
              LOAD: {
                target: 'loading',
              },
            },
          },
          // NEW should invoke loading the dataset too! (but it's not "loading per se")
          new: {
            invoke: {
              id: 'LOADING_DATASET',
              src: 'doLoadingDataset',
              onDone: {
                // NOTE - stay in "new" state, "edit.definition" ui
                // is responsible for moving this to "ready"
                actions: ['handleLoadingDatasetResponse'],
              },
              onError: {
                target: ['error'],
                actions: ['setError'],
              },
            },
          },
          loading: {
            invoke: {
              id: 'LOADING_DATASET',
              src: 'doLoadingDataset',
              onDone: {
                target: ['ready', '#root.api.loading_definition'],
                actions: ['handleLoadingDatasetResponse'],
              },
              onError: {
                target: ['error'],
                actions: ['setError'],
              },
            },
          },
          processing: {},
          error: {},
          ready: {
            on: {
              // Update column orders in table
              SET_COLUMNS_ORDER: {
                actions: ['setColumnsOrder'],
              },
              // update columns order when column_mapping changes
              SET_COLUMNS_ORDER_OVERRIDE: {
                actions: ['setColumnsOrderOverride'],
              },
              RESTORE_COLUMNS_ORDER_DEFAULTS: {
                actions: ['restoreColumnOrderDefaults'],
              },
              // Form States (dirty/stale):
              SET_DATASET_DIRTY: {
                actions: ['setIsDirty'],
              },
              SET_STALE_TABS: {
                actions: ['setStaleTabs'],
              },
              // View changes:
              SWITCH_MAIN_VIEW: [
                // If switching to plot view with no saved plots
                // - clear out plotter context
                // - open plot overlay
                // - load default plot form
                {
                  target: ['ready', '#root.edit.group_plot', '#root.api.loading_plot_form'],
                  cond: 'switchingToPlottingWithNoPlots',
                  actions: ['clearPlotterContext', 'resetPlotSlug', 'switchMainView', 'trackEvent'],
                },
                // If switching to plot view with saved plots, load the first plot:
                {
                  target: ['ready', '#root.api.loading_plot_data'],
                  cond: 'switchingToPlotting',
                  actions: ['switchMainView', 'selectFirstPlot', 'trackEvent'],
                },
                {
                  target: ['ready', '#root.edit.idle'],
                  actions: ['switchMainView', 'trackEvent'],
                },
              ],
              SELECT_GROUP: [
                // If switching group tabs while plotting, load the first plot:
                {
                  target: ['ready', '#root.api.loading_plot_data'],
                  cond: 'switchingGroupWhilePlotting',
                  actions: ['setSelectedGroup', 'selectFirstPlot'],
                },
                {
                  target: 'ready',
                  actions: ['setSelectedGroup'],
                },
              ],

              // Running/Saving/Updating:
              DATASET_RUN: {
                target: ['ready'],
                cond: 'hasCohort',
                actions: ['setPendingRun', 'setRunning'],
              },
              DATASET_RUN_DONE: {
                target: ['ready'],
                actions: ['setRunning', 'unsetStaleTab', 'setNotification'],
              },
              SAVE_CREATE_SUCCESS: {
                target: ['updating'],
                actions: ['setNotDirty', 'setNotification'],
              },
              UPDATE_QUERY_DEFINITION: {
                actions: ['handleLoadingDatasetResponse'],
              },
              SAVE_UPDATE_SUCCESS: {
                target: ['updating'],
                actions: ['setNotDirty', 'setNotification'],
              },
              SAVE_FAILURE: {
                actions: ['setNotification'],
              },

              // Plotting:
              SELECT_PLOT: {
                target: ['#root.api.loading_plot_data'],
                cond: 'isPlotting',
                actions: ['selectPlot'],
              },
              EDIT_PLOT: {
                target: ['#root.edit.group_plot', '#root.api.loading_plot_form'],
                cond: 'isPlotting',
                // clear out plotter context form_state to make sure overlay doesn't
                // show an out of date plot beneath the loading state:
                actions: ['clearPlotterContextFormState', 'trackEvent'],
              },
              NEW_PLOT: {
                target: ['#root.edit.group_plot', '#root.api.loading_plot_form'],
                cond: 'isPlotting',
                // clear out plotter context form_state to make sure overlay doesn't
                // show an out of date plot beneath the loading state:
                actions: ['clearPlotterContextFormState', 'trackEvent'],
              },
              DUPLICATE_PLOT: {
                target: ['#root.edit.group_plot', '#root.api.loading_plot_form'],
                cond: 'isPlottingWithSelectedPlot',
                // clear out plotter context form_state to make sure overlay doesn't
                // show an out of date plot beneath the loading state:
                actions: ['clearPlotterContextFormState', 'trackEvent'],
              },
              REFRESH_PLOT: {
                target: ['ready', '#root.api.loading_plot_data'],
                cond: 'isPlottingWithSelectedPlot',
              },
              REMOVE_PLOT: {
                // when removing a plot, try to load the first plot (if there are any)
                target: ['#root.api.loading_plot_data'],
                cond: 'isPlottingWithSelectedPlot',
                actions: ['removePlot', 'clearPlotterContext', 'resetPlotSlug'],
              },

              // Editing:
              EDIT_DEFINITION: {
                target: ['#root.edit.definition', '#root.api.loading_definition'],
              },
              EDIT_INTEGRATIONS: {
                target: ['#root.edit.integrations', '#root.api.idle'],
                cond: 'hasCohort',
              },
              EDIT_DATASET_STORY: {
                target: ['#root.edit.dataset_story', '#root.api.idle'],
                actions: ['switchToStoryView'],
                cond: 'hasCohort',
              },
              EDIT_COMPUTATION: {
                target: ['#root.edit.computation', '#root.api.idle'],
                cond: 'hasCohort',
                actions: ['addEventToEditContext'],
              },
              APPLY_COLUMN_SHORTCUT: {
                target: ['processing', '#root.api.submitting_column_shortcut'],
              },
              APPLY_ROW_SHORTCUT: {
                target: ['processing', '#root.api.submitting_row_shortcut'],
              },
              ADD_ACTIVITY_COLUMNS: {
                cond: 'cohortActivityDefined',
                target: ['#root.api.loading_add_column_options'],
              },
              SUBMITTING_ACTIVITY_COLUMNS: {
                cond: 'cohortActivityDefined',
                target: ['#root.api.submitting_activity_columns'],
                actions: ['clearError'],
              },
              DELETE_COLUMN: {
                target: ['processing', '#root.api.submitting_column_shortcut'],
              },
              CREATE_GROUP: {
                target: ['#root.edit.create_group', '#root.api.idle'],
                cond: 'hasCohort',
              },
              ADD_COLUMNS_TO_GROUP: {
                target: ['#root.edit.add_columns_to_group', '#root.api.idle'],
                cond: 'isGroup',
              },
              DELETE_GROUP: {
                target: ['#root.edit.delete_group', '#root.api.idle'],
                cond: 'isGroup',
              },
              DUPLICATE_PARENT: {
                target: 'ready',
                actions: [
                  'duplicateParent',
                  'selectLastDuplicateParent',
                  'maintainDuplicateParentColumnOrder',
                  'switchToTableView',
                  'trackEvent',
                ],
              },
              DUPLICATE_GROUP: {
                target: 'ready',
                cond: 'isGroup',
                actions: [
                  'duplicateGroup',
                  'selectLastGroup',
                  'maintainDuplicateGroupColumnOrder',
                  'switchToTableView',
                  'trackEvent',
                ],
              },
              RENAME_GROUP: {
                target: ['#root.edit.rename_group', '#root.api.idle'],
                cond: 'isGroup',
              },
              EDIT_ORDER_BY: {
                target: ['#root.edit.order_by', '#root.api.idle'],
              },
              EDIT_FILTER_COLUMN: {
                target: ['#root.edit.filter_column', '#root.api.idle'],
                actions: ['addEventToEditContext'],
              },
              ADD_TABLE_CELL_FILTER: {
                target: ['ready'],
                actions: ['addTableCellFilter'],
              },
              EDIT_METRIC_COLUMN: {
                target: ['#root.edit.metrics', '#root.api.idle'],
                actions: ['addEventToEditContext'],
              },
              EDIT_SWAP_GROUP_COLUMN: {
                target: ['#root.edit.swap_group_column', '#root.api.idle'],
                actions: ['addEventToEditContext'],
              },
              UPDATE_GROUP_TAB_ORDER: {
                actions: ['updateGroupTabOrder'],
              },
              TOGGLE_COLUMN_VISIBILITY: {
                actions: ['updateColumnVisible'],
              },
              EDIT_COLUMN_LABEL: {
                actions: ['editColumnLabel'],
              },
              EDIT_ACTIVITY_NAME: {
                actions: ['editActivityName'],
              },
              DUPLICATE_COLUMN: {
                target: 'ready',
                actions: ['duplicateColumn'],
              },
              EDIT_SPEND: {
                target: ['#root.edit.create_spend', '#root.api.idle'],
                cond: 'hasGroups',
              },
              EDIT_QUICK_REORDER_COLUMNS: {
                target: ['#root.edit.quick_reorder_columns', '#root.api.idle'],
              },
              SUBMITTING_EDIT_SPEND_COLUMNS: {
                target: ['processing', '#root.api.submitting_edit_spend_columns'],
              },
              SUBMITTING_DELETE_SPEND_COLUMNS: {
                target: ['processing', '#root.api.submitting_delete_spend_columns'],
              },
              EDIT_PARENT_FILTERS: {
                target: ['#root.edit.parent_filters', '#root.api.idle'],
              },
              EDIT_HIDE_DUPLICATE_PARENT_COLUMNS: {
                target: ['#root.edit.hide_duplicate_parent_columns', '#root.api.idle'],
              },
              EDIT_COLUMN_PIVOT: {
                target: ['processing', '#root.api.loading_pivot_column'],
                cond: 'isGroup',
                actions: ['addEventToEditContext'],
              },
              EDIT_REVERSE_COLUMN_PIVOT: {
                target: ['#root.edit.column_pivot', '#root.api.idle'],
                cond: 'isGroup',
                actions: ['addEventToEditContext'],
              },
              TOGGLE_DELETE_COLUMNS_MODE: {
                target: 'ready',
                actions: ['toggleEditMode'],
              },
              TOGGLE_SELECT_COLUMN_FOR_DELETE: {
                target: 'ready',
                actions: ['toggleEditModeColumDelete'],
              },
              DELETE_EDIT_MODE_COLUMNS: {
                target: ['processing', '#root.api.submitting_delete_columns'],
              },
              CREATE_DATASET_NARRATIVE: {
                target: ['#root.edit.create_dataset_narrative', '#root.api.idle'],
                actions: ['trackEvent'],
              },
              EDIT_DUPLICATE_PARENT_MARKDOWN: {
                target: 'ready',
                cond: 'isDuplicateParentGroup',
                actions: ['editDuplicateParentMarkdown'],
              },
              CLOSE_FROM_NARRATIVE_BANNER: {
                target: 'ready',
                actions: ['closeFromNarrativeBanner'],
              },
            },
          },
          updating: {
            invoke: {
              id: 'FETCHING_GRAPH_DATASET',
              src: 'doPostSaveDataset',
              onDone: {
                target: ['ready'],
                actions: ['handlePostSaveResponse'],
              },
              onError: {
                actions: ['setError'],
              },
            },
          },
        },
      },
      api: {
        initial: 'idle',
        states: {
          idle: {},
          error: {
            on: {
              CLEAR_ERROR: {
                target: ['idle'],
                actions: ['clearError'],
              },
            },
          },

          ///////// DEFININTION UI /////////
          // Handle API requests for loading an existing dataset
          loading_definition: {
            invoke: {
              id: 'LOADING_DEFINITION',
              src: 'doLoadingDefinition',
              onDone: {
                target: ['idle'],
                actions: ['handleLoadingDefinitionResponse'],
              },
              onError: {
                target: ['error'],
                actions: ['setError'],
              },
            },
          },
          loading_add_column_options: {
            invoke: {
              id: 'LOADING_ADD_COLUMN_OPTIONS',
              src: 'doLoadingDefinition',
              onDone: {
                target: ['idle'],
                actions: ['handleLoadingDefinitionResponse'],
              },
              onError: {
                target: ['error'],
                actions: ['setError'],
              },
            },
          },
          // Handle API requests for all definition updates:
          updating_definition: {
            invoke: {
              id: 'UPDATING_DEFINITION',
              src: 'doUpdatingDefinition',
              onDone: {
                target: ['idle'],
                actions: ['handleUpdatingDefinitionResponse', 'scrollActivityIntoView'],
              },
              onError: {
                target: ['error'],
                actions: ['setError'],
              },
            },
          },
          // Handle API requests for updating integrations
          updating_integrations: {
            invoke: {
              id: 'UPDATING_INTEGRATIONS',
              src: 'doUpdatingIntegrations',
              onDone: {
                target: ['idle', '#root.edit.idle', '#root.main.updating'],
                actions: ['handlePostSaveResponse', 'setNotification'],
              },
              onError: {
                target: ['error'],
                actions: ['setNotification'],
              },
            },
          },
          // Handle API requests when submitting (getting _plan_execution and setting it to context)
          submitting_definition: {
            invoke: {
              id: 'SUBMITTING_DEFINITION',
              src: 'doSubmittingDefinition',
              onDone: {
                target: 'reconciling_response',
                actions: ['setPlanExecution', 'scrollToTopOfInfoPanel', 'setDefaultView'],
              },
              onError: {
                target: ['error'],
                actions: ['setError', 'setPendingRun'],
              },
            },
          },
          // Handle API requests when submitting (getting _plan_execution and setting it to context)
          submitting_activity_columns: {
            invoke: {
              id: 'SUBMITTING_ACTIVITY_COLUMNS',
              src: 'doSubmittingDefinition',
              onDone: {
                target: 'reconciling_response',
                actions: ['setPlanExecution'],
              },
              onError: {
                target: ['error'],
                actions: ['setError'],
              },
            },
          },
          ///////// Reconciler /////////
          // Handle reconciler updates
          submitting_plan: {
            invoke: {
              id: 'SUBMITTING_RECONCILER',
              src: 'doSubmittingReconciler',
              onDone: {
                target: ['reconciling_response'],
                actions: ['setPlanExecution'],
              },
              onError: {
                target: ['error'],
                actions: ['setError'],
              },
            },
          },
          // Deal with any plan_execution response to see if we should prompt
          // the user to reconcile:
          reconciling_response: {
            // Transient transition, trigger these transitions immediatley
            // upon entering "reconciling" state
            always: [
              {
                target: ['idle', '#root.edit.reconciler', '#root.main.ready'],
                cond: 'shouldReconcile',
              },
              {
                target: ['loading_plot_data', '#root.edit.idle', '#root.main.ready'],
                actions: ['persistPlanExecution', 'executeUiInstructions', 'setHasCustomerColumn'],
                cond: 'shouldLoadPlot',
              },
              {
                target: ['idle', '#root.edit.idle', '#root.main.ready'],
                actions: ['persistPlanExecution', 'executeUiInstructions', 'setHasCustomerColumn'],
              },
            ],
          },

          ///////// Column Shortcuts /////////
          submitting_column_shortcut: {
            invoke: {
              id: 'SUBMITTING_COLUMN_SHORTCUT',
              src: 'doSubmittingColumnShortcut',
              onDone: {
                target: ['reconciling_response'],
                actions: ['setPlanExecution', 'resetDatasetStory', 'trackEvent'],
              },
              // Don't go to the api.error state as this request happens on the
              // main UI and we'll use a notification to render the error:
              onError: {
                target: ['idle', '#root.main.ready'],
                actions: ['setNotification'],
              },
            },
          },
          ///////// Row Shortcuts /////////
          submitting_row_shortcut: {
            invoke: {
              id: 'SUBMITTING_ROW_SHORTCUT',
              src: 'doSubmittingRowShortcut',
              onDone: {
                target: ['reconciling_response'],
                actions: ['setPlanExecution', 'trackEvent'],
              },
              // Don't go to the api.error state as this request happens on the
              // main UI and we'll use a notification to render the error:
              onError: {
                target: ['idle', '#root.main.ready'],
                actions: ['setNotification'],
              },
            },
          },
          submitting_swap_group_column: {
            invoke: {
              id: 'SUBMITTING_SWAP_GROUP_COLUMN',
              src: 'doSubmittingSwapGroupColumn',
              onDone: {
                target: ['reconciling_response'],
                actions: ['setPlanExecution'],
              },
              onError: {
                target: ['error'],
                actions: ['setError'],
              },
            },
          },

          submitting_delete_columns: {
            invoke: {
              id: 'SUBMITTING_DELETE_COLUMNS',
              src: 'submittingDeleteColumns',
              onDone: {
                target: ['reconciling_response'],
                actions: ['setPlanExecution', 'clearEditModeForGroup', 'trackEvent'],
              },
              // Don't go to the api.error state as this request happens on the
              // main UI and we'll use a notification to render the error:
              onError: {
                target: ['idle', '#root.main.ready'],
                actions: ['setNotification'],
              },
            },
          },

          submitting_edit_spend_columns: {
            invoke: {
              id: 'SUBMITTING_EDIT_SPEND_COLUMNS',
              src: 'doSubmittingEditSpendColumns',
              onDone: {
                target: ['reconciling_response'],
                actions: ['setPlanExecution'],
              },
              // Don't go to the api.error state as this request happens on the
              // main UI and we'll use a notification to render the error:
              onError: {
                target: ['idle', '#root.main.ready'],
                actions: ['setNotification'],
              },
            },
          },
          submitting_delete_spend_columns: {
            invoke: {
              id: 'SUBMITTING_DELETE_SPEND_COLUMNS',
              src: 'doSubmittingDeleteSpendColumns',
              onDone: {
                target: ['reconciling_response'],
                actions: ['setPlanExecution'],
              },
              // Don't go to the api.error state as this request happens on the
              // main UI and we'll use a notification to render the error:
              onError: {
                target: ['idle', '#root.main.ready'],
                actions: ['setNotification'],
              },
            },
          },

          ///////// Create Group By /////////
          submitting_create_group: {
            invoke: {
              id: 'SUBMITTING_CREATE_GROUP',
              src: 'doSubmittingCreateGroup',
              onDone: {
                target: ['idle', '#root.edit.idle', '#root.main.ready'],
                actions: [
                  'handleSubmittingCreateGroupResponse',
                  'selectLastGroup',
                  'clearPlotterContext',
                  'resetPlotSlug',
                  'trackEvent',
                ],
              },
              onError: {
                target: ['error'],
                actions: ['setError'],
              },
            },
          },

          ///////// Adding columnt to Group By /////////
          adding_group_columns: {
            // adding_group_column uses the reconciler service:
            invoke: {
              id: 'SUBMITTING_RECONCILER',
              src: 'doSubmittingReconciler',
              onDone: {
                target: ['reconciling_response'],
                actions: ['setPlanExecution'],
              },
              onError: {
                target: ['error'],
                actions: ['setError'],
              },
            },
          },

          ///////// Plotting /////////
          loading_plot_form: {
            invoke: {
              id: 'LOADING_PLOT_FORM',
              src: 'doLoadingPlotForm',
              onDone: {
                target: ['idle', '#root.main.ready'],
                actions: ['handleLoadingPlotFormResponse'],
              },
              onError: {
                target: ['error'],
                actions: ['setError'],
              },
            },
          },
          loading_plot_data: {
            invoke: {
              id: 'LOADING_PLOT_DATA',
              src: 'doLoadingPlotData',
              onDone: {
                target: ['idle', '#root.main.ready'],
                actions: ['handleLoadingPlotDataResponse'],
              },
              onError: {
                target: ['error'],
                actions: ['setError'],
              },
            },
          },

          ///////// Pivot Column Function /////////
          loading_pivot_column: {
            invoke: {
              id: 'LOADING_PIVOT_COLUMN',
              src: 'doLoadingPivotColumn',
              onDone: {
                target: ['idle', '#root.edit.column_pivot'],
                actions: ['handleLoadingPivotColumnResponse'],
              },
              onError: {
                // turn off processing loading with main.ready
                target: ['error', '#root.main.ready'],
                actions: ['setNotification'],
              },
            },
          },

          ///////// Freehand function /////////
          validating_freehand_function: {
            invoke: {
              id: 'VALIDATING_FREEHAND_FUNCTION',
              src: 'doValidatingFreehandFunction',
              onDone: {
                target: ['idle', '#root.main.ready'],
                actions: ['handleValidatingFreehandFunctionResponse'],
              },
              onError: {
                target: ['error'],
                actions: ['setError'],
              },
            },
          },
        },
      },
      edit: {
        initial: 'idle',
        states: {
          idle: {},
          reconciler: {
            on: {
              PERSIST_PLAN_EXECUTION: {
                target: ['idle', '#root.main.ready'],
                actions: ['persistPlanExecution', 'executeUiInstructions', 'setHasCustomerColumn'],
              },
              UNDO_PLAN_EXECUTION: {
                target: ['idle', '#root.main.ready'],
              },
              UPDATE_RECONCILER_PLAN: {
                target: ['#root.api.submitting_plan'],
              },
            },
          },
          group_plot: {
            on: {
              EDIT_PLOT_CANCEL: {
                target: ['idle'],
                actions: ['clearEditContext'],
              },
              SUBMIT_PLOT_SUCCESS: {
                target: ['idle', '#root.api.loading_plot_data'],
                actions: ['updateGroupPlot', 'trackEvent'],
              },
            },
          },
          create_dataset_narrative: {
            on: {
              CREATE_DATASET_NARRATIVE_CANCEL: {
                target: ['idle', '#root.main.ready'],
              },
            },
          },
          definition: {
            on: {
              // SELECT_COHORT_ACTIVITY, SELECT_COHORT_OCCURRENCE, SELECT_TIME_COHORT_RESOLUTION, SELECT_APPEND_ACTIVITY, and SELECT_RELATIONSHIP
              // all have to do the following:
              // - get default columns to add automatically
              // - get additional columns for column select
              // - convert dataset definition to query definition (in _plan_execution)
              // - update form value context in machine
              SELECT_COHORT_ACTIVITY: {
                target: ['#root.api.updating_definition'],
                actions: ['clearError'],
              },
              SELECT_TIME_COHORT_RESOLUTION: {
                cond: 'selectedCohortTime',
                target: ['#root.api.updating_definition'],
                actions: ['clearError'],
              },
              SELECT_COHORT_OCCURRENCE: [
                // Scenario 1 - Selecting "Time", needs a default time resolution, so hit the API
                {
                  cond: 'changedFromNormalToTimeOccurrence',
                  target: ['#root.api.updating_definition'],
                  // don't need to clearDatasetDefintionMinusOccurrence b/c
                  // updating_definition handles changedFromNormalToTimeOccurrence
                  actions: ['clearError'],
                },
                // Scenario 2 - Switching from a Time cohort to a Normal occurrence cohort
                // No need to hit the API because the user still needs to select an activity
                {
                  cond: 'changedFromTimeToNormalOccurrence',
                  actions: ['clearDatasetDefintionMinusOccurrence', 'clearError'],
                },
                // Scenario 3 - Switching from one normal occurrence cohort to another normal occurrence cohort
                // (cohort activity MUST be selected!)
                // Hit the API so that we get the proper activity column labels
                {
                  cond: 'cohortActivityDefined',
                  target: ['#root.api.updating_definition'],
                  actions: ['clearError'],
                },
              ],
              SELECT_APPEND_ACTIVITY: {
                cond: 'hasCohortAndValidAppendActivity',
                target: ['#root.api.updating_definition'],
                actions: ['clearError'],
              },
              SELECT_RELATIONSHIP: {
                cond: 'hasCohortAndValidAppendActivity',
                target: ['#root.api.updating_definition'],
                actions: ['clearError'],
              },
              EDIT_ACTIVITY_NAME: {
                actions: ['editActivityName'],
              },
              MOVE_APPEND_ACTIVITY: {
                actions: ['moveAppendActivity'],
              },
              // the following needs to happen:
              // - get _plan_execution
              // - update dataset based on new query definition
              SUBMIT_DEFINITION: {
                cond: 'cohortActivityDefined',
                target: ['#root.api.submitting_definition'],
                actions: ['setPendingRun', 'clearError'],
              },
              CANCEL_EDIT_DEFINITION: {
                target: ['idle', '#root.main.ready'],
              },
              SET_ACTIVITY_STREAM: {
                target: ['definition'],
                actions: ['setActivityStream', 'setDefaultConfig'],
              },
              // Don't blow away other definition values
              // (used in Explorer when receiving activity stream from get_explorer_options)
              SET_ACTIVITY_STREAM_ONLY: {
                target: ['definition'],
                actions: ['setActivityStream'],
              },
              // ONLY USE THIS IN EXPLORER MODE!
              // we get dataset defintiion from get_explore_options - not load dataset
              EXPLORER_RESET_DATASET_DEFINITION: {
                actions: ['explorerResetDatasetDefinition'],
              },
              // ONLY USE THIS IN CHAT MODE!
              // we get dataset defintiion from messages
              CHAT_RESET_DATASET_DEFINITION: {
                actions: ['chatResetDatasetDefinition'],
              },
            },
          },
          create_group: {
            on: {
              CREATE_GROUP_CANCEL: {
                target: ['idle', '#root.main.ready'],
                actions: ['clearEditContext'],
              },
              CREATE_GROUP_SUBMIT: {
                target: ['#root.api.submitting_create_group'],
                actions: ['clearError'],
              },
            },
          },
          add_columns_to_group: {
            on: {
              ADD_COLUMNS_TO_GROUP_CANCEL: {
                target: ['idle', '#root.main.ready'],
                actions: ['clearEditContext'],
              },
              ADD_COLUMNS_TO_GROUP_SUBMIT: {
                target: ['#root.api.adding_group_columns'],
                actions: ['clearError'],
              },
            },
          },
          delete_group: {
            on: {
              DELETE_GROUP_CANCEL: {
                target: ['idle', '#root.main.ready'],
                actions: ['clearEditContext'],
              },
              DELETE_GROUP_SUBMIT: {
                target: ['idle', '#root.main.ready'],
                actions: ['deleteGroup'],
              },
            },
          },
          rename_group: {
            on: {
              RENAME_GROUP_CANCEL: {
                target: ['idle', '#root.main.ready'],
                actions: ['clearEditContext'],
              },
              RENAME_GROUP_SUBMIT: {
                target: ['idle', '#root.main.ready'],
                actions: ['renameGroup'],
              },
            },
          },
          computation: {
            on: {
              EDIT_COMPUTATION_CANCEL: {
                target: ['idle', '#root.main.ready'],
                actions: ['clearEditContext'],
              },
              VALIDATE_FREEHAND_FUNCTION: {
                target: ['#root.api.validating_freehand_function'],
              },
              EDIT_COMPUTATION_SUBMIT: {
                target: ['idle', '#root.main.ready'],
                actions: ['updateComputation', 'trackEvent', 'clearEditContext'],
              },
            },
          },
          integrations: {
            on: {
              EDIT_INTEGRATIONS_CANCEL: {
                target: ['idle', '#root.main.ready'],
              },
              VALIDATE_FREEHAND_FUNCTION: {
                target: ['#root.api.validating_freehand_function'],
              },
              EDIT_INTEGRATIONS_SUBMIT: {
                actions: ['clearError'],
                target: ['#root.api.updating_integrations'],
              },
            },
          },
          dataset_story: {
            on: {
              EDIT_DATASET_STORY_CANCEL: {
                target: ['idle', '#root.main.ready'],
                actions: ['switchToStoryView', 'updateDatasetStory'],
              },
              UPDATE_DATASET_STORY: {
                actions: ['updateDatasetStory'],
              },
            },
          },
          metrics: {
            on: {
              EDIT_METRIC_COLUMN_CANCEL: {
                target: ['idle', '#root.main.ready'],
                actions: ['clearEditContext'],
              },
              EDIT_METRIC_COLUMN_SUBMIT: {
                target: ['idle', '#root.main.ready'],
                actions: ['updateMetricColumn', 'trackEvent', 'clearEditContext'],
              },
            },
          },
          swap_group_column: {
            on: {
              EDIT_SWAP_GROUP_COLUMN_SUBMIT: {
                target: ['#root.api.submitting_swap_group_column'],
              },
              EDIT_SWAP_GROUP_COLUMN_CANCEL: {
                target: ['idle', '#root.main.ready'],
                actions: ['clearEditContext'],
              },
            },
          },
          order_by: {
            on: {
              EDIT_ORDER_BY_CANCEL: {
                target: ['idle', '#root.main.ready'],
                actions: ['clearEditContext'],
              },
              EDIT_ORDER_BY_SUBMIT: {
                target: ['idle', '#root.main.ready'],
                actions: ['updateOrderBy'],
              },
            },
          },
          filter_column: {
            on: {
              EDIT_FILTER_COLUMN_CANCEL: {
                target: ['idle', '#root.main.ready'],
                actions: ['clearEditContext'],
              },
              EDIT_FILTER_COLUMN_SUBMIT: {
                target: ['idle', '#root.main.ready'],
                actions: ['updateColumnFilter'],
              },
            },
          },
          create_spend: {
            on: {
              EDIT_SPEND_CANCEL: {
                target: ['idle', '#root.main.ready'],
                actions: ['clearEditContext'],
              },
            },
          },
          quick_reorder_columns: {
            on: {
              EDIT_QUICK_REORDER_COLUMNS_CANCEL: {
                target: ['idle', '#root.main.ready'],
                actions: ['clearEditContext'],
              },
              EDIT_QUICK_REORDER_COLUMNS_SUBMIT: {
                target: ['idle', '#root.main.ready'],
                actions: ['setColumnsOrderOverride'],
              },
            },
          },
          parent_filters: {
            on: {
              EDIT_PARENT_FILTERS_CANCEL: {
                target: ['idle', '#root.main.ready'],
                actions: ['clearEditContext'],
              },
              EDIT_PARENT_FILTERS_SUBMIT: {
                target: ['idle', '#root.main.ready'],
                actions: ['editParentFilters'],
              },
            },
          },
          hide_duplicate_parent_columns: {
            on: {
              EDIT_HIDE_DUPLICATE_PARENT_COLUMNS_CANCEL: {
                target: ['idle', '#root.main.ready'],
                actions: ['clearEditContext'],
              },
              EDIT_HIDE_DUPLICATE_PARENT_COLUMNS_SUBMIT: {
                target: ['idle', '#root.main.ready'],
                actions: ['editHideDuplicateParentColumns'],
              },
            },
          },
          column_pivot: {
            on: {
              EDIT_COLUMN_PIVOT_CANCEL: {
                target: ['idle', '#root.main.ready'],
                actions: ['clearEditContext'],
              },
              EDIT_COLUMN_PIVOT_SUBMIT: {
                target: ['idle', '#root.main.ready'],
                actions: ['addColumnPivot'],
              },
              EDIT_COLUMN_PIVOT_REVERSE_SUBMIT: {
                target: ['idle', '#root.main.ready'],
                actions: ['reverseColumnPivot'],
              },
            },
          },
        },
      },
    },
  },
  {
    // see machineServices for list of available services:
    services: {},

    guards: {
      changedFromNormalToTimeOccurrence: (_, event) => {
        if (event.type === 'SELECT_COHORT_OCCURRENCE') {
          return !!event.changedFromNormalToTimeOccurrence
        }
        return false
      },
      changedFromTimeToNormalOccurrence: (_, event) => {
        if (event.type === 'SELECT_COHORT_OCCURRENCE') {
          return !!event.changedFromTimeToNormalOccurrence
        }
        return false
      },
      selectedCohortTime: (_, event) => {
        if (event.type === 'SELECT_TIME_COHORT_RESOLUTION') {
          const cohortOccurrence = get(event, 'formValue.cohort.occurrence_filter.occurrence')
          return cohortOccurrence === OCCURRENCE_TIME
        }
        return false
      },
      isRunning: (context) => context._is_running,
      isDirty: (context) => context._is_dirty,
      isGroup: (context) => !!context._group_slug,
      isPlotting: (context) => context._view === viewTypeConstants.PLOT,
      isPlottingWithSelectedPlot: (context) => {
        return context._view === viewTypeConstants.PLOT && !!context._plot_slug
      },
      switchingGroupWhilePlotting: (context, event) => {
        // If you're switching to a group groupSlug will be present
        if (event.type === 'SELECT_GROUP' && context._view === viewTypeConstants.PLOT) {
          return !!event.groupSlug
        }
        return false
      },
      switchingToPlottingWithNoPlots: (context, event) => {
        // Only allow plotting on group tabs:
        if (event.type === 'SWITCH_MAIN_VIEW' && event.view === viewTypeConstants.PLOT && context._group_slug) {
          const groupIndex = getGroupIndex({ context, groupSlug: context._group_slug })
          const group = context.all_groups[groupIndex]
          return isEmpty(group.plots)
        }
        return false
      },
      switchingToPlotting: (context, event) => {
        // Only allow plotting on group tabs:
        if (event.type === 'SWITCH_MAIN_VIEW' && event.view === viewTypeConstants.PLOT && context._group_slug) {
          return true
        }
        return false
      },
      hasGroups: (context) => context.all_groups.length > 0,
      hasSpend: (context, event) => {
        const groupSlug = get(event, 'groupSlug')
        if (groupSlug) {
          const groupIndex = getGroupIndex({ context, groupSlug })
          const group = context.all_groups[groupIndex]
          return !isEmpty(group.spend)
        }
        return false
      },
      hasCohort: (context) => context.activities.length > 0,
      // Definition UI:
      hasCohortAndValidAppendActivity: (context, event) => {
        // Don't allow any of these events unless both an activityId and relationshipSlug are defined!
        if (event.type === 'SELECT_APPEND_ACTIVITY' || event.type === 'SELECT_RELATIONSHIP') {
          const activityIds = get(context, '_definition_context.form_value.cohort.activity_ids', [])
          return activityIds.length > 0 && (event?.activityIds || []).length > 0 && !!event.relationshipSlug
        }

        return false
      },
      cohortActivityDefined: (context) =>
        get(context, '_definition_context.form_value.cohort.activity_ids', []).length > 0,
      shouldReconcile: (context) => get(context, '_plan_execution.show_user', false),
      shouldLoadPlot: (context) => {
        const uiInstructions = context._plan_execution?.ui_instructions
        // ui_instructions can be an object or array of objects (eventually let's just do array of objects)
        if (isArray(uiInstructions)) {
          // it's an array
          return !!find(uiInstructions, ['kind', 'go_to_plot'])
        } else {
          // it's an object
          return uiInstructions?.kind === 'go_to_plot'
        }
      },
      isDuplicateParentGroup: (context) => !!context._is_parent_duplicate,
    },

    actions: {
      addColumnPivot,
      addEventToEditContext,
      handleLoadingDefinitionResponse,
      deleteGroup,
      renameGroup,
      duplicateColumn,
      duplicateParent,
      duplicateGroup,
      editColumnLabel,
      editActivityName,
      editParentFilters,
      handleUpdatingDefinitionResponse,
      handleLoadingPlotFormResponse,
      handleLoadingPlotDataResponse,
      reverseColumnPivot,
      selectLastGroup,
      maintainDuplicateGroupColumnOrder,
      maintainDuplicateParentColumnOrder,
      selectLastDuplicateParent,
      setDefaultConfig,
      setError,
      setNotification,
      clearError,
      clearEditContext,
      persistPlanExecution,
      handlePostSaveResponse,
      handleLoadingDatasetResponse,
      handleLoadingPivotColumnResponse,
      setRunning,
      setPendingRun,
      setSelectedGroup,
      handleSubmittingCreateGroupResponse,
      updateColumnFilter,
      addTableCellFilter,
      updateColumnVisible,
      updateComputation,
      updateMetricColumn,
      updateOrderBy,
      setActivityStream,
      moveAppendActivity,
      setPlanExecution,
      setHasCustomerColumn,
      executeUiInstructions,
      setNotDirty,
      setIsDirty,
      setColumnsOrder,
      setColumnsOrderOverride,
      restoreColumnOrderDefaults,
      setStaleTabs,
      unsetStaleTab,
      switchMainView,
      switchToTableView,
      switchToStoryView,
      updateDatasetStory,
      resetDatasetStory,
      clearPlotterContext,
      clearPlotterContextFormState,
      resetPlotSlug,
      removePlot,
      updateGroupPlot,
      updateGroupTabOrder,
      selectPlot,
      selectFirstPlot,
      handleValidatingFreehandFunctionResponse,
      trackEvent,
      scrollActivityIntoView,
      scrollToTopOfInfoPanel,
      toggleEditMode,
      toggleEditModeColumDelete,
      editDuplicateParentMarkdown,
      closeFromNarrativeBanner,
      clearEditModeForGroup,
      clearDatasetDefintionMinusOccurrence,
      setDefaultView,
      editHideDuplicateParentColumns,
      explorerResetDatasetDefinition,
      chatResetDatasetDefinition,
    },
  }
)

export default buildDatasetMachine
