import { MavisError } from 'util/useCallMavis'
import { assign, createMachine } from 'xstate'

import { IGetCustomerJourneyData } from './interfaces'

const buildCustomerJourneyMachine = createMachine({
  predictableActionArguments: true,
  initial: 'idle',
  context: { data: undefined, error: undefined },
  schema: { context: {} as { data?: IGetCustomerJourneyData; error?: MavisError } },
  states: {
    idle: {
      on: {
        FETCH: {
          target: 'loading',
        },
        INFINITE_FETCH: 'infinite_loading',
      },
    },
    loading: {
      invoke: {
        src: 'fetchData',
        onDone: {
          target: 'success',
          actions: [assign({ data: (_, event) => event.data })],
        },
        onError: {
          target: 'failure',
          actions: [
            assign({
              error: (_, event) => {
                if (event.data?.response?.name === 'AbortError') {
                  return null
                } else {
                  return event.data
                }
              },
            }),
          ],
        },
      },
      on: {
        CANCEL: {
          target: 'cancelled',
        },
      },
    },
    infinite_loading: {
      invoke: {
        src: 'fetchData',
        onDone: {
          target: 'success',
          actions: [
            assign({
              data: (context, event) => {
                // include previously fetched rows in new data object
                const previousRows = context.data?.data?.rows || []
                const newRows = previousRows.concat(event.data.data.rows)

                return {
                  ...event.data,
                  data: {
                    ...event.data.data,
                    rows: newRows,
                  },
                }
              },
            }),
          ],
        },
        onError: {
          target: 'failure',
          actions: [
            assign({
              error: (_, event) => {
                if (event.data?.response?.name === 'AbortError') {
                  return null
                } else {
                  return event.data
                }
              },
            }),
          ],
        },
      },
      on: {
        CANCEL: {
          target: 'cancelled',
        },
      },
    },
    success: {
      on: { FETCH: 'loading', INFINITE_FETCH: 'infinite_loading' },
    },
    failure: {
      on: { FETCH: 'loading', INFINITE_FETCH: 'infinite_loading' },
    },
    cancelled: {
      on: { FETCH: 'loading', INFINITE_FETCH: 'infinite_loading' },
    },
  },
})

export default buildCustomerJourneyMachine
