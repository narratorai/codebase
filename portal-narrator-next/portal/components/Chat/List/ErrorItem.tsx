import { Typography } from 'antd-next'
import { IMessage } from 'portal/stores/chats'

import { StyledContent } from './StyledWrappers'
interface Props {
  message: IMessage
}

const ErrorItem = ({ message }: Props) => (
  <StyledContent>
    <Typography.Text type="danger">{message.data.content as string}</Typography.Text>
  </StyledContent>
)

export default ErrorItem
