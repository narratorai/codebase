import {
  ColumnOptionWithId,
  SpendJoin,
  TableOption,
} from 'components/Datasets/BuildDataset/tools/SpendConfig/interfaces'
import { ICompany, IDataset, IUser } from 'graph/generated'
import _ from 'lodash'
import analytics from 'util/analytics'
import { FormState as BlockFormState } from 'util/blocks/interfaces'
import {
  BEFORE_ACTIVITY_RELATIONSHIPS,
  getGroupColumns,
  getGroupFromContext,
  isAllTimeResolution,
  RAW_DATASET_KEY,
  TIME_COHORT_RESOLUTION_FILTER_FIELDNAME,
} from 'util/datasets'
import { getAllColumnShortcuts, getQueryDefinition, updateDataset } from 'util/datasets/api'
import {
  DatasetColumnType,
  DatasetContext,
  DatasetEvent,
  IActivityColumnOptions,
  IDatasetPlotData,
  IDatasetQueryColumn,
  IDatasetQueryDefinition,
  IDefinitionContext,
  IDefinitionFormValue,
  IPlan,
  IPlanExecution,
  ITimeWindowConfig,
  IValidateFreehandResponse,
  viewTypeConstants,
} from 'util/datasets/interfaces'
import { reportError } from 'util/errors'
import { GetToken } from 'util/interfaces'
import { mavisRequest } from 'util/mavis-api'

import { makeColumnOptionsWithExistingLabels, makeNewGroupColumn, makeQueryDefinitionFromContext } from './helpers'

// We persist customer columns when changing cohort's occurrence/activity
// Currently this is always opt_group = 'Customer Attributes'
// BUT at some point this may change
// (i.e. mavis makes it more dynamic to activity stream name, etc...)
const CUSTOMER_ATTRIBUTE_GROUP_NAME = 'Customer Attributes'
const CUSTOMER_DIM_GROUP_NAME = 'Customer Dims'
const CUSTOMER_COLUMN_GROUP_NAMES = [CUSTOMER_ATTRIBUTE_GROUP_NAME, CUSTOMER_DIM_GROUP_NAME]

interface FetchActivityColumnsArgs {
  getToken: GetToken
  company: ICompany
  event: DatasetEvent
  activityStream?: string
}

const fetchActivityColumns = async ({ getToken, company, event, activityStream }: FetchActivityColumnsArgs) => {
  let eventParams

  if (event.type === 'SELECT_COHORT_OCCURRENCE') {
    // when changing to time cohort
    // default cohort_activity_ids/activity_ids to 'month' if switching to time cohort
    // (just like SELECT_TIME_COHORT_RESOLUTION sets to timeResolution - in this case 'month' as default)
    const activityIds = event.changedFromNormalToTimeOccurrence
      ? 'month'
      : _.join(event.formValue?.cohort?.activity_ids, ',')

    eventParams = {
      cohort_activity_ids: activityIds,
      activity_ids: activityIds,
      include_customer: true,
      cohort_occurrence: event.occurrence,
      index: '0',
    }
  }

  const cohortOccurrence = {
    cohort_occurrence: _.get(event, 'formValue.cohort.occurrence_filter.occurrence'),
  }

  // The cohort activity can append on customer columns
  if (event.type === 'SELECT_COHORT_ACTIVITY') {
    eventParams = {
      cohort_activity_ids: _.join(event.formValue?.cohort?.activity_ids, ','),
      activity_ids: _.join(event.activityIds, ','),
      include_customer: true,
      index: '0',
      ...cohortOccurrence,
    }
  }

  if (event.type === 'SELECT_TIME_COHORT_RESOLUTION') {
    eventParams = {
      cohort_activity_ids: event.timeResolution,
      activity_ids: event.timeResolution,
      include_customer: true,
      index: '0',
      ...cohortOccurrence,
    }
  }

  // Append/Join activity column options depend on the relationship
  if (event.type === 'SELECT_APPEND_ACTIVITY' || event.type === 'SELECT_RELATIONSHIP') {
    eventParams = {
      cohort_activity_ids: _.join(event.formValue?.cohort?.activity_ids, ','),
      activity_ids: _.join(event.activityIds, ','),
      relationship: event.relationshipSlug,
      // NOTE - we're adding 1 from the fieldIndex because the cohort activity is always first
      index: _.toString(_.toNumber(event.fieldIndex) + 1),
      ...cohortOccurrence,
    }
  }

  const selectColumns = await mavisRequest<any>({
    path: '/v1/dataset/create/activity_columns',
    params: {
      company: company.slug,
      stream_table: activityStream,
      ...eventParams,
    },
    getToken,
    company,
  })

  return {
    // Columns that should be automatically added to the form value:
    defaultColumns: selectColumns.default_columns,

    // Columns that the user can optionally add to the form value:
    selectOptions: selectColumns.all_columns,

    // Columns that the user can use to optionally filter this activity:
    filterOptions: selectColumns.raw_columns,
  }
}

interface FetchMakeDefinitionArgs {
  getToken: GetToken
  company: ICompany
  queryDefinition: IDatasetQueryDefinition
}

const fetchMakeDefinition = async ({ getToken, company, queryDefinition }: FetchMakeDefinitionArgs) => {
  const response = await mavisRequest<any>({
    method: 'POST',
    path: 'v1/dataset/create/make_definition',
    params: {
      company: company.slug,
    },
    getToken,
    body: JSON.stringify({
      dataset: queryDefinition,
    }),
    company,
  })

  return response
}

interface FetchConvertDefinitionArgs {
  getToken: GetToken
  company: ICompany
  formValue: IDefinitionFormValue
  queryDefinition?: IDatasetQueryDefinition
}

