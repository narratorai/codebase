import { Flex, Tag, Typography } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { find } from 'lodash'
import { useHistory } from 'react-router'
import styled from 'styled-components'
import { colors } from 'util/constants'

const StyledLink = styled.a`
  background: ${colors.mavis_dark_purple};
  padding: 8px 14px;
  border-radius: 8px;
  color: white !important;
  font-weight: bold;
  text-decoration: none !important;
`

interface Props {
  activityStreamId?: string
  showActivityStream?: boolean
}

const ChatHeader = ({ activityStreamId, showActivityStream = false }: Props) => {
  const company = useCompany()
  const history = useHistory()
  const table = find(company.tables, ['id', activityStreamId])

  const handleOpenChat = () => {
    history.push('/chat')
  }

  return (
    <div
      style={{
        borderBottom: `1px solid ${colors.mavis_light_gray}`,
        padding: '17px',
        position: 'sticky',
        top: 0,
        zIndex: 999,
        background: colors.mavis_off_white,
      }}
    >
      <Flex justify="space-between">
        <Flex align="center" gap={8}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Mavis AI
          </Typography.Title>
          <div>{showActivityStream && table && <Tag>Activity Stream: {table.identifier}</Tag>}</div>
        </Flex>
        <StyledLink onClick={handleOpenChat}>Open new chat</StyledLink>
      </Flex>
    </div>
  )
}

export default ChatHeader
