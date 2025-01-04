import _ from 'lodash'
import { makeShortid } from 'util/shortid'

import { CopiedPlotContent, CopiedMetricContent, CopiedTableContent } from 'util/shared_content/interfaces'
import {
  COPIED_PLOT_CONTENT_TYPE,
  COPIED_METRIC_CONTENT_TYPE,
  COPIED_TABLE_CONTENT_TYPE,
} from 'util/shared_content/constants'
import { COPIED_CONTENT_KEY, COPIED_CONTENT_TTL } from 'util/shared_content/constants'

// https://www.sohamkamani.com/javascript/localstorage-with-ttl-expiry/
// (ttl is in ms)
export const setLocalStorageWithExpiration = (key: string, value: Record<string, any>, ttl: number) => {
  const now = new Date()

  // `item` is an object which contains the original value
  // as well as the time when it's supposed to expire
  const item = {
    value: value,
    expiry: now.getTime() + ttl,
  }

  localStorage.setItem(key, JSON.stringify(item))
}

// set plot/metric/table etc... to localStorage to be pasted elsewhere in portal
export const setCopiedContentToLocalStorage = (value: Record<string, any>) => {
  setLocalStorageWithExpiration(COPIED_CONTENT_KEY, value, COPIED_CONTENT_TTL)
}

// https://www.sohamkamani.com/javascript/localstorage-with-ttl-expiry/
export const getLocalStorageWithExpiration = (key: string) => {
  const itemStr = localStorage.getItem(key)
  // if the item doesn't exist, return null
  if (!itemStr) {
    return null
  }

  const item = JSON.parse(itemStr)
  const now = new Date()

  // compare the expiry time of the item with the current time
  if (now.getTime() > item.expiry) {
    // If the item is expired, delete the item from storage
    // and return null
    localStorage.removeItem(key)
    return null
  }

  return item.value
}

// get plot/metric/table etc... content from localStorage
export const getCopiedContentToLocalStorage = () => {
  return getLocalStorageWithExpiration(COPIED_CONTENT_KEY)
}

interface MakePlotCopiedContentProps {
  datasetSlug: string
  groupSlug: string
  plotSlug: string
  extraPlotData?: Record<string, any>
}
export const makePlotCopiedContent = ({
  datasetSlug,
  groupSlug,
  plotSlug,
  extraPlotData = {},
}: MakePlotCopiedContentProps): CopiedPlotContent => {
  // some components rely on plotSlug being `groupSlug.plotSlug` to help
  // multi-select dropdowns select unique plots
  // if it exists, remove the groupSlug from the plotSlug
  // (leave it up to the components to construct their own unique plotSlugs if necessary)

  const groupSlugPrefix = `${groupSlug}.`
  const formattedPlotSlug = _.startsWith(plotSlug, groupSlugPrefix)
    ? plotSlug.substring(groupSlugPrefix.length) // strips groupSlug
    : plotSlug // didn't have groupSlug

  return {
    id: makeShortid(), // create unique ids when copying
    type: COPIED_PLOT_CONTENT_TYPE,
    data: {
      ...extraPlotData, // don't over-write slug logic below
      dataset_slug: datasetSlug,
      group_slug: groupSlug,
      plot_slug: formattedPlotSlug,
    },
  }
}

interface MakeMetricCopiedContentProps {
  dataset_slug: string
  group_slug: string
  column_id: string
}
export const makeMetricCopiedContent = ({
  dataset_slug,
  group_slug,
  column_id,
  ...extraMetricData
}: MakeMetricCopiedContentProps): CopiedMetricContent => {
  return {
    id: makeShortid(), // create unique ids when copying
    type: COPIED_METRIC_CONTENT_TYPE,
    data: {
      dataset_slug,
      group_slug,
      column_id, // metric id
      ...extraMetricData,
    },
  }
}

interface MakeTableCopiedContentProps {
  dataset_slug: string
  group_slug: string
  as_data_table: boolean
}
export const makeTableCopiedContent = ({
  dataset_slug,
  group_slug,
  as_data_table,
  ...extraTableData
}: MakeTableCopiedContentProps): CopiedTableContent => {
  return {
    id: makeShortid(), // create unique ids when copying
    type: COPIED_TABLE_CONTENT_TYPE,
    data: {
      dataset_slug,
      group_slug,
      as_data_table,
      ...extraTableData,
    },
  }
}
