import { useMutation } from '@tanstack/react-query'
import { useShallow } from 'zustand/react/shallow'

import { useChat } from '@/stores/chats'
import { useCompany } from '@/stores/companies'

const useBookmarksMutation = () => {
  const datacenterRegion = useCompany((state) => state.datacenterRegion)
  const [favoriteChat, unfavoriteChat, favorited] = useChat(
    useShallow((state) => [state.favoriteChat, state.unfavoriteChat, state.favorited])
  )

  const {
    isPending,
    mutateAsync: toggleFavorite,
    ...mutationState
  } = useMutation({
    mutationFn: async () => {
      if (favorited) await unfavoriteChat(datacenterRegion)
      else await favoriteChat(datacenterRegion)
    },
  })

  return {
    isPending,
    toggleFavorite,
    ...mutationState,
  }
}

export default useBookmarksMutation
