import { findIndex, forEach, last } from 'lodash'
import moment from 'moment-timezone'
import { getDuration } from 'util/helpers'

import { TimelineEvent } from './interfaces'

export const isRepeatedEvent = (event1: TimelineEvent, event2: TimelineEvent, withinMinutes: number) => {
  // first check if the events are the same
  if (event1?.activity !== event2?.activity) {
    return false
  }

  // then check if the events happened within the minutes restriction
  const duration = getDuration({ startTime: moment(event1?.ts), endTime: moment(event2?.ts) })
  const isWithinMinutes = Math.abs(duration.asMinutes()) < withinMinutes

  return isWithinMinutes
}

export const makeTimelineOptions = (events?: TimelineEvent[]) => {
  const options: TimelineEvent[] = []

  // go through all events
  forEach(events, (event, idx) => {
    // if it's the first event, add it to the options
    if (idx === 0) {
      options.push(event)
    }

    // if it's not the first event
    if (idx !== 0) {
      const lastOption = last(options) as TimelineEvent

      // check if the event is repeated
      const isRepeated = isRepeatedEvent(lastOption, event, 5)

      // if it's repeated
      if (isRepeated) {
        // see if the last event was repeated as well
        // otherwise this is the first repeated event so use parent id
        const parentId = lastOption.repeatedEventParentId || lastOption.id
        // add it to the repeatedEventParentId
        options.push({ ...event, repeatedEventParentId: parentId })

        // find the original parent in the options
        const originalParentIndex = findIndex(options, { id: parentId })
        // if the original parent is found
        if (originalParentIndex !== -1) {
          // update the repeatedEventIds
          const originalParent = options[originalParentIndex]
          const updatedParent = { ...originalParent }

          // check if the original parent already has repeatedEventIds
          if (updatedParent.repeatedEventIds) {
            // add the repeated event to the repeatedEventIds
            updatedParent.repeatedEventIds.push(event.id)
          } else {
            // otherwise initialize the repeatedEventIds with the repeated event id
            updatedParent.repeatedEventIds = [event.id]
          }

          // replace the original parent with the updated parent
          options[originalParentIndex] = updatedParent
        }
      }

      // if it's not repeated
      if (!isRepeated) {
        // first check if it's been more than 30 minutes since the last event
        const duration = getDuration({ startTime: moment(event.ts), endTime: moment(lastOption.ts) })
        const moreThan30Minutes = Math.abs(duration.asMinutes()) > 30
        if (moreThan30Minutes) {
          const timeDifferenceOption = { startTime: event.ts, endTime: lastOption.ts, isTimeDifference: true }
          options.push(timeDifferenceOption as TimelineEvent)
        }

        // then add the event to the options
        options.push(event)
      }
    }
  })

  return options
}
