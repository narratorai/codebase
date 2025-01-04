import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useCallback, useEffect, useState } from 'react'
import { handleFormatMavisError, MavisError } from 'util/useCallMavis'

import { getCustomerProfile } from './api'

interface IGetCustomerProfile {
  table?: string
  customer: string
  runLive?: boolean
}

interface IUseGetCustomerProfileReturn {
  loading: boolean
  error: MavisError | null
  data?: any
  refetch: ({ runLive }: { runLive?: boolean }) => void
}

export default function useGetCustomerProfile({ table, customer }: IGetCustomerProfile): IUseGetCustomerProfileReturn {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [data, setData] = useState<IUseGetCustomerProfileReturn['data']>(undefined)
  const [loading, setLoading] = useState<IUseGetCustomerProfileReturn['loading']>(true)
  const [error, setError] = useState<IUseGetCustomerProfileReturn['error']>(null)

  const callback = useCallback(
    async ({ table, customer, runLive }: IGetCustomerProfile) => {
      try {
        if (company.slug && table && customer) {
          setLoading(true)
          setError(null)

          const resp = await getCustomerProfile({
            getToken,
            table,
            customer,
            runLive,
            company,
          })

          setData(resp)
        }
      } catch (err: any) {
        setError(handleFormatMavisError(err))
      }

      setLoading(false)
    },
    [getToken, company]
  )

  useEffect(() => {
    callback({ table, customer })
  }, [callback, table, customer])

  return {
    loading,
    data,
    error,
    refetch: ({ runLive }) => callback({ table, customer, runLive }),
  }
}
