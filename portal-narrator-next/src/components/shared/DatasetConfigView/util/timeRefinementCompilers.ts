import { flatten, map } from 'lodash'
import pluralize from 'pluralize'

import { getBoldToken, getRegularToken, getSpaceToken, IToken } from '@/components/shared/TagContent'
import { IRemoteCohortActivity, IRemoteRefinementTimeDetails } from '@/stores/datasets'

import { KEYWORDS, REFINEMENT, SPACE, TIME_RESOLUTION } from './constants'

export const compileRefinementTimeDetails = (
  timeRefinement: IRemoteRefinementTimeDetails,
  activity: IRemoteCohortActivity
): IToken[] => {
  const kind = REFINEMENT[timeRefinement.kind]
  const resolution = TIME_RESOLUTION[timeRefinement.resolution]
  const resolutions = pluralize(resolution, timeRefinement.value)
  const value = `${timeRefinement.value}`

  const spaceToken = getSpaceToken(SPACE)
  const itIsToken = getRegularToken(KEYWORDS.it_is)
  const kindToken = getRegularToken(kind)
  const valueToken = getBoldToken(value)
  const resolutionsToken = getBoldToken(resolutions)
  const ofThatToken = getRegularToken(KEYWORDS.of_that)
  const cohortActivityToken = getRegularToken(activity.displayName)
  return [
    itIsToken,
    spaceToken,
    kindToken,
    spaceToken,
    valueToken,
    spaceToken,
    resolutionsToken,
    spaceToken,
    ofThatToken,
    spaceToken,
    cohortActivityToken,
  ]
}

export const compileRefinementTimeDetailsArray = (
  timeRefinements: IRemoteRefinementTimeDetails[],
  activity: IRemoteCohortActivity
): IToken[] => {
  return flatten(map(timeRefinements, (refinement) => compileRefinementTimeDetails(refinement, activity)))
}