const fetchConvertDefinition = async ({
  getToken,
  company,
  formValue,
  queryDefinition,
}: FetchConvertDefinitionArgs) => {
  const response = await mavisRequest<any>({
    method: 'POST',
    path: '/v1/dataset/create/convert_definition',
    params: {
      company: company.slug,
    },
    getToken,
    // Convert Dataset Definition to Query Definition
    // Include existing queryDefinition so MAVIS can do a diff and reconcile accordingly (only on submit)
    body: JSON.stringify({
      dataset_config: formValue,
      dataset: queryDefinition,
    }),
    company,
  })

  return response
}

interface FetchSwapGroupColumnArgs {
  getToken: GetToken
  company: ICompany
  column: DatasetColumnType
  queryDefinition?: IDatasetQueryDefinition
  newColumnId: string
  groupSlug: string
}

const fetchSwapGroupColumn = async ({
  getToken,
  company,
  column,
  newColumnId,
  groupSlug,
  queryDefinition,
}: FetchSwapGroupColumnArgs) => {
  const postBody = JSON.stringify({
    column,
    dataset: queryDefinition,
    new_column_id: newColumnId,
    group_slug: groupSlug,
  })

  const response = await mavisRequest<any>({
    method: 'POST',
    path: '/v1/dataset/create/swap_group_column',
    params: {
      company: company.slug,
    },
    getToken,
    body: postBody,
    company,
  })

  return response
}

interface FetchReconcilerArgs {
  getToken: GetToken
  company: ICompany
  plan: IPlan[]
  queryDefinition?: IDatasetQueryDefinition
}

const fetchReconcile = async ({ getToken, company, plan, queryDefinition }: FetchReconcilerArgs) => {
  // Convert Dataset Definition to Query Definition
  // Include existing queryDefinition so MAVIS can do a diff and reconcile accordingly (only on submit)
  const postBody = JSON.stringify({
    plan,
    dataset: queryDefinition,
  })

  const response = await mavisRequest<any>({
    method: 'POST',
    path: '/v1/dataset/create/reconcile',
    params: {
      company: company.slug,
    },
    getToken,
    body: postBody,
    company,
  })

  return response
}

interface FetchApplyColumnShortcutArgs {
  getToken: GetToken
  company: ICompany
  column: DatasetColumnType
  groupSlug: string | null
  key: string
  option?: string
  queryDefinition?: IDatasetQueryDefinition
}

const fetchApplyColumnShortcut = async ({
  getToken,
  company,
  column,
  groupSlug,
  key,
  option,
  queryDefinition,
}: FetchApplyColumnShortcutArgs) => {
  // Deal with column shortcut that the user selected
  // Include existing queryDefinition so MAVIS can do a diff and reconcile accordingly (only on submit)
  const postBody = JSON.stringify({
    dataset: queryDefinition,
    column,
    group_slug: groupSlug,
    shortcut_key: key,
    shortcut_option: option,
  })

  const response = await mavisRequest<any>({
    method: 'POST',
    path: '/v1/dataset/create/apply_column_shortcut',
    params: {
      company: company.slug,
    },
    getToken,
    body: postBody,
    company,
  })

  return response
}
interface FetchApplyRowShortcutArgs {
  getToken: GetToken
  company: ICompany
  // row should be the same as what we send in customer journey
  row: any
  groupSlug: string | null
  key: string
  columnId: string
  shortcutColumnId?: string
  option?: string
  queryDefinition?: IDatasetQueryDefinition
}

const fetchApplyRowShortcut = async ({
  getToken,
  company,
  row,
  groupSlug,
  key,
  columnId,
  shortcutColumnId,
  option,
  queryDefinition,
}: FetchApplyRowShortcutArgs) => {
  // Deal with row shortcut that the user selected
  // Include existing queryDefinition so MAVIS can do a diff and reconcile accordingly (only on submit)
  const postBody = JSON.stringify({
    dataset: queryDefinition,
    row,
    group_slug: groupSlug,
    shortcut_key: key,
    shortcut_option: option,
    selected_column_id: columnId,
    shortcut_column_id: shortcutColumnId,
  })

  const response = await mavisRequest<any>({
    method: 'POST',
    path: '/v1/dataset/create/apply_row_shortcut',
    params: {
      company: company.slug,
    },
    getToken,
    body: postBody,
    company,
  })

  return response
}

interface FetchCreateGroupArgs {
  getToken: GetToken
  company: ICompany
  columnIds: string[]
  timeWindow?: ITimeWindowConfig
  queryDefinition?: IDatasetQueryDefinition
}

const fetchCreateGroup = async ({
  getToken,
  company,
  columnIds,
  timeWindow,
  queryDefinition,
}: FetchCreateGroupArgs) => {
  // Create new group!
  // Include existing queryDefinition so MAVIS can do a diff and reconcile accordingly (only on submit)
  const postBody = JSON.stringify({
    column_ids: columnIds,
    time_window: timeWindow,
    dataset: queryDefinition,
  })

  const response = await mavisRequest<any>({
    method: 'POST',
    path: '/v1/dataset/create/add_group',
    params: {
      company: company.slug,
    },
    getToken,
    body: postBody,
    company,
  })

  return response
}

interface FetchEditSpendColumnsArgs {
  getToken: GetToken
  company: ICompany
  queryDefinition?: IDatasetQueryDefinition
  groupSlug: string
  joins?: SpendJoin[]
  metrics?: ColumnOptionWithId[]
  table?: TableOption
  isRemove?: boolean
}

const fetchEditSpendColumns = async ({
  getToken,
  company,
  queryDefinition,
  groupSlug,
  joins = [],
  metrics,
  table,
  isRemove = false,
}: FetchEditSpendColumnsArgs) => {
  const postBody = JSON.stringify({
    dataset: queryDefinition,
    group_slug: groupSlug,
    spend_config: {
      joins,
      metrics,
      table,
    },
    is_remove: isRemove,
  })

  const response = await mavisRequest<{ planExecution: PlanExecutionResponse }>({
    method: 'POST',
    path: '/v1/dataset/create/add_spend',
    params: {
      company: company.slug,
    },
    getToken,
    body: postBody,
    company,
  })

  return response
}

