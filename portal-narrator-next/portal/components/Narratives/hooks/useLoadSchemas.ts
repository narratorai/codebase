import { useState, useEffect, useCallback } from 'react'
import GenericBlockService from 'util/blocks/GenericBlockService'
import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import { IBlockOptions } from 'util/blocks/interfaces'

export default function useLoadSchemas(): {
  loading: boolean
  error: Error | null
  response?: IBlockOptions
} {
  const company = useCompany()
  const { getTokenSilently: getToken } = useAuth0()

  const [service, setService] = useState<GenericBlockService>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [response, setResponse] = useState<IBlockOptions | undefined>()

  const callback = useCallback(async () => {
    setLoading(true)

    try {
      const resp = await service?.loadSchemas({})
      setResponse(resp)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [service])

  // Instantiate GenericBlockService
  useEffect(() => {
    if (company) {
      setService(new GenericBlockService({ getToken, company }))
    }
  }, [getToken, company])

  useEffect(() => {
    if (service) {
      callback()
    }
  }, [service, callback])

  return {
    loading,
    error,
    response,
  }
}
