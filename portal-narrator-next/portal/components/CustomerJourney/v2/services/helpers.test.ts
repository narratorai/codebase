import _ from 'lodash'
import { momentizeActivities, isRepeatedActivity, makeActivitiesWithSameRecentActivities } from './helpers'

import { ICustomerJourneyActivityRowWithMoment } from './interfaces'
import activitiesJson from '../../../../../test/fixtures/customerJourney/activities.json'
import repeatedActivitiesJson from '../../../../../test/fixtures/customerJourney/repeatedActivities.json'
import ascendingActivitiesJson from '../../../../../test/fixtures/customerJourney/ascendingActivities.json'
import filteredActivitiesJson from '../../../../../test/fixtures/customerJourney/filteredActivities.json'
import customerActivitiesJson from '../../../../../test/fixtures/customerJourney/customerActivities.json'
import noRepeatedActivitiesJson from '../../../../../test/fixtures/customerJourney/noRepeatedActivities.json'

const DEFAULT_TIMEZONE = 'America/New_York'
const activities = activitiesJson as unknown as ICustomerJourneyActivityRowWithMoment[]
const repeatedActivities = repeatedActivitiesJson as unknown as ICustomerJourneyActivityRowWithMoment[]
const ascendingActivities = ascendingActivitiesJson as unknown as ICustomerJourneyActivityRowWithMoment[]
const filteredActivities = filteredActivitiesJson as unknown as ICustomerJourneyActivityRowWithMoment[]
const customerActivities = customerActivitiesJson as unknown as ICustomerJourneyActivityRowWithMoment[]
const noRepeatedActivities = noRepeatedActivitiesJson as unknown as ICustomerJourneyActivityRowWithMoment[]

const momentizedActivities = momentizeActivities({ activities, timezone: DEFAULT_TIMEZONE })
const momentizedRepeatedActivities = momentizeActivities({ activities: repeatedActivities, timezone: DEFAULT_TIMEZONE })
const momentizedAscendingActivities = momentizeActivities({
  activities: ascendingActivities,
  timezone: DEFAULT_TIMEZONE,
})
const momentizedFilteredActivities = momentizeActivities({ activities: filteredActivities, timezone: DEFAULT_TIMEZONE })
const momentizedCustomerActivities = momentizeActivities({ activities: customerActivities, timezone: DEFAULT_TIMEZONE })
const momentizedNoRepeatedActivities = momentizeActivities({
  activities: noRepeatedActivities,
  timezone: DEFAULT_TIMEZONE,
})

const DEFAULT_WITHIN_MINUTES = 5

describe('#momentizeActivities', () => {
  it('should add the moment column to all activities', () => {
    expect(momentizedActivities).toMatchSnapshot()
  })

  it('should add moment to one column', () => {
    const firstActivity = activities[0]
    const oneMomentizedActivity = momentizeActivities({ activities: [firstActivity], timezone: DEFAULT_TIMEZONE })

    expect(oneMomentizedActivity[0]).toHaveProperty('moment')
  })

  it('should add moment to only repeated activities', () => {
    expect(momentizedRepeatedActivities[0]).toHaveProperty('moment')
  })

  it('should add moment to ascending activities', () => {
    expect(momentizedAscendingActivities[0]).toHaveProperty('moment')
  })

  it('should add moment to filtered activities', () => {
    expect(momentizedFilteredActivities[0]).toHaveProperty('moment')
  })

  it('should add moment to customer activities', () => {
    expect(momentizedCustomerActivities[0]).toHaveProperty('moment')
  })

  it('should add moment to no repeated activities', () => {
    expect(momentizedNoRepeatedActivities[0]).toHaveProperty('moment')
  })

  it('returns an empty array if no activities are passed', () => {
    expect(momentizeActivities({ timezone: DEFAULT_TIMEZONE })).toEqual(expect.arrayContaining([]))
  })

  it('returns an empty array if no timezone is passed', () => {
    expect(momentizeActivities({ activities })).toEqual(expect.arrayContaining([]))
  })
})

