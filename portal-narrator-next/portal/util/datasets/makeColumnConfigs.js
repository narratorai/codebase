import _ from 'lodash'
import { makeFormState } from 'util/datasets'
import { percentify } from 'util/helpers'

import {
  COLUMN_KIND_ATTRIBUTE,
  // UI SPECIFIC Column Kind
  COLUMN_KIND_BEHAVIOR,
  COLUMN_KIND_CAC,
  COLUMN_KIND_COMPUTED,
  COLUMN_KIND_CONVERSION,
  COLUMN_KIND_GROUP_BY,
  COLUMN_KIND_GROUP_METRIC,
  COLUMN_SOURCE_KIND_ACTIVITY,
  // Column Source Kinds
  COLUMN_SOURCE_KIND_COMPUTED,
  COLUMN_SOURCE_KIND_CUSTOMER,
  DATASET_ACTIVITY_KIND_ATTRIBUTE,
  // Activity Kinds
  DATASET_ACTIVITY_KIND_BEHAVIOR,
  DATASET_ACTIVITY_KIND_CONVERSION,
} from './constants'

export const makeColumnConfigKind = (columnQuery) => {
  const activityKind = _.get(columnQuery, 'source_details.activity_kind')
  const sourceKind = _.get(columnQuery, 'source_kind')

  // For Groups only:
  const isGroupByColumn = _.get(columnQuery, '_isGroupByColumn')
  const aggFunction = _.get(columnQuery, 'agg_function')

  return isGroupByColumn
    ? COLUMN_KIND_GROUP_BY
    : aggFunction
      ? COLUMN_KIND_GROUP_METRIC
      : activityKind === DATASET_ACTIVITY_KIND_BEHAVIOR
        ? COLUMN_KIND_BEHAVIOR
        : activityKind === DATASET_ACTIVITY_KIND_ATTRIBUTE || sourceKind === COLUMN_SOURCE_KIND_CUSTOMER
          ? COLUMN_KIND_ATTRIBUTE
          : activityKind === DATASET_ACTIVITY_KIND_CONVERSION
            ? COLUMN_KIND_CONVERSION
            : _.startsWith(_.get(columnQuery, 'id'), '_spend')
              ? COLUMN_KIND_CAC
              : sourceKind === COLUMN_SOURCE_KIND_COMPUTED
                ? COLUMN_KIND_COMPUTED
                : null
}

const formatMetric = ({ metric, totalRows }) => {
  if (metric.metrics_type === 'distribution') {
    const isApproximate = totalRows > 100000
    const denominator = isApproximate ? 100000 : totalRows

    // When total rows is greater than 100,000 Mavis only runs metrics on the first 100,000 rows
    return {
      ...metric,
      metrics: _.map(metric.metrics, (metricRow) => ({
        ...metricRow,
        percent: percentify(metricRow.value / denominator),
        isApproximate,
      })),
    }
  }

  return metric
}

export const makeColumnHeaderFieldName = ({ queryDefinition, columnQuery, groupSlug }) => {
  const {
    query: { columns },
  } = queryDefinition
  const queryFormState = makeFormState({ queryDefinition })

  // FIXME - when replacing columns columnQuery comes in as undefined
  // (because it doesn't match with column_mapping returned from the API response)
  if (!columnQuery) {
    return null
  }

  const columnData = _.find(columns, (col) => col.id === columnQuery.id)

  let fieldName
  let columnKind
  // NOT A GROUP - just dataset
  if (columnData && !groupSlug) {
    // Find out what kind of activity it is
    if (columnData.source_details.activity_kind === DATASET_ACTIVITY_KIND_BEHAVIOR) {
      columnKind = '_limiting_activities'
    } else if (columnData.source_details.activity_kind === DATASET_ACTIVITY_KIND_CONVERSION) {
      columnKind = '_conversion_activities'
    } else if (columnData.source_kind === COLUMN_SOURCE_KIND_COMPUTED) {
      columnKind = '_computed_columns'
    } else if (columnData.source_kind === COLUMN_SOURCE_KIND_CUSTOMER) {
      columnKind = '_customer_table_columns'
    } else if (columnData.source_kind === COLUMN_SOURCE_KIND_ACTIVITY) {
      columnKind = '_attribute_activities'
    } else {
      columnKind = `_${columnData.source_kind}_` // we will need to update this if we add new fields
    }
    // Build fieldName based on what kind it is
    const columnsByKind = queryFormState[columnKind]
    if (_.includes(['_limiting_activities', '_conversion_activities', '_attribute_activities'], columnKind)) {
      // this could have mulitple sections
      // _limiting_activities[0]._columns[0]        // _conversion_activities[0]._columns[1]
      // _limiting_activities[1]._columns[2]        // _conversion_activities[1]._columns[2]

      let firstIndex, secondIndex
      _.forEach(columnsByKind, (arr, firstIdx) => {
        _.forEach(arr._columns, (col, secondIdx) => {
          if (col.id === columnData.id) {
            firstIndex = firstIdx
            secondIndex = secondIdx
          }
        })
      })

      fieldName = `${columnKind}[${firstIndex}]._columns[${secondIndex}]`
    } else {
      // these just have the index at the end, no preceeding index
      // _computed_columns[0]     // _customer_table_columns[0]
      _.forEach(columnsByKind, (col, idx) => {
        if (col.id === columnData.id) fieldName = `${columnKind}[${idx}]`
      })
    }
  } else {
    // GROUPS!!
    const groupKind = makeColumnConfigKind(columnQuery)
    const groupData = _.find(queryFormState.all_groups, ['slug', groupSlug])
    // groupIndex is the first index of the field name, i.e. "all_groups[groupIndex].columns[0]"
    const groupIndex = _.findIndex(queryFormState.all_groups, ['slug', groupSlug])

    // set fieldName based on kind, and what index it is in that kind
    let groupKindIndex
    if (groupKind === COLUMN_KIND_GROUP_BY) {
      groupKindIndex = _.findIndex(groupData.columns, ['id', columnQuery.id])
      fieldName = `all_groups[${groupIndex}].columns[${groupKindIndex}]`
    } else if (groupKind === COLUMN_KIND_COMPUTED) {
      groupKindIndex = _.findIndex(groupData.computed_columns, ['id', columnQuery.id])
      fieldName = `all_groups[${groupIndex}].computed_columns[${groupKindIndex}]`
    } else if (groupKind === COLUMN_KIND_GROUP_METRIC) {
      groupKindIndex = _.findIndex(groupData.metrics, ['id', columnQuery.id])
      fieldName = `all_groups[${groupIndex}].metrics[${groupKindIndex}]`
    } else if (groupKind === COLUMN_KIND_CAC) {
      groupKindIndex = _.findIndex(groupData.spend.columns, ['id', columnQuery.id])
      fieldName = `all_groups[${groupIndex}].spend.columns[${groupKindIndex}]`
    }
  }

  return fieldName
}

