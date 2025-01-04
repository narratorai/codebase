import { find, flattenDeep, map } from 'lodash'

import {
  getBoldToken,
  getPinkPurpleTagToken,
  getPurpleTagToken,
  getRegularToken,
  getSpaceToken,
  IToken,
} from '@/components/shared/TagContent'
import { IRemoteAppendActivity, IRemoteCohortActivity, IRemoteRelativeActivity } from '@/stores/datasets'

import { compilePrefilterColumns } from './columnCompilers'
import {
  APPEND_ACTIVITY_FETCH_TYPE,
  APPEND_ACTIVITY_RELATION_TYPE,
  COHORT_ACTIVITY_FETCH_TYPE,
  KEYWORDS,
  RELATIVE_ACTIVITY_RELATION_TYPE,
  SPACE,
} from './constants'
import { compileJoinConditonExpression } from './expressionCompilers'
import { compileRefinementTimeDetailsArray } from './timeRefinementCompilers'

export const compileRelativeActivity = (
  relativeActivity: IRemoteRelativeActivity,
  activities: IRemoteAppendActivity[]
): IToken[] => {
  const relation = RELATIVE_ACTIVITY_RELATION_TYPE[relativeActivity.relation]
  const includeIfNull = relativeActivity.includeIfNull ? KEYWORDS.or_is_null : ''
  const id = relativeActivity.appendActivityId
  const name = find(activities, { id })?.displayName || ''

  const spaceToken = getSpaceToken(SPACE)
  const itIsToken = getRegularToken(KEYWORDS.it_is)
  const relationToken = getBoldToken(relation)
  const theToken = getRegularToken(KEYWORDS.the)
  const nameToken = getRegularToken(name)
  const includeIfNullToken = getRegularToken(includeIfNull)
  return [
    itIsToken,
    spaceToken,
    relationToken,
    spaceToken,
    theToken,
    spaceToken,
    nameToken,
    spaceToken,
    includeIfNullToken,
  ]
}

export const compileRelativeActivities = (
  relativeActivities: IRemoteRelativeActivity[],
  activities: IRemoteAppendActivity[]
): IToken[] => {
  return flattenDeep(
    map(relativeActivities, (relativeActivity) => compileRelativeActivity(relativeActivity, activities))
  )
}

export const compileCohortActivity = (activity: IRemoteCohortActivity): IToken[] => {
  const name = activity.displayName
  const fetchType = COHORT_ACTIVITY_FETCH_TYPE[activity.fetchType]

  const spaceToken = getSpaceToken(SPACE)
  const fetchTypeToken = getRegularToken(fetchType)
  const nameToken = getPurpleTagToken(name)
  const columnTokens = compilePrefilterColumns(activity.prefilterColumns)
  const whereToken = getRegularToken(KEYWORDS.where)
  const compiledColumns = columnTokens.length > 0 ? [spaceToken, whereToken, spaceToken, ...columnTokens] : []
  return [fetchTypeToken, spaceToken, nameToken, ...compiledColumns]
}

export const compileAppendActivity = (
  activity: IRemoteAppendActivity,
  cohortActivity: IRemoteCohortActivity,
  activities: IRemoteAppendActivity[]
): IToken[] => {
  const name = activity.displayName
  const fetchType = APPEND_ACTIVITY_FETCH_TYPE[activity.fetchType]
  const relationType = APPEND_ACTIVITY_RELATION_TYPE[activity.relation]
  const relationTypeValue = activity.relation !== 'ever' ? relationType : ''
  const cohortActivityName = activity.relation !== 'ever' ? cohortActivity.displayName : ''

  const spaceToken = getSpaceToken(SPACE)
  const appendToken = getRegularToken(KEYWORDS.append)
  const fetchTypeToken = getRegularToken(fetchType)
  const nameToken = getPinkPurpleTagToken(name)
  const relationTypeToken = getRegularToken(relationTypeValue)

  const cohortActivityNameToken = getBoldToken(cohortActivityName)

  const columns = compilePrefilterColumns(activity.prefilterColumns)
  const timeRefinements = compileRefinementTimeDetailsArray(activity.timeRefinements, cohortActivity)
  const joins = compileJoinConditonExpression(activity.joins)
  const relativeActivities = compileRelativeActivities(activity.relativeActivities, activities)

  const tokens = [appendToken, spaceToken, fetchTypeToken, spaceToken, nameToken]
  const tokenGroups = []
  if (columns.length > 0) tokenGroups.push(columns)
  if (timeRefinements.length > 0) tokenGroups.push(timeRefinements)
  if (joins.length > 0) tokenGroups.push(joins)
  if (relativeActivities.length > 0) tokenGroups.push(relativeActivities)

  if (tokenGroups.length > 0) {
    const whereToken = getRegularToken(KEYWORDS.where)
    tokens.push(spaceToken, whereToken, spaceToken)
  }

  const filtersAndRelations = map(tokenGroups, (group, index) => {
    if (index < tokenGroups.length - 1) {
      const andToken = getRegularToken(KEYWORDS.and)
      return [group, spaceToken, andToken, spaceToken]
    }
    return [group]
  })

  tokens.push(...flattenDeep(filtersAndRelations))
  tokens.push(spaceToken, relationTypeToken, spaceToken, cohortActivityNameToken)

  return tokens
}

export const compileAppendActivities = (
  activities: IRemoteAppendActivity[],
  cohortActivity: IRemoteCohortActivity
): IToken[][] => {
  return map(activities, (activity) => compileAppendActivity(activity, cohortActivity, activities))
}
