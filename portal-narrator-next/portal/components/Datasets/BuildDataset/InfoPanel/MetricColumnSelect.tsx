import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { ColumnSelect, Title } from 'components/Datasets/BuildDataset/tools/shared'
import { Box } from 'components/shared/jawns'
import _ from 'lodash'
import { useContext, useEffect } from 'react'
import { useField, useForm } from 'react-final-form'
import {
  AGG_FUNCTION_COUNT_ALL,
  AGG_FUNCTION_RATE,
  ALL_COLUMN_TYPES,
  COLUMN_TYPE_TIMESTAMP,
  DATASET_ACTIVITY_KIND_BEHAVIOR,
  getGroupFromContext,
  NUMBER_COLUMN_TYPES,
  NUMBER_ONLY_AGG_FUNCTIONS,
} from 'util/datasets'

const MetricColumnSelect = () => {
  const { groupSlug, machineCurrent } = useContext(DatasetFormContext)
  const group = getGroupFromContext({ context: machineCurrent.context, groupSlug })

  const { change, resetFieldState } = useForm()
  const {
    input: { value: columnId },
  } = useField('column_id', { subscription: { value: true } })
  const {
    input: { value: aggFunction },
  } = useField('agg_function', { subscription: { value: true } })

  const {
    input: { value: rateConditionedOnColumns },
  } = useField('conditioned_on_columns', { subscription: { value: true } })

  const isCountAll = aggFunction === AGG_FUNCTION_COUNT_ALL
  const isRate = aggFunction === AGG_FUNCTION_RATE
  const parentColumn = _.find(machineCurrent.context.columns, ['id', columnId])

  useEffect(() => {
    // If it's count all and they had previously selected a column_id
    // Remove the column_id (count all doesn't have column ids)
    const shouldResetForCountAll = isCountAll && parentColumn

    // If you've selected an aggFunction that is only allowed for numbers,
    // But you've already selected a column_id that isn't a number type column
    // Remove the column_id
    const shouldResetForColumnType =
      parentColumn &&
      _.includes(NUMBER_ONLY_AGG_FUNCTIONS, aggFunction) &&
      !_.includes(NUMBER_COLUMN_TYPES, parentColumn.type)

    if (shouldResetForCountAll || shouldResetForColumnType) {
      change('column_id', null)
      resetFieldState('column_id')
    }
  }, [change, resetFieldState, isCountAll, aggFunction, parentColumn])

  // clear out conditioned_on_columns if no longer rate
  useEffect(() => {
    if (!isRate && !_.isEmpty(rateConditionedOnColumns)) {
      change('conditioned_on_columns', undefined)
      resetFieldState('conditioned_on_columns')
    }
  }, [isRate, rateConditionedOnColumns, change, resetFieldState])

  const allowedTypes = _.includes(NUMBER_ONLY_AGG_FUNCTIONS, aggFunction) ? NUMBER_COLUMN_TYPES : ALL_COLUMN_TYPES
  let title = "Choose any dataset column that's not in group by definition"
  switch (aggFunction) {
    case AGG_FUNCTION_COUNT_ALL:
      title = 'You have chosen to count all rows'
      break
    case AGG_FUNCTION_RATE:
      title = 'Only choose columns with 1 or 0 value'
      break
  }

  if (!group) {
    return null
  }

  // limit all "Rate" "conditioned_on_columns" to non-cohort timestamps
  const allCohortAtivityIds = machineCurrent.context.columns
    .filter((col) => col?.source_details?.activity_kind === DATASET_ACTIVITY_KIND_BEHAVIOR)
    .map((col) => col.id)

  return (
    <Box>
      <Title>{title}</Title>
      <ColumnSelect
        baseDatasetColumnOptions
        fieldName="column_id"
        columnTypes={allowedTypes}
        inputProps={{
          disabled: _.isEmpty(aggFunction) || isCountAll,
        }}
        omitColumnIds={_.map(group.columns, 'column_id')}
        // NOTE - field is required, but handled by
        // calculateShouldDisable() in GroupMetricOverlay
        isRequired={false}
      />

      {isRate && (
        <Box>
          <Title>Conditioned on columns</Title>
          <ColumnSelect
            baseDatasetColumnOptions
            fieldName="conditioned_on_columns"
            columnTypes={[COLUMN_TYPE_TIMESTAMP]}
            inputProps={{
              disabled: _.isEmpty(aggFunction) || isCountAll,
              mode: 'multiple',
            }}
            omitColumnIds={allCohortAtivityIds}
            // NOTE - field is required, but handled by
            // calculateShouldDisable() in GroupMetricOverlay
            isRequired={false}
          />
        </Box>
      )}
    </Box>
  )
}

export default MetricColumnSelect