/**
 * Creates columnConfigs object being passed into WindowTable
 *
 * @param {Object} params
 * @param {IDatasetColumnMapping[]} params.columnMapping
 * @param {IResponseMetric[]} params.metrics
 * @param {boolean} [params.metricsLoading]
 * @param {number|undefined} params.totalRows
 * @param {string|null|undefined} params.groupSlug
 * @param {Object} params.queryDefinition
 */
export const makeColumnConfigs = ({
  columnMapping,
  metrics = [],
  metricsLoading = false,
  totalRows,
  groupSlug,
  queryDefinition,
}) => {
  const query = _.get(queryDefinition, 'query', {})

  const configs = _.map(columnMapping, (columnObject) => {
    let columnQuery, order, fieldName
    let activitySlug = null

    if (groupSlug) {
      const groupQuery = _.find(query.all_groups, ['slug', groupSlug])
      columnQuery = _.find(groupQuery.columns, ['id', columnObject.id])

      if (!columnQuery) {
        columnQuery =
          _.find(groupQuery.metrics, ['id', columnObject.id]) ||
          _.find(groupQuery.computed_columns, ['id', columnObject.id]) ||
          _.find(_.get(groupQuery, 'spend.columns'), ['id', columnObject.id])
      } else {
        columnQuery = {
          ...columnQuery,
          _isGroupByColumn: true,
        }
      }

      order = _.find(groupQuery.order, ['column_id', columnObject.id])
      fieldName = makeColumnHeaderFieldName({ queryDefinition, columnQuery, groupSlug })
    } else {
      // FIXME - we shouldn't render deleted columns in the table!
      // If you delete a column before running again, columnQuery will be undefined!
      columnQuery = _.find(query.columns, ['id', columnObject.id])
      order = _.find(query.order, ['column_id', columnObject.id])
      const sourceActivitySlug = _.get(columnQuery, 'source_details.activity_slug', null)
      const sourceActivityId = _.get(columnQuery, 'source_details.activity_id')
      const activityQuery = _.find(query.activities, ['id', sourceActivityId]) || {}

      activitySlug = activityQuery.slug || sourceActivitySlug
      fieldName = makeColumnHeaderFieldName({ queryDefinition, columnQuery })
    }

    return {
      accessor: columnObject.label,
      activitySlug,
      query: columnQuery,
      order: order || null,
      metricsLoading,
      metric: formatMetric({
        metric: _.find(metrics, ['id', columnObject.id]) || {},
        totalRows,
      }),
      // Makes it easier to use this UI specific field than
      // recalculate what should be considered "attribute" for example
      _kind: makeColumnConfigKind(columnQuery),
      fieldName,
      pinned: columnObject.pinned,
    }
  })

  // If columnConfig.query object doesn't exist in the query definition for that column,
  // the assumption is it's been deleted and we can filter it out
  return _.filter(configs, 'query')
}

export default makeColumnConfigs
