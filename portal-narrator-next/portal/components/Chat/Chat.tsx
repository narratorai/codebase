import { useQuery } from '@tanstack/react-query'
import { Alert, Skeleton, Spin } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { isEmpty } from 'lodash'
import { useChat } from 'portal/stores/chats'

import AutoScrollIntoView from './AutoScrollIntoView'
import ChatContent from './ChatContent'
import { useChatRerun } from './hooks'
import LoadingBar from './List/LoadingBar'

interface Props {
  readOnly?: boolean
}

const Chat = ({ ...props }: Props) => {
  const company = useCompany()
  const chat = useChat()

  const { isFetching: isChatFetching, isError } = useQuery({
    queryKey: ['chat', chat.id],
    queryFn: () => chat.fetch(company.datacenter_region),
    enabled: !isEmpty(chat.id),
  })

  const { isFetching: isChatRerunning, reason } = useChatRerun(chat)

  if (isError) return <Alert message="Failed to load chat" type="error" />
  if (isChatFetching)
    return (
      <Spin spinning>
        <Skeleton />
      </Spin>
    )

  return (
    <AutoScrollIntoView scrollKey={[chat.messages.length]}>
      <ChatContent chat={chat} {...props} />
      {isChatRerunning && <LoadingBar messageType={reason.message?.type} />}
    </AutoScrollIntoView>
  )
}

export default Chat
