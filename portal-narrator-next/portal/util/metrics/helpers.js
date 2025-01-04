import _ from 'lodash'
import moment from 'moment'

import {
  METRIC_PAIR_ID_DAY,
  METRIC_PAIR_ID_WEEK,
  METRIC_PAIR_ID_MONTH,
  TIME_SEGMENT_METRIC_KEY_YESTERDAY,
  TIME_SEGMENT_METRIC_KEY_DAY,
  TIME_SEGMENT_METRIC_KEY_LAST_WEEK,
  TIME_SEGMENT_METRIC_KEY_WEEK,
  TIME_SEGMENT_METRIC_KEY_LAST_MONTH,
  TIME_SEGMENT_METRIC_KEY_MONTH,
} from './constants'

// TIME HELPERS
const today = moment().format('dddd, MMMM Do')

const yesterday = moment().subtract(1, 'days').format('dddd, MMMM Do')

const startOfWeek = moment().startOf('week').add(1, 'days').format('MM/DD/YY')

const startOfLastWeek = moment().startOf('week').subtract(1, 'weeks').add(1, 'days').format('MM/DD/YY')

const thisMonth = moment().format('MMMM')

const lastMonth = moment().subtract(1, 'months').format('MMMM')

export const getTimeRange = (metricPairId) => {
  let timeRange

  switch (metricPairId) {
    case METRIC_PAIR_ID_DAY:
      timeRange = `${today} vs. ${yesterday}`
      break
    case METRIC_PAIR_ID_WEEK:
      timeRange = `week of ${startOfWeek} vs. week of ${startOfLastWeek}`
      break
    case METRIC_PAIR_ID_MONTH:
      timeRange = `${thisMonth} vs. ${lastMonth}`
      break
    default:
  }

  return timeRange
}

/*
 * Traverse activty metrics object tree to return metrics object
 * @param metrics - activity.metrics
 * @param metricName - metric name (ex: 'total_events')
 */
export const getMetricObject = (metrics, metricName) => _.get(metrics, `all.${metricName}.data`, {})

/*
 * Get primary segment key based on metricPairId.
 * It's what's appended to the activitiy slug segment url for loaded segment.
 * @param metricPairId - one of "day", "week", "month"
 */
export const getPrimarySegmentKey = (metricPairId) => {
  let key
  switch (metricPairId) {
    case METRIC_PAIR_ID_DAY:
      key = 'today'
      break
    case METRIC_PAIR_ID_WEEK:
      key = 'this_week'
      break
    case METRIC_PAIR_ID_MONTH:
      key = 'this_month'
      break
    default:
  }

  return key
}

/*
 * Get secondary segment key based on metricPairId
 * It's what's appended to the activitiy slug segment url for loaded segment.
 * @param metricPairId - one of "day", "week", "month"
 */
export const getSecondarySegmentKey = (metricPairId) => {
  let key
  switch (metricPairId) {
    case METRIC_PAIR_ID_DAY:
      key = 'yesterday'
      break
    case METRIC_PAIR_ID_WEEK:
      key = 'last_week'
      break
    case METRIC_PAIR_ID_MONTH:
      key = 'last_month'
      break
    default:
  }

  return key
}

/*
 * Get primary label based on metricPairId
 * @param metricPairId - one of "day", "week", "month"
 */
export const getPrimaryLabel = (metricPairId) => {
  let label
  switch (metricPairId) {
    case METRIC_PAIR_ID_DAY:
      label = 'Today'
      break
    case METRIC_PAIR_ID_WEEK:
      label = 'This Week'
      break
    case METRIC_PAIR_ID_MONTH:
      label = 'This Month'
      break
    default:
  }

  return label
}

/*
 * Get secondary label based on metricPairId
 * @param metricPairId - one of "day", "week", "month"
 */
export const getSecondaryLabel = (metricPairId) => {
  let label
  switch (metricPairId) {
    case METRIC_PAIR_ID_DAY:
      label = 'Yesterday'
      break
    case METRIC_PAIR_ID_WEEK:
      label = 'Last Week'
      break
    case METRIC_PAIR_ID_MONTH:
      label = 'Last Month'
      break
    default:
  }

  return label
}

/*
 * Get primary metric value and label from metric object based on metricPairId
 * @param metrics - activity.metrics
 * @param metricName - metric name (ex: 'total_events')
 * @param metricPairId - one of "day", "week", "month"
 */
export const getPrimaryMetric = (metrics, metricName, metricPairId) => {
  const metricObject = getMetricObject(metrics, metricName)

  let value
  switch (metricPairId) {
    case METRIC_PAIR_ID_DAY:
      value = metricObject[TIME_SEGMENT_METRIC_KEY_DAY]
      break
    case METRIC_PAIR_ID_WEEK:
      value = metricObject[TIME_SEGMENT_METRIC_KEY_WEEK]
      break
    case METRIC_PAIR_ID_MONTH:
      value = metricObject[TIME_SEGMENT_METRIC_KEY_MONTH]
      break
    default:
  }

  return value
}

/*
 * Get secondary metric key from the metricPairId
 * @param metricPairId - one of "day", "week", "month"
 */
export const getSecondaryMetricKey = (metricPairId) => {
  let value
  switch (metricPairId) {
    case METRIC_PAIR_ID_DAY:
      value = TIME_SEGMENT_METRIC_KEY_YESTERDAY
      break
    case METRIC_PAIR_ID_WEEK:
      value = TIME_SEGMENT_METRIC_KEY_LAST_WEEK
      break
    case METRIC_PAIR_ID_MONTH:
      value = TIME_SEGMENT_METRIC_KEY_LAST_MONTH
      break
    default:
  }

  return value
}

/*
 * Get secondary metric value and label from metric object based on metricPairId
 * @param metrics - activity.metrics
 * @param metricName - metric name (ex: 'total_events')
 * @param metricPairId - one of "day", "week", "month"
 */
export const getSecondaryMetric = (metrics, metricName, metricPairId) => {
  const metricObject = getMetricObject(metrics, metricName)
  return metricObject[getSecondaryMetricKey(metricPairId)]
}

/*
 * Get both primary and secondary metric values and labels
 * @param metrics - activity.metrics
 * @param metricName - metric name (ex: 'total_events')
 * @param metricPairId - one of "day", "week", "month"
 */
export const getMetrics = (metrics, metricName, metricPairId) => {
  return {
    primaryMetric: getPrimaryMetric(metrics, metricName, metricPairId),
    primaryLabel: getPrimaryLabel(metricPairId),
    secondaryMetric: getSecondaryMetric(metrics, metricName, metricPairId),
    secondaryLabel: getSecondaryLabel(metricPairId),
  }
}
