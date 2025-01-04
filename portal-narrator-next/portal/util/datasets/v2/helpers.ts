import _ from 'lodash'

import {
  ALL_TIME_RESOLUTION_VALUES,
  COLUMN_TYPE_TIMESTAMP,
  DEFAULT_SPEND_COLUMNS,
  NUMBER_COLUMN_TYPES,
  RELATIONSHIP_OPTIONS,
  DATASET_STATUS_LABELS,
  DATASET_STATUS_LABEL_DESCRIPTIONS,
  DOES_EXIST_COLUMN_TYPE,
  COLUMN_TYPE_BOOLEAN,
  STRING_COLUMN_TYPES,
} from '../constants'

import { IActivity, ITransformation_Column_Renames, IStatus_Enum } from 'graph/generated'
import {
  DatasetContext,
  DatasetColumnType,
  IDatasetQueryColumn,
  IDatasetQueryGroup,
  IDatasetQueryDefinition,
} from 'util/datasets/interfaces'

export const isEquivalentType = (type: string, secondType: string): boolean => {
  const isSameType = type === secondType
  // For example Integer, Float, Number, are all treated as "number" now...
  const areNumberTypes = _.includes(NUMBER_COLUMN_TYPES, type) && _.includes(NUMBER_COLUMN_TYPES, secondType)
  return isSameType || areNumberTypes
}

interface GetGroupArgs {
  context: DatasetContext
  groupSlug?: string | null
}
export const getGroupFromContext = ({ context, groupSlug }: GetGroupArgs): IDatasetQueryGroup | undefined => {
  return _.find(context.all_groups, ['slug', groupSlug])
}

interface GetGroupColumnsArgs {
  group: IDatasetQueryGroup
}
export const getGroupColumns = ({ group }: GetGroupColumnsArgs): DatasetColumnType[] => {
  const spendColumns = group.spend?.columns || []
  return [...group.columns, ...group.metrics, ...group.computed_columns, ...spendColumns]
}

// For "or" activities
// By default return the name, otherwise concatenate with "or"
// EX - "Tapped Card or Purchased Product"
export const makeActivityName = (activities: IActivity[]): string => {
  return _.join(_.map(activities, 'name'), ' or ')
}
export const activityNameFromActivityIds = (activities: IActivity[], activityIds: string[]): string => {
  const selectedActivities = _.filter(activities, (activity) => _.includes(activityIds, activity.id))
  return makeActivityName(selectedActivities)
}

interface SelectableSearchColumnsArgs {
  columns: DatasetColumnType[]
  columnTypes?: string[]
  omitColumnIds?: string[]
  optGroupBy: string
}

export interface ISelectableSearchColumn {
  optGroupBy: string
  label: string
  value: string
  type: string
  disabled: boolean
}
export const selectableSearchColumns = ({
  columns,
  columnTypes,
  omitColumnIds,
  optGroupBy,
}: SelectableSearchColumnsArgs): ISelectableSearchColumn[] => {
  return _.map(columns, (col) => {
    let disabled = false

    if (columnTypes && !_.includes(columnTypes, col.type)) {
      disabled = true
    }

    if (omitColumnIds && _.includes(omitColumnIds, col.id)) {
      disabled = true
    }

    return {
      label: col.label,
      value: col.id,
      type: col.type,
      optGroupBy,
      disabled,
    }
  })
}

interface MakeColumnSearchSelectOptionsArgs {
  activities: IActivity[]
  columnTypes?: string[]
  groupSlug?: string | null
  omitColumnIds?: string[]
  queryDefinition: IDatasetQueryDefinition
  isParentDuplicate?: boolean
}

