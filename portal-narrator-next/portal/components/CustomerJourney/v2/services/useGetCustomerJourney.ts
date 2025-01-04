import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useCallback, useEffect, useRef, useState } from 'react'
import { handleFormatMavisError, MavisError } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'

import { getLogger } from '@/util/logger'

import { getCustomerJourney } from './api'
import { IGetCustomerJourneyData } from './interfaces'

const logger = getLogger()

interface IUseGetCustomerJourneyReturn {
  loading: boolean
  error: MavisError | null
  data?: IGetCustomerJourneyData
  infiniteScrollLoading: boolean
  cancelRequest: () => void
}

interface ICallbackInput {
  customer?: string
  customerKind?: string
  table?: string
  activities?: string[]
  start_activity?: string
  only_first_occurrence: boolean
  timestamp?: string
  offset?: number
  asc?: boolean
  time_filter?: Record<string, any>
  as_visual?: boolean
  runLive?: boolean
  depth?: number
  hide_activities?: boolean
  time_between?: number
  time_between_resolution?: string
}

export default function useGetCustomerJourney(): [(input: ICallbackInput) => void, IUseGetCustomerJourneyReturn] {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [data, setData] = useState<IGetCustomerJourneyData>()
  const [loading, setLoading] = useState(false)
  const [infiniteScrollLoading, setInfiniteScrollLoading] = useState(false)
  const [error, setError] = useState<IUseGetCustomerJourneyReturn['error']>(null)

  const controllerRef = useRef<AbortController>()

  // Allow the user to cancel the request
  const cancelRequest = useCallback(() => {
    if (controllerRef?.current?.signal) {
      controllerRef.current.abort()
    }
  }, [])

  const currentSignal = controllerRef.current?.signal
  const prevSignal = usePrevious(currentSignal)
  // RACE CASE: maintain loading state throughout cancel requests (aborted)
  useEffect(() => {
    // if the previous signal was aborted
    // even though we cancel the request, it takes a while for the response to come back (triggers loading false)
    // this can overwrite the loading state of the next request
    // as long as the current signal is not aborted - loading will be set to false in the finally block
    if (!loading && prevSignal?.aborted && !currentSignal?.aborted) {
      setLoading(true)
    }
  }, [loading, prevSignal, currentSignal])

  const callback = useCallback(
    async ({
      customer,
      customerKind,
      table,
      activities,
      start_activity,
      only_first_occurrence,
      timestamp,
      offset,
      asc = false,
      time_filter,
      as_visual,
      runLive,
      depth,
      hide_activities,
      time_between,
      time_between_resolution,
    }: ICallbackInput) => {
      logger.info({ offset, table, activities, timestamp, asc, customerKind, loading }, 'Get Customer Journey')

      try {
        if (company.slug) {
          // if an abort controller has been set, make sure to cancel it (from the previous run)
          cancelRequest()

          // attach a controller to request for future aborts
          controllerRef.current = new AbortController()

          setError(null)
          setLoading(true)

          // offset is only passed on infinite scroll
          if (offset) {
            setInfiniteScrollLoading(true)
          }

          const resp = await getCustomerJourney({
            getToken,
            customer,
            customer_kind: customerKind,
            table,
            activities,
            start_activity,
            only_first_occurrence: !!only_first_occurrence,
            timestamp,
            time_filter,
            asc,
            offset,
            signal: controllerRef.current.signal,
            as_visual,
            runLive,
            depth,
            hide_activities: hide_activities ? true : undefined,
            time_between,
            time_between_resolution,
            company,
          })

          // set controller to abort if the user tries to submit multiple times (cancel previous reqs)
          controllerRef.current = new AbortController()

          // offset is only passed when getting more data (to concat new data)
          if (offset) {
            setData((previous: any) => ({
              ...resp,
              data: {
                ...resp.data,
                rows: previous?.data?.rows ? previous?.data?.rows?.concat(resp.data.rows) : resp.data.rows,
              },
            }))
          } else {
            setData(resp)
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          setError(handleFormatMavisError(error))
        }
      } finally {
        setLoading(false)
        setInfiniteScrollLoading(false)
      }
    },
    [getToken, company, cancelRequest]
  )

  return [
    callback,
    {
      loading,
      infiniteScrollLoading,
      data,
      error,
      cancelRequest,
    },
  ]
}
