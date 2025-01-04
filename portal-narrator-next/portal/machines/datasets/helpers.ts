import {
  KIND_FREEHAND_FUNCTION,
  KIND_IFTTT,
} from 'components/Datasets/BuildDataset/tools/ComputedModal/computedConstants'
import {
  compact,
  filter,
  find,
  findIndex,
  flatten,
  get,
  includes,
  isEmpty,
  isEqual,
  map,
  omit,
  orderBy,
  pick,
  replace,
  slice,
  snakeCase,
  some,
  sortBy,
  toString,
  uniq,
} from 'lodash'
import {
  AUTO_GEN_CREATE_PIVOT,
  COLUMN_KIND_CAC,
  COLUMN_KIND_COMPUTED,
  COLUMN_KIND_GROUP_BY,
  COLUMN_KIND_GROUP_METRIC,
  COLUMN_TYPE_COLUMN_ID,
  COLUMN_TYPE_FLOAT,
  CUSTOMER_COLUMN_NAMES,
  DEFAULT_COLUMN,
  DEFAULT_COMPUTED_COLUMN,
  DEFAULT_GROUP_BY_METRIC,
  getGroupColumns,
  makeSanitizedId,
} from 'util/datasets'
import {
  DatasetContext,
  DatasetEvent,
  IDatasetDefinitionSelectColumn,
  IDatasetQueryColumn,
  IDatasetQueryDefinition,
  IDatasetQueryGroup,
  IDatasetQueryGroupComputedColumn,
  IDatasetResults,
} from 'util/datasets/interfaces'
import { makeShortid } from 'util/shortid'

export const makeQueryDefinitionFromContext = (context: DatasetContext): IDatasetQueryDefinition => {
  return {
    fields: context.fields,
    query: pick(context, [
      'activities',
      'columns',
      'all_groups',
      'order',
      'activity_stream',
      'swapped_ids',
      'columns_order',
      'kpi',
      'story',
    ]),
  }
}

// util to override default column labels from the API with
// user defined custom column labels from the formValue
interface MakeColumnOptionsArgs {
  options: IDatasetDefinitionSelectColumn[]
  formValue: any
  appendActivityIndex?: string | number
}
export const makeColumnOptionsWithExistingLabels = ({
  options,
  formValue,
  appendActivityIndex,
}: MakeColumnOptionsArgs): IDatasetDefinitionSelectColumn[] => {
  // If appendActivityIndex, assume it's column options for an append/join activity
  // If no appendActivityIndex, assume it's column options for the cohort activity
  const formColumns = toString(appendActivityIndex)
    ? get(formValue, `append_activities[${appendActivityIndex}].columns`)
    : formValue.cohort.columns

  return map(options, (option) => {
    const existingColumn = find(formColumns, ['name', option.name])
    if (existingColumn) {
      return {
        ...existingColumn,
        // Make sure to preserve column values (they won't be on the exiting form column)
        values: option.values,
      }
    }
    return option
  })
}

interface GetGroupIndexProps {
  context: DatasetContext
  groupSlug: string
}
export const getGroupIndex = ({ context, groupSlug }: GetGroupIndexProps) => {
  return findIndex(context.all_groups, (grp) => {
    if (isEqual(grp.slug, groupSlug)) {
      return true
    }
    return false
  })
}

interface GetGroupColumnAndColumnTypeProps {
  group: IDatasetQueryGroup
  columnId: string
}
export const getGroupColumnAndColumnType = ({ group, columnId }: GetGroupColumnAndColumnTypeProps) => {
  // 4 potential places for group columns:
  // columns: COLUMN_KIND_GROUP_BY
  // computed_columns: COLUMN_KIND_COMPUTED
  // metrics: COLUMN_KIND_GROUP_METRIC
  // spend: COLUMN_KIND_CAC
  const column = find(group.columns, (col) => col.id === columnId)
  if (column) return { column, columnType: COLUMN_KIND_GROUP_BY }

  const computedColumn = find(group.computed_columns, (col) => col.id === columnId)
  if (computedColumn) return { column: computedColumn, columnType: COLUMN_KIND_COMPUTED }

  const metricColumn = find(group.metrics, (col) => col.id === columnId)
  if (metricColumn) return { column: metricColumn, columnType: COLUMN_KIND_GROUP_METRIC }

  if (group.spend) {
    const spendColumn = find(group.spend.columns, (col) => col.id === columnId)
    if (spendColumn) return { column: spendColumn, columnType: COLUMN_KIND_CAC }
  }

  // if you haven't found it by now, it doesn't exist
  return { column: null, columnType: null }
}