interface FetchValidateFreehandArgs {
  getToken: GetToken
  company: ICompany
  freehandString: string
  groupSlug: string
  queryDefinition?: IDatasetQueryDefinition
}

const fetchValidateFreehandFunction = async ({
  getToken,
  company,
  freehandString,
  groupSlug,
  queryDefinition,
}: FetchValidateFreehandArgs) => {
  // Include existing queryDefinition so MAVIS can do a diff and reconcile accordingly (only on submit)
  const postBody = JSON.stringify({
    freehand_string: freehandString,
    dataset: queryDefinition,
  })

  const response = await mavisRequest<any>({
    method: 'POST',
    path: '/v1/dataset/computed/validate',
    params: {
      company: company.slug,
      group_slug: groupSlug,
    },
    getToken,
    body: postBody,
    company,
  })

  return response
}

interface FetchLoadPivotColumnArgs {
  getToken: GetToken
  company: ICompany
  groupSlug: string
  columnId: string
  queryDefinition: IDatasetQueryDefinition
}

const fetchLoadPivotColumn = async ({
  getToken,
  company,
  groupSlug,
  columnId,
  queryDefinition,
}: FetchLoadPivotColumnArgs) => {
  const postBody = JSON.stringify({
    dataset: queryDefinition,
  })

  const response = await mavisRequest<any>({
    method: 'POST',
    path: '/v1/dataset/pivot_values',
    retryable: true,
    params: {
      company: company.slug,
      column_id: columnId,
      group_slug: groupSlug,
    },
    getToken,
    body: postBody,
    company,
  })

  return response
}

interface FetchLoadPlotBlockArgs {
  getToken: GetToken
  company: ICompany
  groupSlug: string
  plotSlug?: string
  queryDefinition?: IDatasetQueryDefinition
  isCopy?: boolean
}

const fetchLoadPlotBlock = async ({
  getToken,
  company,
  groupSlug,
  queryDefinition,
  plotSlug,
  isCopy,
}: FetchLoadPlotBlockArgs) => {
  // Include existing queryDefinition so MAVIS can do a diff and reconcile accordingly (only on submit)
  const postBody = JSON.stringify({
    group_slug: groupSlug,
    plot_slug: plotSlug,
    dataset: queryDefinition,
    is_copy: isCopy,
  })

  const response = await mavisRequest<any>({
    method: 'POST',
    path: '/v1/dataset/plot/load',
    params: {
      company: company.slug,
    },
    getToken,
    body: postBody,
    // NOTE - plot block needs to retry as the user can load the plot block without
    // having run data first:
    retryable: true,
    company,
  })

  return response
}

interface FetchRunPlotArgs {
  getToken: GetToken
  company: ICompany
  groupSlug: string
  plotSlug: string
  queryDefinition?: IDatasetQueryDefinition
}

const fetchRunPlot = async ({ getToken, company, groupSlug, plotSlug, queryDefinition }: FetchRunPlotArgs) => {
  // Include existing queryDefinition so MAVIS can do a diff and reconcile accordingly (only on submit)
  const postBody = JSON.stringify({
    plot_slug: plotSlug,
    group_slug: groupSlug,
    dataset: queryDefinition,
  })

  const response = await mavisRequest<any>({
    method: 'POST',
    path: '/v1/dataset/plot/run',
    params: {
      company: company.slug,
    },
    getToken,
    body: postBody,
    // NOTE - plot block needs to retry as the user can load the plot block without
    // having run data first:
    retryable: true,
    company,
  })

  return response
}

interface DoPostSaveDatasetResponse {
  datasetFromGraph?: IDataset
}

interface IWrapperServicesProps {
  company: ICompany
  user: IUser
  getToken: GetToken
  getDatasetGraph?: Function
}

interface DoLoadingDatasetResponse {
  slug?: string
  columnShortcuts: any
  rowShortcuts: any
  queryDefinition?: IDatasetQueryDefinition
  groupSlugFromSearch?: string
  datasetFromGraph?: IDataset
  view?: viewTypeConstants
  narrative_slug?: string
  upload_key?: string
}

interface DoUpdatingDefinitionResponse {
  initialEvent: DatasetEvent
  activityColumnOptions: IActivityColumnOptions
  formValue: IDefinitionFormValue
}

interface DoSubmittingDefinitionResponse {
  formValue: IDefinitionFormValue
  planExecution: IPlanExecution
}

interface DoLoadingPlotFormResponse {
  initialEvent: DatasetEvent
  formState: BlockFormState
}

interface PlanExecutionResponse {
  planExecution: IPlanExecution
}

