import { useState, useEffect } from 'react'
import { useAuth0 } from 'components/context/auth/hooks'
import { useCompany } from 'components/context/company/hooks'
import FieldsWarehouseSource from './FieldsWarehouseSource'

const useFieldsWarehouseSource = () => {
  const { getTokenSilently: getToken } = useAuth0()
  const company = useCompany()

  const [source, setSource] = useState<FieldsWarehouseSource>()

  useEffect(() => {
    if (company) {
      setSource(new FieldsWarehouseSource({ getToken, company }))
    }
  }, [getToken, company])

  return source
}

export default useFieldsWarehouseSource