interface MakeUniqueIdProps {
  id: string
  ids: string[]
}
export const makeUniqueId = ({ id, ids }: MakeUniqueIdProps) => {
  const alreadyExists = includes(ids, id)
  // If it doesn't already exist, make sure to strip all commas for OR activities (replace with _)
  const uniqueColumnId = alreadyExists ? makeSanitizedId(`${id}_${makeShortid()}`) : makeSanitizedId(id)
  return uniqueColumnId
}

interface GetTopValuesProps {
  columnId: string
  queryResults: IDatasetResults
}
export const getTopValues = ({ columnId, queryResults }: GetTopValuesProps) => {
  const selectedCol = find(queryResults.column_mapping, ['id', columnId])

  const totalEventsCol = find(queryResults.column_mapping, ['id', 'metrics_total_events'])
  // If no total events column, order based on user's order
  if (!totalEventsCol && selectedCol) {
    return slice(uniq(map(queryResults.data.rows, selectedCol.label)), 0, 20)
  }

  if (totalEventsCol && selectedCol) {
    const orderedRowsByTotalEvents = orderBy(queryResults.data.rows, [totalEventsCol.label], ['desc'])
    return slice(uniq(map(orderedRowsByTotalEvents, selectedCol.label)), 0, 20)
  }

  return []
}

interface MakeMetricsOnPivotedToggleProps {
  columnId: string
  group: IDatasetQueryGroup
  pivotValues?: string[]
}
export const makeMetricsOnPivotedToggle = ({ columnId, group, pivotValues }: MakeMetricsOnPivotedToggleProps) => {
  const existingMetrics = group.metrics

  const pivotedMetrics = sortBy(
    flatten(
      map(existingMetrics, (metric) => {
        return map(pivotValues, (value) => {
          const newId = makeSanitizedId(value)
          return {
            ...metric,
            _pre_pivot_column_id: metric.id,
            _pre_pivot_column_label: metric.label,
            id: `${metric.id}_${newId}`,
            label: `${metric.label} ${value}`,
            pivot: [
              ...metric.pivot,
              {
                column_id: columnId,
                value,
              },
            ],
            _auto_generated_by: AUTO_GEN_CREATE_PIVOT,
          }
        })
      })
    ),
    'label'
  )

  const totalEventsMetrics = filter(pivotedMetrics, ['_pre_pivot_column_id', DEFAULT_GROUP_BY_METRIC.id])
  const sumConversionMetrics = filter(pivotedMetrics, ['agg_function', 'SUM'])

  let pivotedConversions = [] as IDatasetQueryGroupComputedColumn[]

  if (totalEventsMetrics.length > 0 && sumConversionMetrics.length > 0) {
    pivotedConversions = sortBy(
      compact(
        map(sumConversionMetrics, (metric) => {
          const pivotValue = replace(metric.id, `${metric._pre_pivot_column_id}_`, '')
          const totalEventsMetric = find(totalEventsMetrics, (metric) => {
            return includes(metric.id, pivotValue)
          })

          if (totalEventsMetric) {
            return {
              ...DEFAULT_COMPUTED_COLUMN,

              id: `${metric.id}__computed_conversion`,
              label: `Conversion Rate to ${replace(metric.label, 'Total', '')}`,
              source_details: {
                kind: KIND_FREEHAND_FUNCTION.kind,
                raw_string: `({${metric.id}}*1.0)/{${totalEventsMetric.id}}`,
              },
              type: COLUMN_TYPE_FLOAT,
              _auto_generated_by: AUTO_GEN_CREATE_PIVOT,
            }
          }
        })
      ),
      'label'
    )
  }

  return {
    pivotedComputedColumns: pivotedConversions,
    pivotedMetrics,
  }
}

