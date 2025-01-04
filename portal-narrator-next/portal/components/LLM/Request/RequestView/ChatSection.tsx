import Chat from 'components/Chat/Chat'
import { useChat } from 'portal/stores/chats'
import { useEffectOnce } from 'react-use'
import styled from 'styled-components'
import { colors } from 'util/constants'

const StyledHeader = styled.div`
  color: ${colors.mavis_black};
  font-size: 18px;
  font-weight: 600;
  padding: 24px;
  border-bottom: 1px solid ${colors.mavis_light_gray};
`

interface Props {
  chatId: string
}

const ChatSection = ({ chatId }: Props) => {
  const [set, reset] = useChat((state) => [state.set, state.reset])

  useEffectOnce(() => {
    set({ id: chatId, messages: [] })

    return () => {
      reset()
    }
  })

  return (
    <div style={{ paddingBottom: '80px' }}>
      <StyledHeader>AI Chat</StyledHeader>
      <div style={{ padding: 24 }}>
        <Chat readOnly />
      </div>
    </div>
  )
}

export default ChatSection
