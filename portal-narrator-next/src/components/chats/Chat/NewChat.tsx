import { isNil } from 'lodash'

import { ChatPromptFormData } from '@/components/chats/ChatPrompt'
import { InitialSuggestions } from '@/components/chats/ChatSuggestions'
import ChatWelcome from '@/components/chats/ChatWelcome'
import Loading from '@/components/shared/Loading'
import { useChatSuggestions } from '@/stores/chats'

import ChatFooter from './ChatFooter'
import { useNewChatMutation } from './hooks'

interface Props {
  onCreate: (chatId: string) => void
}

const NewChat = ({ onCreate }: Props) => {
  const { isIdle, submitPrompt } = useNewChatMutation()
  const suggestion = useChatSuggestions((state) => state.selectedSuggestion)

  const handleSubmitPrompt = async (data: ChatPromptFormData) => {
    const chat = await submitPrompt(data)
    if (!isNil(chat)) onCreate(chat.id)
  }

  return (
    <div className="flex-y">
      <section className="flex-1 overflow-scroll">
        <div className="mx-auto max-w-5xl space-y-8 p-8">
          <ChatWelcome />
          {!isIdle ? (
            <div className="h-32 pt-6">
              <Loading className="h-12 w-16" />
            </div>
          ) : (
            <InitialSuggestions />
          )}
        </div>
      </section>

      <ChatFooter onSubmit={handleSubmitPrompt} prompt={suggestion} />
    </div>
  )
}

export default NewChat
