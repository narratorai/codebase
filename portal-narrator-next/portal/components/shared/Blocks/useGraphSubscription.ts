//
// Hook to subscribe to graphql updates
//
// Why use this one?
//  - Handles managing multiple subscriptions
//  - subscribes lazily by default
//

import { useApolloClient, ObservableSubscription, gql, ApolloClient } from '@apollo/client'
import { useRef, useEffect } from 'react'
import _ from 'lodash'

import { getLogger } from '@/util/logger'
const logger = getLogger()

interface SubscribeParams {
  graphQuery: string
  variables: any
  onUpdate: (data: any) => void
}

const useGraphSubscription = () => {
  const client = useApolloClient()
  const subscriptions = useRef<GraphSubscription[]>([])

  useEffect(() => {
    const registered = subscriptions.current
    return function cleanup() {
      _.forEach(registered, (subscription, index) => {
        subscription.unsubscribe()
        logger.debug({ component: 'blocks', index }, `Unsubscribed from graph query`)
      })

      subscriptions.current = []
    }
  }, [])

  const subscribe = ({ graphQuery, variables, onUpdate }: SubscribeParams): void => {
    const alreadySubscribed = _.filter(subscriptions.current, (subscription) => {
      return subscription.matches(graphQuery, variables)
    })

    if (alreadySubscribed.length > 0) {
      return
    }

    const subscription = new GraphSubscription()
    subscription.subscribe({ client, graphQuery, variables, onUpdate })
    subscriptions.current.push(subscription)
    logger.info(
      { component: 'blocks', index: subscriptions.current.length, graphQuery, variables },
      `Subscribed to graph query`
    )
  }

  // return function that takes a data callback -- see if we can unsubscribe ourselves
  return subscribe
}

interface SubscribeParamsClass extends SubscribeParams {
  client: ApolloClient<object>
}

// Helper class to manage a single subscription
class GraphSubscription {
  private _query: string | null = null
  private _variables: object | null = null
  private _subscriptionObject: ObservableSubscription | null = null
  private _onUpdate: ((data: any) => void) | null = null

  matches = (graphQuery: string, variables: any): boolean => {
    return _.isEqual(graphQuery, this._query) && _.isEqual(variables, this._variables)
  }

  subscribe = ({ client, graphQuery, variables, onUpdate }: SubscribeParamsClass): void => {
    if (this._subscriptionObject) {
      throw new Error('Error subscribing: already subscribed')
    }

    if (!onUpdate) {
      throw new Error('onUpdate callback required')
    }

    const query = gql(graphQuery)
    const observable = client.subscribe({ query, variables })

    this._subscriptionObject = observable.subscribe(this._onData, this._onError)
    this._query = graphQuery
    this._variables = variables
    this._onUpdate = onUpdate
  }

  unsubscribe = (): void => {
    if (this._subscriptionObject) {
      this._subscriptionObject.unsubscribe()
    }

    this._subscriptionObject = null
    this._query = null
    this._variables = null
    this._onUpdate = null
  }

  _onData = (data: any): void => {
    logger.debug({ component: 'blocks', update: data }, `Subscription received updates`)
    if (this._onUpdate) {
      this._onUpdate(data)
    }
  }

  _onError = (err: any): void => {
    logger.error({ err, component: 'blocks' }, 'Unable to subscribe to graph query')
    this.unsubscribe()
  }
}

export default useGraphSubscription
