import { List } from 'antd-next'
import { AnimatePresence } from 'framer-motion'
import { last, reduce } from 'lodash'
import { IChatStore, IMessage } from 'portal/stores/chats'

import ChatMessagesGroup from './List/ChatMessagesGroup'

interface Props {
  chat: IChatStore
  readOnly?: boolean
}

const ChatContent = ({ chat, readOnly = false }: Props) => {
  const { messages } = chat
  const messagesGroupedByRole = reduce(
    messages,
    (acc: IMessage[][], value, index: number) => {
      if (index > 0 && value.role === messages[index - 1].role) last(acc)?.push(value)
      else acc.push([value])

      return acc
    },
    []
  )

  return (
    <AnimatePresence>
      <List
        itemLayout="vertical"
        dataSource={messagesGroupedByRole}
        renderItem={(item) => <ChatMessagesGroup chat={chat} group={item} readOnly={readOnly} />}
      />
    </AnimatePresence>
  )
}

export default ChatContent
