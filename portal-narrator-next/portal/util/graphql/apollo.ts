import {
  ApolloClient,
  ApolloLink,
  FetchResult,
  from,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
  Operation,
  split,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { RetryLink } from '@apollo/client/link/retry'
import { getMainDefinition, Observable } from '@apollo/client/utilities'
import { GraphQLError, print } from 'graphql'
import { Client as WSClient, ClientOptions as WSClientOptions, createClient as createWsClient } from 'graphql-ws'
import { reportError } from 'util/errors'
import { GetToken } from 'util/interfaces'

import { isServer } from '@/util/env'
import { getLogger } from '@/util/logger'

import { graphHealthcheck } from './healthcheck'
const logger = getLogger()

interface makeApolloClientProps {
  getToken: GetToken
}

// Share a cache between clients
// A new client is generated during init when a company slug is detected
const apolloCache = new InMemoryCache()

class WebSocketLink extends ApolloLink {
  private client: WSClient

  constructor(options: WSClientOptions) {
    super()
    this.client = createWsClient(options)
  }

  public request(operation: Operation): Observable<FetchResult> {
    return new Observable((sink) => {
      return this.client.subscribe<FetchResult>(
        { ...operation, query: print(operation.query) },
        {
          next: sink.next.bind(sink),
          complete: sink.complete.bind(sink),
          error: (err: unknown) => {
            if (Array.isArray(err)) {
              // GraphQLError[]x
              return sink.error(new Error(err.map(({ message }) => message).join(', ')))
            }

            if (err instanceof CloseEvent) {
              return sink.error(
                // reason will be available on clean closes
                new Error(`WS Socket closed with event ${err.code} ${err.reason || ''}`)
              )
            }

            // Fallback
            return sink.error(err)
          },
        }
      )
    })
  }
}

export const makeApolloClient = ({ getToken }: makeApolloClientProps): ApolloClient<NormalizedCacheObject> => {
  // Retries operations in case of network errors
  // This is very helpful for websockets, which can raise a lot of `start-failed` errors while initializing
  // https://www.apollographql.com/docs/link/links/retry/
  const retryLink = new RetryLink({
    delay: {
      initial: 300,
      max: Infinity,
      jitter: true,
    },
    attempts: {
      max: 10,
    },
  })

  // Create an http link:
  const authLink = setContext(async (_, { headers }) => {
    try {
      const token = await getToken()
      if (!token) {
        throw new Error('Missing auth token')
      }

      return {
        headers: {
          ...headers,
          authorization: `Bearer ${token}`,
        },
      }
    } catch (err) {
      logger.error({ err }, 'Auth Link Error')
      throw err
    }
  })

  const abortController = new AbortController()

  const httpLink = authLink.concat(
    new HttpLink({
      uri: `https://${process.env.NEXT_PUBLIC_GRAPH_DOMAIN}/v1/graphql`,
      fetch,
      fetchOptions: {
        mode: 'cors',
        signal: abortController.signal,
      },
    })
  )

  const wsLink = isServer
    ? null
    : new WebSocketLink({
        url: `wss://${process.env.NEXT_PUBLIC_GRAPH_DOMAIN}/v1/graphql`,
        lazy: true,
        lazyCloseTimeout: 30 * 60 * 1000, // 30 minutes
        connectionAckWaitTimeout: 15 * 1000, // 15 seconds
        keepAlive: 31 * 1000, // 30 seconds (hasura cofigured) + 1s padding
        retryAttempts: 20,
        retryWait: async () => {
          // wait for graph to become healthy before retrying after an abrupt disconnect (most commonly a restart)
          await graphHealthcheck()

          // after the server becomes ready, wait for a second + random 1-4s timeout
          // (avoid DDoSing ourselves) and try connecting again
          await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 3000))
        },
        connectionParams: async () => {
          try {
            const token = await getToken()
            if (!token) {
              throw new Error('Missing auth token')
            }

            return {
              headers: {
                authorization: `Bearer ${token}`,
              },
            }
          } catch (err) {
            logger.error({ err }, 'WS Connection Params Failed')
            throw err
          }
        },
        on: {
          connecting: () => logger.debug('WS Connecting'),
          connected: () => logger.debug('WS Connected'),
          closed: (event) => logger.debug({ event }, 'WS Closed'),
          error: (err) => logger.debug({ err }, 'WS Error'),
        },
      })

  // chose the link to use based on operation
  const graphLink = isServer
    ? httpLink
    : split(
        // split based on operation type
        ({ query }) => {
          const def = getMainDefinition(query)
          return def.kind === 'OperationDefinition' && def.operation === 'subscription'
        },
        wsLink as ApolloLink,
        httpLink
      )

  // https://hasura.io/blog/handling-graphql-hasura-errors-with-react/
  const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, extensions, locations, path, originalError }) => {
        logger.error({ err: originalError, locations, path, extensions }, `GraphQL Error: ${message}`)

        reportError(`GraphQL Error: ${message}`, originalError, {
          locations,
          path,
          query: operation.query,
          operationName: operation.operationName,
          extensions,
        })
      })
    }

    if (networkError) {
      reportError(`GraphQL Network Error: ${networkError.message}`, null, {
        code: (networkError as GraphQLError).extensions?.code,
        query: operation.query,
        operationName: operation.operationName,
      })
    }
  })

  const client = new ApolloClient({
    link: from([errorLink, retryLink, graphLink]),
    cache: apolloCache,
    assumeImmutableResults: true,
    ssrMode: isServer,
  })

  return client
}
