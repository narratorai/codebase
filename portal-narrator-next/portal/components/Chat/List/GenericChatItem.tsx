import { Button, Space } from 'antd-next'
import SQLText from 'components/shared/SQLText'
import { IMessage } from 'portal/stores/chats'
import { useLazyCallMavis } from 'util/useCallMavis'

import { StyledCard } from './StyledWrappers'

const GenericChatItem = ({ chatId, message }: { chatId?: string; message: IMessage }) => {
  const [run] = useLazyCallMavis<Record<string, unknown>>({
    method: 'POST',
    path: `/v1/chat/${chatId}/vote`,
  })

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <StyledCard>
        <SQLText value={JSON.stringify(message, null, 2)} defaultHeight={400} />
      </StyledCard>

      <Button type="primary" onClick={() => run({})}>
        Run
      </Button>
    </Space>
  )
}

export default GenericChatItem
