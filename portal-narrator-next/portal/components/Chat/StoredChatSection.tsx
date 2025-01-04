import { useChat } from 'portal/stores/chats'
import { useEffect } from 'react'
import { useParams } from 'react-router'

import ChatMainSection from './ChatMainSection'

const StoredChatSection = () => {
  const { id: chatId } = useParams<{ id?: string }>()
  const [set, reset] = useChat((state) => [state.set, state.reset])

  useEffect(() => {
    set({ id: chatId, messages: [] })

    return () => {
      reset()
    }
  }, [chatId])

  return <ChatMainSection />
}

export default StoredChatSection
