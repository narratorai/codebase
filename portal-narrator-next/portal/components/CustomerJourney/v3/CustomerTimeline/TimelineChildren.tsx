import { LinkOutlined } from '@ant-design/icons'
import { Flex, Tooltip, Typography } from 'antd-next'
import { isEmpty, isFinite } from 'lodash'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { ordinalSuffixOf } from 'util/helpers'

import EventAttributes from './EventAttributes'
import { TimelineEvent } from './interfaces'
import RevenueTag from './RevenueTag'
import TimeDifferenceChildren from './TimeDifferenceChildren'

const Container = styled.div<{ isLastEvent: boolean }>`
  ${({ isLastEvent }) =>
    !isLastEvent &&
    `
  border-bottom: 1px solid ${colors.mavis_light_gray};
`}

  margin-right: 16px;
  padding-bottom: 8px;
`
interface Props {
  event: TimelineEvent
  isLastEvent: boolean
  repeatedIsOpen?: boolean
  isAsc: boolean
}

const TimelineChildren = ({ event, isLastEvent, repeatedIsOpen, isAsc }: Props) => {
  const hasRepeatedActivities = !isEmpty(event.repeatedEventIds)

  // TIME_DIFFERENCE: show time difference if it's a time difference row
  const isTimeDifference = event.isTimeDifference
  const startTime = event.startTime
  const endTime = event.endTime
  if (isTimeDifference && startTime && endTime) {
    return <TimeDifferenceChildren startTime={startTime} endTime={endTime} isAsc={isAsc} />
  }

  // if it has repeated events and isn't open
  // only show the name
  if (hasRepeatedActivities && !repeatedIsOpen) {
    return (
      <Container isLastEvent={isLastEvent}>
        <Typography.Title level={5}>{event.activity}</Typography.Title>
      </Container>
    )
  }

  // EVENT: show the event description
  return (
    <Container isLastEvent={isLastEvent}>
      <Flex align="center">
        <div style={{ marginRight: '16px' }}>
          <Typography.Title level={5} style={{ marginBottom: 0 }}>
            {event.activity}
          </Typography.Title>
        </div>

        <Typography.Title
          level={5}
          style={{ color: event.occurrence === 1 ? colors.mavis_subscribed_green : undefined, marginBottom: 0 }}
        >
          {ordinalSuffixOf(event.occurrence)}
        </Typography.Title>

        {/* Revenue if it exists */}
        {isFinite(event.revenue) && (
          <div style={{ marginLeft: '16px' }}>
            <RevenueTag revenue={event.revenue as number} />
          </div>
        )}

        {/* Link if it exists */}
        {event.link && (
          <div style={{ marginLeft: '16px' }}>
            <a href={event.link} target="_blank" rel="noreferrer">
              <Tooltip title={event.link}>
                <LinkOutlined />
              </Tooltip>
            </a>
          </div>
        )}
      </Flex>

      {!isEmpty(event.attributes) && <EventAttributes attributes={event.attributes} />}
    </Container>
  )
}

export default TimelineChildren
