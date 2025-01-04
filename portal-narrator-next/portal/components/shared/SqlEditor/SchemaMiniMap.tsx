import { useMachine } from '@xstate/react'
import { Result, Spin } from 'antd-next'
import React, { useEffect } from 'react'
import { assign, createMachine } from 'xstate'

import { getLogger } from '@/util/logger'

import SchemaTree from './SchemaTree'
import { ISchemas } from './services/interfaces'

const logger = getLogger()
const fetchMachine = createMachine({
  predictableActionArguments: true,
  initial: 'idle',
  context: { data: {}, error: undefined as Error | undefined },
  states: {
    idle: {
      on: {
        FETCH: 'loading',
      },
    },
    loading: {
      invoke: {
        src: 'fetchData',
        onDone: {
          target: 'success',
          actions: assign({ data: (_, event) => event.data }),
        },
        onError: {
          target: 'failure',
          actions: [
            assign({ error: (_, event) => event.data }),
            (ctx) => logger.error({ err: ctx.error }, 'Error running query'),
          ],
        },
      },
    },
    success: {
      type: 'final',
    },
    failure: {
      on: {
        RETRY: 'loading',
      },
    },
  },
})

interface SchemaMiniMapProps {
  getSchemas: () => Promise<ISchemas>
}

const SchemaMiniMap: React.FC<SchemaMiniMapProps> = ({ getSchemas }) => {
  const [state, send] = useMachine(fetchMachine, {
    services: { fetchData: () => getSchemas() },
  })

  useEffect(() => {
    send('FETCH')
  }, [send])

  if (state.matches('loading')) return <Spin />
  if (state.matches('failure')) return <Result status="warning" title={state.context.error?.message} />
  if (state.matches('success')) return <SchemaTree schemasData={state.context.data} />

  return null
}

export default SchemaMiniMap
