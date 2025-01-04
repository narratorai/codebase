import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { AssembleFieldsConfig } from 'components/Narratives/interfaces'
import { useCallback, useState } from 'react'
import { assembleNarrativeFields, refreshNarrative } from 'util/narratives'
import { IAssembledFieldsResponse } from 'util/narratives/interfaces'
import { handleFormatMavisError, MavisError } from 'util/useCallMavis'

export interface IAssembleFieldsCallbackProps {
  config: AssembleFieldsConfig
  remove?: boolean
  asRefresh?: boolean
}

export default function useAssembleFields(): [
  ({ config, remove }: IAssembleFieldsCallbackProps) => void,
  {
    refreshed: boolean
    refreshing: boolean
    loading: boolean
    error?: MavisError
    refreshError?: MavisError
    response?: IAssembledFieldsResponse
  },
] {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [loading, setLoading] = useState<boolean>(false)
  const [refreshed, setRefreshed] = useState<boolean>(false)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<MavisError | undefined>()
  const [refreshError, setRefreshError] = useState<MavisError | undefined>()
  const [response, setResponse] = useState<IAssembledFieldsResponse>()

  const callback = useCallback(
    async ({ config, remove, asRefresh }: IAssembleFieldsCallbackProps): Promise<void> => {
      setRefreshed(false)

      if (asRefresh) {
        // Refresh Feilds Flow
        try {
          setRefreshError(undefined)
          setRefreshing(true)

          const resp = await refreshNarrative({
            getToken,
            company,
            config,
          })

          // only set response if refresh bool is returned from Mavis
          if (resp?.refresh && resp?.fields) {
            setResponse(resp)
            setRefreshed(true)
          }
        } catch (err: any) {
          setRefreshError(handleFormatMavisError(err))
        } finally {
          setRefreshing(false)
        }
      } else {
        // Regular Assemble Flow
        try {
          setError(undefined)
          setLoading(true)

          const resp = await assembleNarrativeFields({
            getToken,
            company,
            config,
            remove,
          })

          setResponse(resp)
        } catch (err: any) {
          setRefreshError(err?.response || err)
        } finally {
          setLoading(false)
        }
      }
    },
    [getToken, company]
  )

  return [
    callback,
    {
      refreshed,
      refreshing,
      loading,
      error,
      refreshError,
      response,
    },
  ]
}