export const makeColumnSearchSelectOptions = ({
  activities,
  columnTypes,
  groupSlug,
  omitColumnIds,
  queryDefinition,
  isParentDuplicate,
}: MakeColumnSearchSelectOptionsArgs): ISelectableSearchColumn[] => {
  if (groupSlug && !isParentDuplicate) {
    const groupFormObject = _.find(queryDefinition.query.all_groups, ['slug', groupSlug])

    if (!groupFormObject) {
      return []
    }

    const cacColumns =
      _.get(groupFormObject, 'spend.columns', []).length > 0
        ? [
            ...selectableSearchColumns({
              columns: _.get(groupFormObject, 'spend.columns', []),
              columnTypes,
              omitColumnIds,
              optGroupBy: 'Spend Columns',
            }),
          ]
        : []

    return _.compact([
      ...selectableSearchColumns({
        columns: groupFormObject.columns,
        columnTypes,
        omitColumnIds,
        optGroupBy: 'Group By Columns',
      }),
      ...selectableSearchColumns({
        columns: groupFormObject.metrics,
        columnTypes,
        omitColumnIds,
        optGroupBy: 'Metric Columns',
      }),
      ...cacColumns,
      ...selectableSearchColumns({
        columns: groupFormObject.computed_columns,
        columnTypes,
        omitColumnIds,
        optGroupBy: 'Computed Columns',
      }),
    ])
  }

  const groupedColumnsByActivity = _.groupBy(queryDefinition.query.columns, 'source_details.activity_id')

  const groupedColumns = _.compact(
    _.flatMap(groupedColumnsByActivity, (columns, queryActivityId) => {
      // Assume missing queryActivityId is the computed column bucket:
      if (queryActivityId === 'undefined') {
        return selectableSearchColumns({ columns, columnTypes, omitColumnIds, optGroupBy: 'Computed Columns' })
      }

      // Get the query definition activity config object:
      const queryActivity = _.find(queryDefinition.query.activities, ['id', queryActivityId])

      if (!queryActivity) {
        return null
      }

      // use queryActivity.activity_ids to get the relevant graph activities and activity name for display
      // use queryActivity.relationship_slug to get the relationship label to display
      const graphActivities = _.filter(activities, (activity) => _.includes(queryActivity.activity_ids, activity.id))
      const relationship = _.find(RELATIONSHIP_OPTIONS, ['value', queryActivity.relationship_slug])

      // FIXME - added deprecatedGraphActivity and queryActivityId to support datasets that don't have the activity_ids array
      // Should we handle this a different way?
      const deprecatedGraphActivity = _.find(activities, ['slug', queryActivity.slug])
      const activityName = makeActivityName(graphActivities) || `${deprecatedGraphActivity?.name} (${queryActivityId})`

      const truncatedActivityName = _.truncate(activityName, { length: 80 })

      return selectableSearchColumns({
        columns,
        columnTypes,
        omitColumnIds,
        optGroupBy: relationship ? `${relationship.label} - ${truncatedActivityName}` : truncatedActivityName,
      })
    })
  )

  return groupedColumns
}

