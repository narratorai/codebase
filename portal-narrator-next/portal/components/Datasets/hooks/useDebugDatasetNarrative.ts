import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useCallback, useState } from 'react'
import { debugDatasetNarrative } from 'util/datasets/api'
import { handleFormatMavisError, MavisError } from 'util/useCallMavis'

interface ICallbackInput {
  [key: string]: any
}

interface IUseDebugDatasetNarrativeResponse {
  loading: boolean
  error: MavisError | null
  data?: {
    markdown?: string
    open_helpscout?: boolean
    helpscout_message?: string
  }
}

export default function useDebugDatasetNarrative(): [
  (input: ICallbackInput) => void,
  IUseDebugDatasetNarrativeResponse,
] {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [data, setData] = useState<IUseDebugDatasetNarrativeResponse['data']>()
  const [loading, setLoading] = useState<IUseDebugDatasetNarrativeResponse['loading']>(false)
  const [error, setError] = useState<IUseDebugDatasetNarrativeResponse['error']>(null)

  const callback = useCallback(
    async (body: any) => {
      if (!company?.slug) {
        return null
      }

      try {
        setError(null)
        setLoading(true)
        const resp = await debugDatasetNarrative({
          getToken,
          body,
          company,
        })

        if (resp) {
          setData(resp)
        }
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
      data,
      error,
    },
  ]
}
