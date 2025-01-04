import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useCallback, useEffect, useState } from 'react'
import { assembleNarrativeDependencyGraph } from 'util/narratives'
import { IFeildsDependencyGraph } from 'util/narratives/api'
import { IDependencyGraphResponse } from 'util/narratives/interfaces'

export default function useDependencyGraph(config: IFeildsDependencyGraph['config']): {
  loading: boolean
  error?: Error
  response?: IDependencyGraphResponse
} {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | undefined>()
  const [response, setResponse] = useState<IDependencyGraphResponse>()

  const callback = useCallback(async (): Promise<void> => {
    try {
      setError(undefined)
      setLoading(true)

      const resp = await assembleNarrativeDependencyGraph({
        getToken,
        company,
        config,
      })

      setResponse(resp)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [getToken, config, company.slug])

  useEffect(() => {
    async function doAsync() {
      await callback()
    }

    if (!response && !loading && !error) {
      doAsync()
    }
  }, [loading, error, response, callback])

  return {
    loading,
    error,
    response,
  }
}
