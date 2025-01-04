import { useQuery } from '@tanstack/react-query'

import { useDelayedState } from '@/hooks'
import { useActivities } from '@/stores/activities'
import { useCompany } from '@/stores/companies'

const useSearchQuery = () => {
  const [companySlug, datacenterRegion] = useCompany((state) => [state.slug, state.datacenterRegion])
  const searchActivities = useActivities((state) => state.searchActivities)
  const [search, setSearch] = useDelayedState<string>('')

  const params = { search }

  const { isFetching } = useQuery({
    queryFn: () => searchActivities(params, datacenterRegion),
    queryKey: [companySlug, 'activities', JSON.stringify(params)],
  })

  return {
    isFetching,
    setSearch,
  }
}

export default useSearchQuery
