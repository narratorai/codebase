import { forEach, isEmpty, map } from 'lodash'
import moment from 'moment-timezone'
import { getDuration } from 'util/helpers'

import { ICustomerJourneyActivityRow, ICustomerJourneyActivityRowWithMoment } from '../services/interfaces'

// momentize all activities
export const momentizeActivities = ({
  activities,
  timezone,
}: {
  activities?: ICustomerJourneyActivityRow[]
  timezone?: string
}): ICustomerJourneyActivityRowWithMoment[] => {
  if (!activities || !timezone) {
    return []
  }

  return map(activities, (act) => ({
    ...act,
    moment: moment.tz(act.ts, timezone),
  }))
}

// break activities into days
interface GetActivityDaysArgs {
  activities?: ICustomerJourneyActivityRowWithMoment[]
}
export const getActivityDays = ({ activities }: GetActivityDaysArgs) => {
  if (!activities) {
    return []
  }

  const days: ICustomerJourneyActivityRowWithMoment[][] = []
  let day: ICustomerJourneyActivityRowWithMoment[] = []

  forEach(activities, (act, idx) => {
    // don't compare first activity to anything, it starts the first day
    if (idx === 0) {
      day.push(act)
    }

    // if it's not the first activity
    if (idx !== 0) {
      // check last activity to see if it is in same day

      const isSameDay = act.moment.isSame(activities[idx - 1].moment, 'day')

      // if it is the same day, add it to the current day
      if (isSameDay) {
        day.push(act)
      }

      // if it is NOT the same day, push day into days and reset day with current activity
      if (!isSameDay) {
        days.push(day)
        day = [act]
      }
    }

    // if it's the last activity, push day into days
    if (idx === activities.length - 1) {
      days.push(day)
    }
  })

  return days
}

// does the next activity have the same name, customer, and within X minutes
export const isRepeatedActivity = (
  activity1: ICustomerJourneyActivityRowWithMoment,
  activity2: ICustomerJourneyActivityRowWithMoment,
  withinMinutes: number
) => {
  const isSameActivity = activity1?.activity === activity2?.activity
  if (!isSameActivity) {
    return false
  }

  // if either activity has a customer
  if (!isEmpty(activity1?.customer) || !isEmpty(activity2?.customer)) {
    // make sure they are the same customer
    const isSameCustomer = activity1?.customer === activity2?.customer
    if (!isSameCustomer) {
      return false
    }
  }

  const duration = getDuration({ startTime: activity1.moment, endTime: activity2.moment })
  const isWithinMinutes = Math.abs(duration.asMinutes()) < withinMinutes

  return isWithinMinutes
}

// collapse repeated activities into first activity's "repeated_activities"
interface MakeActivitiesWithSameRecentActivitiesArgs {
  activities: ICustomerJourneyActivityRowWithMoment[]
  withinMinutes: number
}
export const makeActivitiesWithSameRecentActivities = ({
  activities,
  withinMinutes,
}: MakeActivitiesWithSameRecentActivitiesArgs) => {
  // must have withinMinutes for this to work
  // just return the activities without collapse if no 'withinMinutes' passed
  if (!withinMinutes) {
    return activities
  }

  const activitiesWithRepeated = []
  // go through all activities
  for (let i = 0; i < activities.length; i++) {
    // check if next activities are repeated
    const repeatedActivites = []
    const firstActivity = { ...activities[i] }
    for (let j = i; j < activities.length; j++) {
      const act = { ...activities[j] }
      const nextAct = activities[j + 1] ? { ...activities[j + 1] } : undefined

      if (nextAct && isRepeatedActivity(act, nextAct, withinMinutes)) {
        // add the first activity as it will be included in the
        // repeated activities dropdown
        if (act._id === firstActivity._id) {
          repeatedActivites.push({ ...act })
        }

        repeatedActivites.push(nextAct)
      } else {
        // it isn't repeated
        // add repeated activities to current activity
        firstActivity.repeated_activities = repeatedActivites
        activitiesWithRepeated.push(firstActivity)

        // skip ahead X amount of repeated activities in outer loop
        if (repeatedActivites.length > 0) {
          i = i + repeatedActivites.length - 1
        }

        // break out of inner loop
        break
      }
    }
  }

  return activitiesWithRepeated
}

// go through each day and collapse the
// repeated activities within a day
interface CollapseRepeatedActivities {
  days: ICustomerJourneyActivityRowWithMoment[][]
  withinMinutes: number
}
export const collapseRepeatedActivities = ({ days, withinMinutes }: CollapseRepeatedActivities) => {
  return map(days, (day) => {
    return makeActivitiesWithSameRecentActivities({ activities: day, withinMinutes })
  })
}

// takes a list of activities
// 1) momentizes them
// 2) breaks them into days
// 3) collapses the repeated activities within a day (if collapseWithinMinutes is provided)
interface AssembledActivitiesArgs {
  activities?: ICustomerJourneyActivityRow[]
  timezone?: string
  collapseWithinMinutes?: number
}
export const assembleActivities = ({ activities, timezone, collapseWithinMinutes }: AssembledActivitiesArgs) => {
  const withMoment = momentizeActivities({ activities, timezone })

  const byDay = getActivityDays({ activities: withMoment })

  if (!collapseWithinMinutes) {
    return byDay
  }

  const repeatsCollapsed = collapseRepeatedActivities({ days: byDay, withinMinutes: collapseWithinMinutes })
  return repeatsCollapsed
}
