import ChatMessages from '@/components/chats/ChatMessages'
import { LastMessageSuggestions } from '@/components/chats/ChatSuggestions'
import Loading from '@/components/shared/Loading'
import { useChatSuggestions } from '@/stores/chats'

import ChatFooter from './ChatFooter'
import { useStoredChat } from './hooks'

const StoredChat = () => {
  const { isInitiating, isSubmittingPrompt, submitPrompt } = useStoredChat()
  const suggestion = useChatSuggestions((state) => state.selectedSuggestion)

  return (
    <div className="flex-y">
      <section className="flex-1 space-y-8 overflow-scroll p-10">
        <ChatMessages />
        <LastMessageSuggestions />

        {(isInitiating || isSubmittingPrompt) && (
          <div className="h-32 pt-6">
            <Loading className="h-12 w-16" />
          </div>
        )}
      </section>
      <ChatFooter onSubmit={submitPrompt} prompt={suggestion} />
    </div>
  )
}

export default StoredChat
