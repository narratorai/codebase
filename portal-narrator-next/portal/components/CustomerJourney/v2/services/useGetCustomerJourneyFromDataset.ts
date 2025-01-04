import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useCallback, useState } from 'react'
import { IDatasetQueryDefinition } from 'util/datasets/interfaces'
import { handleFormatMavisError, MavisError } from 'util/useCallMavis'

import { getLogger } from '@/util/logger'

import { getCustomerJourneyFromDataset } from './api'
import { IGetCustomerJourneyData } from './interfaces'

const logger = getLogger()

interface IUseGetCustomerJourneyFromDatasetReturn {
  loading: boolean
  error: MavisError | null
  data?: IGetCustomerJourneyData
  infiniteScrollLoading: boolean
}

interface ICallbackInput {
  row: object
  dataset: IDatasetQueryDefinition
  offset?: number
  fullJourney?: boolean
}

// This hook's returned callback (getCustomerJourneyFromDataset) takes the row right-clicked on in a dataset, plus the dataset's full queryDefinition
// and returns a customer journey (for the customer journey sidebar in dataset)
export default function useGetCustomerJourneyFromDataset(): [
  (input: ICallbackInput) => void,
  IUseGetCustomerJourneyFromDatasetReturn,
] {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [data, setData] = useState<IGetCustomerJourneyData>()
  const [loading, setLoading] = useState<IUseGetCustomerJourneyFromDatasetReturn['loading']>(false)
  const [infiniteScrollLoading, setInfiniteScrollLoading] =
    useState<IUseGetCustomerJourneyFromDatasetReturn['infiniteScrollLoading']>(false)
  const [error, setError] = useState<IUseGetCustomerJourneyFromDatasetReturn['error']>(null)

  const callback = useCallback(
    async ({ row, dataset, offset, fullJourney = false }: ICallbackInput) => {
      logger.info({ offset, row }, 'Get Customer Journey in Dataset')

      try {
        if (company.slug) {
          setError(null)
          setLoading(true)

          // offset is only passed on infinite scroll
          if (offset) {
            setInfiniteScrollLoading(true)
          }

          const resp = await getCustomerJourneyFromDataset({
            getToken,
            row,
            dataset,
            offset,
            fullJourney,
            company,
          })

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
      } catch (err: any) {
        setError(handleFormatMavisError(err))
      }

      setLoading(false)
      setInfiniteScrollLoading(false)
    },
    [getToken, company]
  )

  return [
    callback,
    {
      loading,
      data,
      error,
      infiniteScrollLoading,
    },
  ]
}
