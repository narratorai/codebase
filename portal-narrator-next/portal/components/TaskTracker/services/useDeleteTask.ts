import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useCallback, useState } from 'react'
import { handleFormatMavisError, MavisError } from 'util/useCallMavis'

import { deleteTask } from './api'

interface IUseDeleteTaskReturn {
  loading: boolean
  error: MavisError | null
  deleted: boolean
}

export default function useDeleteTask(): [(id: string) => void, IUseDeleteTaskReturn] {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [deleted, setDeleted] = useState<IUseDeleteTaskReturn['deleted']>(false)
  const [loading, setLoading] = useState<IUseDeleteTaskReturn['loading']>(false)
  const [error, setError] = useState<IUseDeleteTaskReturn['error']>(null)

  const callback = useCallback(
    async (id: string) => {
      try {
        setLoading(true)
        await deleteTask({
          getToken,
          id,
          company,
        })

        setDeleted(true)
      } catch (err: any) {
        setError(handleFormatMavisError(err))
      }
      setLoading(false)
    },
    [getToken, company]
  )

  return [
    callback,
    {
      loading,
      deleted,
      error,
    },
  ]
}
