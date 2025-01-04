import { Icon } from 'components/shared/jawns'
import _, { compact, filter, find, flatten, isEmpty, isEqual, map, replace } from 'lodash'
import AttributeIcon from 'static/svg/Attribute.svg'
import CacIcon from 'static/svg/CacSegment.svg'
import CohortIcon from 'static/svg/Cohort.svg'
import ComputedIcon from 'static/svg/Computed.svg'
import ConversionIcon from 'static/svg/Conversion.svg'
import GroupIcon from 'static/svg/Group.svg'
import MetricIcon from 'static/svg/Metric.svg'

import {
  AGG_FUNCTION_AVERAGE,
  AGG_FUNCTION_COUNT,
  AGG_FUNCTION_COUNT_ALL,
  AGG_FUNCTION_COUNT_DISTINCT,
  AGG_FUNCTION_MEDIAN,
  AGG_FUNCTION_PERCENTILE_CONT,
  AGG_FUNCTION_STDDEV,
  AGG_FUNCTION_SUM,
  ALL_COLUMN_TYPES,
  ATTRIBUTE_COLOR,
  ATTRIBUTE_COLOR_BG,
  BEHAVIOR_COLOR,
  BEHAVIOR_COLOR_BG,
  COLUMN_KIND_ATTRIBUTE,
  COLUMN_KIND_BEHAVIOR,
  COLUMN_KIND_CAC,
  COLUMN_KIND_COMPUTED,
  COLUMN_KIND_CONVERSION,
  COLUMN_KIND_GROUP_BY,
  COLUMN_KIND_GROUP_METRIC,
  COLUMN_SOURCE_KIND_ACTIVITY,
  COLUMN_TYPE_FLOAT,
  COLUMN_TYPE_INTEGER,
  COLUMN_TYPE_NUMBER,
  COMPUTATION_COLOR,
  COMPUTATION_COLOR_BG,
  CONVERSION_COLOR,
  CONVERSION_COLOR_BG,
  DATASET_ACTIVITY_KIND_ATTRIBUTE,
  DATASET_ACTIVITY_KIND_CONVERSION,
  DEFAULT_COLUMN,
  GROUP_BY_COLOR,
  GROUP_BY_COLOR_BG,
  GROUP_CAC_COLOR,
  GROUP_CAC_COLOR_BG,
  GROUP_METRIC_COLOR,
  GROUP_METRIC_COLOR_BG,
  RELATIONSHIP_AFTER,
  RELATIONSHIP_KEY_JOIN,
} from './constants'

// Get all column_ids from raw_string
// for example: "date_diff('days', {limiting_session_ts},{conversion_ts})"
export const getRawStringColumnIds = (rawString) => {
  const found = []
  const rxp = /{([^}]+)}/g

  let curMatch = rxp.exec(rawString)

  while (curMatch) {
    found.push(curMatch[1])
    curMatch = rxp.exec(rawString)
  }

  return found
}

export const bgButtonProps = (color) => {
  const base = color.replace(/[0-9]/g, '')
  return {
    bg: color,
    bgHover: `${base}700`,
    bgActive: `${base}800`,
  }
}

/**
 * @param {Object} params
 * @param {string[]} params.existingLabels
 * @param {string} params.label
 * @param {boolean} [params.snakeCase]
 * @returns {string}
 */
export const dedupeLabel = ({ existingLabels = [], label, snakeCase = false }) => {
  let looping = true
  let loopingIndex = 1
  let tempLabel = label
  let checkLabels = existingLabels

  // support deduping snake case only
  if (snakeCase) {
    tempLabel = _.snakeCase(label)
    checkLabels = map(existingLabels, (label) => _.snakeCase(label))
  }

  // Loop through to make sure labels come out unique!
  while (looping) {
    if (_.includes(checkLabels, tempLabel)) {
      tempLabel = snakeCase ? _.snakeCase(`${label} ${loopingIndex}`) : `${label} ${loopingIndex}`
      loopingIndex += 1
    } else {
      looping = false
    }
  }

  return tempLabel
}

