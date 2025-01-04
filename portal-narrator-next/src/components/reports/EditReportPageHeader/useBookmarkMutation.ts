import { useMutation } from '@tanstack/react-query'
import { useShallow } from 'zustand/react/shallow'

import { useCompany } from '@/stores/companies'
import { useReport } from '@/stores/reports'

const useBookmarkMutation = () => {
  const datacenterRegion = useCompany((state) => state.datacenterRegion)
  const [favorite, unfavorite, favorited] = useReport(
    useShallow((state) => [state.favorite, state.unfavorite, state.favorited])
  )

  const toggleFavoriteMutation = () => {
    if (favorited) return unfavorite(datacenterRegion)
    return favorite(datacenterRegion)
  }

  const { isPending, mutateAsync: toggle } = useMutation({ mutationFn: toggleFavoriteMutation })

  return {
    favorited,
    isPending,
    toggle,
  }
}

export default useBookmarkMutation