const machineServices = ({ company, user, getToken, getDatasetGraph }: IWrapperServicesProps) => {
  return {
    doPostSaveDataset: async (_context: DatasetContext, event: DatasetEvent): Promise<DoPostSaveDatasetResponse> => {
      let datasetFromGraph
      if (
        event.type === 'SAVE_UPDATE_SUCCESS' ||
        event.type === 'SAVE_CREATE_SUCCESS' ||
        event.type === 'done.invoke.UPDATING_INTEGRATIONS'
      ) {
        if (getDatasetGraph) {
          try {
            let datasetSlug
            if (event.type === 'SAVE_UPDATE_SUCCESS' || event.type === 'SAVE_CREATE_SUCCESS') {
              datasetSlug = event?.slug
            }

            // updating integrations/dataset story comes from an invoke so slug is within data object
            if (event.type === 'done.invoke.UPDATING_INTEGRATIONS') {
              datasetSlug = event?.data?.slug
            }

            // Make sure to pass in the "no-cache" fetchPolicy
            // so it makes a round trip to the server!
            // see FIXME in util/helpers.js
            const graphResp = await getDatasetGraph(
              { company_id: company.id, user_id: user.id, slug: datasetSlug },
              'no-cache'
            )
            datasetFromGraph = graphResp?.data?.dataset[0]
          } catch (error) {
            return Promise.reject(error)
          }
        }
      }

      return { datasetFromGraph }
    },

    doLoadingDataset: async (_context: DatasetContext, event: DatasetEvent): Promise<DoLoadingDatasetResponse> => {
      // Load column shortcuts for NEW and duplicate (LOAD) and edit (LOAD) flows
      let loadColumnShortcutsResponse
      try {
        loadColumnShortcutsResponse = await getAllColumnShortcuts({
          getToken,
          company,
        })
      } catch (error) {
        return Promise.reject(error)
      }

      let loadDatasetResponse
      if (event.type === 'LOAD') {
        try {
          loadDatasetResponse = await getQueryDefinition({
            getToken,
            company,
            datasetSlug: event.slug,
            upload_key: event.upload_key,
            narrative_slug: event.narrative_slug,
          })
        } catch (error) {
          return Promise.reject(error)
        }

        let datasetFromGraphResponse
        if (getDatasetGraph) {
          try {
            const graphResp = await getDatasetGraph({ company_id: company.id, user_id: user.id, slug: event.slug })
            datasetFromGraphResponse = graphResp?.data?.dataset[0]
          } catch (error) {
            return Promise.reject(error)
          }
        }

        return {
          slug: event.slug,
          columnShortcuts: loadColumnShortcutsResponse.column_shortcuts,
          rowShortcuts: loadColumnShortcutsResponse.row_shortcuts,
          queryDefinition: loadDatasetResponse,
          groupSlugFromSearch: event.groupSlugFromSearch,
          datasetFromGraph: datasetFromGraphResponse,
          view: event.view,
          upload_key: event.upload_key,
          narrative_slug: event.narrative_slug,
        }
      }

      return {
        columnShortcuts: loadColumnShortcutsResponse.column_shortcuts,
        rowShortcuts: loadColumnShortcutsResponse.row_shortcuts,
        queryDefinition: loadDatasetResponse,
      }
    },
    doLoadingDefinition: async (_context: DatasetContext): Promise<IDefinitionContext> => {
      // Convert Existing Query Definition to Dataset Definition
      let makeDefinitionResponse
      try {
        makeDefinitionResponse = await fetchMakeDefinition({
          getToken,
          company,
          queryDefinition: makeQueryDefinitionFromContext(_context),
        })
      } catch (error) {
        return Promise.reject(error)
      }

      // MAVIS sends back `all_columns` and `raw_columns` inside the dataset_config response:
      const datasetConfig = makeDefinitionResponse.dataset_config

      const cohortColumnOptions = {
        activity_ids: datasetConfig.cohort?.activity_ids,
        relationship_slug: null,
        filter_options: datasetConfig.cohort?.raw_columns,
        // NOTE - we're overriding the default column labels with what's in the formValue
        // (the existing custom user defined labels)
        select_options: makeColumnOptionsWithExistingLabels({
          options: datasetConfig.cohort?.all_columns,
          formValue: datasetConfig,
        }),
      }
      const appendColumnOptions = _.map(datasetConfig.append_activities, (appendActivity, index) => ({
        // Add activity_ids and relationship_slug so we can guarantee
        // that we're selecting the correct options regardless of field order:
        activity_ids: appendActivity.activity_ids,
        relationship_slug: appendActivity.relationship_slug,
        filter_options: appendActivity.raw_columns,
        // NOTE - we're overriding the default column labels with what's in the formValue
        // (the existing custom user defined labels)
        select_options: makeColumnOptionsWithExistingLabels({
          options: appendActivity.all_columns,
          formValue: datasetConfig,
          appendActivityIndex: index,
        }),
      }))

      // Return the updated formValue and all the column options for our Select components:
      return {
        column_options: [cohortColumnOptions, ...appendColumnOptions],
        form_value: datasetConfig,
      }
    },
    doUpdatingDefinition: async (
      _context: DatasetContext,
      event: DatasetEvent
    ): Promise<DoUpdatingDefinitionResponse | {}> => {
      if (
        event.type === 'SELECT_APPEND_ACTIVITY' ||
        event.type === 'SELECT_RELATIONSHIP' ||
        event.type === 'SELECT_TIME_COHORT_RESOLUTION' ||
        event.type === 'SELECT_COHORT_ACTIVITY' ||
        event.type === 'SELECT_COHORT_OCCURRENCE'
      ) {
        let formValue = event.formValue

        // check if is a time cohort with "all time" resolution
        const cohortOccurrenceResolution = _.get(formValue, 'cohort.occurrence_filter.resolution')
        const hasAllTimeOccurrenceResolution = isAllTimeResolution(cohortOccurrenceResolution)
        const activityStream = _context?.activity_stream || undefined

        // check if there are any resolution filters set (can only be for "all time" resolutions)
        const hasAllTimeOccurrenceResolutionFilter = !_.isEmpty(
          _.get(formValue, TIME_COHORT_RESOLUTION_FILTER_FIELDNAME)
        )

        // remove time cohort resolution filters if not an "all time" resolution
        if (hasAllTimeOccurrenceResolutionFilter && !hasAllTimeOccurrenceResolution) {
          formValue = {
            ...formValue,
            cohort: {
              ...formValue.cohort,
              occurrence_filter: {
                ...formValue.cohort.occurrence_filter,
                // remove resolution filter
                resolution_filter: {},
              },
            },
          }
        }

        let activityColumnOptions

        // Fetch optional columns for selection (columns.all_columns)
        // as well as defaults (columns.default_columns)
        let columnsResponse
        try {
          columnsResponse = await fetchActivityColumns({
            getToken,
            company,
            event,
            activityStream,
          })
        } catch (error) {
          return Promise.reject(error)
        }

        if (event.type === 'SELECT_COHORT_OCCURRENCE') {
          const existingCohortColumns = _.get(formValue, 'cohort.columns', [])

          // maintain all customer opt_group columns (if there were any)
          const customerColumns = _.filter(existingCohortColumns, (column) =>
            _.includes(CUSTOMER_COLUMN_GROUP_NAMES, column.opt_group)
          )

          // maintain all enriched columns (if there were any)
          const enrichedColumns = _.filter(existingCohortColumns, (column) => !_.isEmpty(column.enrichment_table))

          // replace all other cohort columns with defaultColumns
          const updatedColumns = [...columnsResponse.defaultColumns, ...customerColumns, ...enrichedColumns]

          formValue = {
            ...formValue,
            cohort: {
              ...formValue.cohort,
              occurrence_filter: {
                custom_value: null,
                occurrence: event.occurrence,
                resolution: null,
              },
              columns: updatedColumns,
            },
          }

          // when changing to time cohort
          // over-ride the formValue with defaults
          if (event.changedFromNormalToTimeOccurrence) {
            formValue = {
              cohort: {
                activity_ids: ['month'],
                occurrence_filter: {
                  occurrence: event.occurrence,
                  resolution: 'month',
                },
                columns: columnsResponse.defaultColumns,
              },
            }
          }

          activityColumnOptions = {
            activity_ids: formValue.cohort.activity_ids,
            relationship_slug: null,
            filter_options: columnsResponse.filterOptions,
            select_options: columnsResponse.selectOptions,
          }
        }

        // add columns.default_columns to the formValue:
        if (event.type === 'SELECT_COHORT_ACTIVITY' && !_.isEmpty(columnsResponse.defaultColumns)) {
          const existingCohortColumns = _.get(formValue, 'cohort.columns', [])
          // maintain all customer opt_group columns (if there were any)
          const customerColumns = _.filter(existingCohortColumns, (column) =>
            _.includes(CUSTOMER_COLUMN_GROUP_NAMES, column.opt_group)
          )

          // add _is_new field so we know what columns to animate!
          const defaultColumnsWithMeta = _.map(columnsResponse.defaultColumns, (col) => ({ ...col, _is_new: true }))

          // add customer columns to default columns
          const updatedColumns = [...defaultColumnsWithMeta, ...customerColumns]

          formValue = {
            ...formValue,
            cohort: {
              ...formValue.cohort,
              columns: updatedColumns,
              // add _last_updated field so we know what activities to animate!
              _last_updated: Date.now(),
            },
          }

          activityColumnOptions = {
            activity_ids: formValue.cohort.activity_ids,
            relationship_slug: null,
            filter_options: columnsResponse.filterOptions,
            select_options: columnsResponse.selectOptions,
          }
        }

        // add default columns to formValue
        // and make cohort activity id the time resolution
        if (event.type === 'SELECT_TIME_COHORT_RESOLUTION' && !_.isEmpty(columnsResponse.defaultColumns)) {
          formValue = {
            ...formValue,
            cohort: {
              activity_ids: [event.timeResolution],
              occurrence_filter: {
                ...formValue.cohort.occurrence_filter,
                // remove resolution filter if not "all" time resolution
                resolution_filter: event.isAllTimeResolution
                  ? { ..._.get(formValue, TIME_COHORT_RESOLUTION_FILTER_FIELDNAME, {}) }
                  : {},
              },
              // add _is_new field so we know what columns to animate!
              columns: _.map(columnsResponse.defaultColumns, (col) => ({ ...col, _is_new: true })),
              // add _last_updated field so we know what activities to animate!
              _last_updated: Date.now(),
            },
          }

          activityColumnOptions = {
            activity_ids: formValue.cohort.activity_ids,
            relationship_slug: null,
            filter_options: columnsResponse.filterOptions,
            select_options: columnsResponse.selectOptions,
          }
        }

        // check if it is a "before" resolution and add default within time if there are no time_filters
        if (event.type === 'SELECT_APPEND_ACTIVITY' || event.type === 'SELECT_RELATIONSHIP') {
          const appendActivities = _.cloneDeep(formValue.append_activities)
          const selectedActivity = appendActivities[event.fieldIndex]
          // if "before" relationship
          if (_.includes(BEFORE_ACTIVITY_RELATIONSHIPS, selectedActivity.relationship_slug)) {
            // make sure it has a time_filters within 30
            // (if it doesn't already have a time option)
            if (_.isEmpty(selectedActivity.time_filters)) {
              selectedActivity.time_filters = [{ resolution: 'day', time_option: 'within_time', value: 30 }]

              // if we added time filters
              // update formValue to include changes
              appendActivities[event.fieldIndex] = selectedActivity
              formValue = {
                ...formValue,
                append_activities: appendActivities,
              }
            }
          }
        }

        // add columns.default_columns to the formValue:
        if (
          (event.type === 'SELECT_APPEND_ACTIVITY' || event.type === 'SELECT_RELATIONSHIP') &&
          !_.isEmpty(columnsResponse.defaultColumns)
        ) {
          const appendActivities = _.cloneDeep(formValue.append_activities)
          appendActivities[event.fieldIndex] = {
            ...appendActivities[event.fieldIndex],
            // add _is_new field so we know what columns to animate!
            columns: _.map(columnsResponse.defaultColumns, (col) => ({ ...col, _is_new: true })),
            // add _last_updated field so we know what activities to animate!
            _last_updated: Date.now(),
          }

          formValue = {
            ...formValue,
            append_activities: appendActivities,
          }

          activityColumnOptions = {
            activity_ids: appendActivities[event.fieldIndex].activity_ids,
            relationship_slug: appendActivities[event.fieldIndex].relationship_slug,
            filter_options: columnsResponse.filterOptions,
            select_options: columnsResponse.selectOptions,
          }
        }

        return {
          // pass initial event back so handleUpdatingResponse knows where to put the response:
          initialEvent: event,
          activityColumnOptions,
          formValue,
        }
      }

      return {}
    },
    doSubmittingDefinition: async (
      _context: DatasetContext,
      event: DatasetEvent
    ): Promise<DoSubmittingDefinitionResponse | {}> => {
      if (event.type === 'SUBMIT_DEFINITION' || event.type === 'SUBMITTING_ACTIVITY_COLUMNS') {
        // get cohort activity id
        const cohortActivityIds = _context._definition_context?.form_value?.cohort?.activity_ids

        // find all the cohorts column options
        const cohortColumnOptions =
          _.find(_context._definition_context.column_options, {
            activity_ids: cohortActivityIds,
            relationship_slug: null,
          }) || ({} as IActivityColumnOptions)

        // add full column object to column filters (not just name)
        // without this Mavis has a hard time determining the type of the columns
        // (only activity_column_name, cohort_column_name, and/or append_column_name
        // are set to form state before it arrives here)
        const formValueWithEnhancedColumnFilters = {
          ...event.formValue,
          cohort: {
            ...event.formValue.cohort,
            column_filters: _.map(event.formValue.cohort.column_filters, (columnFilter) => {
              const backfillActivityColumn = _.find(cohortColumnOptions.filter_options, [
                'name',
                columnFilter.activity_column_name,
              ])

              const activityColumn = _.find(cohortColumnOptions.filter_options, [
                'name',
                columnFilter.activity_column?.name,
              ])
              return {
                ...columnFilter,
                // add the entire cohort column and append column to form
                activity_column: activityColumn || backfillActivityColumn,
              }
            }),
          },
          append_activities: _.map(event.formValue.append_activities, (appendActivity) => {
            // get all column options for this append/join activity
            const appendColumnOptions =
              _.find(_context._definition_context.column_options, {
                activity_ids: appendActivity.activity_ids,
                relationship_slug: appendActivity.relationship_slug || null,
              }) || ({} as IActivityColumnOptions)

            return {
              ...appendActivity,
              cohort_column_filters: _.map(appendActivity.cohort_column_filters, (cohortColumnFilter) => {
                const cohortColumn = _.find(cohortColumnOptions.filter_options, [
                  'name',
                  cohortColumnFilter.cohort_column_name,
                ])
                const appendColumn = _.find(appendColumnOptions.filter_options, [
                  'name',
                  cohortColumnFilter.append_column_name,
                ])

                return {
                  ...cohortColumnFilter,
                  // add the entire cohort column and append column to form
                  cohort_column: cohortColumn,
                  append_column: appendColumn,
                }
              }),
              column_filters: _.map(appendActivity.column_filters, (columnFilter) => {
                const backfillActivityColumn = _.find(appendColumnOptions.filter_options, [
                  'name',
                  columnFilter.activity_column_name,
                ])

                const activityColumn = _.find(appendColumnOptions.filter_options, [
                  'name',
                  columnFilter.activity_column?.name,
                ])

                return {
                  ...columnFilter,
                  // add the entire activity column to form
                  activity_column: activityColumn || backfillActivityColumn,
                }
              }),
            }
          }),
        }

        // Convert Dataset Definition to Query Definition
        let convertDefinitionResponse
        try {
          convertDefinitionResponse = await fetchConvertDefinition({
            getToken,
            company,
            formValue: formValueWithEnhancedColumnFilters,
            queryDefinition: makeQueryDefinitionFromContext(_context),
          })
        } catch (error) {
          return Promise.reject(error)
        }

        return {
          formValue: formValueWithEnhancedColumnFilters,
          planExecution: convertDefinitionResponse,
        }
      }

      return {}
    },
    doUpdatingIntegrations: async (
      _context: DatasetContext,
      event: DatasetEvent
    ): Promise<DoSubmittingDefinitionResponse | {}> => {
      if (event.type === 'EDIT_INTEGRATIONS_SUBMIT') {
        const { dataset, formValue } = event
        const materializations = formValue?.materializations

        let resp
        try {
          resp = await updateDataset({
            getToken,
            company,
            id: dataset.id,
            name: dataset.name,
            slug: dataset.slug,
            description: dataset.description,
            status: dataset.status,
            materializations,
            created_by: dataset.created_by,
            asQuickSave: false,
          })
        } catch (error) {
          return Promise.reject(error)
        }

        return {
          slug: dataset?.slug,
          notification: resp?.notification,
        }
      }

      return {}
    },
    doSubmittingSwapGroupColumn: async (
      _context: DatasetContext,
      event: DatasetEvent
    ): Promise<PlanExecutionResponse | {}> => {
      let swapGroupColumnResponse

      if (event.type === 'EDIT_SWAP_GROUP_COLUMN_SUBMIT') {
        try {
          swapGroupColumnResponse = await fetchSwapGroupColumn({
            getToken,
            company,
            column: event.column,
            newColumnId: event.parentColumnId,
            queryDefinition: makeQueryDefinitionFromContext(_context),
            groupSlug: event.groupSlug,
          })
        } catch (error) {
          return Promise.reject(error)
        }
      }

      return {
        planExecution: swapGroupColumnResponse,
      }
    },

    submittingDeleteColumns: async (
      _context: DatasetContext,
      event: DatasetEvent
    ): Promise<PlanExecutionResponse | {}> => {
      let updateReconcilerResponse
      if (event.type === 'DELETE_EDIT_MODE_COLUMNS') {
        const deleteMutation = 'delete' as const

        try {
          // if no groupSlug it is the parent so grab those columns' ids
          const tabName = event.groupSlug ? event.groupSlug : RAW_DATASET_KEY

          const columnsIdsToDelete = _.find(_context._delete_columns_tabs, ['tabName', tabName])?.deleteColumnsIds

          const group = getGroupFromContext({ context: _context, groupSlug: event.groupSlug })!

          // get all columns from ids
          const allColumns = tabName === RAW_DATASET_KEY ? _context.columns : getGroupColumns({ group })
          const columnsToDelete = _.filter(allColumns, (col) => _.includes(columnsIdsToDelete, col.id))

          const plan = _.map(columnsToDelete, (column) => ({
            group_slug: event.groupSlug,
            mutation: deleteMutation,
            column,
            mavis_created: false,
          }))

          updateReconcilerResponse = await fetchReconcile({
            getToken,
            company,
            // Make plan for deleting multiple columns:
            plan,
            queryDefinition: makeQueryDefinitionFromContext(_context),
          })
        } catch (error) {
          return Promise.reject(error)
        }
      }
      return {
        planExecution: updateReconcilerResponse,
      }
    },

    doSubmittingColumnShortcut: async (
      _context: DatasetContext,
      event: DatasetEvent
    ): Promise<PlanExecutionResponse | {}> => {
      let columnShortcutResponse
      let updateReconcilerResponse

      if (event.type === 'DELETE_COLUMN') {
        const deleteMutation = 'delete' as const

        try {
          updateReconcilerResponse = await fetchReconcile({
            getToken,
            company,
            // Make plan for deleting a single column:
            plan: [
              {
                group_slug: event.groupSlug,
                mutation: deleteMutation,
                column: event.column,
                mavis_created: false,
              },
            ],
            queryDefinition: makeQueryDefinitionFromContext(_context),
          })
        } catch (error) {
          return Promise.reject(error)
        }
      }

      if (event.type === 'APPLY_COLUMN_SHORTCUT') {
        try {
          columnShortcutResponse = await fetchApplyColumnShortcut({
            getToken,
            company,
            column: event.column,
            groupSlug: _context._group_slug,
            key: event.key,
            option: event.option,
            queryDefinition: makeQueryDefinitionFromContext(_context),
          })
        } catch (error) {
          return Promise.reject(error)
        }
      }

      return {
        planExecution: columnShortcutResponse || updateReconcilerResponse,
      }
    },

    doSubmittingRowShortcut: async (
      _context: DatasetContext,
      event: DatasetEvent
    ): Promise<PlanExecutionResponse | {}> => {
      if (event.type === 'APPLY_ROW_SHORTCUT') {
        let rowShortcutResponse

        try {
          rowShortcutResponse = await fetchApplyRowShortcut({
            getToken,
            company,
            row: event.row,
            groupSlug: _context._group_slug,
            key: event.key,
            columnId: event.columnId,
            shortcutColumnId: event.shortcutColumnId,
            queryDefinition: makeQueryDefinitionFromContext(_context),
          })
        } catch (error) {
          return Promise.reject(error)
        }

        return {
          planExecution: rowShortcutResponse,
        }
      }

      return {}
    },

    doSubmittingCreateGroup: async (
      _context: DatasetContext,
      event: DatasetEvent
    ): Promise<PlanExecutionResponse | {}> => {
      if (event.type === 'CREATE_GROUP_SUBMIT') {
        // Convert Dataset Definition to Query Definition
        let createGroupResponse
        try {
          createGroupResponse = await fetchCreateGroup({
            getToken,
            company,
            columnIds: event.column_ids,
            timeWindow: event.time_window,
            queryDefinition: makeQueryDefinitionFromContext(_context),
          })
        } catch (error) {
          return Promise.reject(error)
        }

        return {
          planExecution: createGroupResponse,
        }
      }
      return {}
    },

    doSubmittingEditSpendColumns: async (
      _context: DatasetContext,
      event: DatasetEvent
    ): Promise<PlanExecutionResponse | {}> => {
      if (event.type === 'SUBMITTING_EDIT_SPEND_COLUMNS') {
        const editSpendColumnsResponse = await fetchEditSpendColumns({
          getToken,
          company,
          groupSlug: event.groupSlug,
          queryDefinition: makeQueryDefinitionFromContext(_context),
          joins: event.joins,
          metrics: event.metrics,
          table: event.table,
        })

        return { planExecution: editSpendColumnsResponse }
      }

      return {}
    },

    doSubmittingDeleteSpendColumns: async (
      _context: DatasetContext,
      event: DatasetEvent
    ): Promise<PlanExecutionResponse | {}> => {
      if (event.type === 'SUBMITTING_DELETE_SPEND_COLUMNS') {
        const editSpendColumnsResponse = await fetchEditSpendColumns({
          getToken,
          company,
          groupSlug: event.groupSlug,
          queryDefinition: makeQueryDefinitionFromContext(_context),
          isRemove: true,
        })

        return { planExecution: editSpendColumnsResponse }
      }

      return {}
    },

    doSubmittingReconciler: async (
      _context: DatasetContext,
      event: DatasetEvent
    ): Promise<PlanExecutionResponse | {}> => {
      let updateReconcilerResponse, plan

      if (event.type === 'ADD_COLUMNS_TO_GROUP_SUBMIT') {
        const addMutation = 'add' as const
        const parentColumns = _.compact(
          _.map(event.columnIds, (id) => _.find(_context.columns, ['id', id]))
        ) as IDatasetQueryColumn[]

        // this shouldn't happen - but notify us if it does
        if (_.isEmpty(parentColumns)) {
          reportError('ADD_COLUMNS_TO_GROUP_SUBMIT - no parent columns', null, { event })
        }

        const group = getGroupFromContext({ context: _context, groupSlug: event.groupSlug })

        // Use the parentColumn to make a new group column:
        if (!_.isEmpty(parentColumns) && group) {
          const newGroupColumns = _.map(parentColumns, (parentColumn) =>
            makeNewGroupColumn({ group, column: parentColumn })
          )

          plan = _.map(newGroupColumns, (grpCol) => ({
            group_slug: event.groupSlug,
            mutation: addMutation,
            new_column: grpCol,
            column_kind: 'group',
            mavis_created: false,
          }))
        }
      }

      if (event.type === 'UPDATE_RECONCILER_PLAN') {
        plan = event.plan
      }

      if (plan) {
        try {
          updateReconcilerResponse = await fetchReconcile({
            getToken,
            company,
            plan,
            queryDefinition: makeQueryDefinitionFromContext(_context),
          })
        } catch (error) {
          return Promise.reject(error)
        }
      }

      return {
        planExecution: updateReconcilerResponse,
      }
    },
    doLoadingPlotForm: async (_context: DatasetContext, event: DatasetEvent): Promise<DoLoadingPlotFormResponse> => {
      let loadingResponse, groupSlug, plotSlug, isCopy

      if (event.type === 'SWITCH_MAIN_VIEW') {
        groupSlug = _context._group_slug
      }

      // Get default dataset_plotter block json schema
      if (event.type === 'NEW_PLOT') {
        groupSlug = event.groupSlug
      }

      // Get dataset_plotter block json schema for an existing plot (using plotSlug)
      if (event.type === 'EDIT_PLOT') {
        groupSlug = event.groupSlug
        plotSlug = event.plotSlug
      }

      if (event.type === 'DUPLICATE_PLOT') {
        groupSlug = event.groupSlug
        plotSlug = event.plotSlug
        isCopy = true
      }

      if (groupSlug) {
        try {
          loadingResponse = await fetchLoadPlotBlock({
            getToken,
            company,
            groupSlug,
            plotSlug,
            isCopy,
            queryDefinition: makeQueryDefinitionFromContext(_context),
          })
        } catch (error) {
          return Promise.reject(error)
        }
      }

      return {
        // pass through initialEvent so we know if the user triggered NEW_PLOT or EDIT_PLOT
        // for _plotter_context.is_edit
        initialEvent: event,
        formState: loadingResponse,
      }
    },
    doLoadingPlotData: async (_context: DatasetContext, event: DatasetEvent): Promise<IDatasetPlotData> => {
      let loadingResponse, groupSlug, plotSlug

      // Load the first plot when switching the view!
      if (event.type === 'SWITCH_MAIN_VIEW' && _context._group_slug) {
        const group = getGroupFromContext({ context: _context, groupSlug: _context._group_slug })

        if (group?.plots && group.plots.length > 0) {
          groupSlug = _context._group_slug
          plotSlug = group.plots[0].slug
        }
      }

      // Load the first plot when switching the group!
      if (event.type === 'SELECT_GROUP' && event.groupSlug) {
        const group = getGroupFromContext({ context: _context, groupSlug: event.groupSlug })

        if (group?.plots && group.plots.length > 0) {
          groupSlug = event.groupSlug
          plotSlug = group.plots[0].slug
        }
      }

      if (event.type === 'SELECT_PLOT' || event.type === 'REFRESH_PLOT') {
        groupSlug = event.groupSlug
        plotSlug = event.plotSlug
      }

      if (event.type === 'SUBMIT_PLOT_SUCCESS' || event.type === 'REMOVE_PLOT') {
        groupSlug = _context._group_slug
        plotSlug = _context._plot_slug
      }

      if (event.type === 'done.invoke.SUBMITTING_COLUMN_SHORTCUT') {
        const uiInstructions = event.data?.planExecution?.ui_instructions

        // ui_instructions can be an object or array of objects (eventually let's just do array of objects)
        let goToPlotUiInstructions
        if (_.isArray(uiInstructions)) {
          // it's an array
          goToPlotUiInstructions = _.find(uiInstructions, ['kind', 'go_to_plot'])
        } else {
          // it's an object
          goToPlotUiInstructions = uiInstructions?.kind === 'go_to_plot' ? uiInstructions : undefined
        }

        plotSlug = goToPlotUiInstructions?.plot_slug
        groupSlug = _context._group_slug
      }

      if (groupSlug && plotSlug) {
        try {
          loadingResponse = await fetchRunPlot({
            getToken,
            company,
            groupSlug,
            plotSlug,
            queryDefinition: makeQueryDefinitionFromContext(_context),
          })
        } catch (error) {
          return Promise.reject(error)
        }
      }

      return loadingResponse
    },
    doLoadingPivotColumn: async (_context: DatasetContext, event: DatasetEvent): Promise<any> => {
      if (event.type === 'EDIT_COLUMN_PIVOT') {
        let pivotResponse

        try {
          if (_context._group_slug) {
            pivotResponse = await fetchLoadPivotColumn({
              getToken,
              company,
              columnId: event.column.id,
              groupSlug: _context._group_slug,
              queryDefinition: makeQueryDefinitionFromContext(_context),
            })
          }
        } catch (error) {
          return Promise.reject(error)
        }

        return pivotResponse
      }
    },
    doValidatingFreehandFunction: async (
      _context: DatasetContext,
      event: DatasetEvent
    ): Promise<IValidateFreehandResponse | {}> => {
      if (event.type === 'VALIDATE_FREEHAND_FUNCTION') {
        // Convert Dataset Definition to Query Definition
        let validateResponse
        try {
          validateResponse = await fetchValidateFreehandFunction({
            getToken,
            company,
            freehandString: event.freehandString,
            groupSlug: event.groupSlug,
            queryDefinition: makeQueryDefinitionFromContext(_context),
          })
          analytics.track('validated_freehand_function', {
            dataset_slug: _context._slug,
            group_slug: event.groupSlug,
            error: false,
          })
        } catch (error) {
          analytics.track('validated_freehand_function', {
            dataset_slug: _context._slug,
            group_slug: event.groupSlug,
            freehand_string: event.freehandString,
            error: true,
          })
          return Promise.reject(error)
        }
        return {
          raw_string: event.freehandString,
          ...validateResponse,
        }
      }
      return {}
    },
  }
}

export default machineServices