// momentizedActivities[1] and momentizedActivities[2] should be a repeated activity within 5 minutes
describe('#isRepeatedActivity', () => {
  it('should return true if same activity and within time frame', () => {
    expect(isRepeatedActivity(momentizedActivities[1], momentizedActivities[2], DEFAULT_WITHIN_MINUTES)).toBe(true)
  })

  it('should return false if same activity and outside time frame', () => {
    expect(isRepeatedActivity(momentizedActivities[1], momentizedActivities[2], 2)).toBe(false)
  })

  it('should return false if not the same activity and within time frame', () => {
    expect(isRepeatedActivity(momentizedActivities[0], momentizedActivities[1], DEFAULT_WITHIN_MINUTES)).toBe(false)
  })
})

describe('#makeActivitiesWithSameRecentActivities', () => {
  const activitiesWithRepeated = makeActivitiesWithSameRecentActivities({
    activities: momentizedActivities,
    withinMinutes: DEFAULT_WITHIN_MINUTES,
  })

  const repeatedActivitiesOnlyWithRepeated = makeActivitiesWithSameRecentActivities({
    activities: momentizedRepeatedActivities,
    withinMinutes: DEFAULT_WITHIN_MINUTES,
  })

  const ascendingActivitiesWithRepeated = makeActivitiesWithSameRecentActivities({
    activities: momentizedRepeatedActivities,
    withinMinutes: DEFAULT_WITHIN_MINUTES,
  })

  const filteredActivitiesWithRepeated = makeActivitiesWithSameRecentActivities({
    activities: momentizedFilteredActivities,
    withinMinutes: DEFAULT_WITHIN_MINUTES,
  })

  const customerActivitiesWithRepeated = makeActivitiesWithSameRecentActivities({
    activities: momentizedCustomerActivities,
    withinMinutes: DEFAULT_WITHIN_MINUTES,
  })

  const activitiesWithNoRepeated = makeActivitiesWithSameRecentActivities({
    activities: momentizedNoRepeatedActivities,
    withinMinutes: DEFAULT_WITHIN_MINUTES,
  })

  it('should create a list of activities with repeat_activity children', () => {
    expect(activitiesWithRepeated).toMatchSnapshot()
  })

  it('should take only repeated activities and return an activity with all repeated activities', () => {
    expect(repeatedActivitiesOnlyWithRepeated).toMatchSnapshot()
  })

  it('should create a list of ascending activities with repeat_activity children', () => {
    expect(ascendingActivitiesWithRepeated).toMatchSnapshot()
  })

  it('should create a list of filtered activities with repeat_activity children', () => {
    expect(filteredActivitiesWithRepeated).toMatchSnapshot()
  })

  it('should create a list of customer activities with repeat_activity children', () => {
    expect(customerActivitiesWithRepeated).toMatchSnapshot()
  })

  it('should create a list of activities with no repeat_activity children', () => {
    expect(activitiesWithNoRepeated).toMatchSnapshot()
  })

  it('should have less top level activities, since some are added as children', () => {
    expect(activitiesWithRepeated.length).toBeLessThan(momentizedActivities.length)
  })

  // This helps ensure that we aren't missing any of the activities when nesting repeated activities
  it('should have the same number of shown activities, both repeated and singular, as originally passed activities', () => {
    // Grab all top level activities that don't have any repeated activities
    const allNonRepeatedActivities = _.filter(activitiesWithRepeated, (act) => _.isEmpty(act.repeated_activities))

    // Grab all nested repeated activities
    const allActivitiesWithRepeatedActivities = _.filter(
      activitiesWithRepeated,
      (act) => !_.isEmpty(act.repeated_activities)
    )
    const allRepeatedActivities = _.flatMap(allActivitiesWithRepeatedActivities, (activityWithRepeated) =>
      _.map(activityWithRepeated.repeated_activities)
    )

    const totalRepeatedAndNonRepeatedActivities = allNonRepeatedActivities.length + allRepeatedActivities.length

    expect(momentizedActivities).toHaveLength(totalRepeatedAndNonRepeatedActivities)
  })
})
