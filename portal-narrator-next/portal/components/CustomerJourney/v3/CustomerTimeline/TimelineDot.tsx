import { ClockCircleOutlined } from '@ant-design/icons'
import { Badge, Tooltip } from 'antd-next'
import { isEmpty } from 'lodash'
import BlueCircle from 'static/img/blueCircle.svg'
import styled from 'styled-components'
import { colors } from 'util/constants'

import { TimelineEvent } from './interfaces'

const IconWrapper = styled.div<{ hasRepeatedEvents?: boolean; isRepeatedEvent?: boolean }>`
  background-color: white;

  svg {
    font-size: 20px;
  }

  ${({ hasRepeatedEvents }) =>
    hasRepeatedEvents &&
    `
    &:hover {
      cursor: pointer;
    }
  `}

  ${({ isRepeatedEvent }) =>
    isRepeatedEvent &&
    `
    .antd5-badge-status-dot {
      width: 18px !important;
      height: 18px !important;
    }
  `}
`

interface Props {
  event: TimelineEvent
  onRepeatedClick: (repeatedEventId: string) => void
  repeatedIsOpen?: boolean
}

const TimelineDot = ({ event, onRepeatedClick, repeatedIsOpen }: Props) => {
  // TIME_DIFFERENCE - the clock icon
  const isTimeDifference = event.isTimeDifference
  if (isTimeDifference) {
    return (
      <IconWrapper>
        <ClockCircleOutlined style={{ color: colors.mavis_dark_gray }} />
      </IconWrapper>
    )
  }

  // STAND_ALONE_EVENT - the blue circle, white interior
  const isRepeatedEvent = !!event.repeatedEventParentId
  const repeatedEventIds = event.repeatedEventIds || []
  const hasRepeatedEvents = !isEmpty(repeatedEventIds)
  // if the event has no repeated events, nor it is a repeated event
  // treat it like a normal event (regular dot)
  if (!hasRepeatedEvents && !isRepeatedEvent) {
    return (
      <IconWrapper>
        <BlueCircle />
      </IconWrapper>
    )
  }

  // IS_REAPEATED_EVENT - filled blue circle
  // if the event is a repeated event (and the parent has been opened)
  if (isRepeatedEvent) {
    return (
      <IconWrapper isRepeatedEvent={isRepeatedEvent}>
        <Badge color={colors.mavis_checkout_blue} />
      </IconWrapper>
    )
  }

  // HAS_REPEATED_EVENT - the badge with the number of repeated events
  // if the event has repeated events
  // show the number of repeated events
  // and allow open/close of the repeated events
  const numberOfRepeatedEvents = repeatedEventIds.length
  const handleOnClick = () => {
    onRepeatedClick(event.id)
  }

  // TODO: what state should we show for opened?
  // (no designs currently for this)
  return (
    <IconWrapper onClick={handleOnClick} hasRepeatedEvents>
      <Tooltip title={repeatedIsOpen ? 'Hide repeated events' : 'Show repeated events'}>
        <Badge count={numberOfRepeatedEvents + 1} overflowCount={9} color={colors.mavis_checkout_blue} />
      </Tooltip>
    </IconWrapper>
  )
}

export default TimelineDot
