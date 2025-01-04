import { findLastIndex, last, reduce } from 'lodash'

import { IRemoteChatMessage, Role, useChat } from '@/stores/chats'

import ChatMessagesGroup from './ChatMessagesGroup'

const ChatMessages = () => {
  const chat = useChat()
  const { messages } = chat
  const messagesGroupedByRole = reduce(
    messages,
    (acc: IRemoteChatMessage[][], value, index: number) => {
      if (index > 0 && value.role === messages[index - 1].role) last(acc)?.push(value)
      else acc.push([value])

      return acc
    },
    []
  )

  const nextToLast = messages.length - 2
  const lastUserMessage = findLastIndex(messages, { role: Role.User }, nextToLast)

  return (
    <ul className="space-y-8">
      {messagesGroupedByRole.map((group, index) => (
        <li key={index}>
          <ChatMessagesGroup group={group} showFeedback={index > lastUserMessage} />
        </li>
      ))}
    </ul>
  )
}

export default ChatMessages
