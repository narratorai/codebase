import { useInfiniteQuery } from '@tanstack/react-query'
import { useShallow } from 'zustand/react/shallow'

import { useChats } from '@/stores/chats'
import { useCompany } from '@/stores/companies'

const useChatsQuery = () => {
  const [companySlug, datacenterRegion] = useCompany((state) => [state.slug, state.datacenterRegion])
  const [totalCount, page, perPage, getNextPage] = useChats(
    useShallow((state) => [state.totalCount, state.page, state.perPage, state.getNextPage])
  )

  return useInfiniteQuery({
    enabled: false,
    getNextPageParam: () => (page * perPage >= totalCount ? null : page + 1),
    initialPageParam: 1,
    queryFn: () => getNextPage(datacenterRegion),
    queryKey: [companySlug, 'chats'],
  })
}

export default useChatsQuery
