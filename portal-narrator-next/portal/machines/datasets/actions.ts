import { diff } from 'deep-object-diff'
import _, {
  cloneDeep,
  filter,
  find,
  findIndex,
  forEach,
  get,
  includes,
  isArray,
  isEmpty,
  keys,
  map,
  omit,
} from 'lodash'
import analytics from 'util/analytics'
import {
  COLUMN_KIND_CAC,
  COLUMN_KIND_COMPUTED,
  COLUMN_KIND_GROUP_BY,
  COLUMN_KIND_GROUP_METRIC,
  columnTypeFromAgg,
  dedupeLabel,
  getDedupedLabel,
  getGroupFromContext,
  INFO_PANEL_CONTAINER_ID,
  RAW_DATASET_KEY,
} from 'util/datasets'
import {
  DatasetContext,
  DatasetEvent,
  IDatasetQueryColumn,
  IDatasetQueryGroup,
  IDatasetQueryGroupComputedColumn,
  IDatasetQueryGroupMetric,
  INotification,
  viewTypeConstants,
} from 'util/datasets/interfaces'
import { reportError } from 'util/errors'
import { makeShortid } from 'util/shortid'
import { parseMavisErrorCode } from 'util/useCallMavis'
import { assign } from 'xstate'

import { getLogger } from '@/util/logger'

import buildDatasetMachine from './buildDatasetMachine'
import {
  datasetHasCustomerColumn,
  getGroupColumnAndColumnType,
  getGroupIndex,
  handleUpdateComputationColumn,
  makeMetricsOnPivotedToggle,
  makeQueryDefinitionFromContext,
  makeUniqueId,
  reverseMetricComputeColumns,
} from './helpers'
const logger = getLogger()

