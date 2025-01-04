import { Timeline } from 'antd-next'
import { includes, map } from 'lodash'

import { REPEATED_ACTIVITY_PARENT_ID_CLASSNAME_PREFIX } from './constants'
import { makeTimelineOptions } from './helpers'
import { TimelineEvent } from './interfaces'
import TimelineChildren from './TimelineChildren'
import TimelineDot from './TimelineDot'
import TimelineLabel from './TimelineLabel'

interface Props {
  events: TimelineEvent[]
  openedRepeatedEventIds: string[]
  handleRepeatedActivityClick: (id: string) => void
  isAsc: boolean
}

const EventTimelineItems = ({ events, openedRepeatedEventIds, handleRepeatedActivityClick, isAsc }: Props) => {
  // Build timeline items for antd's timeline
  const timelineOptions = makeTimelineOptions(events)
  const timelineItems = map(timelineOptions, (option, index) => {
    const isRepeatedActivity = !!option.repeatedEventParentId
    const isTimeDifference = option.isTimeDifference
    const repeatedIsOpen = includes(openedRepeatedEventIds, option.id)
    const isLastEvent = index === timelineOptions.length - 1

    return {
      className: isRepeatedActivity
        ? `${REPEATED_ACTIVITY_PARENT_ID_CLASSNAME_PREFIX}${option.repeatedEventParentId}`
        : undefined,
      label: <TimelineLabel timestamp={option.ts} timeDifferenceOption={isTimeDifference ? option : undefined} />,
      dot: <TimelineDot event={option} onRepeatedClick={handleRepeatedActivityClick} repeatedIsOpen={repeatedIsOpen} />,
      children: (
        <TimelineChildren event={option} isLastEvent={isLastEvent} repeatedIsOpen={repeatedIsOpen} isAsc={isAsc} />
      ),
    }
  })

  return <Timeline mode="left" items={timelineItems} />
}

export default EventTimelineItems