export const getColorByKind = ({ columnKind, bg = false }) => {
  if (bg) {
    return columnKind === COLUMN_KIND_BEHAVIOR
      ? BEHAVIOR_COLOR_BG
      : columnKind === COLUMN_KIND_ATTRIBUTE
        ? ATTRIBUTE_COLOR_BG
        : columnKind === COLUMN_KIND_CONVERSION
          ? CONVERSION_COLOR_BG
          : columnKind === COLUMN_KIND_COMPUTED
            ? COMPUTATION_COLOR_BG
            : columnKind === COLUMN_KIND_GROUP_BY
              ? GROUP_BY_COLOR_BG
              : columnKind === COLUMN_KIND_CAC
                ? GROUP_CAC_COLOR_BG
                : columnKind === COLUMN_KIND_GROUP_METRIC
                  ? GROUP_METRIC_COLOR_BG
                  : 'transparent'
  }

  return columnKind === COLUMN_KIND_BEHAVIOR
    ? BEHAVIOR_COLOR
    : columnKind === COLUMN_KIND_ATTRIBUTE
      ? ATTRIBUTE_COLOR
      : columnKind === COLUMN_KIND_CONVERSION
        ? CONVERSION_COLOR
        : columnKind === COLUMN_KIND_COMPUTED
          ? COMPUTATION_COLOR
          : columnKind === COLUMN_KIND_GROUP_BY
            ? GROUP_BY_COLOR
            : columnKind === COLUMN_KIND_CAC
              ? GROUP_CAC_COLOR
              : columnKind === COLUMN_KIND_GROUP_METRIC
                ? GROUP_METRIC_COLOR
                : 'transparent'
}

export const ColumnKindIcon = ({ columnKind, ...props }) => {
  return columnKind === COLUMN_KIND_BEHAVIOR ? (
    <Icon svg={CohortIcon} {...props} />
  ) : columnKind === COLUMN_KIND_ATTRIBUTE ? (
    <Icon svg={AttributeIcon} {...props} />
  ) : columnKind === COLUMN_KIND_CONVERSION ? (
    <Icon svg={ConversionIcon} {...props} />
  ) : columnKind === COLUMN_KIND_COMPUTED ? (
    <Icon svg={ComputedIcon} {...props} />
  ) : columnKind === COLUMN_KIND_CAC ? (
    <Icon svg={CacIcon} {...props} />
  ) : columnKind === COLUMN_KIND_GROUP_BY ? (
    <Icon svg={GroupIcon} {...props} />
  ) : columnKind === COLUMN_KIND_GROUP_METRIC ? (
    <Icon svg={MetricIcon} {...props} />
  ) : null
}

export const columnTypeFromAgg = ({ aggFunction, columnType }) => {
  if (
    _.includes(
      [AGG_FUNCTION_AVERAGE, AGG_FUNCTION_MEDIAN, AGG_FUNCTION_PERCENTILE_CONT, AGG_FUNCTION_SUM, AGG_FUNCTION_STDDEV],
      aggFunction
    )
  ) {
    return COLUMN_TYPE_FLOAT
  }

  if (_.includes([AGG_FUNCTION_COUNT_ALL], aggFunction)) {
    return COLUMN_TYPE_NUMBER
  }

  if (_.includes([AGG_FUNCTION_COUNT, AGG_FUNCTION_COUNT_DISTINCT], aggFunction)) {
    return COLUMN_TYPE_INTEGER
  }

  return columnType
}

export const makeDefaultRelationship = ({ referencingId = '', referencingSlug = '' }) => ({
  slug: RELATIONSHIP_AFTER,
  referencing_id: referencingId,
  _referencing_slug: referencingSlug,
})

export const makeDefaultKeyJoin = ({ referencingId = '', referencingSlug = '' }) => ({
  slug: RELATIONSHIP_KEY_JOIN,
  column_name: '',
  referencing_id: referencingId,
  _referencing_slug: referencingSlug,
  referencing_column_name: '',
})

// For generating unique column ids!
// Prefer the form's unique activityId vs activitySlug to deal with duplication
export const makeActivityColumnId = ({ activityKind, activityId, activitySlug, columnName }) =>
  // Remove all commas from OR activities and replace with underscore
  makeSanitizedId(`${activityKind}_${activityId || activitySlug}_${columnName}`)

