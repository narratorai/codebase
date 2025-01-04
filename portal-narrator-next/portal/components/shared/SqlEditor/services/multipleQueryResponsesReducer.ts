import _ from 'lodash'

export const RUN_QUERY_REQUEST = 'multipleQueryResponsesReducer/RUN_QUERY_REQUEST'
export const RUN_QUERY_SUCCESS = 'multipleQueryResponsesReducer/RUN_QUERY_SUCCESS'
export const RUN_QUERY_FAILURE = 'multipleQueryResponsesReducer/RUN_QUERY_FAILURE'
export const RUN_QUERY_CANCEL_REQUEST = 'multipleQueryResponsesReducer/RUN_QUERY_CANCEL_REQUEST'
export const RUN_QUERY_CANCEL_SUCCESS = 'multipleQueryResponsesReducer/RUN_QUERY_CANCEL_SUCCESS'
export const RUN_QUERY_CANCEL_FAILURE = 'multipleQueryResponsesReducer/RUN_QUERY_CANCEL_FAILURE'

export const CURRENT_QUERY_ID = 'current_query'

interface ReducerAction {
  type: string
  id?: string
  scratchpad?: any[]
  error?: Object
  payload?: Object
  sql?: string
}

interface QueryResponse {
  canceled: boolean
  canceling: boolean
  response: any
  error: { message?: string } | null
  loaded: boolean
  loading: boolean
  requestStartedAt: number | null
  requestCompletedAt: number | null
  sql: string | null
}

interface ReducerState {
  [prop: string]: QueryResponse
}

const defaultObject = {
  canceled: false,
  canceling: false,
  response: null,
  error: null,
  loaded: false,
  loading: false,
  requestStartedAt: null,
  requestCompletedAt: null,
  sql: null,
}

export const initialState = {
  [CURRENT_QUERY_ID]: defaultObject,
}

const multipleQueryResponsesReducer = (state: ReducerState, action: ReducerAction): ReducerState => {
  const queryId = action.id || CURRENT_QUERY_ID

  switch (action.type) {
    case RUN_QUERY_REQUEST:
      return {
        ...state,
        [queryId]: {
          ...defaultObject,
          ...state[queryId],
          error: null,
          response: _.get(state, `${queryId}.response`),
          loaded: false,
          loading: true,
          requestStartedAt: new Date().getTime(),
          // When triggering a new request, persist the sql that was run
          sql: action.sql || '',
        },
      }

    case RUN_QUERY_SUCCESS:
      return {
        ...state,
        [queryId]: {
          ...state[queryId],
          loading: false,
          loaded: true,
          response: action.payload || null,
          requestCompletedAt: new Date().getTime(),
        },
      }

    case RUN_QUERY_CANCEL_REQUEST:
      return {
        ...state,
        [queryId]: {
          ...state[queryId],
          loading: true,
          loaded: false,
          canceling: true,
          canceled: false,
          response: null,
          requestCompletedAt: new Date().getTime(),
        },
      }

    case RUN_QUERY_CANCEL_SUCCESS:
      return {
        ...state,
        [queryId]: {
          ...state[queryId],
          loading: false,
          loaded: false,
          canceling: false,
          canceled: true,
          requestCompletedAt: new Date().getTime(),
        },
      }

    case RUN_QUERY_FAILURE:
    case RUN_QUERY_CANCEL_FAILURE:
      return {
        ...state,
        [queryId]: {
          ...state[queryId],
          loading: false,
          loaded: false,
          canceling: false,
          canceled: false,
          error: action.error || {},
          requestCompletedAt: new Date().getTime(),
        },
      }
    default:
      throw new Error('Activity type does not exist for this reducer')
  }
}

export default multipleQueryResponsesReducer
