import { IMessage } from 'portal/stores/chats'

import GenericChatItem from './GenericChatItem'
import { StyledContainer } from './StyledWrappers'
interface Props {
  chatId: string
  message: IMessage
}

const JSONItem = ({ chatId, message }: Props) => (
  <StyledContainer message={message}>
    <GenericChatItem chatId={chatId} message={message} />
  </StyledContainer>
)

export default JSONItem