// For New Activity Columns
export const makeActivityColumn = ({
  activity,
  activityId,
  column,
  activityKind,
  occurrence,
  customerIdentifier,
  sourceKind = COLUMN_SOURCE_KIND_ACTIVITY,
}) => {
  const metaColumns = _.get(activity, 'meta.columns', [])

  const prependLabel =
    activityKind === DATASET_ACTIVITY_KIND_ATTRIBUTE
      ? `${_.startCase(occurrence) || 'First'} ${activity.name} `
      : activityKind === DATASET_ACTIVITY_KIND_CONVERSION
        ? `Converted to ${activity.name} `
        : ''

  const metaColumn = find(metaColumns, ['name', column.name]) || {}

  let label = metaColumn.label
    ? `${prependLabel}${metaColumn.label}`
    : column.label
      ? `${prependLabel}${column.label}`
      : `${prependLabel}${column.name}`

  if (column.name === 'customer') {
    label = customerIdentifier || 'Customer'
  }

  if (column.name === 'ts') {
    label = `${prependLabel || `${activity.name} `}At`
  }

  const source_details = activityId
    ? {
        activity_kind: activityKind,
        // use activity_id instead of activity_slug because we might have multiple
        // activity objects with the same slug in query_definition.activities:
        activity_id: activityId,
        enrichment_table: column.enrichment_table,
      }
    : {
        activity_kind: activityKind,
        activity_slug: activity.slug,
        enrichment_table: column.enrichment_table,
      }

  return {
    ...DEFAULT_COLUMN,
    id: makeActivityColumnId({ activityKind, activityId, activitySlug: activity.slug, columnName: column.name }),
    label,
    name: column.name,
    source_details,
    source_kind: sourceKind,
    type: column.kind,
  }
}

// For Column Options in Key Join (Behavior Relationship) column select
const featureLabels = ['feature_1', 'feature_2', 'feature_3']
export const getKeyJoinColumnOptions = ({ activity, referencingActivity }) => {
  const columnOptions = [{ label: 'Activity Occurrence', value: 'activity_occurrence' }]
  const activityColumns = _.get(activity, 'meta.columns', [])
  const referencingActivityColumns = _.get(referencingActivity, 'meta.columns', [])

  const activityIdColumn = find(activityColumns, ['name', 'activity_id'])
  const referencingActivityIdColumn = find(referencingActivityColumns, ['name', 'activity_id'])

  if (activityIdColumn && referencingActivityIdColumn && activityIdColumn.label === referencingActivityIdColumn.label) {
    columnOptions.push({
      label: activityIdColumn.label,
      value: 'activity_id',
    })
  }

  const activityFeatureLabels = _.values(map(activityColumns, 'label'))
  const referencingFeatureLabels = _.values(map(referencingActivityColumns, 'label'))

  const commonLabels = _.intersection(activityFeatureLabels, referencingFeatureLabels)

  // Compare activity's feature labels to ANY of other activity's feature labels
  // ex feature_1's label could === other activity's feature_3's label and that would be valid!
  _.forEach(featureLabels, (labelName) => {
    const referencingFeatureColumn = find(referencingActivityColumns, ['name', labelName])
    const referencingFeatureLabel = _.get(referencingFeatureColumn, 'label')

    if (_.includes(commonLabels, referencingFeatureLabel)) {
      columnOptions.push({
        label: referencingFeatureLabel,
        value: labelName,
      })
    }
  })

  return columnOptions
}

const makeSelectableColumn = ({ columnTypes, selectColumnIds, omitColumnIds, column, groupSlug = null }) => {
  let isDisabled = !_.includes(columnTypes, column.type)

  if (selectColumnIds && _.includes(selectColumnIds, column.id)) {
    isDisabled = false
  }

  if (omitColumnIds && _.includes(omitColumnIds, column.id)) {
    isDisabled = true
  }

  return {
    label: column.label,
    column,
    value: column.id,
    isDisabled,
    groupSlug,
  }
}

const makeGroupedColumns = ({
  activities,
  accessor,
  columnTypes = [],
  groupLabel,
  formValue,
  omitColumnIds,
  selectColumnIds,
}) => {
  return map(formValue[accessor], (formActivity) => {
    const activity = find(activities, ['slug', formActivity.slug])
    const label = activity ? `${groupLabel} - ${activity.name}` : groupLabel
    return {
      label,
      options: map(formActivity._columns, (col) =>
        makeSelectableColumn({
          columnTypes,
          selectColumnIds,
          omitColumnIds,
          column: col,
        })
      ),
    }
  })
}

