import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useCallback, useState } from 'react'
import { listNarrativeTemplateColumnOptions } from 'util/datasets/api'
import { handleFormatMavisError, MavisError } from 'util/useCallMavis'

type OptionsType = {
  label: string
  value: string
}[]

export interface INarrativeTemplateOptions {
  features: OptionsType
  kpi_formats: string[]
  kpis: OptionsType
  row_name: string
  time_to_convert_options: OptionsType
}

interface IUseNarrativeTemplateOptionsResponse {
  loading: boolean
  error: MavisError | null
  data?: INarrativeTemplateOptions
}

interface ICallbackInput {
  [key: string]: any
}

export default function useListNarrativeTemplateOptions(): [
  (input: ICallbackInput) => void,
  IUseNarrativeTemplateOptionsResponse,
] {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [data, setData] = useState<IUseNarrativeTemplateOptionsResponse['data']>()
  const [loading, setLoading] = useState<IUseNarrativeTemplateOptionsResponse['loading']>(false)
  const [error, setError] = useState<IUseNarrativeTemplateOptionsResponse['error']>(null)

  const callback = useCallback(
    async (body: any) => {
      if (company?.slug) {
        try {
          setLoading(true)
          const resp = await listNarrativeTemplateColumnOptions({
            getToken,
            company,
            body,
          })
          if (resp) {
            setData(resp as unknown as INarrativeTemplateOptions)
          }
        } catch (err: any) {
          setError(handleFormatMavisError(err))
        }
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
