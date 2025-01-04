import { Layout } from 'antd-next'
import { isEmpty } from 'lodash'
import { useChat, useChatSuggestions } from 'portal/stores/chats'
import { useEffectOnce } from 'react-use'
import styled from 'styled-components'
import { colors } from 'util/constants'

import { useLastActivityStream } from './hooks'
import PromptForm, { PromptFormData } from './PromptForm'
import LastMessageSuggestions from './Suggestions/LastMessageSuggestions'

const SuggestionsContainer = styled.div`
  margin-bottom: 16px;
  overflow-x: scroll;
  width: 100%;
`

const StyledFooter = styled(Layout.Footer)`
  padding: 24px;
  background: ${colors.mavis_off_white};
`

interface Props {
  onPromptSubmit: (data: PromptFormData) => Promise<void>
}

const ChatFooter = ({ onPromptSubmit }: Props) => {
  const chat = useChat()
  const [selectedSuggestion, setSuggestions] = useChatSuggestions((state) => [state.selectedSuggestion, state.set])
  const [lastActivityStreamId, setLastActivityStreamId] = useLastActivityStream()

  const isNewChat = isEmpty(chat.id)

  const setPrompt = (suggestion: string) => {
    setSuggestions({ selectedSuggestion: suggestion })
  }

  const handlePromptSubmit = async (data: PromptFormData) => {
    setPrompt('')
    setLastActivityStreamId(data.activityStreamId) // Update the global last used activity stream ID

    await onPromptSubmit(data)
  }

  useEffectOnce(() => {
    return () => {
      setPrompt('')
    }
  })

  return (
    <StyledFooter>
      <SuggestionsContainer>
        {!isNewChat && <LastMessageSuggestions onSuggestionClick={setPrompt} />}
      </SuggestionsContainer>
      <PromptForm
        defaultValues={{ activityStreamId: chat.table_id || lastActivityStreamId, prompt: selectedSuggestion }}
        onSubmit={handlePromptSubmit}
        hideActivityStreamInput={!isNewChat}
      />
    </StyledFooter>
  )
}

export default ChatFooter
