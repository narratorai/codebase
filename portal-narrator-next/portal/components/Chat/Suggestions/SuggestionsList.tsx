import { Flex, Typography } from 'antd-next'

import ChatSuggestion from './ChatSuggestion'

interface Props {
  suggestions: string[]
  onSuggestionClick: (suggestion: string) => void
}

const SuggestionsList = ({ suggestions, onSuggestionClick }: Props) => {
  return (
    <div>
      <Typography.Title level={5}>Suggestions</Typography.Title>
      <div style={{ overflow: 'scroll' }}>
        <Flex gap={16} style={{ display: 'inline-flex' }}>
          {suggestions.map((suggestion, index) => (
            <ChatSuggestion key={index} onClick={() => onSuggestionClick(suggestion)}>
              {suggestion}
            </ChatSuggestion>
          ))}
        </Flex>
      </div>
    </div>
  )
}

export default SuggestionsList
