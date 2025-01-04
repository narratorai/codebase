import { useQuery } from '@tanstack/react-query'
import { Flex, Space, Typography } from 'antd-next'
import { isEmpty } from 'lodash'
import Image from 'next/image'
import { useChatSuggestions } from 'portal/stores/chats'
import LightBulb from 'static/img/light-bulb.png'
import { colors } from 'util/constants'

import LargeChatSuggestion from './LargeChatSuggestion'

const InitialSuggestions = () => {
  const [suggestions, fetchSuggestions, setSuggestions] = useChatSuggestions((state) => [
    state.initialSuggestions,
    state.fetchInitialSuggestions,
    state.set,
  ])

  const setSelectedSuggestion = (suggestion: string) => {
    setSuggestions({ selectedSuggestion: suggestion })
  }

  useQuery({
    queryKey: ['chat-initial-suggestions'],
    queryFn: fetchSuggestions,
  })

  if (isEmpty(suggestions)) return null
  return (
    <Space direction="vertical" size={24}>
      <div>
        <Image src={LightBulb} alt="Suggestions" width={32} height={32} />
        <Typography.Title level={4} style={{ color: colors.mavis_black, margin: '0' }}>
          Suggestions
        </Typography.Title>
      </div>
      <Flex gap={8} vertical>
        {suggestions.map((suggestion) => (
          <LargeChatSuggestion key={suggestion} onClick={() => setSelectedSuggestion(suggestion)}>
            {suggestion}
          </LargeChatSuggestion>
        ))}
      </Flex>
    </Space>
  )
}

export default InitialSuggestions
