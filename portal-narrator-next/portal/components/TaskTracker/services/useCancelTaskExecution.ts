import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useCallback, useState } from 'react'
import { handleFormatMavisError, MavisError } from 'util/useCallMavis'

import { cancelTaskExecution } from './api'

interface IUseCancelTaskExecutionReturn {
  loading: boolean
  error: MavisError | null
  canceled: boolean
}

export default function useCancelTaskExecution(): [(id: string) => Promise<void>, IUseCancelTaskExecutionReturn] {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [canceled, setCanceled] = useState<IUseCancelTaskExecutionReturn['canceled']>(false)
  const [loading, setLoading] = useState<IUseCancelTaskExecutionReturn['loading']>(false)
  const [error, setError] = useState<IUseCancelTaskExecutionReturn['error']>(null)

  const callback = useCallback(
    async (id: string) => {
      try {
        setLoading(true)
        setCanceled(false)
        await cancelTaskExecution({
          getToken,
          id,
          company,
        })

        setCanceled(true)
      } catch (err: any) {
        setError(handleFormatMavisError(err))
      } finally {
        setLoading(false)
      }
    },
    [getToken, company]
  )

  return [
    callback,
    {
      loading,
      canceled,
      error,
    },
  ]
}
