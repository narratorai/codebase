import { useMachine } from '@xstate/react'
import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useCallback, useRef } from 'react'
import { MavisError } from 'util/useCallMavis'

import { getCustomerJourney, IGetCustomerJourney } from './api'
import buildCustomerJourneyMachine from './buildCustomerJourneyMachine'
import { IGetCustomerJourneyData } from './interfaces'

type FetchParams = Omit<IGetCustomerJourney, 'getToken' | 'company'>

interface IUseGetCustomerJourneyReturn {
  data?: IGetCustomerJourneyData
  error?: MavisError
  isIdle: boolean
  isLoading: boolean
  isInfiniteLoading: boolean
  isSuccessful: boolean
  isCancelled: boolean
  cancelRequest: () => void
  fetch: (params: FetchParams, signalController?: AbortController) => void
}

export default function useGetCustomerJourneyMachine(): IUseGetCustomerJourneyReturn {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [state, send] = useMachine(buildCustomerJourneyMachine, {
    services: {
      fetchData: (_, event) => {
        const { params, signal } = event
        const { only_first_occurrence, hide_activities, ...otherParams } = params

        return getCustomerJourney({
          getToken,
          signal,
          company,
          only_first_occurrence: !!only_first_occurrence,
          hide_activities: hide_activities ? true : undefined,
          ...otherParams,
        })
      },
    },
  })

  const controller = useRef<AbortController>(new AbortController())

  const fetch = useCallback(
    (params: any, signalController?: AbortController) => {
      controller.current = signalController || new AbortController()

      // infinite scroll fetched by "offset"
      if (params.offset) {
        return send({ type: 'INFINITE_FETCH', params, signal: controller.current.signal })
      }

      // otherwise it's first fetch or submit button
      return send({ type: 'FETCH', params, signal: controller.current.signal })
    },
    [send]
  )

  const cancel = useCallback(() => {
    controller.current?.abort()

    send('CANCEL')
  }, [send])

  return {
    data: state.context.data,
    error: state.context.error,
    isIdle: state.matches('idle'),
    isLoading: state.matches('loading'),
    isInfiniteLoading: state.matches('infinite_loading'),
    isSuccessful: state.matches('success'),
    isCancelled: state.matches('cancelled'),
    cancelRequest: cancel,
    fetch,
  }
}