interface ReverseMetricComputeColumnsProps {
  group: IDatasetQueryGroup
}
export const reverseMetricComputeColumns = ({ group }: ReverseMetricComputeColumnsProps) => {
  const existingMetrics = group.metrics
  const existingComputedColumns = group.computed_columns

  // make sure to keep the metric columns that were NOT created by pivot
  const unpivotedMetrics = filter(
    existingMetrics,
    (col): boolean => !!(col._auto_generated_by !== AUTO_GEN_CREATE_PIVOT)
  )

  // make sure to keep the computed columns that were NOT created by pivot
  const nonPivotedComputedColumns = filter(
    existingComputedColumns,
    (col): boolean => !!(col._auto_generated_by !== AUTO_GEN_CREATE_PIVOT)
  )

  return {
    computedColumns: [...nonPivotedComputedColumns],
    metrics: unpivotedMetrics,
  }
}

interface MakeNewGroupColumnProps {
  group: IDatasetQueryGroup
  column: IDatasetQueryColumn
}
export const makeNewGroupColumn = ({ group, column }: MakeNewGroupColumnProps) => {
  const newId = makeUniqueId({ id: `${group.slug}_${snakeCase(column.label)}`, ids: map(group.columns, 'id') })
  return {
    ...omit(DEFAULT_COLUMN, ['source_details', 'source_kind']),
    id: makeSanitizedId(newId),
    column_id: column.id,
    label: column.label,
    type: column.type,
    pivoted: false,
  }
}

// FIXME - makeAggregateColumn is deprecated! use makeNewGroupColumn instead!
interface MakeAggregateColumnProps {
  id: string
  column: IDatasetQueryColumn
}
export const makeAggregateColumn = ({ id, column }: MakeAggregateColumnProps) => ({
  ...omit(DEFAULT_COLUMN, ['source_details', 'source_kind']),
  id: makeSanitizedId(id),
  column_id: column.id,
  label: column.label,
  type: column.type,
  pivoted: false,
})

export const datasetHasCustomerColumn = (columns: IDatasetQueryColumn[]) => {
  return some(columns, (col) => includes(CUSTOMER_COLUMN_NAMES, col.name))
}

interface GetIftttColumnTypeProps {
  context: DatasetContext
  column: IDatasetQueryColumn | IDatasetQueryGroupComputedColumn
  groupSlug?: string
}

export const getIftttColumnType = ({ column, context, groupSlug }: GetIftttColumnTypeProps) => {
  // If the else value column type is "column_id" use the referenced column's column type
  const valueKind = column.source_details.value_kind
  // default to parent columns
  let groupOrParentColumns = context.columns
  // over-ride columns if group found
  if (groupSlug) {
    const groupIndex = getGroupIndex({ context, groupSlug })
    const group = context.all_groups[groupIndex]
    if (group) {
      groupOrParentColumns = getGroupColumns({ group }) as IDatasetQueryColumn[]
    }
  }

  if (valueKind === COLUMN_TYPE_COLUMN_ID) {
    const elseColumn = find(groupOrParentColumns, ['id', column.source_details.value])
    if (elseColumn) {
      return elseColumn.type
    }
    // Set column type to "string", "number", etc...
  } else if (valueKind) {
    // if valueKind is NOT 'null', set type to else value
    if (valueKind !== 'null') {
      return valueKind
    } else {
      // otherwise, set type to first, non-null case value_kind (if it exists)
      const { cases } = column.source_details
      const nonNullableCaseValueKind = filter(cases, (c) => c.value_kind !== 'null')
      if (!isEmpty(nonNullableCaseValueKind[0]?.value_kind)) {
        const nonNullCase = nonNullableCaseValueKind[0]
        //  If case value_kind is "column_id" use the referenced column's column type
        if (nonNullCase.value_kind === COLUMN_TYPE_COLUMN_ID) {
          const referencedColumn = find(groupOrParentColumns, ['id', nonNullCase.value])
          if (referencedColumn) {
            return referencedColumn.type
          }
        } else {
          // For all non "column_id" value_kinds, use that i.e. "string", "number", etc...
          return nonNullCase.value_kind
        }
      } else {
        // more of a catch... there shouldn't be all 'null' value_kinds (cases + else)
        // b/c why would you create that column??
        // but in case someone does that - this will default to original behavior
        return valueKind
      }
    }
  }

  // safety return null
  return null
}

