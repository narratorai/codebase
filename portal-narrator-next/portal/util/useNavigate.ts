import { useCompany } from 'components/context/company/hooks'
import { useCallback } from 'react'
import { useHistory } from 'react-router'

/**
 * Hook to navigate to a given path
 */
const useNavigate = () => {
  const company = useCompany()
  const history = useHistory()

  const handleNavigate = useCallback(
    (path: string) => {
      if (company) {
        history.push(`/${company.slug}${path}`)
      }
    },
    [company, history]
  )

  return handleNavigate
}

export default useNavigate
