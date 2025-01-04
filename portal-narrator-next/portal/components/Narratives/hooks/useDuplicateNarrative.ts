import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useCallback, useState } from 'react'
import { duplicateNarrative } from 'util/narratives'
import { handleFormatMavisError, MavisError } from 'util/useCallMavis'

import { DuplicateNarrativeInput, UpdateNarrativeResponse } from '../interfaces'

interface IUseDuplicateNarrativeReturn {
  loading: boolean
  error: MavisError | null
  saved: boolean
  data?: UpdateNarrativeResponse
}

export default function useDuplicateNarrative(): [
  (input: DuplicateNarrativeInput) => void,
  IUseDuplicateNarrativeReturn,
] {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [saved, setSaved] = useState<IUseDuplicateNarrativeReturn['saved']>(false)
  const [loading, setLoading] = useState<IUseDuplicateNarrativeReturn['loading']>(false)
  const [error, setError] = useState<IUseDuplicateNarrativeReturn['error']>(null)
  const [data, setData] = useState<IUseDuplicateNarrativeReturn['data']>()

  const callback = useCallback(
    async ({ name, id, duplicate_datasets }: DuplicateNarrativeInput) => {
      try {
        setLoading(true)
        const resp = await duplicateNarrative({
          getToken,
          company,
          name,
          id,
          duplicate_datasets,
        })

        setData(resp)
        setSaved(true)
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
      saved,
      error,
      data,
    },
  ]
}
