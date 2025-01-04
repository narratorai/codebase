import { Typography } from 'antd-next'
import { IMessage } from 'portal/stores/chats'

import { StyledContent } from './StyledWrappers'

interface Props {
  message: IMessage
}

const ClassifiedQuestionItem = ({ message }: Props) => (
  <StyledContent message={message}>
    <Typography.Text>{`Answering "${message.data.data_question}"`}</Typography.Text>
  </StyledContent>
)

export default ClassifiedQuestionItem
