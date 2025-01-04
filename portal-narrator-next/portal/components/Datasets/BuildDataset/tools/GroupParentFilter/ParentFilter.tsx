import { Input } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Title } from 'components/Datasets/BuildDataset/tools/shared'
import {
  ColumnSelect,
  DoesExistColumnFilter,
  FilterOperatorSelect,
  FilterValueInput,
  OrNull,
} from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import { Box, Flex, ListItemCard } from 'components/shared/jawns'
import { find, includes, isEmpty, isEqual } from 'lodash'
import pluralize from 'pluralize'
import { useContext, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import {
  DEFAULT_FILTER,
  DEFAULT_IS_DOES_EXIST_COLUMN_FILTER,
  NO_VALUE_OPERATORS,
  OPERATOR_IS_NOT_NULL,
  OPERATOR_IS_NULL,
  OPERATOR_TIME_RANGE,
} from 'util/datasets'
import { IDatasetQueryColumn } from 'util/datasets/interfaces'
import { getDefaultColumnOperator, isDoesExistColumnType } from 'util/datasets/v2/helpers'
import usePrevious from 'util/usePrevious'

interface Props {
  fieldName: string
  onClose(): void
  fieldsLength: number
}

const ParentFilter = ({ fieldName, onClose, fieldsLength }: Props) => {
  const { machineCurrent, parentApiData } = useContext(DatasetFormContext) || {}
  const { columns } = machineCurrent.context

  const { setValue, watch } = useFormContext()

  const onChangeFilter = (value: any) => setValue(`${fieldName}.filter`, value)

  const columnId = watch(`${fieldName}.column_id`)
  const kindValue = watch(`${fieldName}.filter.kind`)

  const operatorValue = watch(`${fieldName}.filter.operator`)
  const operatorOnChange = (value: string) => setValue(`${fieldName}.filter.operator`, value)

  const filterValueOnChange = (value?: string | string[] | number) => setValue(`${fieldName}.filter.value`, value)

  const prevOperatorValue = usePrevious(operatorValue)
  const prevColumnId = usePrevious(columnId)
  // fieldLengthChanged makes sure values aren't set to defaults if a field is removed
  // since we are checking if column ids are different
  // (prevIndex and index will always be the same in this component)
  const prevFieldsLength = usePrevious(fieldsLength)
  const fieldLengthChanged = prevFieldsLength && !isEqual(prevFieldsLength, fieldsLength)

  const selectedColumn = find(columns, ['id', columnId]) || ({} as IDatasetQueryColumn)
  const isDoesExistColumn = isDoesExistColumnType(selectedColumn)

  // Make sure to clear out the filter if the column changed!
  useEffect(() => {
    if (!fieldLengthChanged && prevColumnId && prevColumnId !== columnId) {
      if (isDoesExistColumn) {
        return onChangeFilter(DEFAULT_IS_DOES_EXIST_COLUMN_FILTER)
      }

      onChangeFilter(DEFAULT_FILTER)
    }
  }, [onChangeFilter, prevColumnId, columnId, fieldLengthChanged, isDoesExistColumn])

  const isNullOperation = includes([OPERATOR_IS_NOT_NULL, OPERATOR_IS_NULL], operatorValue)

  const isTimeRangeOperation = operatorValue === OPERATOR_TIME_RANGE

  const pluralizeOperator = pluralize.isPlural(selectedColumn?.label || '')

  // set initial default operator
  // (since DEFAULT_FILTER doesn't have operator - it's column specific)
  useEffect(() => {
    if (!isEmpty(selectedColumn) && isEmpty(operatorValue)) {
      // if isDoesExistColumn - "Did (1)" or "Did Not (0)"
      if (isDoesExistColumn) {
        // default to 'equal'
        return operatorOnChange('equal')
      }

      const defaultValue = getDefaultColumnOperator(selectedColumn.type)
      operatorOnChange(defaultValue)
    }
  }, [selectedColumn, operatorValue, operatorOnChange, isDoesExistColumn])

  // clear values if changing to a NO_VALUE_OPERATORS from an operator with values
  useEffect(() => {
    const prevOperatorHasValue = !includes(NO_VALUE_OPERATORS, prevOperatorValue)
    const operatorHasNoValue = includes(NO_VALUE_OPERATORS, operatorValue)

    if (prevOperatorHasValue && operatorHasNoValue && !isDoesExistColumn) {
      filterValueOnChange(undefined)
    }
  }, [prevOperatorValue, operatorValue, filterValueOnChange, isDoesExistColumn])

  // note: parent api data will not be available until the parent tab has been run
  // so sometimes you will have autocomplete for parent filters, and sometimes you wont
  const parentColumnMetrics =
    find(parentApiData?.metrics, ['id', columnId])?.metrics?.map((metric) => ({ key: metric.name })) || []

  return (
    <ListItemCard onClose={onClose} data-test="parent-filter-card">
      <Title>Where parent column:</Title>
      <Flex alignItems="center">
        <Box>
          {!isTimeRangeOperation && (
            <Input.Group compact>
              <ColumnSelect
                baseDatasetColumnOptions
                labelText=""
                fieldName={`${fieldName}.column_id`}
                defaultNthOptionWithFilter={{ index: 0 }}
              />

              {isDoesExistColumn && <DoesExistColumnFilter fieldName={`${fieldName}.filter.value`} />}

              {!isDoesExistColumn && (
                <>
                  <FilterOperatorSelect
                    columnType={selectedColumn?.type}
                    fieldName={`${fieldName}.filter.operator`}
                    inputProps={{ isDisabled: isEmpty(selectedColumn) }}
                    pluralizeLabels={pluralizeOperator}
                    kind={kindValue}
                  />
                  <FilterValueInput
                    columnId={columnId}
                    columnType={selectedColumn?.type}
                    filterFieldName={`${fieldName}.filter`}
                    baseDatasetColumnOptions
                    columnValues={parentColumnMetrics}
                  />
                </>
              )}
            </Input.Group>
          )}

          {isTimeRangeOperation && !isDoesExistColumn && (
            <>
              <Input.Group compact>
                <ColumnSelect
                  baseDatasetColumnOptions
                  labelText={''}
                  fieldName={`${fieldName}.column_id`}
                  defaultNthOptionWithFilter={{ index: 0 }}
                />
                <FilterOperatorSelect
                  columnType={selectedColumn?.type}
                  fieldName={`${fieldName}.filter.operator`}
                  inputProps={{ isDisabled: isEmpty(selectedColumn) }}
                  pluralizeLabels={pluralizeOperator}
                  kind={kindValue}
                />
              </Input.Group>
              <Box>
                <FilterValueInput
                  columnId={columnId}
                  columnType={selectedColumn?.type}
                  filterFieldName={`${fieldName}.filter`}
                  baseDatasetColumnOptions
                  columnValues={parentColumnMetrics}
                />
              </Box>
            </>
          )}
        </Box>

        {!isNullOperation && !isDoesExistColumn && (
          <Box ml={2}>
            <OrNull filterFieldName={`${fieldName}.filter`} />
          </Box>
        )}
      </Flex>
    </ListItemCard>
  )
}

export default ParentFilter
