import { useMemo } from 'react'

import { IRemoteCohortActivity } from '@/stores/datasets'

import { compileCohortActivity } from '../util'

const useCohortActivity = (activity: IRemoteCohortActivity | null) => {
  const result = useMemo(() => {
    if (activity === null) return []
    return compileCohortActivity(activity)
  }, [activity])

  return result
}

export default useCohortActivity
