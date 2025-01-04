import { IRemoteChatMessage, MessageType } from '@/stores/chats'

import AnimatedContainer from './AnimatedContainer'
import CustomerJourneyItem from './CustomerJourneyItem'
import DatasetItem from './DatasetItem'
import JSONItem from './JSONItem'
import ReplyItem from './ReplyItem'
import TextItem from './TextItem'

interface Props {
  index: number
  message: IRemoteChatMessage
  showFeedback?: boolean
}

const ChatMessageItem = ({ index, message, showFeedback = false }: Props) => {
  const { type } = message

  return (
    <AnimatedContainer index={index}>
      {type === MessageType.UserMessage && <TextItem message={message} />}
      {type === MessageType.Reply && <ReplyItem message={message} showFeedback={showFeedback} />}
      {type === MessageType.Journey && <CustomerJourneyItem message={message} showFeedback={showFeedback} />}
      {type === MessageType.Dataset && <DatasetItem message={message} showFeedback={showFeedback} />}
      {type === MessageType.Examples && <JSONItem message={message} showFeedback={showFeedback} />}
    </AnimatedContainer>
  )
}

export default ChatMessageItem
