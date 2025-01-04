import { useMemo } from 'react'

import { IRemoteAppendActivity, IRemoteCohortActivity } from '@/stores/datasets'

import { compileAppendActivities } from '../util'

const useAppendActivities = (activities: IRemoteAppendActivity[], cohortActivity: IRemoteCohortActivity | null) => {
  const result = useMemo(() => {
    if (cohortActivity === null || activities.length === 0) return []
    return compileAppendActivities(activities, cohortActivity)
  }, [activities, cohortActivity])

  return result
}

export default useAppendActivities
