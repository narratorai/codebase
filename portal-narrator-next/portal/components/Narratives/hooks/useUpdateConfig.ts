import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useCallback, useState } from 'react'
import analytics from 'util/analytics'
import { updateConfigFile } from 'util/narratives'
import { MavisError } from 'util/useCallMavis'

import { GetFileAPIReturn } from '../interfaces'

interface IUseUpdateConfigReturn {
  loading: boolean
  error?: MavisError
  saved: boolean
}

export interface IUpdateConfigCallbackInput {
  narrativeSlug: string
  updatedNarrativeConfig: GetFileAPIReturn
}

export default function useUpdateConfig(): [(input: IUpdateConfigCallbackInput) => void, IUseUpdateConfigReturn] {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<MavisError>()

  const callback = useCallback(
    async ({
      narrativeSlug,
      updatedNarrativeConfig,
    }: {
      narrativeSlug: string
      updatedNarrativeConfig: GetFileAPIReturn
    }) => {
      try {
        setError(undefined)
        setLoading(true)

        // TODO: add a write endpoint to files api
        await updateConfigFile({
          getToken,
          company,
          narrativeSlug,
          config: updatedNarrativeConfig,
        })

        analytics.track('updated_narrative_config', {
          narrative_slug: narrativeSlug,
        })

        setSaved(true)
      } catch (err) {
        setError(err as MavisError)
      }
      setLoading(false)
    },
    [getToken, company.slug]
  )

  return [
    callback,
    {
      loading,
      saved,
      error,
    },
  ]
}
