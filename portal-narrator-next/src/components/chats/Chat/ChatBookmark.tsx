import { BookmarkIcon as OutlineBookmarkIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as SolidBookmarkIcon } from '@heroicons/react/24/solid'

import Loading from '@/components/primitives/Loading'
import { NavbarItem } from '@/components/primitives/Navbar'
import { useChat } from '@/stores/chats'

import { useBookmarksMutation } from './hooks'

const ChatBookmark = () => {
  const { isPending, toggleFavorite } = useBookmarksMutation()
  const favorited = useChat((state) => state.favorited)

  return (
    <NavbarItem aria-label="Bookmark" disabled={isPending} onClick={() => toggleFavorite()}>
      {isPending ? <Loading size="2xs" /> : favorited ? <SolidBookmarkIcon /> : <OutlineBookmarkIcon />}
    </NavbarItem>
  )
}

export default ChatBookmark
