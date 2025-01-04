import { useInfiniteQuery } from '@tanstack/react-query'

import { useActivities } from '@/stores/activities'
import { useCompany } from '@/stores/companies'

const useActivitiesQuery = () => {
  const [companySlug, datacenterRegion] = useCompany((state) => [state.slug, state.datacenterRegion])
  const [totalCount, page, perPage, getNextPage] = useActivities((state) => [
    state.totalCount,
    state.page,
    state.perPage,
    state.getNextPage,
  ])

  const { fetchNextPage, isFetchingNextPage, ...state } = useInfiniteQuery({
    enabled: false,
    getNextPageParam: () => (page * perPage >= totalCount ? null : page + 1),
    initialPageParam: 1,
    queryFn: () => getNextPage(datacenterRegion),
    queryKey: [companySlug, 'activities'],
  })

  return {
    fetchNextPage,
    isFetchingNextPage,
    ...state,
  }
}

export default useActivitiesQuery
