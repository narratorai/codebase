import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { ChatPromptFormData } from '@/components/chats/ChatPrompt'
import { useChat } from '@/stores/chats'
import { useCompany } from '@/stores/companies'

const useStoredChat = () => {
  const datacenterRegion = useCompany((state) => state.datacenterRegion)
  const [chatId, resetChat, initiateChat, getMessages, postMessage] = useChat(
    useShallow((state) => [state.id, state.reset, state.initiateChat, state.getMessages, state.postMessage])
  )

  const getMessagesQuery = async () => await getMessages(datacenterRegion)

  const initiateChatMutation = async () => {
    await initiateChat(datacenterRegion)
  }

  const postMessageMutation = async (data: ChatPromptFormData) => {
    await postMessage(data.prompt, datacenterRegion)
  }

  const { isFetched: hasMessages, isFetching: isGettingMessages } = useQuery({
    queryFn: getMessagesQuery,
    queryKey: ['chat', chatId],
  })

  const { isPending: isInitiatingChat, mutateAsync: initiateChatAsync } = useMutation({
    mutationFn: initiateChatMutation,
  })

  const { isPending: isSubmittingPrompt, mutateAsync: submitPrompt } = useMutation({
    mutationFn: postMessageMutation,
  })

  useEffect(() => {
    if (isGettingMessages) return
    if (hasMessages) initiateChatAsync()

    return resetChat
  }, [isGettingMessages, hasMessages])

  const isInitiating = isInitiatingChat || isGettingMessages

  return {
    isInitiating,
    isSubmittingPrompt,
    submitPrompt,
  }
}

export default useStoredChat