export const handleUpdateComputationColumn = ({ context, event }: { context: DatasetContext; event: DatasetEvent }) => {
  // For parent datasets
  if (event.type === 'EDIT_COMPUTATION_SUBMIT' && !event.groupSlug) {
    let group_func = event.column.group_func
    const isFreehandFunction = event.column.source_details?.kind === KIND_FREEHAND_FUNCTION.kind
    // only update group func for freehand functions
    if (isFreehandFunction) {
      // also, only override the group_func if a validation was run (maybe they are editing)
      const validatedGroupFunc = context._edit_context?.validate_response?.group_func

      if (validatedGroupFunc) {
        group_func = validatedGroupFunc
      }
    }

    // no groupSlug so you're on a parent dataset, (add/update those columns)

    // For IFTTT make sure the ultimate column type is whatever the user selected as the else value!
    // Unless else value is null (then grab first non-null case value)
    let type = event.column.type
    if (includes([KIND_IFTTT.kind], event.column.source_details.kind)) {
      const iftttType = getIftttColumnType({ context, column: event.column })
      if (iftttType) {
        type = iftttType
      }
    }

    if (event.isEdit) {
      // find old column to replace
      const columnIndex = findIndex(context.columns, (col) => {
        if (isEqual(col.id, event.column.id)) {
          return true
        }
        return false
      })

      // replace old column
      const columns = [...context.columns]
      // confident that this is a parent compute column b/c there was no groupSlug in payload
      columns[columnIndex] = { ...event.column, type, group_func } as IDatasetQueryColumn
      return columns
    } else {
      // Make sure column has a unique id (prefix w/ 'id_' to make sure id starts with letter)
      const uniqueId = makeSanitizedId(`id_${snakeCase(event.column.label)}_${makeShortid()}`)

      // add new column to columns
      // confident that this is a parent compute column b/c there was no groupSlug in payload
      return [...context.columns, { ...event.column, id: uniqueId, type, group_func } as IDatasetQueryColumn]
    }
  }

  // For group tabs
  if (event.type === 'EDIT_COMPUTATION_SUBMIT' && event.groupSlug) {
    // you're on a group, so get group's index
    const groupIndex = getGroupIndex({ context, groupSlug: event.groupSlug })
    const group = context.all_groups[groupIndex]

    let group_func = event.column.group_func
    const isFreehandFunction = event.column.source_details?.kind === KIND_FREEHAND_FUNCTION.kind
    // only update group func for freehand functions
    if (isFreehandFunction) {
      // also, only override the group_func if a validation was run (maybe they are editing)
      const validatedGroupFunc = context._edit_context?.validate_response?.group_func
      if (validatedGroupFunc) {
        group_func = validatedGroupFunc
      }
    }

    // For IFTTT make sure the ultimate column type is whatever the user selected as the else value!
    // Unless else value is null (then grab first non-null case value)
    let type = event.column.type
    if (includes([KIND_IFTTT.kind], event.column.source_details.kind)) {
      const iftttType = getIftttColumnType({ context, column: event.column, groupSlug: event.groupSlug })
      if (iftttType) {
        type = iftttType
      }
    }

    if (event.isEdit) {
      // find column in group's computed columns
      const columnIndex = findIndex(group.computed_columns, (col) => {
        if (isEqual(col.id, event.column.id)) {
          return true
        }
        return false
      })

      // replace old compute column with the new
      const updatedComputeColumns = [...group.computed_columns]
      // confident that this is a group computed column since there was a groupSlug in payload
      updatedComputeColumns[columnIndex] = { ...event.column, type, group_func } as IDatasetQueryGroupComputedColumn

      // replace group's computed columns with updated computed columns
      const updatedGroup = {
        ...group,
        computed_columns: updatedComputeColumns,
      }

      // replace group in all_groups
      const updatedAllGroups = [...context.all_groups]
      updatedAllGroups[groupIndex] = updatedGroup

      return updatedAllGroups
    } else {
      // Make sure column has a unique id (prefix w/ 'id_' to make sure id starts with letter)
      const uniqueId = makeSanitizedId(`id_${snakeCase(event.column.label)}_${makeShortid()}`)

      // it's a new column so add it to the group's computed_columns
      // add new column to group's computed columns
      const updatedGroup = {
        ...group,
        // confident that this is a group computed column since there was a groupSlug in payload
        computed_columns: [
          ...group.computed_columns,
          { ...event.column, id: uniqueId, type, group_func } as IDatasetQueryGroupComputedColumn,
        ],
      }

      const updatedAllGroups = [...context.all_groups]
      updatedAllGroups[groupIndex] = updatedGroup

      return updatedAllGroups
    }
  }
}
