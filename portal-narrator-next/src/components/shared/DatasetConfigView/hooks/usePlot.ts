import { useMemo } from 'react'

import { IRemoteTab } from '@/stores/datasets'

import { compileTabs } from '../util'

const usePlot = (tabs: IRemoteTab[], groupSlug?: string | null, plotSlug?: string | null) => {
  const result = useMemo(() => {
    if (!groupSlug || !plotSlug || tabs.length === 0) return []
    return compileTabs(tabs, groupSlug, plotSlug)
  }, [tabs, groupSlug, plotSlug])

  return result
}

export default usePlot
