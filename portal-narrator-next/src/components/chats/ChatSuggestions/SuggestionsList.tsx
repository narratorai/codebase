import { isEmpty } from 'lodash'
import { useShallow } from 'zustand/react/shallow'

import { useChatSuggestions } from '@/stores/chats'

import ChatSuggestion from './ChatSuggestion'

const SuggestionsList = () => {
  const [suggestions, setSelectedSuggestion] = useChatSuggestions(
    useShallow((state) => [state.data, state.setSelectedSuggestion])
  )

  if (isEmpty(suggestions)) return null

  return (
    <ul className="grid grid-cols-2 gap-4">
      {suggestions.map((suggestion) => (
        <ChatSuggestion key={suggestion} onClick={() => setSelectedSuggestion(suggestion)}>
          {suggestion}
        </ChatSuggestion>
      ))}
    </ul>
  )
}

export default SuggestionsList
