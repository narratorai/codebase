import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { useCallback, useRef, useState } from 'react'
import { handleFormatMavisError, MavisError } from 'util/useCallMavis'

import { getAutoCompleteCustomer } from './api'

interface IUseGetAutoCompleteCustomerReturn {
  loading: boolean
  error: MavisError | null
  data?: any
  reset: () => void
  cancel: () => void
}

interface ICallbackInput {
  dimTable: string
  inputValue: string
}

export default function useGetAutoCompleteCustomer(): [
  (input: ICallbackInput) => void,
  IUseGetAutoCompleteCustomerReturn,
] {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [data, setData] = useState<IUseGetAutoCompleteCustomerReturn['data']>(undefined)
  const [loading, setLoading] = useState<IUseGetAutoCompleteCustomerReturn['loading']>(false)
  const [error, setError] = useState<IUseGetAutoCompleteCustomerReturn['error']>(null)
  const controller = useRef<AbortController>(new AbortController())

  const cancel = useCallback(() => {
    controller.current.abort()
    controller.current = new AbortController()
  }, [])

  const reset = useCallback(() => {
    cancel()
    setData(undefined)
    setLoading(false)
    setError(null)
  }, [cancel])

  const callback = useCallback(
    async ({ inputValue, dimTable }: ICallbackInput) => {
      try {
        if (company.slug) {
          setError(null)
          setLoading(true)
          const resp = await getAutoCompleteCustomer({
            getToken,
            dimTable,
            inputValue,
            signal: controller.current.signal,
            company,
          })

          setData(resp)
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(handleFormatMavisError(err))
        }
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
      reset,
      cancel,
    },
  ]
}
