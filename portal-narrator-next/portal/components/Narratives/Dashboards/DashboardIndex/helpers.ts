import { NON_SHARED_TAGS } from 'components/shared/IndexPages/constants'
import { each, includes, isEmpty } from 'lodash'

import { DashboardsType } from './interfaces'

export const getDashboardsByNonSharedTags = ({ dashboards }: { dashboards?: DashboardsType }) => {
  const dashByTag: { [key: string]: DashboardsType } = {}

  // go through each dashboard
  each(dashboards, (dashboard) => {
    // then go through each dashboard's tags
    each(dashboard.tags, (tag) => {
      // add any non-shared tagged dashboard to end result
      const tagName = tag.company_tag?.tag
      if (tagName && !includes(NON_SHARED_TAGS, tagName)) {
        // initialize tag if not yet present
        if (isEmpty(dashByTag[tagName])) {
          dashByTag[tagName] = []
        }

        // and add the dashboard to tag
        dashByTag[tagName].push(dashboard)
      }
    })
  })

  return dashByTag
}
