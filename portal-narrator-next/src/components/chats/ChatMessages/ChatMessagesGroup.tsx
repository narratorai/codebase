import { IRemoteChatMessage } from '@/stores/chats'

import ChatMessageItem from './ChatMessageItem'
import ChatMessageUserAvatar from './ChatMessageUserAvatar'

interface Props {
  group: IRemoteChatMessage[]
  showFeedback?: boolean
}

const ChatMessagesGroup = ({ group, showFeedback }: Props) => {
  const [firstMessage] = group

  return (
    <div className="flex items-end space-x-3">
      <ChatMessageUserAvatar isUser={firstMessage.role === 'user'} />
      <div className="flex-1 space-y-4">
        {group.map((message, index) => (
          <ChatMessageItem index={index} key={message.id} message={message} showFeedback={showFeedback} />
        ))}
      </div>
    </div>
  )
}

export default ChatMessagesGroup
