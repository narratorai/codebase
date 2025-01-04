import queryString from 'query-string'
import { useHistory, useLocation } from 'react-router-dom'

export default function useQueryParams(): [
  Record<string, unknown>,
  (nextQueryParams: Record<string, unknown>) => void
] {
  const location = useLocation()
  const history = useHistory()
  const queryParams = queryString.parse(location?.search, {
    arrayFormat: 'comma',
    parseBooleans: true,
  })

  const setQueryParams = (nextQueryParams: Record<string, unknown>) => {
    const serializedParams = queryString.stringify(nextQueryParams)
    history.push({ search: `?${serializedParams}` })
  }

  return [queryParams, setQueryParams]
}
