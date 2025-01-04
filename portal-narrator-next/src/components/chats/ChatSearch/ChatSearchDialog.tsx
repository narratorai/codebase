'use client'

import EmptyState from '@/components/primitives/EmptyState'
import { Searchbox, SearchboxItems } from '@/components/primitives/Searchbox'
import { useScrollEvents } from '@/hooks'
import { IRemoteChat, useChats } from '@/stores/chats'

import ChatSearchItemTemplate from './ChatSearchItemTemplate'
import ChatSearchTotalCount from './ChatSearchTotalCount'
import { useChatsQuery, useNavigate, useSearchQuery } from './hooks'

interface Props {
  open: boolean
  setOpen: (value: boolean) => void
}

const ChatSearchDialog = ({ open, setOpen }: Props) => {
  const navigateToChat = useNavigate()
  const [chats, totalCount] = useChats((state) => [state.data, state.totalCount])
  const { isFetching, setSearch } = useSearchQuery()
  const { fetchNextPage, isFetchingNextPage } = useChatsQuery()

  const isEmpty = chats.length === 0

  const handleScrollEnd = () => {
    if (!isFetchingNextPage) fetchNextPage()
  }

  const handleScroll = useScrollEvents(handleScrollEnd)

  const handleValueChange = (chat: IRemoteChat | null) => {
    if (chat) navigateToChat(chat.id)
  }

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
  }

  const handleClose = () => {
    setSearch('')
    setOpen(false)
  }

  return (
    <Searchbox<IRemoteChat>
      searchboxDialogProps={{
        onClose: handleClose,
        open,
      }}
      searchboxInputProps={{
        autoFocus: true,
        onBlur: handleClose,
        onChange: handleSearch,
        placeholder: 'Search chat history...',
      }}
      searchboxProps={{
        onChange: handleValueChange,
        virtual: { options: chats },
      }}
    >
      {isEmpty ? (
        <EmptyState description="No chats were found for the searched term. Please try again." title="No chats found" />
      ) : (
        <SearchboxItems
          isLoading={isFetching || isFetchingNextPage}
          onScroll={handleScroll}
          OptionTemplate={ChatSearchItemTemplate}
        />
      )}
      <ChatSearchTotalCount isFetching={isFetching} totalCount={totalCount} />
    </Searchbox>
  )
}

export default ChatSearchDialog
