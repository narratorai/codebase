import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useCallback, useState } from 'react'
import { deleteDataset } from 'util/datasets/api'
import { handleFormatMavisError, MavisError } from 'util/useCallMavis'

interface IUseDeleteDatasetReturn {
  loading: boolean
  error: MavisError | null
  deleted: boolean
}

export default function useDeleteDataset(): [(id: string) => void, IUseDeleteDatasetReturn] {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [deleted, setDeleted] = useState<IUseDeleteDatasetReturn['deleted']>(false)
  const [loading, setLoading] = useState<IUseDeleteDatasetReturn['loading']>(false)
  const [error, setError] = useState<IUseDeleteDatasetReturn['error']>(null)

  const callback = useCallback(
    async (id: string) => {
      if (company) {
        try {
          setLoading(true)
          await deleteDataset({
            getToken,
            company,
            id,
          })

          setDeleted(true)
        } catch (err: any) {
          setError(handleFormatMavisError(err))
        }
        setLoading(false)
      }
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
