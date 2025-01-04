'use client'

import { useEffect } from 'react'

import PageContent from '@/components/shared/PageContent'
import { useChat } from '@/stores/chats'

import StoredChat from './StoredChat'

interface Props {
  chatId: string
}

const ChatPageContent = ({ chatId }: Props) => {
  const [set, reset] = useChat((state) => [state.set, state.reset])

  useEffect(() => {
    set({ id: chatId })

    return reset
  }, [set, reset, chatId])

  return (
    <PageContent>
      <StoredChat />
    </PageContent>
  )
}

export default ChatPageContent
