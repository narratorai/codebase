import { isEmpty, last } from 'lodash'
import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { useChat, useChatSuggestions } from '@/stores/chats'

import SuggestionsList from './SuggestionsList'

const LastMessageSuggestions = () => {
  const [resetSuggestions, setSuggestions] = useChatSuggestions(useShallow((state) => [state.reset, state.set]))
  const messages = useChat((state) => state.messages)
  const lastMessage = last(messages)

  useEffect(() => {
    if (isEmpty(lastMessage?.suggestions)) setSuggestions({ data: [] })
    else setSuggestions({ data: lastMessage?.suggestions })
    return resetSuggestions
  }, [lastMessage])

  return <SuggestionsList />
}

export default LastMessageSuggestions
