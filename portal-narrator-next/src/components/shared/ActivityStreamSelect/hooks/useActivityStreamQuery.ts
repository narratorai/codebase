import { useInfiniteQuery } from '@tanstack/react-query'
import { useShallow } from 'zustand/react/shallow'

import { useCompany } from '@/stores/companies'
import { useTables } from '@/stores/tables'

const useActivityStreamQuery = () => {
  const datacenterRegion = useCompany((state) => state.datacenterRegion)
  const [page, perPage, totalCount, getTables] = useTables(
    useShallow((state) => [state.page, state.perPage, state.totalCount, state.getTables])
  )

  const { isFetching, isFetchingNextPage, ...queryState } = useInfiniteQuery({
    getNextPageParam: () => (page * perPage >= totalCount ? null : page + 1),
    initialPageParam: 1,
    queryFn: () => getTables(datacenterRegion),
    queryKey: ['tables'],
  })

  return {
    ...queryState,
    isFetching: isFetching || isFetchingNextPage,
  }
}

export default useActivityStreamQuery
