import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { INarrative } from 'graph/generated'
import { useCallback, useState } from 'react'
import analytics from 'util/analytics'
import { INarrative as IAssembledNarrative } from 'util/interfaces'
import { assembleNarrative } from 'util/narratives'
import { handleFormatMavisError, MavisError } from 'util/useCallMavis'

export default function useAssembleNarrative(): [
  ({ narrative, onSuccess }: { narrative: Partial<INarrative>; onSuccess?: () => void }) => Promise<void>,
  {
    loading: boolean
    error?: MavisError
    response?: any
  },
] {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<MavisError | undefined>()
  const [response, setResponse] = useState<IAssembledNarrative>()

  const callback = useCallback(
    async ({ narrative, onSuccess }: { narrative: Partial<INarrative>; onSuccess?: () => void }) => {
      try {
        setError(undefined)
        setLoading(true)

        const resp = await assembleNarrative({
          getToken,
          company,
          narrativeSlug: narrative.slug as string,
        })

        analytics.track('assembled_narrative', {
          narrative_slug: narrative.slug,
        })

        setResponse(resp)

        if (onSuccess) {
          onSuccess()
        }
      } catch (err: any) {
        setError(handleFormatMavisError(err))
      } finally {
        setLoading(false)
      }
    },
    [getToken, company.slug]
  )

  return [
    callback,
    {
      loading,
      error,
      response,
    },
  ]
}
