import { List } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { IUser, useGetChatUserQuery } from 'graph/generated'
import { IChatStore, IMessage } from 'portal/stores/chats'
import styled from 'styled-components'

import AvatarAndTitle from './AvatarAndTitle'
import ChatListItem from './ChatListItem'

const StyledListItem = styled(List.Item)`
  padding: 0 !important;
  border-block-end: none !important;
`

interface Props {
  group: IMessage[]
  chat: IChatStore
  readOnly?: boolean
}

const ChatMessagesGroup = ({ chat, group, readOnly = false }: Props) => {
  const company = useCompany()
  const [firstMessage] = group
  // This call is used to get the full user detilas of the chat creator
  // TODO: Get the full user from the chats REST API
  const { data: chatData } = useGetChatUserQuery({
    variables: { chat_id: chat.id, company_id: company.id },
  })
  const chatUser = chatData?.chat?.user

  return (
    <StyledListItem>
      <AvatarAndTitle user={chatUser as IUser} isUser={firstMessage.role === 'user'} />
      <List
        itemLayout="vertical"
        dataSource={group}
        renderItem={(message, index) => (
          <ChatListItem key={message.id} message={message} chat={chat} readOnly={readOnly} index={index} />
        )}
      />
    </StyledListItem>
  )
}

export default ChatMessagesGroup
