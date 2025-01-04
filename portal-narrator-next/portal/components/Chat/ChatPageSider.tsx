import { useQuery } from '@tanstack/react-query'
import { Flex, Tag, Typography } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useChats } from 'portal/stores/chats'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { useShallow } from 'zustand/react/shallow'

import ChatsList from './ChatsList'

const StyledHeaderContainer = styled(Flex)`
  border-bottom: 1px solid ${colors.mavis_light_gray};
  padding: 20px;
  position: sticky;
  top: 0;
  z-index: 1;
  background: white;
`

const ChatPageSider = () => {
  const company = useCompany()
  const [chats, total, fetch] = useChats(useShallow((state) => [state.chats, state.total, state.fetch]))

  const { isLoading } = useQuery({
    queryKey: ['chats', company.datacenter_region],
    queryFn: () => fetch({}, company.datacenter_region),
  })

  return (
    <aside style={{ overflowY: 'scroll', height: '100vh' }}>
      <StyledHeaderContainer gap={16} align="center" justify="space-between">
        <Typography.Title level={3} style={{ margin: 0 }}>
          History
        </Typography.Title>
        <div>
          <Tag>{total}</Tag>
        </div>
      </StyledHeaderContainer>
      <ChatsList items={chats} isLoading={isLoading} />
    </aside>
  )
}

export default ChatPageSider
