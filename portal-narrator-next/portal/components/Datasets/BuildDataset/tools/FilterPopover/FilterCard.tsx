import { Input, Space } from 'antd-next'
import {
  DoesExistColumnFilter,
  FilterOperatorSelect,
  FilterValueInput,
  OrNull,
} from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import { Box, ListItemCard } from 'components/shared/jawns'
import { includes, isEmpty } from 'lodash'
import pluralize from 'pluralize'
import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { OPERATOR_IS_NOT_NULL, OPERATOR_IS_NULL, OPERATOR_TIME_RANGE } from 'util/datasets'
import { IDatasetQueryColumn } from 'util/datasets/interfaces'
import { getColumnType, getDefaultColumnOperator, isDoesExistColumnType } from 'util/datasets/v2/helpers'
import usePrevious from 'util/usePrevious'

interface Props {
  columnDefinition: IDatasetQueryColumn
  fieldName: string
  handleRemove: () => void
}

const FilterCard = ({ columnDefinition, fieldName, handleRemove }: Props) => {
  const { setValue, watch } = useFormContext()

  const operatorValue = watch(`${fieldName}.operator`)
  const operatorOnChange = (value: string) => setValue(`${fieldName}.operator`, value, { shouldValidate: true })

  const kindValue = watch(`${fieldName}.kind`)

  const isTimeRangeOperation = operatorValue === OPERATOR_TIME_RANGE

  const isNullOperation = includes([OPERATOR_IS_NOT_NULL, OPERATOR_IS_NULL], operatorValue)

  const pluralizeOperator = pluralize.isPlural(columnDefinition?.label || '')

  const isDoesExistColumn = isDoesExistColumnType(columnDefinition)
  const prevIsDoesExistColumn = usePrevious(isDoesExistColumn)

  useEffect(() => {
    if (isEmpty(operatorValue)) {
      // if isDoesExistColumn - "Did (1)" or "Did Not (0)"
      if (isDoesExistColumn) {
        // default to 'equal'
        return operatorOnChange('equal')
      }

      // otherwise add default for string/boolean vs timestamp/number
      const defaultValue = getDefaultColumnOperator(columnDefinition.type)

      operatorOnChange(defaultValue)
    }
  }, [operatorValue, operatorOnChange, columnDefinition, isDoesExistColumn])

  // ensure default values for isDoesExistColumn
  useEffect(() => {
    if (!prevIsDoesExistColumn && isDoesExistColumn) {
      setValue(`${fieldName}.kind`, 'value')
      setValue(`${fieldName}.operator`, 'equal')
      setValue(`${fieldName}.or_null`, false)
    }
  }, [prevIsDoesExistColumn, isDoesExistColumn, setValue, fieldName])

  const columnType = getColumnType(columnDefinition)

  return (
    <ListItemCard bg="gray200" key={fieldName} onClose={handleRemove}>
      {isDoesExistColumn && <DoesExistColumnFilter fieldName={`${fieldName}.value`} />}

      {!isTimeRangeOperation && !isDoesExistColumn && (
        <Space>
          <Input.Group compact>
            <FilterOperatorSelect
              columnType={columnType}
              fieldName={`${fieldName}.operator`}
              pluralizeLabels={pluralizeOperator}
              kind={kindValue}
            />

            <FilterValueInput columnId={columnDefinition?.id} columnType={columnType} filterFieldName={fieldName} />
          </Input.Group>
          {!isNullOperation && <OrNull filterFieldName={fieldName} />}
        </Space>
      )}

      {isTimeRangeOperation && !isDoesExistColumn && (
        <>
          <FilterOperatorSelect
            columnType={columnType}
            fieldName={`${fieldName}.operator`}
            pluralizeLabels={pluralizeOperator}
            kind={kindValue}
          />

          <>
            <FilterValueInput columnId={columnDefinition?.id} columnType={columnType} filterFieldName={fieldName} />

            <Box mt={1}>{!isNullOperation && <OrNull filterFieldName={fieldName} />}</Box>
          </>
        </>
      )}
    </ListItemCard>
  )
}

export default FilterCard
