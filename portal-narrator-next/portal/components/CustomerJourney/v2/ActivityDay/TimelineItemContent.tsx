import { Timeline } from 'antd-next'
import { Box, Flex } from 'components/shared/jawns'
import { includes, isEmpty, map, toString } from 'lodash'
import { useState } from 'react'
import styled, { css } from 'styled-components'

import { ICustomerJourneyActivityRowWithMoment } from '../services/interfaces'
import TitleAndRevenueImpact from './Revenue/TitleAndRevenueImpact'
import TimeWithHighlight from './TimeWithHighlight'

const { Item } = Timeline

// only show copy and link icon on hover of actual rows
// (not the top level collapsable row that holds the repeated activities)
const StyledRowContent = styled(Box)<{ hasRepeatedActivities: boolean }>`
  ${({ hasRepeatedActivities }) =>
    !hasRepeatedActivities &&
    css`
      .copy-and-link-icon {
        display: none;
      }

      &:hover {
        .copy-and-link-icon {
          display: block;
        }
      }
    `}
`

const RepeatedActivitiesTimeline = styled(({ showTimeline, ...props }) => <Timeline {...props} />)<{
  showTimeline?: boolean
}>`
  transition: all 0.25s ease-in-out;
  transform: scaleY(0);
  transform-origin: left top;
  height: 20px;
  ${({ showTimeline }) =>
    showTimeline &&
    css`
      transform: scaleY(1);
      height: 100%;
    `}
`

interface Props {
  act: ICustomerJourneyActivityRowWithMoment
  isSidebar?: boolean
  table?: string
  customer?: string
  goToRowId?: number
  timezone?: string
  isRepeatedActivity?: boolean
}

const TimelineItemContent = ({ act, isSidebar, table, customer, goToRowId, timezone, isRepeatedActivity }: Props) => {
  const allGoToRowIds = [act._id, ...map(act.repeated_activities, (repAct) => repAct._id)]
  const hasSelectedGoToRowIds = includes(allGoToRowIds, goToRowId)
  const [showRepeatedActivities, setShowRepeatedActivities] = useState(hasSelectedGoToRowIds)
  const handleToggleCollapse = () => {
    setShowRepeatedActivities((prevShow) => !prevShow)
  }

  const timelineWidth = isRepeatedActivity ? '450px' : '600px'

  return (
    <StyledRowContent hasRepeatedActivities={!isEmpty(act.repeated_activities)}>
      <div id={toString(act._id)}>
        <Flex width={isSidebar ? 'inherit' : timelineWidth} alignItems="baseline">
          {/* if there is no Customer - ActivityDay is being used as a company activity index - so include the activity's customer */}
          {/* also don't show it it is a repeated activities */}
          <TitleAndRevenueImpact
            act={act}
            toggleCollapse={handleToggleCollapse}
            showRepeatedActivities={showRepeatedActivities}
            isSidebar={!!isSidebar}
          />
        </Flex>
      </div>

      {!isEmpty(act.repeated_activities) && (
        <RepeatedActivitiesTimeline
          showTimeline={showRepeatedActivities}
          mode="left"
          key={`nested_timeline_${act._id}`}
          style={{
            marginTop: '16px',
            marginBottom: '-40px',
          }}
        >
          {map(act.repeated_activities, (repAct) =>
            makeRow({
              act: repAct as ICustomerJourneyActivityRowWithMoment,
              timezone,
              goToRowId,
              isSidebar,
              table,
              customer,
              isRepeatedActivity: true,
            })
          )}
        </RepeatedActivitiesTimeline>
      )}
    </StyledRowContent>
  )
}

// using function instead of component, b/c component seems
// to break the UI when sent in timeline.push(<TimelineRow ... />)
// BUT we want this to be a functional component so it can
// keep track of whether it's children are visible or not
export const makeRow = ({
  act,
  timezone,
  goToRowId,
  isSidebar,
  table,
  customer,
  isRepeatedActivity,
}: {
  act: ICustomerJourneyActivityRowWithMoment
  timezone?: string
  goToRowId?: number
  isSidebar?: boolean
  table?: string
  customer?: string
  isRepeatedActivity?: boolean
}) => {
  return (
    <Item
      label={
        <TimeWithHighlight
          act={act}
          timezone={timezone}
          goToRowId={goToRowId}
          isRepeatedActivity={isRepeatedActivity}
        />
      }
      color={act.dot_color}
      key={`${act._id}`}
      style={{ marginLeft: isRepeatedActivity ? '-170px' : 'inherit' }}
    >
      <TimelineItemContent
        act={act}
        isSidebar={isSidebar}
        table={table}
        customer={customer}
        goToRowId={goToRowId}
        timezone={timezone}
        isRepeatedActivity={isRepeatedActivity}
      />
    </Item>
  )
}

export default TimelineItemContent
