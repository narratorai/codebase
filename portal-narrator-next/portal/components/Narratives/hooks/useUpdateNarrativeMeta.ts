import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { UpdateNarrativeMetaInput, UpdateNarrativeResponse } from 'components/Narratives/interfaces'
import { INarrative_Types_Enum } from 'graph/generated'
import { useCallback, useState } from 'react'
import analytics from 'util/analytics'
import { updateNarrativeMeta } from 'util/narratives'
import { handleFormatMavisError, MavisError } from 'util/useCallMavis'

interface IUseUpdateNarrativeReturn {
  loading: boolean
  error: MavisError | null
  saved: boolean
  response?: UpdateNarrativeResponse
}

export default function useUpdateNarrativeMeta(): [
  (input: UpdateNarrativeMetaInput) => void,
  IUseUpdateNarrativeReturn,
] {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [saved, setSaved] = useState<IUseUpdateNarrativeReturn['saved']>(false)
  const [response, setResponse] = useState<IUseUpdateNarrativeReturn['response']>()
  const [loading, setLoading] = useState<IUseUpdateNarrativeReturn['loading']>(false)
  const [error, setError] = useState<IUseUpdateNarrativeReturn['error']>(null)

  const callback = useCallback(
    async ({
      narrative_id,
      name,
      slug,
      state,
      description,
      category,
      schedule,
      requested_by,
      isEdit,
      depends_on,
      type = INarrative_Types_Enum.Analysis,
      created_by,
      tags,
      config,
    }: UpdateNarrativeMetaInput) => {
      try {
        setLoading(true)
        setSaved(false)
        setError(null)

        const resp = await updateNarrativeMeta({
          getToken,
          company,
          narrative_id,
          name,
          slug,
          state,
          description,
          category,
          schedule,
          requested_by,
          depends_on,
          type,
          created_by,
          tags,
          config,
        })

        analytics.track(isEdit ? 'updated_narrative_meta' : 'created_narrative', {
          narrative_slug: slug,
          narrative_state: state,
        })

        setResponse(resp)
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
      response,
    },
  ]
}
