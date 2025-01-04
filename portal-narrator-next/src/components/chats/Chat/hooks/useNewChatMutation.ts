import { useMutation } from '@tanstack/react-query'
import { isNil } from 'lodash'

import { ChatPromptFormData } from '@/components/chats/ChatPrompt'
import { useChats } from '@/stores/chats'
import { useCompany } from '@/stores/companies'
import { useTables } from '@/stores/tables'

const useNewChatMutation = () => {
  const datacenterRegion = useCompany((state) => state.datacenterRegion)
  const table = useTables((state) => state.table)
  const createChat = useChats((state) => state.createChat)

  const {
    isIdle,
    mutateAsync: submitPrompt,
    ...state
  } = useMutation({
    mutationFn: async (data: ChatPromptFormData) => {
      if (isNil(table)) return

      const chat = await createChat({ content: data.prompt, tableId: table.id }, datacenterRegion)
      return chat
    },
  })

  return { isIdle, submitPrompt, ...state }
}

export default useNewChatMutation
