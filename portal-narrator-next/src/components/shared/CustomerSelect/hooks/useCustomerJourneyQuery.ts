import { useInfiniteQuery } from '@tanstack/react-query'
import { useShallow } from 'zustand/react/shallow'

import { useCompany } from '@/stores/companies'
import { useJourneyActivities } from '@/stores/journeys'
import { useTables } from '@/stores/tables'

const useCustomerJourneyQuery = () => {
  const [companySlug, datacenterRegion] = useCompany((state) => [state.slug, state.datacenterRegion])
  const [table, getTables] = useTables(useShallow((state) => [state.table, state.getTables]))
  const [totalCount, page, perPage, getNextPage] = useJourneyActivities((state) => [
    state.totalCount,
    state.page,
    state.perPage,
    state.getNextPage,
  ])

  const queryFn = async () => {
    if (!table) await getTables(datacenterRegion) // TODO: We are not certain that the table identifier will reference the table by the time this operation finishes. We have to ensure that it does, or retrieve the value before the next step.

    const results = await getNextPage(table!.id, datacenterRegion)
    return results
  }

  const { fetchNextPage, isFetchingNextPage, ...state } = useInfiniteQuery({
    enabled: false,
    getNextPageParam: () => (page * perPage >= totalCount ? null : page + 1),
    initialPageParam: 1,
    queryFn,
    queryKey: [companySlug, 'journey-activities'],
  })

  return {
    fetchNextPage,
    isFetchingNextPage,
    ...state,
  }
}

export default useCustomerJourneyQuery
