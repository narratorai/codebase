import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useCallback, useState } from 'react'
import { createDatasetNarrative } from 'util/datasets/api'
import { handleFormatMavisError, MavisError } from 'util/useCallMavis'

interface ICallbackInput {
  [key: string]: any
}

interface IUseCreateDatasetNarrativeResponse {
  loading: boolean
  error: MavisError | null
  data: {
    dataset_slug: string
    markdown: string
    narrative_slug: string
    narrative_name: string
  }
}

export default function useCreateDatasetNarrative(): [
  (input: ICallbackInput) => void,
  IUseCreateDatasetNarrativeResponse,
] {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [data, setData] = useState<any>()
  const [loading, setLoading] = useState<IUseCreateDatasetNarrativeResponse['loading']>(false)
  const [error, setError] = useState<IUseCreateDatasetNarrativeResponse['error']>(null)

  const callback = useCallback(
    async (body: any) => {
      try {
        if (!company?.slug) {
          return null
        }

        setLoading(true)
        const resp = await createDatasetNarrative({
          getToken,
          body,
          company,
        })
        if (resp) {
          setData(resp)
        }
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
      data,
      error,
    },
  ]
}
