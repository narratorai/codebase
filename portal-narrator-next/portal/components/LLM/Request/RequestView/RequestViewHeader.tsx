import { ClockCircleOutlined, LeftOutlined } from '@ant-design/icons'
import { Flex } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { Link, Typography } from 'components/shared/jawns'
import UserAvatar from 'components/shared/UserAvatar'
import { IUser } from 'graph/generated'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { timeFromNow } from 'util/helpers'

import { ViewRequest } from './interfaces'
import NextRequestButton from './NextRequestButton'

export const HEADER_HEIGHT = 80

const AvatarWrapper = styled(Flex)`
  .user-avatar-identifier-text {
    font-weight: 600;
    font-size: 16px;
  }
`

const StyledLink = styled(Link)`
  color: black;
  margin-right: 8px;
`

interface Props {
  request: ViewRequest
}

const RequestViewHeader = ({ request }: Props) => {
  const company = useCompany()
  const waitingForAnswer = timeFromNow(request.created_at, company.timezone)

  return (
    <Flex
      align="center"
      justify="space-between"
      style={{ padding: '24px', borderBottom: `1px solid ${colors.mavis_light_gray}`, height: `${HEADER_HEIGHT}px` }}
    >
      <Flex align="center" justify="space-between" style={{ minWidth: '49%' }}>
        <Flex align="center">
          <StyledLink to="/llms/requests">
            <LeftOutlined />
          </StyledLink>

          <AvatarWrapper align="center">
            <UserAvatar user={request?.user as IUser} size="default" showTooltip={false} />
          </AvatarWrapper>
        </Flex>

        <Flex align="center" style={{ marginLeft: '16px', color: colors.mavis_text_gray }}>
          {request.status === 'completed' ? (
            <Typography ml={1}>Completed</Typography>
          ) : (
            <>
              <ClockCircleOutlined />
              <Typography ml={1}>Waiting for answer since {waitingForAnswer}</Typography>
            </>
          )}
        </Flex>
      </Flex>

      <NextRequestButton requestId={request.id} />
    </Flex>
  )
}

export default RequestViewHeader
