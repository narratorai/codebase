import { isEmpty, last } from 'lodash'
import { useChat } from 'portal/stores/chats'

import SuggestionsList from './SuggestionsList'

interface Props {
  onSuggestionClick: (suggestion: string) => void
}

const LastMessageSuggestions = ({ onSuggestionClick }: Props) => {
  const messages = useChat((state) => state.messages)
  const lastMessage = last(messages)

  if (isEmpty(lastMessage?.suggestions)) return null
  // @ts-ignore suggestions is not empty but lodash typing is not picking it
  return <SuggestionsList suggestions={lastMessage?.suggestions} onSuggestionClick={onSuggestionClick} />
}

export default LastMessageSuggestions
