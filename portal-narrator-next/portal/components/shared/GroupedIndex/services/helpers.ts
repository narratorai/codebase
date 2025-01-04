import _ from 'lodash'
import moment from 'moment-timezone'
import {
  GROUPING_RECENT,
  GROUPING_RECENT_NEW_LABEL,
  GROUPING_RECENT_NOT_NEW_LABEL,
  GROUPING_NULL_LABEL,
  RECENT_CALCULATION_DAY_COUNT,
} from './constants'

export interface IGroupConfig {
  label: string
  group: string
  pathToValue: string
  groupLabelOverrides?: {
    key: string
    label: string
  }[]
  addToGroup?: {
    from: string
    to: string
  }[]
}

/////
// isItemNew()
//
// Calculate whether an item in the index is classified as "new"
// based on the number of days since it was created
/////
interface IsItemNewArgs<T> {
  item: T
  pathToTimestamp?: string
  tz?: string
}
export const isItemNew = <T>({
  item,
  pathToTimestamp = 'created_at',
  tz = 'America/New York',
}: IsItemNewArgs<T>): boolean => {
  const timestamp = _.get(item, pathToTimestamp)
  if (!timestamp) {
    return false
  }

  const daysSinceCreated = moment(new Date()).diff(moment.tz(timestamp, tz), 'days')
  return daysSinceCreated <= RECENT_CALCULATION_DAY_COUNT
}

/////
// getAllPossibleGroupKeys()
//
// antd's <Collapse> component expects `defaultActiveKey` prop to have all the open panel keys in it
// Since we're using a <Radio> to decide with Collapse headers to show, I need to include
// every possible panel key so they are all open by defualt when swapping between group types
// https://ant.design/components/collapse/
/////
interface GetAllPossibleGroupKeysArgs<T> {
  items: T[]
  groupConfigs: IGroupConfig[]
}
export const getAllPossibleGroupKeys = <T>({ items, groupConfigs }: GetAllPossibleGroupKeysArgs<T>): string[] => {
  const groupValues = _.reduce(
    groupConfigs,
    (result: string[], config) => {
      const uniqueValues = _.compact(_.uniq(_.map(items, config.pathToValue)))
      const overrideLabels = _.map(config.groupLabelOverrides, 'label')
      return [...result, ...uniqueValues, ...overrideLabels]
    },
    []
  )
  return [...groupValues, GROUPING_RECENT_NEW_LABEL, GROUPING_RECENT_NOT_NEW_LABEL, GROUPING_NULL_LABEL]
}

/////
// groupItems()
//
// Take list of items, and _.group them based on a selectedGroup
// Includes support for GROUPING_RECENT and a list of user defined groupConfigs
/////
interface GroupItemsArgs<T> extends Pick<IsItemNewArgs<T>, 'pathToTimestamp' | 'tz'> {
  items: T[]
  groupConfigs: IGroupConfig[]
  selectedGroup: string
}
interface GroupItemsResponse<T> {
  [key: string]: T[]
}

export const groupItems = <T>({
  items,
  groupConfigs,
  selectedGroup,
  pathToTimestamp,
  tz,
}: GroupItemsArgs<T>): GroupItemsResponse<T> | null => {
  if (selectedGroup === GROUPING_RECENT) {
    const groupedByNew = _.groupBy(items, (item) => isItemNew({ item, pathToTimestamp, tz }))
    return {
      [GROUPING_RECENT_NEW_LABEL]: groupedByNew['true'],
      [GROUPING_RECENT_NOT_NEW_LABEL]: groupedByNew['false'],
    }
  }

  const selectedGroupConfig = _.find(groupConfigs, ['group', selectedGroup])

  if (selectedGroupConfig) {
    // make sure undefined items are last in the list
    const sortedItems = _.sortBy(items, (item) => _.isEmpty(_.get(item, selectedGroupConfig.pathToValue)))

    const groupedValues = _.groupBy(sortedItems, selectedGroupConfig.pathToValue)
    // Allow overwriting the default _.groupBy keys with new labels
    // ex: validated: true/false --> validated: "Validated"/"Not Validated"
    if (selectedGroupConfig.groupLabelOverrides || selectedGroupConfig.addToGroup) {
      const groupedValuesWithOverride: any = {}
      _.forEach(groupedValues, (value, key) => {
        // first check for group label overrides (i.e. 'undefined' -> 'Not Materialized')
        const override = _.find(selectedGroupConfig.groupLabelOverrides, ['key', key])
        if (override) {
          groupedValuesWithOverride[override.label] = [...(groupedValuesWithOverride[override.label] || []), ...value]
        } else {
          groupedValuesWithOverride[key] = [...(groupedValuesWithOverride[key] || []), ...value]
        }

        // Now check for addToGroup (some items should be in more than one group i.e. 'gsheets' in 'gsheets' and 'materialized_view')
        // (this is why we splat value into previous values)
        const groupToAdd = _.find(selectedGroupConfig.addToGroup, ['from', key])
        if (groupToAdd) {
          groupedValuesWithOverride[groupToAdd.to] = [...(groupedValuesWithOverride[groupToAdd.to] || []), ...value]
        }
      })

      return groupedValuesWithOverride
    }

    // Overwrite "null" to be "Uncategorized"
    if (_.includes(_.keys(groupedValues), 'null')) {
      return {
        ..._.omit(groupedValues, 'null'),
        [GROUPING_NULL_LABEL]: groupedValues['null'],
      }
    }

    return groupedValues
  }

  return null
}

/////
// searchItems()
//
// Search through a list of items matching the serachValue to values
// from a list of _.get searchablePaths
//
// FIXME - consider moving this type of logic to graph?
/////
export type SearchablePathFunction = (item: any, searchValue: string) => boolean

interface SearchItemsArgs<T> {
  items: T[]
  searchablePaths: (string | SearchablePathFunction)[]
  searchValue: string
}

export const searchItems = <T>({ items, searchablePaths, searchValue }: SearchItemsArgs<T>): T[] => {
  if (!searchValue) {
    return items
  }

  return _.filter(items, (item: T) =>
    _.some(searchablePaths, (path) => {
      if (_.isString(path)) {
        const value = _.get(item, path)

        return _.includes(_.lowerCase(value), _.lowerCase(searchValue))
      }

      if (_.isFunction(path)) {
        return path(item, searchValue)
      }
    })
  )
}
