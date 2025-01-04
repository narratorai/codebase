import { DownOutlined, RightOutlined } from '@ant-design/icons'
import { Badge, Popover, Tooltip } from 'antd-next'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { isEmpty } from 'lodash'
import styled from 'styled-components'
import { colors, zIndex } from 'util/constants'

import { ICustomerJourneyActivityRowWithMoment } from '../../services/interfaces'
import FeatureTable from '../FeatureTable'

const StyledTitle = styled(Flex)<{ hasRepeatedActivities?: boolean }>`
  &:hover {
    cursor: ${({ hasRepeatedActivities }) => (hasRepeatedActivities ? 'pointer' : 'inherit')};
  }
`

interface Props {
  act: ICustomerJourneyActivityRowWithMoment
  toggleCollapse: () => void
  showRepeatedActivities?: boolean
  isSidebar?: boolean
}

const Title = ({ act, toggleCollapse, showRepeatedActivities, isSidebar }: Props) => {
  return (
    <StyledTitle
      mr={2}
      onClick={toggleCollapse}
      alignItems="center"
      hasRepeatedActivities={!isEmpty(act.repeated_activities)}
    >
      <Flex alignItems="center">
        {/* if activity has repeated activities show dropdown carat */}
        {!isEmpty(act.repeated_activities) && !!act.repeated_activities && (
          <Box mr={1}>
            {showRepeatedActivities ? (
              <DownOutlined style={{ fontSize: '12px' }} />
            ) : (
              <RightOutlined style={{ fontSize: '12px' }} />
            )}
          </Box>
        )}

        {/* only show hover with feature table if sidebar and there are features */}
        {isSidebar && !isEmpty(act.features) ? (
          <Popover content={<FeatureTable activity={act} />} placement="right" zIndex={zIndex.notification}>
            <Typography type="title400" data-test="customers-activity" style={{ wordBreak: 'keep-all' }}>
              {act.activity_name}
            </Typography>
          </Popover>
        ) : (
          <Typography type="title400" data-test="customers-activity" style={{ wordBreak: 'keep-all' }}>
            {act.activity_name}
          </Typography>
        )}
      </Flex>

      {/* if activity has repeated activities show badge w/ count */}
      {!isEmpty(act.repeated_activities) && !!act.repeated_activities && (
        <Tooltip
          getPopupContainer={(trigger: any) => trigger.parentNode}
          title={`There are ${act.repeated_activities.length} "${act.activity_name}" activities that happened within a short period of time.`}
          overlayStyle={{ width: '240px' }}
        >
          <Box ml={2}>
            <Badge
              size="small"
              count={act.repeated_activities.length}
              style={{ backgroundColor: colors.blue500, minWidth: '24px' }}
            />
          </Box>
        </Tooltip>
      )}
    </StyledTitle>
  )
}

export default Title
