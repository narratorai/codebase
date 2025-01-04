import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useCallback, useState } from 'react'
import { duplicateDataset } from 'util/datasets/api'
import { handleFormatMavisError, MavisError } from 'util/useCallMavis'

interface Response {
  dataset_id: string
  dataset_slug: string
}

interface IUseDuplicateDatasetReturn {
  loading: boolean
  error: MavisError | null
  saved: boolean
  data?: Response
}

interface ICallbackInput {
  name: string
  id: string
}

export default function useDuplicateDataset(): [(input: ICallbackInput) => void, IUseDuplicateDatasetReturn] {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [saved, setSaved] = useState<IUseDuplicateDatasetReturn['saved']>(false)
  const [loading, setLoading] = useState<IUseDuplicateDatasetReturn['loading']>(false)
  const [error, setError] = useState<IUseDuplicateDatasetReturn['error']>(null)
  const [data, setData] = useState<IUseDuplicateDatasetReturn['data']>(undefined)

  const callback = useCallback(
    async ({ name, id }: ICallbackInput) => {
      if (company?.slug) {
        try {
          setLoading(true)
          const resp = (await duplicateDataset({
            getToken,
            company,
            name,
            id,
          })) as unknown as Response

          setData(resp)
          setSaved(true)
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
      saved,
      error,
      data,
    },
  ]
}