const actions = {
  // eslint-disable-next-line max-lines-per-function
  trackEvent: (context: DatasetContext, event: DatasetEvent) => {
    if (event.type === 'done.invoke.SUBMITTING_COLUMN_SHORTCUT' && context._slug) {
      const { planExecution } = event.data

      // adding computed column from column shortcut
      // Make sure to trigger analytics only when a computed column was added:
      const computedColumnPlan = find(planExecution?.plan, { mutation: 'add', column_kind: 'computed' })
      if (computedColumnPlan) {
        // Notice EDIT_COMPUTATION_SUBMIT below as well!
        analytics.track('added_dataset_computed_column', {
          dataset_slug: context._slug,
          group_slug: context._group_slug,
          computed_kind: _.get(computedColumnPlan, 'new_column.source_details.kind'),
          trigger: 'column shortcut',
        })
      }

      // adding metric column to groups from column shortcut
      // Make sure to trigger analytics only for each metric column added:
      const metricColumnPlans = filter(planExecution?.plan, { mutation: 'add', column_kind: 'metrics' })
      if (metricColumnPlans.length > 0) {
        forEach(metricColumnPlans, (columnPlan) => {
          // Notice EDIT_METRIC_COLUMN_SUBMIT below as well!
          analytics.track('added_dataset_metric_column', {
            dataset_slug: context._slug,
            group_slug: columnPlan.group_slug,
            agg_function: _.get(columnPlan, 'new_column.agg_function'),
            trigger: 'column shortcut',
          })
        })
      }

      // adding group by from column shortcut
      // Make sure to trigger analytics only when a group was added:
      const groupPlan = find(planExecution?.plan, ['mutation', 'add_group'])
      if (groupPlan) {
        analytics.track('created_dataset_group_by', {
          dataset_slug: context._slug,
          group_slug: groupPlan.group_slug,
          trigger: 'column shortut',
        })
      }
    }
    if (event.type === 'done.invoke.SUBMITTING_CREATE_GROUP' && context._slug) {
      analytics.track('created_dataset_group_by', {
        dataset_slug: context._slug,
        group_slug: context._group_slug,
        trigger: 'add group by',
      })
    }
    if (event.type === 'DUPLICATE_PARENT') {
      analytics.track('created_dataset_duplicate_parent_group', {
        dataset_slug: context._slug,
        group_slug: context._group_slug,
        trigger: 'duplicate parent group',
      })
    }
    if (event.type === 'DUPLICATE_GROUP') {
      analytics.track('created_dataset_group_by', {
        dataset_slug: context._slug,
        group_slug: context._group_slug,
        trigger: 'duplicate group by',
      })
    }

    if (event.type === 'EDIT_COMPUTATION_SUBMIT') {
      if (!event.isEdit) {
        analytics.track('added_dataset_computed_column', {
          dataset_slug: context._slug,
          group_slug: context._group_slug,
          computed_kind: event.column.source_details.kind,
          trigger: 'computed column overlay',
        })
      }
    }

    if (event.type === 'EDIT_METRIC_COLUMN_SUBMIT') {
      if (!event.isEdit) {
        analytics.track('added_dataset_metric_column', {
          dataset_slug: context._slug,
          group_slug: context._group_slug,
          agg_function: event.metricColumn.agg_function,
          trigger: 'metric column popover',
        })
      }
    }

    // NOTE - trackEvent MUST occur as the last action because we rely
    // on the context._plot_slug being updated
    if (event.type === 'SUBMIT_PLOT_SUCCESS') {
      analytics.track(event.plotSlug ? 'updated_dataset_plot' : 'created_dataset_plot', {
        dataset_slug: context._slug,
        group_slug: context._group_slug,
        plot_slug: context._plot_slug,
        plot_title: event.plotConfig.axes.title,
      })
    }

    if (event.type === 'SWITCH_MAIN_VIEW') {
      analytics.track('switched_dataset_view', {
        dataset_slug: context._slug,
        group_slug: context._group_slug,
        view: event.view,
      })
    }

    const switchingToPlotting =
      event.type === 'SWITCH_MAIN_VIEW' && event.view === viewTypeConstants.PLOT && context._group_slug
    if (event.type === 'EDIT_PLOT' || event.type === 'NEW_PLOT' || switchingToPlotting) {
      let plotSlug
      // Only EDIT_PLOT will have a plot slug
      if (event.type === 'EDIT_PLOT') {
        plotSlug = event.plotSlug
      }
      analytics.track('opened_dataset_plotter', {
        dataset_slug: context._slug,
        group_slug: context._group_slug,
        plot_slug: plotSlug,
        type: plotSlug ? 'edit' : 'new',
      })
    }

    if (event.type === 'done.invoke.SUBMITTING_DELETE_COLUMNS') {
      analytics.track('deleted_multiple_columns', {
        dataset_slug: context._slug,
        group_slug: context._group_slug,
      })
    }

    if (event.type === 'CREATE_DATASET_NARRATIVE') {
      analytics.track('clicked_analyze_button', {
        dataset_slug: context._slug,
        group_slug: context._group_slug,
      })
    }
  },

  // useful for determining if dataset definition was submitted
  // but hasn't started running yet
  setPendingRun: assign<DatasetContext, DatasetEvent>({
    _pending_run: (context, event) => {
      if (event.type === 'SUBMIT_DEFINITION') {
        return true
      } else if (event.type === 'DATASET_RUN' || event.type.startsWith('error')) {
        return false
      } else {
        return context._pending_run
      }
    },
  }),

  setRunning: assign<DatasetContext, DatasetEvent>({
    _is_running: (context, event) => {
      if (event.type === 'DATASET_RUN') {
        return true
      }

      if (event.type === 'DATASET_RUN_DONE') {
        return false
      }

      return context._is_running
    },
  }),

  setActivityStream: assign<DatasetContext, DatasetEvent>({
    activity_stream: (context, event) => {
      if (event.type === 'SET_ACTIVITY_STREAM' || event.type === 'SET_ACTIVITY_STREAM_ONLY') {
        return event.activityStream
      } else {
        return context.activity_stream
      }
    },
  }),

  moveAppendActivity: assign<DatasetContext, DatasetEvent>({
    _definition_context: (context, event) => {
      if (event.type === 'MOVE_APPEND_ACTIVITY') {
        const appendActivities = event.activities
        const updatedAppendActivities = [...appendActivities]
        const fromAppendActivity = appendActivities[event.from]
        const toAppendActivity = appendActivities[event.to]

        // if the from and to append/join activities are found
        if (!isEmpty(fromAppendActivity) && !isEmpty(toAppendActivity)) {
          // swap the found activities
          updatedAppendActivities[event.from] = toAppendActivity
          updatedAppendActivities[event.to] = fromAppendActivity

          // and update the definition context with new append/join activity order
          return {
            ...context._definition_context,
            form_value: {
              ...context._definition_context.form_value,
              append_activities: updatedAppendActivities,
            },
          }
        }

        // shouldn't happen, but if the activities weren't found
        // return existing def context
        return context._definition_context
      } else {
        return context._definition_context
      }
    },
  }),

  // general purpose action to give edit overlays/modals/popovers access to event data
  addEventToEditContext: assign<DatasetContext, DatasetEvent>({
    _edit_context: (context, event) => {
      if (
        event.type === 'EDIT_SWAP_GROUP_COLUMN' ||
        event.type === 'EDIT_COMPUTATION' ||
        event.type === 'EDIT_METRIC_COLUMN' ||
        event.type === 'EDIT_COLUMN_PIVOT' ||
        event.type === 'EDIT_REVERSE_COLUMN_PIVOT' ||
        event.type === 'EDIT_FILTER_COLUMN'
      ) {
        return {
          ...context._edit_context,
          event,
        }
      } else {
        return context._edit_context
      }
    },
  }),
  clearEditContext: assign<DatasetContext, DatasetEvent>({
    _edit_context: () => {
      return undefined
    },
  }),

  toggleEditMode: assign<DatasetContext, DatasetEvent>({
    _delete_columns_tabs: (context, event) => {
      if (event.type === 'TOGGLE_DELETE_COLUMNS_MODE') {
        const { tabName } = event
        const existingTab = find(context._delete_columns_tabs, ['tabName', tabName])
        // if tab exists, remove it, otherwise add it
        let tempEditMode = [...context._delete_columns_tabs]
        if (existingTab) {
          tempEditMode = filter([...context._delete_columns_tabs], (tab) => tab.tabName !== tabName)
        } else {
          tempEditMode = [
            ...tempEditMode,
            {
              tabName,
              deleteColumnsIds: [],
            },
          ]
        }
        return tempEditMode
      } else {
        return context._delete_columns_tabs
      }
    },
  }),

  editDuplicateParentMarkdown: assign<DatasetContext, DatasetEvent>({
    all_groups: (context, event) => {
      if (event.type === 'EDIT_DUPLICATE_PARENT_MARKDOWN' && event.groupSlug) {
        const groupIndex = getGroupIndex({ context, groupSlug: event.groupSlug })
        const group = cloneDeep(context.all_groups[groupIndex])

        const updatedGroup = {
          ...group,
          duplicate_parent_markdown: event.markdown,
        }

        const updatedGroups = [...context.all_groups]
        updatedGroups[groupIndex] = updatedGroup

        return updatedGroups
      } else {
        return context.all_groups
      }
    },
  }),

  closeFromNarrativeBanner: assign<DatasetContext, DatasetEvent>({
    _from_narrative: (context, event) => {
      if (event.type === 'CLOSE_FROM_NARRATIVE_BANNER') {
        return {
          ...context._from_narrative,
          open: false,
        }
      } else {
        return context._from_narrative
      }
    },
  }),

  toggleEditModeColumDelete: assign<DatasetContext, DatasetEvent>({
    _delete_columns_tabs: (context, event) => {
      if (event.type === 'TOGGLE_SELECT_COLUMN_FOR_DELETE') {
        const { tabName, columnId } = event
        // get existing tab
        const existingTab = find(context._delete_columns_tabs, ['tabName', tabName])

        // see if column exists
        let tempDeleteColumnsIds = existingTab?.deleteColumnsIds ? [...existingTab.deleteColumnsIds] : []
        const columnExists = _.includes(existingTab?.deleteColumnsIds, columnId)
        if (columnExists) {
          // if column exists, remove it
          tempDeleteColumnsIds = filter(existingTab?.deleteColumnsIds, (id) => id !== columnId)
        } else {
          // otherwise add it
          tempDeleteColumnsIds = [...tempDeleteColumnsIds, columnId]
        }

        // reconstruct tab with delete columns (added or filtered)
        const updatedTabWithColumns = {
          tabName,
          deleteColumnsIds: tempDeleteColumnsIds,
        }

        // remove tab being edited (it will be replaced)
        const editModeWithoutCurrentTab = filter(
          [...context._delete_columns_tabs],
          (editModeTab) => editModeTab.tabName !== tabName
        )

        const updatedEditMode = [...editModeWithoutCurrentTab, updatedTabWithColumns]

        return updatedEditMode
      } else {
        return context._delete_columns_tabs
      }
    },
  }),

  clearEditModeForGroup: assign<DatasetContext, DatasetEvent>({
    _delete_columns_tabs: (context, event) => {
      // 'done.invoke.SUBMITTING_COLUMN_SHORTCUT'
      if (event.type === 'done.invoke.SUBMITTING_DELETE_COLUMNS') {
        // after deleting multiple columns, turn off edit mode by removing the tab
        const {
          data: { planExecution },
        } = event
        const firstPlan = planExecution.plan[0]

        if (firstPlan && firstPlan.mutation === 'delete') {
          // there is no groupSlug for parent so use RAW_DATASET_KEY if no groupSlug
          const tabName = firstPlan?.group_slug || RAW_DATASET_KEY
          const editModeWithoutCurrentTab = filter(
            [...context._delete_columns_tabs],
            (editModeTab) => editModeTab.tabName !== tabName
          )

          return editModeWithoutCurrentTab
        }

        return context._delete_columns_tabs
      } else {
        return context._delete_columns_tabs
      }
    },
  }),

  // Config actions
  setDefaultConfig: assign<DatasetContext, DatasetEvent>({
    fields: (context, event) => {
      if (event.type === 'NEW' || event.type === 'SET_ACTIVITY_STREAM') {
        return {}
      } else {
        return context.fields
      }
    },
    columns: (context, event) => {
      if (event.type === 'NEW' || event.type === 'SET_ACTIVITY_STREAM') {
        return []
      } else {
        return context.columns
      }
    },
    activities: (context, event) => {
      if (event.type === 'NEW' || event.type === 'SET_ACTIVITY_STREAM') {
        return []
      } else {
        return context.activities
      }
    },
    activity_stream: (context, event) => {
      if (event.type === 'NEW') {
        // don't default when multiple tables
        // (helps prevent race case when showing selectable activities in edit dataset definition)
        if (event.tables.length > 1) {
          return context.activity_stream
        }

        // if there is only one table, set it as default activity stream
        return event.tables[0].activity_stream
      } else if (event.type === 'SET_ACTIVITY_STREAM') {
        return event.activityStream
      } else {
        return context.activity_stream
      }
    },
    all_groups: (context, event) => {
      if (event.type === 'NEW' || event.type === 'SET_ACTIVITY_STREAM') {
        return []
      } else {
        return context.all_groups
      }
    },
    order: (context, event) => {
      if (event.type === 'NEW' || event.type === 'SET_ACTIVITY_STREAM') {
        return []
      } else {
        return context.order
      }
    },
    swapped_ids: (context, event) => {
      if (event.type === 'NEW' || event.type === 'SET_ACTIVITY_STREAM') {
        return []
      } else {
        return context.swapped_ids
      }
    },
    _definition_context: (context, event) => {
      // add cohort occurence filter 'all' for new datasets (sets default)
      if (event.type === 'NEW') {
        return {
          ...context._definition_context,
          form_value: {
            ...context._definition_context.form_value,
            cohort: {
              ...context._definition_context.form_value.cohort,
              occurrence_filter: {
                occurrence: 'all',
              },
            },
          },
        }
      } else {
        return context._definition_context
      }
    },
  }),

  setNotDirty: assign<DatasetContext, DatasetEvent>({
    _is_dirty: (context, event) => {
      if (event.type === 'SAVE_UPDATE_SUCCESS' || event.type === 'SAVE_CREATE_SUCCESS') {
        return false
      } else {
        return context._is_dirty
      }
    },
  }),

  setIsDirty: assign<DatasetContext, DatasetEvent>({
    _is_dirty: (context, event) => {
      if (event.type === 'SET_DATASET_DIRTY') {
        return event.dirty
      } else {
        return context._is_dirty
      }
    },
  }),

  setColumnsOrder: assign<DatasetContext, DatasetEvent>({
    columns_order: (context, event) => {
      if (event.type === 'SET_COLUMNS_ORDER') {
        const tabSlug = event.groupSlug || 'parent'
        const agGridColumns = event.agGridColumns

        const leftPinnedColumnIds = _.map(
          filter(agGridColumns, (col) => col['pinned'] === 'left'),
          (column) => column['colId']
        )

        const rightPinnedColumnIds = _.map(
          filter(agGridColumns, (col) => col['pinned'] === 'right'),
          (column) => column['colId']
        )

        const allPinnedColumnIds = [...leftPinnedColumnIds, ...rightPinnedColumnIds]
        const allColumnIds = _.map(agGridColumns, (col) => col['colId'])
        const nonPinnedColumnIds = filter(allColumnIds, (colId) => !_.includes(allPinnedColumnIds, colId))

        const updatedColumnsOrders = {
          ...context.columns_order,
          [tabSlug]: {
            order: nonPinnedColumnIds,
            left_pinned: leftPinnedColumnIds,
            right_pinned: rightPinnedColumnIds,
          },
        }

        return updatedColumnsOrders
      } else {
        return context.columns_order
      }
    },
  }),
  // fired when the column_mapping response changes
  // this ensures that new columns generated from dataset (not cohort/append columns)
  // are accounted for in the column order
  setColumnsOrderOverride: assign<DatasetContext, DatasetEvent>({
    columns_order: (context, event) => {
      if (event.type === 'SET_COLUMNS_ORDER_OVERRIDE' || event.type === 'EDIT_QUICK_REORDER_COLUMNS_SUBMIT') {
        const tabSlug = event.groupSlug || 'parent'
        const colIds = event.colIds

        // include left/right pinned if they existed in the dataset prior to run
        const previousColumnsOrder = context.columns_order?.[tabSlug]
        const left_pinned = previousColumnsOrder?.left_pinned ?? []
        const right_pinned = previousColumnsOrder?.right_pinned ?? []

        const updatedColumnsOrders = {
          ...context.columns_order,
          [tabSlug]: {
            order: colIds,
            left_pinned,
            right_pinned,
          },
        }

        return updatedColumnsOrders
      } else {
        return context.columns_order
      }
    },
  }),

  restoreColumnOrderDefaults: assign<DatasetContext, DatasetEvent>({
    columns_order: (context, event) => {
      if (event.type === 'RESTORE_COLUMNS_ORDER_DEFAULTS') {
        const tabSlug = event.groupSlug || 'parent'

        // remove the tab columns_order
        const updatedColumnsOrders = _.omit(context.columns_order, tabSlug)

        return updatedColumnsOrders
      } else {
        return context.columns_order
      }
    },
  }),

  setStaleTabs: assign<DatasetContext, DatasetEvent>({
    _stale_tabs: (context, event) => {
      if (event.type === 'SET_STALE_TABS') {
        return event.staleTabs
      } else {
        return context._stale_tabs
      }
    },
  }),

  unsetStaleTab: assign<DatasetContext, DatasetEvent>({
    _stale_tabs: (context, event) => {
      if (event.type === 'DATASET_RUN_DONE') {
        const groupSlug = event.groupSlug

        // Filter out the successfully run tab!
        return filter(context._stale_tabs, (tabKey) => {
          if (groupSlug) {
            return tabKey !== groupSlug
          }
          return tabKey !== RAW_DATASET_KEY
        })
      } else {
        return context._stale_tabs
      }
    },
  }),

  switchToTableView: assign<DatasetContext, DatasetEvent>({
    _view: (context, event) => {
      if (event.type === 'DUPLICATE_GROUP') {
        return viewTypeConstants.TABLE
      } else {
        return context._view
      }
    },
  }),

  switchToStoryView: assign<DatasetContext, DatasetEvent>({
    _view: (context, event) => {
      if (event.type === 'EDIT_DATASET_STORY') {
        return viewTypeConstants.STORY
      } else if (event.type === 'EDIT_DATASET_STORY_CANCEL') {
        return viewTypeConstants.TABLE
      } else {
        return context._view
      }
    },
  }),

  switchMainView: assign<DatasetContext, DatasetEvent>({
    _view: (context, event) => {
      if (event.type === 'SWITCH_MAIN_VIEW') {
        return event.view
      } else {
        return context._view
      }
    },
    _plot_slug: (context, event) => {
      if (event.type === 'SWITCH_MAIN_VIEW') {
        return undefined
      } else {
        return context._plot_slug
      }
    },
    _plotter_context: (context, event) => {
      if (event.type === 'SWITCH_MAIN_VIEW') {
        return {}
      } else {
        return context._plotter_context
      }
    },
  }),

  handlePostSaveResponse: assign<DatasetContext, DatasetEvent>({
    _dataset_from_graph: (context, event) => {
      if (event.type === 'done.invoke.FETCHING_GRAPH_DATASET' && event.data.datasetFromGraph) {
        return event.data.datasetFromGraph
      } else {
        return context._dataset_from_graph
      }
    },
  }),

  handleLoadingDatasetResponse: assign<DatasetContext, DatasetEvent>({
    // For all:
    _column_shortcuts: (context, event) => {
      if (event.type === 'done.invoke.LOADING_DATASET') {
        return event.data.columnShortcuts
      } else {
        return context._prev_query
      }
    },
    _row_shortcuts: (context, event) => {
      if (event.type === 'done.invoke.LOADING_DATASET') {
        return event.data.rowShortcuts
      } else {
        return context._prev_query
      }
    },
    // for LOADING existing dataset (either duplicate or /edit/) only:
    _slug: (context, event) => {
      if (event.type === 'done.invoke.LOADING_DATASET' && event.data.slug) {
        return event.data.slug
      } else {
        return context._slug
      }
    },
    fields: (context, event) => {
      if (
        (event.type === 'done.invoke.LOADING_DATASET' || event.type === 'UPDATE_QUERY_DEFINITION') &&
        event.data.queryDefinition
      ) {
        return event.data.queryDefinition.fields
      } else {
        return context.fields
      }
    },
    columns: (context, event) => {
      if (
        (event.type === 'done.invoke.LOADING_DATASET' || event.type === 'UPDATE_QUERY_DEFINITION') &&
        event.data.queryDefinition
      ) {
        return event.data.queryDefinition.query.columns
      } else {
        return context.columns
      }
    },
    activity_stream: (context, event) => {
      if (
        (event.type === 'done.invoke.LOADING_DATASET' || event.type === 'UPDATE_QUERY_DEFINITION') &&
        event.data.queryDefinition
      ) {
        return event.data.queryDefinition.query.activity_stream
      } else {
        return context.activity_stream
      }
    },
    activities: (context, event) => {
      if (
        (event.type === 'done.invoke.LOADING_DATASET' || event.type === 'UPDATE_QUERY_DEFINITION') &&
        event.data.queryDefinition
      ) {
        return event.data.queryDefinition.query.activities
      } else {
        return context.activities
      }
    },
    all_groups: (context, event) => {
      if (
        (event.type === 'done.invoke.LOADING_DATASET' || event.type === 'UPDATE_QUERY_DEFINITION') &&
        event.data.queryDefinition
      ) {
        return event.data.queryDefinition.query.all_groups
      } else {
        return context.all_groups
      }
    },
    story: (context, event) => {
      if (
        (event.type === 'done.invoke.LOADING_DATASET' || event.type === 'UPDATE_QUERY_DEFINITION') &&
        event.data.queryDefinition
      ) {
        return event.data.queryDefinition.query.story
      } else {
        return context.story
      }
    },
    order: (context, event) => {
      if (
        (event.type === 'done.invoke.LOADING_DATASET' || event.type === 'UPDATE_QUERY_DEFINITION') &&
        event.data.queryDefinition
      ) {
        return event.data.queryDefinition.query.order
      } else {
        return context.order
      }
    },
    swapped_ids: (context, event) => {
      if (
        (event.type === 'done.invoke.LOADING_DATASET' || event.type === 'UPDATE_QUERY_DEFINITION') &&
        event.data.queryDefinition
      ) {
        return event.data.queryDefinition.query.swapped_ids
      } else {
        return context.swapped_ids
      }
    },
    // If there's a group=GROUP_SLUG in the url params, set that as the group
    _group_slug: (context, event) => {
      if (
        event.type === 'done.invoke.LOADING_DATASET' &&
        event.data.queryDefinition &&
        event.data.groupSlugFromSearch
      ) {
        const groupExists = !!find(event.data.queryDefinition.query.all_groups, [
          'slug',
          event.data.groupSlugFromSearch,
        ])
        return groupExists ? event.data.groupSlugFromSearch : context._group_slug
      } else {
        return context._group_slug
      }
    },
    _from_narrative: (context, event) => {
      if (event.type === 'done.invoke.LOADING_DATASET') {
        const open = !!(event.data.narrative_slug && event.data.upload_key)
        return {
          slug: event.data.narrative_slug,
          upload_key: event.data.upload_key,
          open, // if coming from narrative, start with the banner showing (they can close it later)
        }
      } else {
        return context._from_narrative
      }
    },
    // Check if duplicate parent group
    _is_parent_duplicate: (context, event) => {
      if (event.type === 'done.invoke.LOADING_DATASET' && event.data.queryDefinition) {
        // see if there is a group
        const group = find(event.data.queryDefinition.query.all_groups, ['slug', event.data.groupSlugFromSearch])

        // if parent, it's not a duplicate of parent
        if (!group) {
          return false
        }

        // if group has "is_parent" flag - it is a duplicate
        return !!group?.is_parent
      } else {
        return context._is_parent_duplicate
      }
    },
    _view: (context, event) => {
      if (event.type === 'done.invoke.LOADING_DATASET' && event.data.view) {
        return event.data.view
      } else {
        return context._view
      }
    },

    // Store prev here so we can compare for `hasChanged`
    _prev_query: (context, event) => {
      if (event.type === 'done.invoke.LOADING_DATASET' && event.data.queryDefinition) {
        return event.data.queryDefinition.query
      } else {
        return context._prev_query
      }
    },
    _dataset_from_graph: (context, event) => {
      if (event.type === 'done.invoke.LOADING_DATASET' && event.data.datasetFromGraph) {
        return event.data.datasetFromGraph
      } else {
        return context._dataset_from_graph
      }
    },
    _has_customer_column: (context, event) => {
      if (event.type === 'done.invoke.LOADING_DATASET' && event.data.queryDefinition) {
        return datasetHasCustomerColumn(event.data.queryDefinition.query.columns)
      } else {
        return context._has_customer_column
      }
    },
    columns_order: (context, event) => {
      if (event.type === 'done.invoke.LOADING_DATASET' && event.data.queryDefinition) {
        return event.data.queryDefinition.query.columns_order
      } else {
        return context.columns_order
      }
    },
  }),

  handleLoadingPlotFormResponse: assign<DatasetContext, DatasetEvent>({
    _plotter_context: (context, event) => {
      if (event.type === 'done.invoke.LOADING_PLOT_FORM') {
        return {
          ...context._plotter_context,
          is_edit: event.data.initialEvent.type === 'EDIT_PLOT',
          form_state: event.data.formState,
        }
      } else {
        return context._plotter_context
      }
    },
  }),
  handleLoadingPlotDataResponse: assign<DatasetContext, DatasetEvent>({
    _plotter_context: (context, event) => {
      if (event.type === 'done.invoke.LOADING_PLOT_DATA') {
        return {
          ...context._plotter_context,
          plot_data: event.data,
        }
      } else {
        return context._plotter_context
      }
    },
  }),

  //////////////// Dataset Definition Form actions ////////////////
  handleLoadingDefinitionResponse: assign<DatasetContext, DatasetEvent>({
    _definition_context: (context, event) => {
      if (event.type === 'done.invoke.LOADING_DEFINITION' || event.type === 'done.invoke.LOADING_ADD_COLUMN_OPTIONS') {
        return {
          ...context._definition_context,
          // Update the cohort and append/join activity column select and column filter options:
          column_options: event.data.column_options,
          // Update form value with whatever comes back from make_definition api:
          form_value: {
            ...event.data.form_value,
            append_activities: event.data.form_value.append_activities?.map((appendActivity: any) => ({
              ...appendActivity,
              // Add unique id to help with reordering/deleting/duplicating
              _unique_id: makeShortid(),
            })),
          },
        }
      } else {
        return context._definition_context
      }
    },
    _plan_execution: (context, event) => {
      if (event.type === 'done.invoke.LOADING_DEFINITION') {
        // Make sure the current dataset query definition is copied over to
        // _plan_execution on edit:
        return {
          plan: [],
          show_user: false,
          staged_dataset: makeQueryDefinitionFromContext(context),
          staged_compiled_sql: [],
        }
      } else {
        return context._plan_execution
      }
    },
  }),
  scrollToTopOfInfoPanel: (_: DatasetContext, event: DatasetEvent) => {
    if (event.type === 'done.invoke.SUBMITTING_DEFINITION') {
      const infoPanelElement = document.getElementById(INFO_PANEL_CONTAINER_ID)

      // Wrap in setTimeout, so DOM updates with columns before the scroll is engaged
      // So there's the proper height to be calculated against
      setTimeout(() => {
        if (infoPanelElement) {
          infoPanelElement.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }, 300)
    }
  },
  scrollActivityIntoView: (_: DatasetContext, event: DatasetEvent) => {
    if (event.type === 'done.invoke.UPDATING_DEFINITION') {
      const infoPanelElement = document.getElementById(INFO_PANEL_CONTAINER_ID)
      let activityElementId = ''

      if (event.data.initialEvent.type === 'SELECT_COHORT_ACTIVITY') {
        activityElementId = 'cohort-activity'
      }
      if (
        event.data.initialEvent.type === 'SELECT_APPEND_ACTIVITY' ||
        event.data.initialEvent.type === 'SELECT_RELATIONSHIP'
      ) {
        activityElementId = `append-activity-${event.data.initialEvent.fieldIndex}`
      }

      // Wrap in setTimeout, so DOM updates with columns before the scroll is engaged
      // So there's the proper height to be calculated against
      setTimeout(() => {
        const activityToScrollTo = document.getElementById(activityElementId)

        // Make sure the selected activity is scrolled into view!
        if (infoPanelElement && activityToScrollTo) {
          infoPanelElement.scrollTo({ top: activityToScrollTo.offsetTop, behavior: 'smooth' })
        }
      }, 0)
    }
  },
  clearDatasetDefintionMinusOccurrence: assign<DatasetContext, DatasetEvent>({
    _definition_context: (context, event) => {
      if (event.type === 'SELECT_COHORT_OCCURRENCE') {
        return {
          column_options: [],
          form_value: {
            cohort: {
              activity_ids: [],
              occurrence_filter: {
                occurrence: event.occurrence,
              },
            },
          },
        }
      } else {
        return context._definition_context
      }
    },
  }),
  handleUpdatingDefinitionResponse: assign<DatasetContext, DatasetEvent>({
    _definition_context: (context, event) => {
      if (
        event.type === 'done.invoke.UPDATING_DEFINITION' &&
        (event.data.initialEvent.type === 'SELECT_COHORT_ACTIVITY' ||
          event.data.initialEvent.type === 'SELECT_TIME_COHORT_RESOLUTION' ||
          event.data.initialEvent.type === 'SELECT_COHORT_OCCURRENCE' ||
          event.data.initialEvent.type === 'SELECT_APPEND_ACTIVITY' ||
          event.data.initialEvent.type === 'SELECT_RELATIONSHIP')
      ) {
        return {
          ...context._definition_context,
          column_options: [event.data.activityColumnOptions, ...context._definition_context.column_options],
          form_value: event.data.formValue,
        }
      } else {
        return context._definition_context
      }
    },
  }),
  explorerResetDatasetDefinition: assign<DatasetContext, DatasetEvent>({
    _definition_context: (context, event) => {
      if (event.type === 'EXPLORER_RESET_DATASET_DEFINITION') {
        return {
          ...context._definition_context,
          form_value: {
            ...context._definition_context.form_value,
            cohort: event.cohort,
            append_activities: event.appendActivities,
          },
        }
      } else {
        return context._definition_context
      }
    },
  }),
  chatResetDatasetDefinition: assign<DatasetContext, DatasetEvent>({
    _definition_context: (context, event) => {
      if (event.type === 'CHAT_RESET_DATASET_DEFINITION') {
        const eventData = _.omit(event, ['type'])

        return {
          ...context._definition_context,
          column_options: event.column_options || [],
          form_value: {
            ...context._definition_context.form_value,
            ...eventData,
          },
        }
      } else {
        return context._definition_context
      }
    },
  }),
  setPlanExecution: assign<DatasetContext, DatasetEvent>({
    _plan_execution: (context, event) => {
      if (
        event.type === 'done.invoke.SUBMITTING_DEFINITION' ||
        event.type === 'done.invoke.SUBMITTING_ACTIVITY_COLUMNS' ||
        event.type === 'done.invoke.SUBMITTING_RECONCILER' ||
        event.type === 'done.invoke.SUBMITTING_COLUMN_SHORTCUT' ||
        event.type === 'done.invoke.SUBMITTING_ROW_SHORTCUT' ||
        event.type === 'done.invoke.SUBMITTING_SWAP_GROUP_COLUMN' ||
        event.type === 'done.invoke.SUBMITTING_DELETE_COLUMNS' ||
        event.type === 'done.invoke.SUBMITTING_EDIT_SPEND_COLUMNS' ||
        event.type === 'done.invoke.SUBMITTING_DELETE_SPEND_COLUMNS'
      ) {
        return event.data.planExecution
      } else {
        return context._plan_execution
      }
    },
  }),
  setHasCustomerColumn: assign<DatasetContext, DatasetEvent>({
    _has_customer_column: (context, event) => {
      if (event.type === '' || event.type === 'PERSIST_PLAN_EXECUTION') {
        return datasetHasCustomerColumn(context.columns)
      } else {
        return context._has_customer_column
      }
    },
  }),

  handleSubmittingCreateGroupResponse: assign<DatasetContext, DatasetEvent>({
    // Since a group was just created, update the dataset with the
    // staged_dataset from the plan execution
    all_groups: (context, event) => {
      if (event.type === 'done.invoke.SUBMITTING_CREATE_GROUP') {
        return event.data.planExecution.staged_dataset.query.all_groups
      } else {
        return context.all_groups
      }
    },
    _view: (context, event) => {
      if (event.type === 'done.invoke.SUBMITTING_CREATE_GROUP') {
        return viewTypeConstants.TABLE
      } else {
        return context._view
      }
    },
  }),
  persistPlanExecution: assign<DatasetContext, DatasetEvent>({
    // NOTE - this comes from a transient transition, hence event.type === ''
    fields: (context, event) => {
      if (event.type === '' || event.type === 'PERSIST_PLAN_EXECUTION') {
        return context._plan_execution?.staged_dataset?.fields
      } else {
        return context.fields
      }
    },
    activities: (context, event) => {
      if (event.type === '' || event.type === 'PERSIST_PLAN_EXECUTION') {
        return context._plan_execution?.staged_dataset?.query?.activities || []
      } else {
        return context.activities
      }
    },
    columns: (context, event) => {
      if (event.type === '' || event.type === 'PERSIST_PLAN_EXECUTION') {
        return context._plan_execution?.staged_dataset?.query?.columns || []
      } else {
        return context.columns
      }
    },
    order: (context, event) => {
      if (event.type === '' || event.type === 'PERSIST_PLAN_EXECUTION') {
        return context._plan_execution?.staged_dataset?.query?.order || []
      } else {
        return context.order
      }
    },
    all_groups: (context, event) => {
      if (event.type === '' || event.type === 'PERSIST_PLAN_EXECUTION') {
        return context._plan_execution?.staged_dataset?.query?.all_groups || []
      } else {
        return context.all_groups
      }
    },
    swapped_ids: (context, event) => {
      if (event.type === '' || event.type === 'PERSIST_PLAN_EXECUTION') {
        return context._plan_execution?.staged_dataset?.query?.swapped_ids || []
      } else {
        return context.swapped_ids
      }
    },
  }),
  executeUiInstructions: assign<DatasetContext, DatasetEvent>({
    // Handle go_to_group ui_instructions
    _group_slug: (context, event) => {
      const validEventType = event.type === '' || event.type === 'PERSIST_PLAN_EXECUTION'
      const uiInstructions = context._plan_execution?.ui_instructions

      // ui_instructions can be an object or array of objects (eventually let's just do array of objects)
      let goToGroupUiInstructions
      if (isArray(uiInstructions)) {
        // it's an array
        goToGroupUiInstructions = find(uiInstructions, ['kind', 'go_to_group'])
      } else {
        // it's an object
        goToGroupUiInstructions = uiInstructions?.kind === 'go_to_group' ? uiInstructions : undefined
      }

      if (validEventType && uiInstructions && goToGroupUiInstructions) {
        return goToGroupUiInstructions.group_slug
      } else {
        return context._group_slug
      }
    },

    // Handle go_to_group - _is_parent_duplicate - ui_instructions
    _is_parent_duplicate: (context, event) => {
      const validEventType = event.type === '' || event.type === 'PERSIST_PLAN_EXECUTION'
      const uiInstructions = context._plan_execution?.ui_instructions

      // ui_instructions can be an object or array of objects (eventually let's just do array of objects)
      let goToGroupUiInstructions
      if (isArray(uiInstructions)) {
        // it's an array
        goToGroupUiInstructions = find(uiInstructions, ['kind', 'go_to_group'])
      } else {
        // it's an object
        goToGroupUiInstructions = uiInstructions?.kind === 'go_to_group' ? uiInstructions : undefined
      }

      // if valid group - check/set if it is a duplicate parent group
      if (validEventType && uiInstructions && goToGroupUiInstructions) {
        const stagedGroups = context?._plan_execution?.staged_dataset?.query?.all_groups
        const newGroup = find(stagedGroups, ['slug', goToGroupUiInstructions.group_slug])

        return !!newGroup?.is_parent
      } else {
        return context._is_parent_duplicate
      }
    },

    // Handle notification ui_instructions
    _notification: (context, event) => {
      const validEventType = event.type === '' || event.type === 'PERSIST_PLAN_EXECUTION'
      const uiInstructions = context._plan_execution?.ui_instructions

      // ui_instructions can be an object or array of objects (eventually let's just do array of objects)
      let notificationUiInstructions
      if (isArray(uiInstructions)) {
        // it's an array
        // grab all notifications
        notificationUiInstructions = filter(uiInstructions, ['kind', 'push_notification'])
      } else {
        // it's an object
        notificationUiInstructions = uiInstructions?.kind === 'push_notification' ? uiInstructions : undefined
      }

      if (validEventType && uiInstructions && notificationUiInstructions) {
        if (isArray(notificationUiInstructions)) {
          // return each notification if array
          // compact is used to help typescript (filter should only include instructions that have notifications)
          return _.compact(notificationUiInstructions.map((instruction) => instruction.notification))
        } else {
          // return single notification if object
          return notificationUiInstructions.notification
        }
      } else {
        return context._notification
      }
    },

    // Handle go to plot
    _view: (context, event) => {
      const validEventType = event.type === '' || event.type === 'PERSIST_PLAN_EXECUTION'
      const uiInstructions = context._plan_execution?.ui_instructions

      // ui_instructions can be an object or array of objects (eventually let's just do array of objects)
      let goToPlotViewInstructions
      if (isArray(uiInstructions)) {
        // it's an array
        goToPlotViewInstructions = find(uiInstructions, ['kind', 'go_to_plot'])
      } else {
        // it's an object
        goToPlotViewInstructions = uiInstructions?.kind === 'go_to_plot' ? uiInstructions : undefined
      }

      if (validEventType && uiInstructions && goToPlotViewInstructions?.plot_slug) {
        return viewTypeConstants.PLOT
      } else {
        return context._view
      }
    },

    _plot_slug: (context, event) => {
      const validEventType = event.type === '' || event.type === 'PERSIST_PLAN_EXECUTION'
      const uiInstructions = context._plan_execution?.ui_instructions
      // ui_instructions can be an object or array of objects (eventually let's just do array of objects)
      let goToPlotUiInstructions
      if (isArray(uiInstructions)) {
        // it's an array
        goToPlotUiInstructions = find(uiInstructions, ['kind', 'go_to_plot'])
      } else {
        // it's an object
        goToPlotUiInstructions = uiInstructions?.kind === 'go_to_plot' ? uiInstructions : undefined
      }

      if (validEventType && uiInstructions && goToPlotUiInstructions?.plot_slug) {
        return goToPlotUiInstructions.plot_slug
      } else {
        return context._plot_slug
      }
    },
  }),

  setDefaultView: assign<DatasetContext, DatasetEvent>({
    _view: (context, event) => {
      if (event.type === 'done.invoke.SUBMITTING_DEFINITION') {
        return viewTypeConstants.TABLE
      } else {
        return context._view
      }
    },
  }),

  updateDatasetStory: assign<DatasetContext, DatasetEvent>({
    story: (context, event) => {
      if (event.type === 'EDIT_DATASET_STORY_CANCEL' || event.type === 'UPDATE_DATASET_STORY') {
        return event.story
      } else {
        return context.story
      }
    },
  }),

  resetDatasetStory: assign<DatasetContext, DatasetEvent>({
    story: (context, event) => {
      if (
        event.type === 'done.invoke.SUBMITTING_COLUMN_SHORTCUT' &&
        event?.data?.planExecution?.staged_dataset?.query?.story
      ) {
        return event.data.planExecution.staged_dataset.query.story
      } else {
        return context.story
      }
    },
  }),

  // Group actions
  setSelectedGroup: assign<DatasetContext, DatasetEvent>({
    _group_slug: (context, event) => {
      if (event.type === 'SELECT_GROUP') {
        return event.groupSlug
      } else {
        return context._group_slug
      }
    },
    _is_parent_duplicate: (context, event) => {
      if (event.type === 'SELECT_GROUP') {
        // if parent - it's not a duplicate
        if (!event.groupSlug) {
          return false
        }

        const group = find(context.all_groups, ['slug', event.groupSlug])

        // if group has "is_parent" - it's a duplicate of the parent
        if (group?.is_parent) {
          return true
        }

        // otherwise it's a regular group (not a duplicate of the parent)
        return false
      } else {
        return context._is_parent_duplicate
      }
    },
    // Make sure to set the view back to TABLE view on tab change
    _view: (context, event) => {
      if (event.type === 'SELECT_GROUP') {
        return viewTypeConstants.TABLE
      } else {
        return context._view
      }
    },
    _plot_slug: (context, event) => {
      if (event.type === 'SELECT_GROUP') {
        return undefined
      } else {
        return context._plot_slug
      }
    },

    _plotter_context: (context, event) => {
      if (event.type === 'SELECT_GROUP') {
        return {}
      } else {
        return context._plotter_context
      }
    },
  }),
  // when duplicating or creating a new group
  // it's added to the end
  // now select it
  selectLastGroup: assign<DatasetContext, DatasetEvent>({
    _group_slug: (context, event) => {
      if (event.type === 'DUPLICATE_GROUP' || event.type === 'done.invoke.SUBMITTING_CREATE_GROUP') {
        const lastGroup = _.last(context.all_groups)

        if (lastGroup) {
          return lastGroup.slug
        }
        return context._group_slug
      }

      return context._group_slug
    },
  }),
  // when duplicating a group
  // maintain duplicate group's column order in new group
  maintainDuplicateGroupColumnOrder: assign<DatasetContext, DatasetEvent>({
    columns_order: (context, event) => {
      if (event.type === 'DUPLICATE_GROUP') {
        const lastGroup: IDatasetQueryGroup | undefined = _.last(context.all_groups)

        if (lastGroup) {
          // find the group's columns_order this group was duplicated from
          const originalGroupSlug = lastGroup.duplicated_from_group as string
          const originalGroupColumnsOrder = context.columns_order?.[originalGroupSlug]

          // return early if the original group didn't have columns order set
          if (!originalGroupColumnsOrder) {
            return context.columns_order
          }

          // // otherwise, set the new groups columns_order to duplicate original group
          const newGroupSlug: string = lastGroup.slug

          const updatedColumnsOrder = {
            ...context.columns_order,
            [newGroupSlug]: originalGroupColumnsOrder,
          }

          return updatedColumnsOrder
        }

        return context.columns_order
      }

      return context.columns_order
    },
  }),
  selectLastDuplicateParent: assign<DatasetContext, DatasetEvent>({
    _group_slug: (context) => {
      const parentDuplicateGroups = filter(context.all_groups, (grp) => grp.is_parent)
      const lastParentDuplicateGroup = _.last(parentDuplicateGroups) as IDatasetQueryGroup

      if (lastParentDuplicateGroup?.slug) {
        return lastParentDuplicateGroup.slug
      }

      return context._group_slug
    },
    _is_parent_duplicate: () => true,
  }),
  duplicateParent: assign<DatasetContext, DatasetEvent>({
    all_groups: (context, event) => {
      if (event.type === 'DUPLICATE_PARENT') {
        logger.debug({ context, event }, 'duplicateParent')

        const existingSlugs = _.map(context.all_groups, 'slug')
        const newGroupSlug = dedupeLabel({ existingLabels: existingSlugs, label: 'Parent Duplicate', snakeCase: true })

        const newParentDuplicateGroup = {
          is_parent: true,
          name: 'PARENT',
          slug: newGroupSlug,
          parent_filters: [],
          columns: [],
          metrics: [],
          computed_columns: [],
          pivot: [],
          order: context.order,
          _column_ids: [],
        } as IDatasetQueryGroup

        const existingDuplicateParentGroups = context.all_groups.filter((grp) => grp.is_parent)
        const regularGroups = context.all_groups.filter((grp) => !grp.is_parent)

        return [...existingDuplicateParentGroups, newParentDuplicateGroup, ...regularGroups]
      } else {
        return context.all_groups
      }
    },
  }),

  // when duplicating a parent
  // maintain original parent's column order in new group
  maintainDuplicateParentColumnOrder: assign<DatasetContext, DatasetEvent>({
    columns_order: (context, event) => {
      if (event.type === 'DUPLICATE_PARENT') {
        // get last created duplicate parent tab
        const parentDuplicateGroups = filter(context.all_groups, (grp) => grp.is_parent)
        const lastParentDuplicateGroup = _.last(parentDuplicateGroups) as IDatasetQueryGroup
        const newGroupSlug = lastParentDuplicateGroup.slug

        const originalParentColumnsOrder = context.columns_order?.['parent']

        // return early if the parent didn't have columns_order set
        if (!originalParentColumnsOrder || !newGroupSlug) {
          return context.columns_order
        }

        const updatedColumnsOrder = {
          ...context.columns_order,
          [newGroupSlug]: originalParentColumnsOrder,
        }

        return updatedColumnsOrder
      }

      return context.columns_order
    },
  }),

  duplicateGroup: assign<DatasetContext, DatasetEvent>({
    all_groups: (context, event) => {
      if (event.type === 'DUPLICATE_GROUP') {
        const groupIndex = getGroupIndex({ context, groupSlug: event.groupSlug })
        // clone here (not just ...group in newGroup, b/c otherwise changes to newGroup will effect oldGroup too)
        const group = cloneDeep(context.all_groups[groupIndex])
        // Make unique group slug and name
        const existingSlugs = map(context.all_groups, 'slug')
        const existingNames = map(context.all_groups, 'name')
        const newGroupSlug = dedupeLabel({ existingLabels: existingSlugs, label: group.slug, snakeCase: true })
        const newGroupName = dedupeLabel({ existingLabels: existingNames, label: group.name })

        const newGroup = {
          ...group,
          name: newGroupName,
          slug: newGroupSlug,
          duplicated_from_group: group.slug,
        }

        return [...context.all_groups, newGroup]
      } else {
        return context.all_groups
      }
    },
  }),
  deleteGroup: assign<DatasetContext, DatasetEvent>({
    all_groups: (context, event) => {
      if (event.type === 'DELETE_GROUP_SUBMIT') {
        const groupIndex = getGroupIndex({ context, groupSlug: event.groupSlug })
        const updatedAllGroups = [...context.all_groups]
        updatedAllGroups.splice(groupIndex, 1)
        return updatedAllGroups
      } else {
        return context.all_groups
      }
    },
    // Set _group_slug back to parent dataset:
    _group_slug: () => {
      return null
    },
    _is_parent_duplicate: () => {
      return false
    },
    // remove columns_order for that group if it exists
    columns_order: (context, event) => {
      if (event.type === 'DELETE_GROUP_SUBMIT') {
        const { groupSlug } = event

        // the group had columns_order, so remove it
        if (includes(keys(context.columns_order), groupSlug)) {
          const newColumnsOrder = omit(context.columns_order, groupSlug)
          return newColumnsOrder
        }

        return context.columns_order
      }

      return context.columns_order
    },
  }),
  renameGroup: assign<DatasetContext, DatasetEvent>({
    all_groups: (context, event) => {
      if (event.type === 'RENAME_GROUP_SUBMIT') {
        const groupIndex = getGroupIndex({ context, groupSlug: event.groupSlug })
        // clone here (not just ...group in newGroup, b/c otherwise changes to newGroup will effect oldGroup too)
        const group = cloneDeep(context.all_groups[groupIndex])

        const updatedGroup = {
          ...group,
          name: event.name,
        }

        // add updatedGroup to all_groups
        const updatedAllGroups = [...context.all_groups]
        updatedAllGroups[groupIndex] = updatedGroup

        return updatedAllGroups
      } else {
        return context.all_groups
      }
    },
  }),
  resetPlotSlug: assign<DatasetContext, DatasetEvent>({
    _plot_slug: (context) => {
      const groupSlug = context._group_slug
      if (groupSlug) {
        const group = getGroupFromContext({ context, groupSlug })
        if (group && group.plots && group.plots.length > 0) {
          return group.plots[0].slug
        }
      }
      // If this group has no plots, clear out _plot_slug:
      return undefined
    },
  }),
  clearPlotterContextFormState: assign<DatasetContext, DatasetEvent>({
    // maintain existing plot_data, but clear out form_state so loading state shows an
    // empty plot beneath it on editing a plot:
    _plotter_context: (context) => {
      return {
        plot_data: context._plotter_context.plot_data,
        form_state: undefined,
        is_edit: false,
      }
    },
  }),
  clearPlotterContext: assign<DatasetContext, DatasetEvent>({
    _plotter_context: () => {
      return {}
    },
  }),
  removePlot: assign<DatasetContext, DatasetEvent>({
    all_groups: (context, event) => {
      if (event.type === 'REMOVE_PLOT') {
        const groupIndex = getGroupIndex({ context, groupSlug: event.groupSlug })
        // clone here (not just ...group in newGroup, b/c otherwise changes to newGroup will effect oldGroup too)
        const group = cloneDeep(context.all_groups[groupIndex])

        // remove plot by plotSlug:
        const existingPlots = group.plots || []
        const plotIndex = findIndex(existingPlots, ['slug', event.plotSlug])
        existingPlots.splice(plotIndex, 1)

        const updatedGroup = {
          ...group,
          plots: existingPlots,
        }

        // add updatedGroup with removed plot to all_groups:
        const updatedAllGroups = [...context.all_groups]
        updatedAllGroups[groupIndex] = updatedGroup
        return updatedAllGroups
      }

      return context.all_groups
    },
  }),
  selectPlot: assign<DatasetContext, DatasetEvent>({
    _plot_slug: (context, event) => {
      if (event.type === 'SELECT_PLOT') {
        return event.plotSlug
      }
      return context._plot_slug
    },
  }),
  selectFirstPlot: assign<DatasetContext, DatasetEvent>({
    // Set default plot_slug if the group has any plots available:
    _plot_slug: (context, event) => {
      if (event.type === 'SELECT_GROUP' || event.type === 'SWITCH_MAIN_VIEW') {
        const groupSlug = get(event, 'groupSlug', context._group_slug)
        const group = getGroupFromContext({ context, groupSlug })
        if (group && group.plots && group.plots.length > 0) {
          return group.plots[0].slug
        }
        // If this group has no plots, clear out _plot_slug:
        return undefined
      } else {
        return context._plot_slug
      }
    },
  }),
  updateGroupPlot: assign((context: DatasetContext, event: DatasetEvent) => {
    if (event.type === 'SUBMIT_PLOT_SUCCESS') {
      const groupIndex = getGroupIndex({ context, groupSlug: event.groupSlug })
      // clone here (not just ...group in newGroup, b/c otherwise changes to newGroup will effect oldGroup too)
      const group = cloneDeep(context.all_groups[groupIndex])
      const groupPlotSlugs = _.map(group.plots, 'slug')

      const updatedGroupPlot = {
        // Use user inputed title as the plot's title:
        name: event.plotConfig.axes.title,
        // Give existing plot slug, or give each plot a unique slug (per group):
        slug: event.plotSlug || makeUniqueId({ id: _.snakeCase(event.plotConfig.axes.title), ids: groupPlotSlugs }),
        // Dataset plot config:
        config: event.plotConfig,
      }

      let updatedPlots = group.plots || []
      let updatedStory = context.story ? { ...context.story } : { content: [] }

      if (event.plotSlug) {
        // EDIT MODE:
        // - Overwrite existing IGroupPlotConfig (title and slug will be updated!)
        const plotIndex = findIndex(updatedPlots, ['slug', event.plotSlug])
        updatedPlots[plotIndex] = updatedGroupPlot
      } else {
        // NEW MODE:
        // - Add new plot to group.plots
        updatedPlots = [...updatedPlots, updatedGroupPlot]

        // add all new plots to story content
        let updatedContent = updatedStory?.content ? [...updatedStory.content] : []
        updatedContent = [
          ...updatedContent,
          {
            type: 'plot',
            plot: {
              slug: updatedGroupPlot.slug,
              group_slug: event.groupSlug,
            },
          },
        ]
        updatedStory = {
          ...updatedStory,
          content: updatedContent,
        }
      }

      const updatedGroup = {
        ...group,
        plots: updatedPlots,
      }

      // add updatedGroup to all_groups
      const updatedAllGroups = [...context.all_groups]
      updatedAllGroups[groupIndex] = updatedGroup

      // Return updated all_groups, and the new plot slug as the selected _plot_slug:
      return {
        ...context,
        all_groups: updatedAllGroups,
        _plot_slug: updatedGroupPlot.slug,
        story: updatedStory,
      }
    }

    return context
  }),

  // Column actions
  updateMetricColumn: assign<DatasetContext, DatasetEvent>({
    all_groups: (context, event) => {
      if (event.type === 'EDIT_METRIC_COLUMN_SUBMIT') {
        const { groupSlug, metricColumn, isEdit } = event
        // find the group
        const groupIndex = getGroupIndex({ context, groupSlug })
        const group = context.all_groups[groupIndex]
        const parentColumn = find(context.columns, ['id', metricColumn.column_id]) || ({} as IDatasetQueryColumn)

        // column type depends on the selected parent column's type and the selected agg_function:
        const type = columnTypeFromAgg({
          aggFunction: metricColumn.agg_function,
          columnType: parentColumn.type,
        })

        // Add the updated type to metricColumn before persisting
        const updatedMetricColumn = {
          ...metricColumn,
          type,
        }

        if (isEdit) {
          // First check if staged value is any different from current value
          // If nothing has changed, don't do the below logic (eject)
          // (Doing updates on unchanged metrics will cause weird label over-writes)
          const currentMetric = find(group.metrics, ['id', metricColumn.id]) || {}
          const nothingChanged = isEmpty(diff(currentMetric, metricColumn))
          // Eject!
          if (nothingChanged) return context.all_groups

          // find the column that is being edited
          const columnIndex = findIndex(group.metrics, (col) => col.id === metricColumn.id)
          const updatedMetrics = [...group.metrics]
          updatedMetrics[columnIndex] = updatedMetricColumn

          // add updatedMetrics to the group
          const updatedGroup = {
            ...group,
            metrics: updatedMetrics,
          }

          // add updatedGroup to all_groups
          const updatedAllGroups = [...context.all_groups]
          updatedAllGroups[groupIndex] = updatedGroup

          return updatedAllGroups
        } else {
          // It's a new column so it needs a new id:
          // (starts with 'metric_' prefix to ensure ids start with a letter)
          const newMetricId = _.snakeCase(
            `metric_${metricColumn.column_id}_${metricColumn.agg_function}_${makeShortid()}`
          )
          const updatedMetrics = [...group.metrics, { ...updatedMetricColumn, id: newMetricId }]

          // add updatedMetrics to the group
          const updatedGroup = {
            ...group,
            metrics: updatedMetrics,
          }

          // add updatedGroup to all_groups
          const updatedAllGroups = [...context.all_groups]
          updatedAllGroups[groupIndex] = updatedGroup

          return updatedAllGroups
        }
      } else {
        return context.all_groups
      }
    },
  }),
  updateGroupTabOrder: assign<DatasetContext, DatasetEvent>({
    all_groups: (context, event) => {
      if (event.type === 'UPDATE_GROUP_TAB_ORDER' && event.fromSlug && event.toSlug) {
        // do nothing if they moved it back to original position
        if (event.fromSlug === event.toSlug) {
          return context.all_groups
        }

        // do nothing if tried to move the parent tab
        if (event.fromSlug === RAW_DATASET_KEY) {
          return context.all_groups
        }

        // do nothing if you can't find the from group
        const fromGroup = find(context.all_groups, ['slug', event.fromSlug])

        if (!fromGroup) {
          return context.all_groups
        }

        const fromGroupIndex = getGroupIndex({ context, groupSlug: event.fromSlug })

        // if they tried to move it past the Parent - set as first group slug
        const toGroupIndex = getGroupIndex({ context, groupSlug: event.toSlug }) || 0

        const updatedGroups = [...context.all_groups]
        // remove the moved group
        updatedGroups.splice(fromGroupIndex, 1)
        // move the group to new index
        updatedGroups.splice(toGroupIndex, 0, fromGroup)

        return updatedGroups
      } else {
        return context.all_groups
      }
    },
  }),
  updateColumnFilter: assign<DatasetContext, DatasetEvent>({
    columns: (context, event) => {
      if (event.type === 'EDIT_FILTER_COLUMN_SUBMIT' && !event.groupSlug) {
        // no group slug so find the column in parent dataset
        const matched = context.columns.find((col) => col.id === event.column_id)

        const updatedColumns = context.columns.reduce((memo: IDatasetQueryColumn[], col) => {
          if (col === matched) {
            return memo.concat({
              ...col,
              filters: event.filters,
            })
          } else {
            return memo.concat(col)
          }
        }, [])

        return updatedColumns
      } else {
        return context.columns
      }
    },
    all_groups: (context, event) => {
      if (event.type === 'EDIT_FILTER_COLUMN_SUBMIT' && event.groupSlug) {
        // there was a group slug so find the group and update it's column
        const groupIndex = getGroupIndex({ context, groupSlug: event.groupSlug })
        const group = context.all_groups[groupIndex]
        const { column, columnType } = getGroupColumnAndColumnType({ group, columnId: event.column_id })
        // if no column is found return old state and throw error
        if (!column) {
          logger.warn(
            {
              columnId: event.column_id,
              group: group,
              context,
              states: buildDatasetMachine.states,
            },
            'EDIT_FILTER_COLUMN_SUBMIT, column not found in group'
          )
          reportError('EDIT_FILTER_COLUMN_SUBMIT, column not found in group', null, {
            columnId: event.column_id,
            group: group,
          })
          return context.all_groups
        }

        // otherwise you found the column so update it's filters
        const updatedGroup = { ...group }
        if (columnType === COLUMN_KIND_GROUP_BY) {
          const columnIdx = findIndex(group.columns, (col) => col.id === column.id)
          const updatedColumns = [...group.columns]
          updatedColumns[columnIdx].filters = event.filters
          updatedGroup.columns = updatedColumns
        }
        if (columnType === COLUMN_KIND_COMPUTED) {
          const columnIdx = findIndex(group.computed_columns, (col) => col.id === column.id)
          const updatedComputeColumns = [...group.computed_columns]
          updatedComputeColumns[columnIdx].filters = event.filters
          updatedGroup.computed_columns = updatedComputeColumns
        }
        if (columnType === COLUMN_KIND_GROUP_METRIC) {
          const columnIdx = findIndex(group.metrics, (col) => col.id === column.id)
          const updatedMetricColumns = [...group.metrics]
          updatedMetricColumns[columnIdx].filters = event.filters
          updatedGroup.metrics = updatedMetricColumns
        }
        if (columnType === COLUMN_KIND_CAC && group.spend && updatedGroup.spend) {
          const columnIdx = findIndex(group.spend.columns, (col) => col.id === column.id)
          const updatedSpendColumns = group.spend.columns ? [...group.spend.columns] : []
          updatedSpendColumns[columnIdx].filters = event.filters
          updatedGroup.spend.columns = updatedSpendColumns
        }

        // now update all_groups with newly updatedGroup
        const updatedAllGroups = [...context.all_groups]
        updatedAllGroups[groupIndex] = updatedGroup
        return updatedAllGroups
      } else {
        return context.all_groups
      }
    },
  }),
  addTableCellFilter: assign<DatasetContext, DatasetEvent>({
    columns: (context, event) => {
      if (event.type === 'ADD_TABLE_CELL_FILTER' && !event.groupSlug) {
        // find the column in parent dataset
        const matched = context.columns.find((col) => col.id === event.column_id)

        const updatedColumns = context.columns.reduce((memo: IDatasetQueryColumn[], col) => {
          if (col === matched) {
            const filterAlreadyExists = _.some(col.filters, (filter) => {
              if (
                filter.kind === event.filter.kind &&
                filter.or_null === event.filter.or_null &&
                filter.operator === event.filter.operator &&
                filter.value === event.filter.value
              ) {
                return true
              }

              return false
            })

            // only add filter if they haven't already added it
            const updatedFilters = [...col.filters]
            if (!filterAlreadyExists) {
              updatedFilters.push(event.filter)
            }

            return memo.concat({
              ...col,
              filters: updatedFilters,
            })
          } else {
            return memo.concat(col)
          }
        }, [])

        return updatedColumns
      } else {
        return context.columns
      }
    },
    all_groups: (context, event) => {
      if (event.type === 'ADD_TABLE_CELL_FILTER' && event.groupSlug) {
        // there was a group slug so find the group and update it's column
        const groupIndex = getGroupIndex({ context, groupSlug: event.groupSlug })
        const group = context.all_groups[groupIndex]
        const { column, columnType } = getGroupColumnAndColumnType({ group, columnId: event.column_id })
        // if no column is found return old state and throw error
        if (!column) {
          logger.warn(
            {
              columnId: event.column_id,
              group: group,
              context,
              states: buildDatasetMachine.states,
            },
            'ADD_TABLE_CELL_FILTER, column not found in group'
          )
          reportError('ADD_TABLE_CELL_FILTER, column not found in group', null, {
            columnId: event.column_id,
            group: group,
          })
          return context.all_groups
        }

        // otherwise you found the column so update it's filters
        const updatedGroup = { ...group }

        // check if filter already exists on the column
        const filterAlreadyExists = _.some(column.filters, (filter) => {
          if (
            filter.kind === event.filter.kind &&
            filter.or_null === event.filter.or_null &&
            filter.operator === event.filter.operator &&
            filter.value === event.filter.value
          ) {
            return true
          }

          return false
        })

        // Only add the column if the filter does not already exist
        if (!filterAlreadyExists) {
          if (columnType === COLUMN_KIND_GROUP_BY) {
            const columnIdx = findIndex(group.columns, (col) => col.id === column.id)
            const updatedColumns = [...group.columns]
            updatedColumns[columnIdx].filters = [...column.filters, event.filter]
            updatedGroup.columns = updatedColumns
          }
          if (columnType === COLUMN_KIND_COMPUTED) {
            const columnIdx = findIndex(group.computed_columns, (col) => col.id === column.id)
            const updatedComputeColumns = [...group.computed_columns]
            updatedComputeColumns[columnIdx].filters = [...column.filters, event.filter]
            updatedGroup.computed_columns = updatedComputeColumns
          }
          if (columnType === COLUMN_KIND_GROUP_METRIC) {
            const columnIdx = findIndex(group.metrics, (col) => col.id === column.id)
            const updatedMetricColumns = [...group.metrics]
            updatedMetricColumns[columnIdx].filters = [...column.filters, event.filter]
            updatedGroup.metrics = updatedMetricColumns
          }
          if (columnType === COLUMN_KIND_CAC && group.spend && updatedGroup.spend) {
            const columnIdx = findIndex(group.spend.columns, (col) => col.id === column.id)
            const updatedSpendColumns = group.spend.columns ? [...group.spend.columns] : []
            updatedSpendColumns[columnIdx].filters = [...column.filters, event.filter]
            updatedGroup.spend.columns = updatedSpendColumns
          }
        }

        // now update all_groups with newly updatedGroup
        const updatedAllGroups = [...context.all_groups]
        updatedAllGroups[groupIndex] = updatedGroup
        return updatedAllGroups
      } else {
        return context.all_groups
      }
    },
    _notification: (context, event) => {
      if (event.type === 'ADD_TABLE_CELL_FILTER') {
        return {
          type: 'success' as const,
          message: 'Filter Added',
          description: 'Please re-run dataset to get filtered data',
        }
      } else {
        return context._notification
      }
    },
  }),
  updateColumnVisible: assign<DatasetContext, DatasetEvent>({
    columns: (context, event) => {
      if (event.type === 'TOGGLE_COLUMN_VISIBILITY' && !event.groupSlug) {
        // on parent, so find and update the column's visible state
        const matched = context.columns.find((col) => col.id === event.columnId)

        const updatedColumns = context.columns.reduce((memo: IDatasetQueryColumn[], col) => {
          if (col === matched) {
            return memo.concat({
              ...col,
              output: !col.output,
            })
          } else {
            return memo.concat(col)
          }
        }, [])

        return updatedColumns
      } else {
        return context.columns
      }
    },
    all_groups: (context, event) => {
      if (event.type === 'TOGGLE_COLUMN_VISIBILITY' && event.groupSlug) {
        // on group slug, so find the group and update it's correct column types columns's visible state
        const groupIndex = getGroupIndex({ context, groupSlug: event.groupSlug })
        const group = context.all_groups[groupIndex]
        const { column, columnType } = getGroupColumnAndColumnType({ group, columnId: event.columnId })
        // if no column is found return old state and throw error
        if (!column) {
          logger.warn(
            {
              columnId: event.columnId,
              group: group,
              context,
              states: buildDatasetMachine.states,
            },
            'TOGGLE_COLUMN_VISIBILITY, column not found in group'
          )
          reportError('TOGGLE_COLUMN_VISIBILITY, column not found in group', null, {
            columnId: event.columnId,
            group: group,
          })
          return context.all_groups
        }

        // otherwise you found the column so update it's output
        const updatedGroup = { ...group }
        if (columnType === COLUMN_KIND_GROUP_BY) {
          const columnIdx = findIndex(group.columns, (col) => col.id === column.id)
          const updatedColumns = [...group.columns]
          updatedColumns[columnIdx].output = !updatedColumns[columnIdx].output
          updatedGroup.columns = updatedColumns
        }
        if (columnType === COLUMN_KIND_COMPUTED) {
          const columnIdx = findIndex(group.computed_columns, (col) => col.id === column.id)
          const updatedComputeColumns = [...group.computed_columns]
          updatedComputeColumns[columnIdx].output = !updatedComputeColumns[columnIdx].output
          updatedGroup.computed_columns = updatedComputeColumns
        }
        if (columnType === COLUMN_KIND_GROUP_METRIC) {
          const columnIdx = findIndex(group.metrics, (col) => col.id === column.id)
          const updatedMetricColumns = [...group.metrics]
          updatedMetricColumns[columnIdx].output = !updatedMetricColumns[columnIdx].output
          updatedGroup.metrics = updatedMetricColumns
        }
        if (columnType === COLUMN_KIND_CAC && group.spend && updatedGroup.spend) {
          const columnIdx = findIndex(group.spend.columns, (col) => col.id === column.id)
          const updatedSpendColumns = group.spend.columns ? [...group.spend.columns] : []
          updatedSpendColumns[columnIdx].output = !updatedSpendColumns[columnIdx].output
          updatedGroup.spend.columns = updatedSpendColumns
        }

        // now update all_groups with newly updatedGroup
        const updatedAllGroups = [...context.all_groups]
        updatedAllGroups[groupIndex] = updatedGroup
        return updatedAllGroups
      } else {
        return context.all_groups
      }
    },
  }),

  editActivityName: assign<DatasetContext, DatasetEvent>({
    activities: (context, event) => {
      if (event.type === 'EDIT_ACTIVITY_NAME' && event.id && event.name) {
        const { id, name } = event
        const updatedActivities = [...context.activities]
        // find the activity index
        const activityIndex = findIndex(updatedActivities, (activity) => activity.id === id)
        if (activityIndex !== -1) {
          // update the name override of the activity
          updatedActivities[activityIndex].name_override = name
        }

        return updatedActivities
      } else {
        return context.activities
      }
    },
  }),

  editColumnLabel: assign<DatasetContext, DatasetEvent>({
    columns: (context, event) => {
      if (event.type === 'EDIT_COLUMN_LABEL' && !event.groupSlug) {
        // get columnIndex to replace later
        const { label, columnId } = event
        const columnIdx = findIndex(context.columns, (col) => col.id === columnId)
        let updatedColumn = find(context.columns, (col) => col.id === columnId)

        if (!updatedColumn) {
          logger.warn(
            {
              columnId,
              label,
              context,
              states: buildDatasetMachine.states,
            },
            'EDIT_COLUMN_LABEL, no column found'
          )
          reportError('EDIT_COLUMN_LABEL, no column found', null, {
            label,
            columnId,
          })
          return context.columns
        }

        updatedColumn = {
          ...updatedColumn,
          label,
        }

        const updatedColumns = [...context.columns]
        updatedColumns[columnIdx] = updatedColumn

        return updatedColumns
      } else {
        return context.columns
      }
    },
    all_groups: (context, event) => {
      if (event.type === 'EDIT_COLUMN_LABEL' && event.groupSlug) {
        const { groupSlug, columnId, label } = event
        const groupIndex = getGroupIndex({ context, groupSlug })
        const group = context.all_groups[groupIndex]
        const { column, columnType } = getGroupColumnAndColumnType({ group, columnId })

        // If no column is found, return original all_groups and fire error
        if (!column) {
          logger.warn(
            {
              groupSlug,
              label,
              context,
              states: buildDatasetMachine.states,
            },
            'EDIT_COLUMN_LABEL, column not found'
          )
          reportError('EDIT_COLUMN_LABEL, column not found', null, {
            column,
            label,
            groupSlug,
          })
          return context.all_groups
        }

        const updatedGroup = { ...group }
        if (columnType === COLUMN_KIND_GROUP_BY) {
          const columnIdx = findIndex(group.columns, (col) => col.id === column.id)
          const updatedColumns = [...group.columns]
          updatedColumns[columnIdx].label = label
          updatedGroup.columns = updatedColumns
        }
        if (columnType === COLUMN_KIND_COMPUTED) {
          const columnIdx = findIndex(group.computed_columns, (col) => col.id === column.id)
          const updatedComputeColumns = [...group.computed_columns]
          updatedComputeColumns[columnIdx].label = label
          updatedGroup.computed_columns = updatedComputeColumns
        }
        if (columnType === COLUMN_KIND_GROUP_METRIC) {
          const columnIdx = findIndex(group.metrics, (col) => col.id === column.id)
          const updatedMetricColumns = [...group.metrics]
          updatedMetricColumns[columnIdx].label = label
          updatedGroup.metrics = updatedMetricColumns
        }
        if (columnType === COLUMN_KIND_CAC && group.spend && updatedGroup.spend) {
          const columnIdx = findIndex(group.spend.columns, (col) => col.id === column.id)
          const updatedSpendColumns = group.spend.columns ? [...group.spend.columns] : []
          updatedSpendColumns[columnIdx].label = label
          updatedGroup.spend.columns = updatedSpendColumns
        }

        const updatedAllGroups = [...context.all_groups]
        updatedAllGroups[groupIndex] = updatedGroup

        return updatedAllGroups
      } else {
        return context.all_groups
      }
    },
  }),
  duplicateColumn: assign<DatasetContext, DatasetEvent>({
    all_groups: (context, event) => {
      // there was a group slug so find the group and update it's column
      if (event.type === 'DUPLICATE_COLUMN' && event.groupSlug) {
        const { columnId, groupSlug } = event
        const groupIndex = getGroupIndex({ context, groupSlug })
        const group = context.all_groups[groupIndex]
        const { column, columnType } = getGroupColumnAndColumnType({ group, columnId })

        // If no column is found, return original all_groups and fire error
        if (!column) {
          logger.warn(
            {
              groupSlug,
              context,
              states: buildDatasetMachine.states,
            },
            'DUPLICATE_COLUMN, column not found'
          )
          reportError('DUPLICATE_COLUMN, column not found', null, {
            column,
            groupSlug,
          })
          return context.all_groups
        }

        // // Duplicate the column with unique id and label
        const cleanLabel = getDedupedLabel({ formValue: context, groupSlug, label: column.label })
        const duplicateColumn = {
          // clone so as not to effect original column
          ...cloneDeep(column),
          id: `${column.id}_${makeShortid()}`,
          label: cleanLabel,
          output: true, // show all duplicated columns (even if they were hidden before)
        }

        // can be a computed_column or a metrics column
        let updatedMetrics = [...group.metrics]
        if (columnType === COLUMN_KIND_GROUP_METRIC) {
          updatedMetrics = [...updatedMetrics, duplicateColumn as IDatasetQueryGroupMetric]
        }

        let updatedComputeColumns = [...group.computed_columns]
        if (columnType === COLUMN_KIND_COMPUTED) {
          updatedComputeColumns = [...updatedComputeColumns, duplicateColumn as IDatasetQueryGroupComputedColumn]
        }

        const updatedGroup = {
          ...group,
          metrics: updatedMetrics,
          computed_columns: updatedComputeColumns,
        }

        const updatedAllGroups = [...context.all_groups]
        updatedAllGroups[groupIndex] = updatedGroup

        return updatedAllGroups
      } else {
        return context.all_groups
      }
    },
    columns: (context, event) => {
      if (event.type === 'DUPLICATE_COLUMN' && !event.groupSlug) {
        // only computed_columns in the parent
        // clone so as not to effect oriignal column
        const column = cloneDeep(find(context.columns, ['id', event.columnId]))
        if (!column) {
          // if no column is found, return original columns and throw error
          logger.warn(
            {
              column,
              groupSlug: event.groupSlug,
              context,
              states: buildDatasetMachine.states,
            },
            'DUPLICATE_COLUMN, column not found in parent'
          )
          reportError('DUPLICATE_COLUMN, column not found in parent', null, {
            column,
            groupSlug: event.groupSlug,
          })
          return context.columns
        }

        // Duplicate the column with unique id and label
        const existingLabels = _.map(context.columns, 'label')
        const cleanLabel = dedupeLabel({ existingLabels, label: column.label })
        const duplicateColumn = {
          ...column,
          id: `${column.id}_${makeShortid()}`,
          label: cleanLabel,
          output: true, // show all duplicated columns (even if they were hidden before)
        }

        return [...context.columns, duplicateColumn]
      } else {
        return context.columns
      }
    },
  }),
  addColumnPivot: assign<DatasetContext, DatasetEvent>({
    all_groups: (context, event) => {
      if (event.type === 'EDIT_COLUMN_PIVOT_SUBMIT') {
        const { groupSlug, columnId, orderedPivotedMetrics, pivotValues } = event
        const groupIndex = getGroupIndex({ context, groupSlug })
        const group = context.all_groups[groupIndex]

        const { pivotedComputedColumns, pivotedMetrics: defaultPivotedMetrics } = makeMetricsOnPivotedToggle({
          group,
          columnId,
          pivotValues,
        })

        // @ts-expect-error - orderedPivotedMetrics is never undefined according to types, but investigate if it might be
        const pivotedMetrics = [...orderedPivotedMetrics] || defaultPivotedMetrics

        // now update column to have pivoted true
        const columnIndex = findIndex(group.columns, (col) => col.id === columnId)
        const updatedColumn = {
          ...group.columns[columnIndex],
          pivoted: true,
        }
        const updatedColumns = [...group.columns]
        updatedColumns[columnIndex] = updatedColumn

        // remove the pivoted column from order (if it was ordered by it)
        const newOrder = filter(group.order, (order) => order.column_id !== group.columns[columnIndex].id)

        const updatedGroup = {
          ...group,
          columns: updatedColumns,
          computed_columns: [...group.computed_columns, ...pivotedComputedColumns],
          metrics: [...group.metrics, ...pivotedMetrics],
          order: newOrder,
        }

        const updatedAllGroups = [...context.all_groups]
        updatedAllGroups[groupIndex] = updatedGroup

        return updatedAllGroups
      } else {
        return context.all_groups
      }
    },
  }),
  reverseColumnPivot: assign<DatasetContext, DatasetEvent>({
    all_groups: (context, event) => {
      if (event.type === 'EDIT_COLUMN_PIVOT_REVERSE_SUBMIT') {
        const groupIndex = getGroupIndex({ context, groupSlug: event.groupSlug })
        const group = context.all_groups[groupIndex]
        const { computedColumns, metrics } = reverseMetricComputeColumns({ group })

        // Update column's pivoted in group (now false)
        const columnIndex = findIndex(group.columns, (col) => col.id === event.columnId)
        const updatedColumn = {
          ...group.columns[columnIndex],
          pivoted: false,
        }
        const updatedColumns = [...group.columns]
        updatedColumns[columnIndex] = updatedColumn

        const updatedGroup = {
          ...group,
          columns: updatedColumns,
          computed_columns: computedColumns,
          metrics,
        }

        const updatedAllGroups = [...context.all_groups]
        updatedAllGroups[groupIndex] = updatedGroup

        return updatedAllGroups
      } else {
        return context.all_groups
      }
    },
  }),
  updateOrderBy: assign<DatasetContext, DatasetEvent>({
    order: (context, event) => {
      if (event.type === 'EDIT_ORDER_BY_SUBMIT' && !event.groupSlug) {
        // if there is no group slug, update parent's order
        return event.orderBy
      }
      return context.order
    },
    all_groups: (context, event) => {
      if (event.type === 'EDIT_ORDER_BY_SUBMIT' && event.groupSlug) {
        // there was a group slug so:
        // find the group
        const groupIndex = getGroupIndex({ context, groupSlug: event.groupSlug })
        const group = context.all_groups[groupIndex]

        // replace order in that group
        const updatedGroup = {
          ...group,
          order: event.orderBy,
        }

        // replace group in all_groups
        const updatedAllGroups = [...context.all_groups]
        updatedAllGroups[groupIndex] = updatedGroup
        return updatedAllGroups
      }
      return context.all_groups
    },
  }),

  setError: assign<DatasetContext, DatasetEvent>({
    _error: (context, event) => {
      // Parent machine error type would be "error.execution"
      // whereas child machine error types are "error.platform.*"
      // For now, lets just test for "error.*"
      if (
        event.type === 'error.execution' ||
        event.type === 'error.platform.LOADING_DATASET' ||
        event.type === 'error.platform.LOADING_DEFINITION' ||
        event.type === 'error.platform.UPDATING_DEFINITION' ||
        event.type === 'error.platform.SUBMITTING_DEFINITION' ||
        event.type === 'error.platform.SUBMITTING_ACTIVITY_COLUMNS' ||
        event.type === 'error.platform.SUBMITTING_RECONCILER' ||
        event.type === 'error.platform.SUBMITTING_SWAP_GROUP_COLUMN' ||
        event.type === 'error.platform.SUBMITTING_CREATE_GROUP' ||
        event.type === 'error.platform.FETCHING_GRAPH_DATASET' ||
        event.type === 'error.platform.LOADING_PLOT_DATA' ||
        event.type === 'error.platform.LOADING_PLOT_FORM' ||
        event.type === 'error.platform.VALIDATING_FREEHAND_FUNCTION' ||
        event.type === 'error.platform.LOADING_PIVOT_COLUMN'
      ) {
        return event.data
      } else {
        return context._error
      }
    },
  }),
  setNotification: assign<DatasetContext, DatasetEvent>({
    _notification: (context, event) => {
      // UI notifications
      if (
        event.type === 'error.platform.SUBMITTING_COLUMN_SHORTCUT' ||
        event.type === 'error.platform.SUBMITTING_DELETE_COLUMNS' ||
        event.type === 'error.platform.SUBMITTING_EDIT_SPEND_COLUMNS' ||
        event.type === 'error.platform.SUBMITTING_DELETE_SPEND_COLUMNS' ||
        event.type === 'error.platform.LOADING_PIVOT_COLUMN' ||
        event.type === 'error.platform.UPDATING_INTEGRATIONS'
      ) {
        const errorNotification = {
          type: 'error' as const,
          message: 'Error',
          description: event.data?.message,
        }
        return errorNotification
      } else if (event.type === 'SAVE_UPDATE_SUCCESS') {
        // Don't send notification if passed silenceUpdateSuccess
        // (useful for autosave - which could fire once every 5 seconds)
        if (event.silenceUpdateSuccess) {
          return context._notification
        }

        // default success message
        let successNotification: INotification = {
          type: 'success' as const,
          message: 'Saved Successfully',
        }

        // set success notification if passed from Mavis
        if (event.notification) {
          successNotification = event.notification
        }

        return successNotification
      } else if (event.type === 'SAVE_CREATE_SUCCESS') {
        // set success notification if passed from Mavis
        if (event.notification) {
          return event.notification
        }

        return context._notification
      } else if (event.type === 'done.invoke.UPDATING_INTEGRATIONS') {
        // set success notification if passed from Mavis
        if (event?.data?.notification) {
          return event.data.notification
        }

        // otherwise send generic success message
        return {
          type: 'success' as const,
          message: 'Saved Successfully',
        }
      } else if (event.type === 'SAVE_FAILURE') {
        const message = parseMavisErrorCode(event.error.code)

        return {
          type: 'error' as const,
          message,
          description: event.error.message,
        }
      } else if (event.type === 'DATASET_RUN_DONE' && !isEmpty(event.notification)) {
        return event.notification
      } else {
        return context._notification
      }
    },
  }),

  // clear out the top level _error
  // this can be triggered from anywhere
  clearError: assign<DatasetContext, DatasetEvent>({
    _error: null,
  }),

  updateComputation: assign<DatasetContext, DatasetEvent>({
    columns: (context, event) => {
      if (event.type === 'EDIT_COMPUTATION_SUBMIT' && !event.groupSlug) {
        return handleUpdateComputationColumn({ context, event }) as IDatasetQueryColumn[]
      }
      return context.columns
    },
    all_groups: (context, event) => {
      if (event.type === 'EDIT_COMPUTATION_SUBMIT' && event.groupSlug) {
        return handleUpdateComputationColumn({ context, event }) as IDatasetQueryGroup[]
      }
      return context.all_groups
    },
  }),
  handleValidatingFreehandFunctionResponse: assign<DatasetContext, DatasetEvent>({
    _edit_context: (context, event) => {
      if (event.type === 'done.invoke.VALIDATING_FREEHAND_FUNCTION') {
        return {
          ...context._edit_context,
          validate_response: event.data,
        }
      } else {
        return context._edit_context
      }
    },
  }),
  handleLoadingPivotColumnResponse: assign<DatasetContext, DatasetEvent>({
    _edit_context: (context, event) => {
      if (event.type === 'done.invoke.LOADING_PIVOT_COLUMN') {
        return {
          ...context._edit_context,
          pivotColumnResponse: event.data,
        }
      } else {
        return context._edit_context
      }
    },
  }),

  editParentFilters: assign<DatasetContext, DatasetEvent>({
    all_groups: (context, event) => {
      if (event.type === 'EDIT_PARENT_FILTERS_SUBMIT') {
        const groupIndex = getGroupIndex({ context, groupSlug: event.groupSlug })
        const group = context.all_groups[groupIndex]

        const updatedGroup = {
          ...group,
          parent_filters: event.filters,
        }

        const updatedAllGroups = [...context.all_groups]
        updatedAllGroups[groupIndex] = updatedGroup

        return updatedAllGroups
      } else {
        return context.all_groups
      }
    },
  }),

  editHideDuplicateParentColumns: assign<DatasetContext, DatasetEvent>({
    all_groups: (context, event) => {
      if (event.type === 'EDIT_HIDE_DUPLICATE_PARENT_COLUMNS_SUBMIT') {
        const groupIndex = getGroupIndex({ context, groupSlug: event.groupSlug })
        const group = context.all_groups[groupIndex]
        const { isShowMode, hiddenColumnIds } = event

        const updatedGroup = {
          ...group,
          hidden_column_ids: hiddenColumnIds,
          is_show_mode: isShowMode,
        }

        const updatedAllGroups = [...context.all_groups]
        updatedAllGroups[groupIndex] = updatedGroup

        return updatedAllGroups
      } else {
        return context.all_groups
      }
    },
  }),
}

export default actions
