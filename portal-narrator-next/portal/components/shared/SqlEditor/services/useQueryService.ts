import { useState, useEffect } from 'react'
//
import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import QueryService from 'components/shared/SqlEditor/services/QueryService'

const useQueryService = () => {
  const { getTokenSilently: getToken } = useAuth0()
  const company = useCompany()

  // Initialize query service to be able to run queries
  const [queryService, setQueryService] = useState<QueryService>()

  // Load query service
  useEffect(() => {
    if (company) {
      setQueryService(new QueryService({ getToken, company }))
    }
  }, [getToken, company])

  return queryService
}

export default useQueryService
