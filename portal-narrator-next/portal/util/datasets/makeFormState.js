import _ from 'lodash'

import {
  COLUMN_SOURCE_KIND_COMPUTED,
  DATASET_ACTIVITY_KIND_ATTRIBUTE,
  DATASET_ACTIVITY_KIND_BEHAVIOR,
  DATASET_ACTIVITY_KIND_CONVERSION,
  COLUMN_SOURCE_KIND_CUSTOMER,
  DEFAULT_ACTIVITY,
  DEFAULT_COMPUTED_COLUMN,
  DEFAULT_FILTER,
  DEFAULT_GROUP_BY,
  DEFAULT_GROUP_BY_METRIC,
  OCCURRENCE_METRIC,
} from './constants'

const makeColumns = (columns, activity, type) => {
  return _.filter(columns, (column) => {
    if (_.get(column, 'source_details.activity_id')) {
      return (
        _.get(column, 'source_details.activity_kind') === type &&
        _.get(column, 'source_details.activity_id') === activity.id
      )
    }

    return (
      _.get(column, 'source_details.activity_kind') === type &&
      _.get(column, 'source_details.activity_slug') === activity.slug
    )
  })
}

const isComputed = (column) =>
  _.get(column, 'source_kind') === COLUMN_SOURCE_KIND_COMPUTED &&
  !_.includes(
    [DATASET_ACTIVITY_KIND_ATTRIBUTE, DATASET_ACTIVITY_KIND_BEHAVIOR, DATASET_ACTIVITY_KIND_CONVERSION],
    _.get(column, 'source_details.activity_kind')
  )

export const parentComputedColumns = (columns) => _.filter(columns, (column) => isComputed(column))

// Function used by validateQueryDefinition(), but keeping it here so it's near similar logic
export const getFormColumnFieldDetails = ({ column, formValue }) => {
  if (isComputed(column)) {
    const formColumnIndex = _.findIndex(
      _.get(formValue, `_computed_columns`),
      (compColumn) => compColumn.id === _.get(column, 'id')
    )
    return { parent: '_computed_columns', index: formColumnIndex }
  }

  if (_.get(column, 'source_details.activity_kind') === DATASET_ACTIVITY_KIND_CONVERSION) {
    const formActivityIndex = _.findIndex(
      formValue._conversion_activities,
      (activity) =>
        activity.id === _.get(column, 'source_details.activity_id') ||
        activity.slug === _.get(column, 'source_details.activity_slug')
    )
    const activityColumns = _.get(formValue, `_conversion_activities[${formActivityIndex}]._columns`)
    const formColumnIndex = _.findIndex(activityColumns, (convColumn) => convColumn.id === _.get(column, 'id'))
    return { parent: `_conversion_activities[${formActivityIndex}]._columns`, index: formColumnIndex }
  }

  return {}
}

const transformActivityAndUpdateEnrichment = ({ activity, liveActivities, columns }) => {
  const liveActivity = _.find(liveActivities, { slug: activity.slug })
  return {
    ..._.omit(DEFAULT_ACTIVITY, ['_fieldIndex', '_isEdit', '_columns']),
    ...activity,
    config: {
      ...activity.config,
      enrichment_table: _.get(liveActivity, 'enrichment.table', activity?.config?.enrichment_table),
    },
    _columns: makeColumns(columns, activity, activity.kind),
  }
}

/////////////////////////// BACKFILL UTILS ///////////////////////////
// This is for utils that preserve old dataset JSON fields so we    //
// don't have to litter our code with backfill logic                //
//////////////////////////////////////////////////////////////////////

// We used to be stupid and _attribute_activities with occurrence "metric" had lower cased occurrence_value
// For example, it would be "count distinct" instead of "COUNT_DISTINCT" like group metrics
// This makes it uppercased so it's the same as Group Metrics
const backfillAttributeActivities = (attributeActivities) => {
  return _.map(attributeActivities, (activity) => {
    if (activity.occurrence === OCCURRENCE_METRIC) {
      return {
        ...activity,
        occurrence_value: _.replace(_.upperCase(activity.occurrence_value), ' ', '_'),
      }
    }

    return activity
  })
}

/////////////////////////// END BACKFILL UTILS ///////////////////////
//////////////////////////////////////////////////////////////////////

// queryDefinition is optional!!!
// this returns default form state with empty query definition!
export default function makeFormState({
  // Passed in for a new dataset
  selectedActivityStream = '',
  // Passed in for a saved dataset
  queryDefinition = {},
  // Present for all datasets?
  liveActivities = [],
}) {
  const query = _.get(queryDefinition, 'query', {})

  // If a query definition is present, use its activity stream
  // If a query definition is not present, use the user selected activity stream
  const activity_stream = query.activity_stream || selectedActivityStream

  if (!activity_stream) {
    throw new Error('Unknown stream: Unable to make dataset form state')
  }

  const updatedActivities = _.map(query.activities, (activity) =>
    transformActivityAndUpdateEnrichment({ activity, liveActivities, columns: query.columns })
  )

  return {
    activity_stream,
    all_groups: _.get(query, 'all_groups', []),
    order: _.get(query, 'order', []),

    // ACTIVITIES WITH COLUMNS:
    _limiting_activities: _.filter(updatedActivities, ['kind', DATASET_ACTIVITY_KIND_BEHAVIOR]),
    _conversion_activities: _.filter(updatedActivities, ['kind', DATASET_ACTIVITY_KIND_CONVERSION]),
    _attribute_activities: backfillAttributeActivities(
      _.filter(updatedActivities, ['kind', DATASET_ACTIVITY_KIND_ATTRIBUTE])
    ),

    // COLUMNS:
    _customer_table_columns: _.filter(
      query.columns,
      (column) => _.get(column, 'source_kind') === COLUMN_SOURCE_KIND_CUSTOMER
    ),
    _computed_columns: parentComputedColumns(query.columns),

    // Staged:
    _staged_group_by: DEFAULT_GROUP_BY,

    // DEPRECATED - should not be used again!
    _staged_group_by_metric: DEFAULT_GROUP_BY_METRIC,
    _staged_activity: DEFAULT_ACTIVITY,
    _staged_order_by: [],
    _staged_filters: [DEFAULT_FILTER],
    _staged_computed_column: DEFAULT_COMPUTED_COLUMN,
  }
}
