import MarkdownRenderer from 'components/shared/MarkdownRenderer'
import { IMessage } from 'portal/stores/chats'

import { StyledContent } from './StyledWrappers'

interface Props {
  message: IMessage
}

const BrainstormConfigItem = ({ message }: Props) => (
  <StyledContent message={message}>
    <MarkdownRenderer source={message.data.ask as string} />
  </StyledContent>
)

export default BrainstormConfigItem
