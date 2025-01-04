import { Tooltip } from 'antd-next'
import { Box, Link, Typography } from 'components/shared/jawns'
import styled from 'styled-components'

import { CARD_WIDTH } from './DashboardImage'
import { DashboardType } from './interfaces'

const StyledDashboardLink = styled(Link)`
  color: black;

  &:hover {
    text-decoration: underline;
  }
`

const DisabledBox = styled(Box)`
  :hover {
    cursor: no-drop;
  }
`

const LinkText = styled(Typography)`
  max-width: ${CARD_WIDTH - 68}px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

interface Props {
  dashboard: DashboardType
  lastAssembled?: string
}

const DashboardLink = ({ dashboard, lastAssembled }: Props) => {
  if (lastAssembled) {
    return (
      <StyledDashboardLink to={`/dashboards/a/${dashboard.slug}`} data-test="narrative-item-title">
        <LinkText title={dashboard.name?.length <= 30 ? undefined : dashboard.name}>{dashboard.name}</LinkText>
      </StyledDashboardLink>
    )
  }

  return (
    <Tooltip placement="topLeft" title="The dashboard has never been assembled.">
      <div>
        <DisabledBox>
          <LinkText title={dashboard.name?.length <= 30 ? undefined : dashboard.name}>{dashboard.name}</LinkText>
        </DisabledBox>
      </div>
    </Tooltip>
  )
}

export default DashboardLink
