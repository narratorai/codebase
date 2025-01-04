import { useQuery } from '@tanstack/react-query'

import { useDelayedState } from '@/hooks'
import { useChats } from '@/stores/chats'
import { useCompany } from '@/stores/companies'

const useSearchQuery = () => {
  const [companySlug, datacenterRegion] = useCompany((state) => [state.slug, state.datacenterRegion])
  const searchChats = useChats((state) => state.searchChats)
  const [search, setSearch] = useDelayedState('')

  const params = { search }

  const { isFetching, ...state } = useQuery({
    queryFn: () => searchChats(params, datacenterRegion),
    queryKey: [companySlug, 'chats', JSON.stringify(params)],
  })

  return {
    isFetching,
    setSearch,
    ...state,
  }
}

export default useSearchQuery