////////////////////// DEPRECATED //////////////////////
////////////////////// use makeColumnSelectOptions instead
// For Computed Column, ColumnSelect (from existing Dataset Columns)
// eslint-disable-next-line max-lines-per-function
export const makeExistingColumnSelectOptions = ({
  activities = [],
  columnTypes,
  groupSlug,
  formValue,
  omitColumnIds,
  selectColumnIds,
}) => {
  if (groupSlug) {
    const groupFormObject = find(formValue.all_groups, ['slug', groupSlug])

    const cacColumns =
      _.get(groupFormObject, 'spend.columns', []).length > 0
        ? {
            label: 'Spend Columns',
            options: map(groupFormObject.spend.columns, (col) =>
              makeSelectableColumn({
                columnTypes,
                selectColumnIds,
                omitColumnIds,
                column: col,
                groupSlug,
              })
            ),
          }
        : null

    return compact([
      {
        label: 'Group By Columns',
        options: map(groupFormObject.columns, (col) =>
          makeSelectableColumn({
            columnTypes,
            selectColumnIds,
            omitColumnIds,
            column: col,
            groupSlug,
          })
        ),
      },
      {
        label: 'Metric Columns',
        options: map(groupFormObject.metrics, (col) =>
          makeSelectableColumn({
            columnTypes,
            selectColumnIds,
            omitColumnIds,
            column: col,
            groupSlug,
          })
        ),
      },
      cacColumns,
      {
        label: 'Computed Columns',
        options: map(groupFormObject.computed_columns, (col) =>
          makeSelectableColumn({
            columnTypes,
            selectColumnIds,
            omitColumnIds,
            column: col,
            groupSlug,
          })
        ),
      },
    ])
  }

  const behaviorColumns = makeGroupedColumns({
    activities,
    accessor: '_limiting_activities',
    columnTypes,
    groupLabel: 'Cohort',
    formValue,
    omitColumnIds,
    selectColumnIds,
  })
  const attributeColumns = makeGroupedColumns({
    activities,
    accessor: '_attribute_activities',
    columnTypes,
    groupLabel: 'Attributes',
    formValue,
    omitColumnIds,
    selectColumnIds,
  })
  const customerAttributeColumns = {
    label: 'Attributes - Customer Table Columns',
    options: map(formValue._customer_table_columns, (col) =>
      makeSelectableColumn({
        columnTypes,
        selectColumnIds,
        omitColumnIds,
        column: col,
      })
    ),
  }
  const conversionColumns = makeGroupedColumns({
    activities,
    accessor: '_conversion_activities',
    columnTypes,
    groupLabel: 'Conversion',
    formValue,
    omitColumnIds,
    selectColumnIds,
  })
  const computedColumns = {
    label: 'Computed Columns',
    options: map(formValue._computed_columns, (col) =>
      makeSelectableColumn({
        columnTypes,
        selectColumnIds,
        omitColumnIds,
        column: col,
      })
    ),
  }
  return [...behaviorColumns, ...attributeColumns, customerAttributeColumns, ...conversionColumns, computedColumns]
}

// Same as above just ungrouped!
export const makeUnGroupedColumnSelectOptions = (args) => {
  const groupedOptions = makeExistingColumnSelectOptions(args)
  return flatten(map(groupedOptions, 'options'))
}

export const getAllGroupColumns = ({ groupQuery }) => {
  const selectOptions = makeUnGroupedColumnSelectOptions({
    columnTypes: ALL_COLUMN_TYPES,
    // Hack as its arguments assume we're passing in the entire form state
    // not just an indivdual group query:
    formValue: {
      all_groups: [groupQuery],
    },
    groupSlug: groupQuery.slug,
  })

  // the above returns an array of select options (with label, value, and column keys).
  // {
  //   label: 'Label to show to user',
  //   value: 'column_id',
  //   column: {
  //     id: 'column_id'
  //     label: 'label_to_show_to_user',
  //     etc...
  //   },
  // }
  // We only care about the column value:
  return map(selectOptions, 'column')
}

