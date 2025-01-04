import { IBasicCompletionDefinition } from '@narratorai/the-sequel'
import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useCallback, useState } from 'react'
import { reportError } from 'util/errors'
import { IAssembledFieldsResponse } from 'util/narratives/interfaces'
import { MavisError } from 'util/useCallMavis'

import NarrativeAutocomplete from '../BuildNarrative/NarrativeAutocomplete'

interface IUseLoadAutocmpleteReturn {
  loading: boolean
  error?: MavisError
  response?: IBasicCompletionDefinition[]
}

export default function useLoadAutocomplete(): [
  (fields: IAssembledFieldsResponse['fields']) => Promise<void>,
  IUseLoadAutocmpleteReturn,
] {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<MavisError>()
  const [response, setResponse] = useState<IBasicCompletionDefinition[]>()

  const callback = useCallback(
    async (fields: IAssembledFieldsResponse['fields']) => {
      try {
        setError(undefined)
        setLoading(true)

        const auto = await new NarrativeAutocomplete({ getToken, company }).loadAutocomplete(fields)

        setResponse(auto)
      } catch (error) {
        const _err = error as MavisError
        setError(_err)
        reportError(_err.message, _err)
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
      error,
      response,
    },
  ]
}
