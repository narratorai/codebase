import _ from 'lodash'
import { RAW_DATASET_KEY } from 'util/datasets'
import { IDatasetReducerState } from 'util/datasets/interfaces'

export const RUN_DATASET_QUERY_REQUEST = 'datasetReducer/RUN_DATASET_QUERY_REQUEST'
export const RUN_DATASET_QUERY_SUCCESS = 'datasetReducer/RUN_DATASET_QUERY_SUCCESS'
export const RUN_DATASET_QUERY_FAILURE = 'datasetReducer/RUN_DATASET_QUERY_FAILURE'
export const RUN_DATASET_QUERY_CANCEL_REQUEST = 'datasetReducer/RUN_DATASET_QUERY_CANCEL_REQUEST'

export const RUN_DATASET_COUNT_REQUEST = 'datasetReducer/RUN_DATASET_COUNT_REQUEST'
export const RUN_DATASET_COUNT_SUCCESS = 'datasetReducer/RUN_DATASET_COUNT_SUCCESS'
export const RUN_DATASET_COUNT_FAILURE = 'datasetReducer/RUN_DATASET_COUNT_FAILURE'
export const RUN_DATASET_COUNT_CANCEL_REQUEST = 'datasetReducer/RUN_DATASET_COUNT_CANCEL_REQUEST'

export const ACTION_TYPE_QUERY = '_query_api_state'
export const ACTION_TYPE_COUNT = '_count_api_state'

// TODO - figure out how we want to do non approximate metrics:
export const ACTION_TYPE_METRICS = '_metrics_api_state'

const defaultObject = {
  canceled: false,
  response: null,
  error: null,
  loaded: false,
  loading: false,
  requestStartedAt: null,
  requestCompletedAt: null,
  queryDefinition: null,
}

export const INITIAL_API_RESPONSE_OBJECT = {
  [ACTION_TYPE_QUERY]: defaultObject,
  [ACTION_TYPE_COUNT]: defaultObject,
}

export const initialState = {
  [RAW_DATASET_KEY]: INITIAL_API_RESPONSE_OBJECT,
}

const datasetReducer = (state: IDatasetReducerState, action: any) => {
  const queryKey = action.groupSlug || RAW_DATASET_KEY
  const actionType = _.includes(action.type, 'COUNT') ? ACTION_TYPE_COUNT : ACTION_TYPE_QUERY

  switch (action.type) {
    case RUN_DATASET_QUERY_CANCEL_REQUEST:
      return {
        ...state,
        [queryKey]: {
          ..._.get(state, queryKey, {}),
          [ACTION_TYPE_QUERY]: {
            ...defaultObject,
            response: _.get(state, `${queryKey}.${actionType}.response`),
            canceled: true,
            requestCompletedAt: new Date().getTime(),
          },
          // When you rerun the query, make sure to make it look like the metrics are also loading:
          [ACTION_TYPE_COUNT]: {
            ..._.get(state, `${queryKey}.${ACTION_TYPE_COUNT}`),
            loading: false,
          },
        },
      }

    case RUN_DATASET_COUNT_CANCEL_REQUEST:
      return {
        ...state,
        [queryKey]: {
          ..._.get(state, queryKey, {}),
          [ACTION_TYPE_COUNT]: {
            ...defaultObject,
            response: _.get(state, `${queryKey}.${actionType}.response`),
            canceled: true,
            requestCompletedAt: new Date().getTime(),
          },
        },
      }

    case RUN_DATASET_QUERY_REQUEST:
      return {
        ...state,
        [queryKey]: {
          ..._.get(state, queryKey, {}),
          [ACTION_TYPE_QUERY]: {
            ...defaultObject,
            response: _.get(state, `${queryKey}.${ACTION_TYPE_QUERY}.response`),
            loading: true,
            requestStartedAt: new Date().getTime(),
            // When triggering a new run dataset request, persist
            // - the query definition that we're running
            queryDefinition: action.queryDefinition,
          },
        },
      }

    case RUN_DATASET_COUNT_REQUEST:
      return {
        ...state,
        [queryKey]: {
          ..._.get(state, queryKey, {}),
          [actionType]: {
            ...defaultObject,
            response: _.get(state, `${queryKey}.${actionType}.response`),
            loading: true,
            requestStartedAt: new Date().getTime(),
            // When triggering a new run dataset request, persist
            // - the query definition that we're running
            queryDefinition: action.queryDefinition,
          },
        },
      }
    case RUN_DATASET_COUNT_SUCCESS:
      return {
        ...state,
        [queryKey]: {
          ..._.get(state, queryKey, {}),
          // update tab's overall total_rows:
          total_rows: action.payload.total_rows,
          [actionType]: {
            ..._.get(state, `${queryKey}.${actionType}`, {}),
            loading: false,
            loaded: true,
            response: action.payload,
            requestCompletedAt: new Date().getTime(),
            // for Narratives, we only get the queryDefinition after the response comes back
            // for BuildDataset, we get the queryDefinition on _REQUEST
            queryDefinition: _.get(state, `${queryKey}.${actionType}.queryDefinition`, action.queryDefinition),
          },
        },
      }
    case RUN_DATASET_QUERY_SUCCESS:
      return {
        ...state,
        [queryKey]: {
          ..._.get(state, queryKey, {}),
          // update tab's overall metrics, column_mapping, and table_rows:
          // - only update total_rows if it's not is_approx (approximate request)
          total_rows: action.payload.is_approx ? undefined : action.payload.total_rows,
          column_mapping: action.payload.column_mapping,
          metrics: action.payload.metrics,
          table_rows: action.payload.data?.rows,
          is_approx: action.payload.is_approx,
          [actionType]: {
            ..._.get(state, `${queryKey}.${actionType}`, {}),
            loading: false,
            loaded: true,
            response: action.payload,
            requestCompletedAt: new Date().getTime(),
            // for Narratives, we only get the queryDefinition after the response comes back
            // for BuildDataset, we get the queryDefinition on _REQUEST
            queryDefinition: _.get(state, `${queryKey}.${actionType}.queryDefinition`, action.queryDefinition),
          },
        },
      }
    case RUN_DATASET_QUERY_FAILURE:
      return {
        ...state,
        [queryKey]: {
          ..._.get(state, queryKey, {}),
          [ACTION_TYPE_QUERY]: {
            ..._.get(state, `${queryKey}.${actionType}`, {}),
            loading: false,
            loaded: true,
            error: action.error,
            requestCompletedAt: new Date().getTime(),
          },
          // When you rerun the query, make sure to make it look like the metrics are also loading:
          [ACTION_TYPE_COUNT]: {
            ..._.get(state, `${queryKey}.${ACTION_TYPE_COUNT}`),
            loading: false,
          },
        },
      }
    case RUN_DATASET_COUNT_FAILURE:
      return {
        ...state,
        [queryKey]: {
          ..._.get(state, queryKey, {}),
          [ACTION_TYPE_COUNT]: {
            ..._.get(state, `${queryKey}.${actionType}`, {}),
            loading: false,
            loaded: true,
            error: action.error,
            requestCompletedAt: new Date().getTime(),
          },
        },
      }
    default:
      throw new Error('Activity type does not exist for this reducer')
  }
}

export default datasetReducer
