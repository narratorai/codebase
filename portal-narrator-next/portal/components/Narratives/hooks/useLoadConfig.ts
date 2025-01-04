import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useCallback, useEffect, useState } from 'react'
import { loadConfigFile } from 'util/narratives'
import { MavisError } from 'util/useCallMavis'

import { GetFileAPIReturn } from '../interfaces'

interface IUseLoadConfigReturn {
  loading: boolean
  error?: MavisError
  response: GetFileAPIReturn | null | undefined
}

export default function useLoadConfig(narrativeSlug?: string): IUseLoadConfigReturn {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<MavisError>()
  const [response, setResponse] = useState<GetFileAPIReturn | null>()

  const callback = useCallback(
    async ({ narrativeSlug }: { narrativeSlug: string }): Promise<void> => {
      try {
        setError(undefined)
        setLoading(true)

        const resp = await loadConfigFile({
          company,
          narrativeSlug,
          getToken,
        })

        setResponse(resp)
      } catch (err) {
        setError(err as MavisError)
      } finally {
        setLoading(false)
      }
    },
    [getToken, company]
  )

  // Load Narrative Config (handled by Mavis)
  useEffect(() => {
    if (narrativeSlug) {
      callback({
        narrativeSlug,
      })
    }
  }, [narrativeSlug, callback])

  return {
    loading,
    error,
    response,
  }
}