interface MakeCacColumnJoinsProps {
  group: IDatasetQueryGroup
  parentColumns: IDatasetQueryColumn[]
  spendColumnRenames: Pick<ITransformation_Column_Renames, 'id' | 'label' | 'type' | 'name'>[] | undefined
}
export const makeCacColumnJoins = ({ group, parentColumns, spendColumnRenames }: MakeCacColumnJoinsProps) => {
  const groupColumns = group.columns

  // If you already have spend columns, and they're valid, don't overwrite them!
  const existingGroupColumns = _.map(_.get(group, 'columns', []), 'id')
  const existingSpendColumns = _.map(_.get(group, 'spend.joins', []), 'column_id')
  const hasValidExistingSpend =
    existingSpendColumns.length > 0 && _.difference(existingSpendColumns, existingGroupColumns).length === 0

  if (hasValidExistingSpend) {
    return group.spend
  }

  // grab parent columns targeted by this group's aggregate columns
  const relevantParentDatasetColumns = _.compact(
    _.map(groupColumns, (col) => _.find(parentColumns, ['id', col.column_id]))
  )

  const columnJoins = _.reduce(
    relevantParentDatasetColumns,
    (result: any[], column) => {
      const matchedColumn = _.find(spendColumnRenames, ['name', _.snakeCase(column?.label)])

      // Match "Ad Source" label column to "ad_source" spend column:
      if (matchedColumn) {
        const columnId = _.find(groupColumns, ['column_id', column.id])?.id
        if (columnId) {
          return [
            ...result,
            {
              column_id: columnId,
              spend_column: matchedColumn.name,
              apply_computed_logic: true,
            },
          ]
        }
      }

      // Match the first timestamp group column to the first timestamp spend column
      const timestampSpendColumn = _.find(spendColumnRenames, ['type', COLUMN_TYPE_TIMESTAMP])
      if (column.type === COLUMN_TYPE_TIMESTAMP && timestampSpendColumn) {
        const existingTimestampJoin = !!_.find(result, ['spend_column', timestampSpendColumn.name])
        const columnId = _.find(groupColumns, ['column_id', column.id])?.id
        if (!existingTimestampJoin && columnId) {
          return [
            ...result,
            {
              column_id: columnId,
              spend_column: timestampSpendColumn.name,
              apply_computed_logic: true,
            },
          ]
        }
      }

      return result
    },
    []
  )

  return {
    joins: columnJoins,
    columns: DEFAULT_SPEND_COLUMNS,
  }
}

// Safety check on adding new status that's not in constants
interface IGetDatasetStatusLabel {
  status: IStatus_Enum
}
export const getDatasetStatusLabel = ({ status }: IGetDatasetStatusLabel) => {
  // can fall back to startcase of the value
  return DATASET_STATUS_LABELS[status] || _.startCase(status)
}

// Safety check on adding new status that's not in constants
interface IGetDatasetStatusDescription {
  status: IStatus_Enum
}
export const getDatasetStatusDescription = ({ status }: IGetDatasetStatusDescription) => {
  // can fall back to empty string
  return DATASET_STATUS_LABEL_DESCRIPTIONS[status] || ''
}

// Formats labels and removes internal_only from non-super admins
interface IGetDatasetStatusOptionsProps {
  isSuperAdmin?: boolean
}
export const getDatasetStatusOptions = ({ isSuperAdmin = false }: IGetDatasetStatusOptionsProps) => {
  // not mapping over IStatus_Enum to get correct order of options
  const statusOptions = [
    {
      label: getDatasetStatusLabel({ status: IStatus_Enum.InProgress }),
      value: IStatus_Enum.InProgress,
    },
    {
      label: getDatasetStatusLabel({ status: IStatus_Enum.Live }),
      value: IStatus_Enum.Live,
    },
    {
      label: getDatasetStatusLabel({ status: IStatus_Enum.Archived }),
      value: IStatus_Enum.Archived,
    },
  ]

  // Only super admin can select internal_only
  if (isSuperAdmin) {
    statusOptions.push({
      label: getDatasetStatusLabel({ status: IStatus_Enum.InternalOnly }),
      value: IStatus_Enum.InternalOnly,
    })
  }

  return statusOptions
}

// used for dataset definition - time cohort resolution filters
export const isAllTimeResolution = (resolution: string) => _.includes(ALL_TIME_RESOLUTION_VALUES, resolution)

// some append columns are technically type: integer
// but serve as boolean (did/doesn't exist as 0 / 1)
// we show different UI for these columns, but need to keep it type integer
export const isDoesExistColumnType = (columnDef: IDatasetQueryColumn): boolean => {
  return _.startsWith(columnDef?.source_details?.raw_string, 'exists(')
}

export const getColumnType = (columnDef: IDatasetQueryColumn): string => {
  if (isDoesExistColumnType(columnDef)) {
    return DOES_EXIST_COLUMN_TYPE
  }

  return columnDef.type
}

export const getDefaultColumnOperator = (type?: string) => {
  if (!type) {
    return 'equal'
  }

  return _.includes([...STRING_COLUMN_TYPES, COLUMN_TYPE_BOOLEAN], type) ? 'equal' : 'greater_than'
}
