import _ from 'lodash'

import {
  SCRIPT_TYPE_CUSTOMER_ATTRIBUTE,
  SCRIPT_KIND_MATERIALIZED_VIEW,
  ACTIVITY_STATUS_LIVE,
  ACTIVITY_STATUS_IGNORED,
  ACTIVITY_SCRIPT_LIFECYCLE_PENDING,
  STREAM_COLUMNS,
  CONFIGURABLE_COLUMNS,
} from './constants'

import { getScriptTemplateForType } from './scriptTemplates'

export const createInitialScriptsFormValue = ({
  isNew = false,
  userEmail,
  script,
  streamTable,
  customerTable,
  type,
}) => {
  if (isNew) {
    return {
      created_by: userEmail,
      type,
      sql: getScriptTemplateForType(type),
      kind: type === SCRIPT_TYPE_CUSTOMER_ATTRIBUTE ? SCRIPT_KIND_MATERIALIZED_VIEW : null,
      column_overrides: STREAM_COLUMNS,
      enriched_scripts: [],
      stream_table: streamTable,
      table_name: type === SCRIPT_TYPE_CUSTOMER_ATTRIBUTE ? customerTable : null,
      _activities_generated: [],
      _diff: {
        show: false,
        original: {},
      },
    }
  }
  const file = _.get(script, 'pending_file', script.file)
  return {
    ...file,
    _diff: {
      show: false,
      original: script.file,
    },
    _run_after_scripts: !_.isEmpty(file.run_after_scripts),
    _activities_generated: [],
  }
}

export const getActivitiesGenerated = ({
  existingActivities,
  activitiesGenerated,
  activitiesGeneratedCurrentlyInForm,
}) => {
  return _.reverse(
    _.sortBy(
      _.map(activitiesGenerated, (activitySlug) => {
        const activityInForm = _.find(activitiesGeneratedCurrentlyInForm, { slug: activitySlug })
        // If the activity is already in the form, return that so that the user's previous edits are preserved
        if (!_.isEmpty(activityInForm)) {
          return activityInForm
        }
        const existingActivity = _.find(existingActivities, { slug: activitySlug })
        // If the activity is already saved in the rails app, return that so that status and pending state are shown
        if (!_.isEmpty(existingActivity)) {
          // If it's live or ignored return it as is
          if (existingActivity.status === ACTIVITY_STATUS_LIVE || existingActivity.status === ACTIVITY_STATUS_IGNORED) {
            return existingActivity
          }
          // Othwerwise default it to LIVE
          return {
            ...existingActivity,
            status: ACTIVITY_STATUS_LIVE,
          }
        }

        // Otherwise construct a new activity object
        return {
          slug: activitySlug,
          name: _.startCase(activitySlug),
          script_lifecycle: ACTIVITY_SCRIPT_LIFECYCLE_PENDING,
          status: ACTIVITY_STATUS_LIVE,
        }
      }),
      'script_lifecycle'
    )
  )
}

export const mergeQueryColumnLabelsIntoColumnOverrides = ({ namedColumns, columnOverrides }) => {
  return _.map(columnOverrides, (formColumn) => {
    if (!_.includes(CONFIGURABLE_COLUMNS, formColumn.name)) {
      return formColumn
    }

    const namedColumn = _.find(namedColumns, ['column_name', formColumn.name]) || {}
    // If batch returns a null label it means the feature not longer exists, so set the label as null. Otherwise prefer the label the user already had set.
    const label = namedColumn.label === null ? null : _.get(formColumn, 'label') || namedColumn.label

    // Add label read from SQL translate if no label exists:
    return {
      ...formColumn,
      label,
      // This order is opposite the label's (always prefer the kind returned by validation) because Mavis is now very good at deducing kinds
      kind: namedColumn.kind || _.get(formColumn, 'kind'),
    }
  })
}