export const getDedupedLabel = ({ formValue, groupSlug, label, snakeCase = false }) => {
  // Get all columns for this tab (whether parent or group)
  let existingColumns
  if (groupSlug) {
    // It's a group tab
    const groupQuery = find(_.get(formValue, 'all_groups'), ['slug', groupSlug])
    existingColumns = getAllGroupColumns({ groupQuery })
  } else {
    // It's a parent tab
    existingColumns = map(makeUnGroupedColumnSelectOptions({ formValue, columnTypes: ALL_COLUMN_TYPES }), 'column')
  }

  const existingLabels = map(existingColumns, (col) => col.label)
  return dedupeLabel({ existingLabels, label, snakeCase })
}

export const getEverySelectableColumnInDataset = (args) => {
  const allGroups = _.get(args, 'formValue.all_groups', [])
  const allGroupColumns = flatten(
    map(allGroups, (group) => {
      return makeUnGroupedColumnSelectOptions({
        ...args,
        groupSlug: group.slug,
      })
    })
  )

  const allParentColumns = makeUnGroupedColumnSelectOptions({
    ...args,
    groupSlug: null,
  })

  // Return type selectable column config!
  // {
  //   column: {
  //     ...column object!
  //   },
  //   groupSlug: what group it came from!
  // }
  return [...allGroupColumns, ...allParentColumns]
}

// if someone enters in a groupSlug in the url is doesn't exist we should redirect them to parent dataset
export const shouldRedirectBadGroup = ({ prevFormValue, formValue, groupSlug }) => {
  // we check if prevFormValue is empty because we only want this to run when
  // a user first lands on the page (the only way they can get to a bad group...so far)
  if (groupSlug && isEmpty(prevFormValue) && formValue?.all_groups) {
    const groupExists = !!find(formValue.all_groups, ['slug', groupSlug])
    if (!groupExists) return true
  }

  return false
}

// make sure they have all the same slugs and
export const hasAllTheSameSlugs = ({ slug1, slug2 }) => {
  // force both into array format (to handle ['slug'] === 'slug')
  const slugs1 = flatten([slug1])
  const slugs2 = flatten([slug2])

  // if they aren't the same length or don't have a length return false
  if (!isEqual(slugs1.length, slugs2.length) || isEmpty(slugs1) || isEmpty(slugs2)) {
    return false
  }

  // Do equality check (the intersection should be same as slug)
  const intersection = _.intersection(slugs1, slugs2)
  if (isEqual(intersection.length, slugs1.length)) {
    return true
  }

  return false
}

export const getActivityBySlug = ({ activities, slug }) => {
  let selectedActivity
  if (_.isArray(slug)) {
    selectedActivity = filter(activities, (activity) => {
      return hasAllTheSameSlugs({ slug1: activity.slug, slug2: slug })
    })
  } else {
    // slug is a string
    selectedActivity = filter(activities, ['slug', slug])
  }
  // return an empty object if no activity was found
  selectedActivity = isEmpty(selectedActivity) ? {} : selectedActivity[0]

  return selectedActivity
}

// Remove all special characters and replace with underscore
// and make lowercase
// https://stackoverflow.com/questions/13020246/remove-special-symbols-and-extra-spaces-and-replace-with-underscore-using-the-re
export const makeSanitizedId = (id) => {
  return replace(id, /[^A-Z0-9]/gi, '_').toLowerCase()
}

export const makeStringFilterAutocompleteOptions = ({ columnValues, selectedApiData, columnId }) => {
  // columnValues come from activities (not columns) when in edit dataset definition mode
  // (columns haven't been created yet so we grab metrics here instead of from selectedApiData's metrics)
  if (!isEmpty(columnValues)) {
    return map(columnValues, (value) => ({ value: value.key, label: _.truncate(value.key, { length: 100 }) }))
  }

  // non-edit dataset mode uses actual columns, so find their metrics from selectedApiData
  const columnMetrics = find(selectedApiData?.metrics, ['id', columnId])?.metrics
  if (!isEmpty(columnMetrics)) {
    return map(columnMetrics, (metric) => ({ value: metric.name, label: metric.name }))
  }

  // default return an empty array
  return []
}
