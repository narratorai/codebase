import MarkdownRenderer from 'components/shared/MarkdownRenderer'
import { IMessage } from 'portal/stores/chats'

import { StyledContent } from './StyledWrappers'

interface Props {
  message: IMessage
}

const TextItem = ({ message }: Props) => (
  <StyledContent message={message}>
    <MarkdownRenderer source={message.data.content as string} />
  </StyledContent>
)

export default TextItem
