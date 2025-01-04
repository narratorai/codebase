import { flatten, map } from 'lodash'

import { getBoldToken, getPurpleTagToken, getRegularToken, getSpaceToken, IToken } from '@/components/shared/TagContent'
import { IRemoteBaseActivity } from '@/stores/activities'
import { IRemoteCompany } from '@/stores/companies'
import { ActivityAction, IRemoteJourneyCustomer } from '@/stores/journeys'
import { formatShortDate } from '@/util/formatters'

import { ACTIVITY_ACTION, KEYWORDS, SPACE } from './constants'

export const compileCustomerJourneyConfigCustomer = (customer: IRemoteJourneyCustomer): IToken[] => {
  const value = customer.customerDisplayName || customer.customer
  const customerToken = getBoldToken(value)
  return [customerToken]
}

export const compileCustomerJourneyConfigActivities = (
  activities: IRemoteBaseActivity[],
  activityAction: ActivityAction
): IToken[] => {
  const compileCustomerJourneyConfigActivity = (activity: IRemoteBaseActivity, index: number): IToken[] => {
    const spaceToken = getSpaceToken(SPACE)
    const activityToken = getPurpleTagToken(activity.name)
    const andToken = getRegularToken(KEYWORDS.and)
    if (activities.length === 1) return [activityToken]
    if (index < activities.length - 1) return [activityToken, spaceToken]
    return [andToken, spaceToken, activityToken]
  }

  const spaceToken = getSpaceToken(SPACE)
  const allActivitiesToken = getBoldToken(KEYWORDS.all_activities)
  const selectionToken = getRegularToken(ACTIVITY_ACTION[activityAction])
  const activitiesTokens = flatten(map(activities, compileCustomerJourneyConfigActivity))
  const tokens = activitiesTokens.length > 0 ? activitiesTokens : [allActivitiesToken]
  return [selectionToken, spaceToken, ...tokens]
}

export const compileCustomerJourneyConfigDateRange = (
  fromTime: string | null,
  toTime: string | null,
  company: IRemoteCompany
): IToken[] => {
  const fromTimeValue = fromTime ? formatShortDate(fromTime, company) : KEYWORDS.beginning_of_time
  const toTimeValue = toTime ? formatShortDate(toTime, company) : KEYWORDS.now

  const spaceToken = getSpaceToken(SPACE)
  const fromToken = getRegularToken(KEYWORDS.from)
  const toToken = getRegularToken(KEYWORDS.to)
  const fromTimeToken = getBoldToken(fromTimeValue)
  const toTimeToken = getBoldToken(toTimeValue)
  return [fromToken, spaceToken, fromTimeToken, spaceToken, toToken, spaceToken, toTimeToken]
}
