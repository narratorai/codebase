import { Timeline } from 'antd-next'
import { Flex, Typography } from 'components/shared/jawns'
import { forEach, isEmpty, map } from 'lodash'
import { colors } from 'util/constants'
import { getDuration, minutesFormatter } from 'util/helpers'

import { ICustomerJourneyActivityRowWithMoment } from '../services/interfaces'
import { makeRow } from './TimelineItemContent'

const Timelines = ({
  activities,
  timeSinceLastDay,
  isSidebar,
  timezone,
  table,
  goToRowId,
  customer,
}: {
  activities: ICustomerJourneyActivityRowWithMoment[]
  timeSinceLastDay?: number
  isSidebar?: boolean
  timezone?: string
  table?: string
  goToRowId?: number
  customer?: string
}) => {
  const timelinesAndTimeDiffs: JSX.Element[] = []
  let timeline: JSX.Element[] = []
  forEach(activities, (act, idx) => {
    // if it's the first activity of the day
    if (idx === 0) {
      // if there was a previous day, show how long it's been since that day first
      if (timeSinceLastDay && !isSidebar) {
        timelinesAndTimeDiffs.push(
          <Flex justifyContent="center" p={3} mb={2} mt={-4} key={`minutes_between_${act._id}`}>
            <Typography color={colors.gray500}>{minutesFormatter(timeSinceLastDay, true)}</Typography>
          </Flex>
        )
      }

      // for first day, don't check for time difference (just add to timeline)
      timeline.push(
        makeRow({
          act,
          timezone,
          goToRowId,
          isSidebar,
          table,
          customer,
        })
      )
    }

    // otherwise, if it's not the first activity of the day
    if (idx !== 0) {
      const duration = getDuration({ startTime: activities[idx - 1].ts, endTime: act.ts })
      const durationAsMinutes = Math.abs(duration.asMinutes())

      // check to see if there is more than 30 minutes between activities
      if (durationAsMinutes <= 30) {
        // if it's been 30 mintues or less between activities, add the activity to the timeline
        timeline.push(
          makeRow({
            act,
            timezone,
            goToRowId,
            isSidebar,
            table,
            customer,
          })
        )
      } else {
        // if it's been more than 30 minutes
        // add timeline (with Timeline wrapper) to the timelinesAndTimeDiffs
        timelinesAndTimeDiffs.push(
          <Timeline mode="left" key={`timeline_${act._id}`}>
            {timeline}
          </Timeline>
        )

        // add the time difference
        timelinesAndTimeDiffs.push(
          <Flex
            justifyContent="center"
            p={3}
            // since we add the first activity to repeated_activities
            // check if the previous activity has repeated_activities
            // (previous activity would be a dupe of current activtiy, but w/ repeated_actvities)
            mt={!isEmpty(activities[idx - 1]?.repeated_activities) ? '-14px' : '-42px'}
            mb={2}
            key={`minutes_between_${act._id}`}
          >
            <Typography color={colors.gray500}>{minutesFormatter(durationAsMinutes, true)}</Typography>
          </Flex>
        )
        // reset timeline with the current activity row
        timeline = []
        timeline.push(
          makeRow({
            act,
            timezone,
            goToRowId,
            isSidebar,
            table,
            customer,
          })
        )
      }
    }

    // if it is the last activity, push timeline (with Timeline wrapper) to timelinesAndTimeDiffs
    if (idx === activities.length - 1) {
      timelinesAndTimeDiffs.push(
        <Timeline mode="left" key={`last_timeline_${act._id}`}>
          {timeline}
        </Timeline>
      )
    }
  })

  return <>{map(timelinesAndTimeDiffs, (el) => el)}</>
}

export default Timelines
