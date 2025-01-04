import { Input } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Title } from 'components/Datasets/BuildDataset/tools/shared'
import {
  ColumnSelect,
  DoesExistColumnFilter,
  FilterOperatorSelect,
  FilterValueInput,
} from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import Close from 'components/shared/icons/Close'
import { Box, Flex, Link } from 'components/shared/jawns'
import { find, isEmpty, isEqual } from 'lodash'
import pluralize from 'pluralize'
import React, { useContext, useEffect, useState } from 'react'
import { Controller, useFieldArray, UseFieldArrayRemove, useFormContext } from 'react-hook-form'
import {
  COLUMN_TYPE_STRING,
  DEFAULT_FILTER,
  getGroupColumns,
  getGroupFromContext,
  OPERATOR_TIME_RANGE,
} from 'util/datasets'
import { DOES_EXIST_COLUMN_TYPE } from 'util/datasets/constants'
import { IDatasetQueryColumn } from 'util/datasets/interfaces'
import { getColumnType, getDefaultColumnOperator, isDoesExistColumnType } from 'util/datasets/v2/helpers'
import usePrevious from 'util/usePrevious'

import ValueOutput from './ValueOutput'

interface ICase {
  column_id: string
  filter: {
    operator: string
    value: string
    kind: string
    or_null: boolean
  }
}

export const DEFAULT_FILTER_CASE = {
  column_id: '',
  filter: DEFAULT_FILTER,
}

interface CaseFilterProps {
  caseFilterFieldName: string
  caseFilterIndex: number
  remove: UseFieldArrayRemove
  parentColumnId: string
}

const CaseFilter: React.FC<CaseFilterProps> = ({ caseFilterFieldName, caseFilterIndex, remove, parentColumnId }) => {
  const filterOperatorFieldName = `${caseFilterFieldName}.filter.operator`

  const [columnType, setColumnType] = useState(COLUMN_TYPE_STRING)
  const [columnLabel, setColumnLabel] = useState('')

  const { groupSlug, machineCurrent } = useContext(DatasetFormContext) || {}
  const { setValue, control, watch } = useFormContext()

  const casesValue = watch('source_details.cases') || []
  const casesLength = casesValue?.length
  const prevCasesLength = usePrevious(casesLength)

  const onChangeCase = (value: ICase) => setValue(caseFilterFieldName, value)
  const caseValue = watch(caseFilterFieldName)
  const columnId = caseValue?.column_id
  const prevColumnId = usePrevious(columnId)
  const caseFilterValue = caseValue?.filter?.value
  const prevCaseFilterValue = usePrevious(caseFilterValue)

  const operatorValue = watch(filterOperatorFieldName)
  const operatorOnChange = (value: {}) => setValue(filterOperatorFieldName, value)
  const kindValue = watch(`${caseFilterFieldName}.filter.kind`)

  const isTimeRangeOperation = operatorValue === OPERATOR_TIME_RANGE
  const pluralizeOperator = pluralize.isPlural(columnLabel || '')

  const isDoesExistColumn = columnType === DOES_EXIST_COLUMN_TYPE

  // set default operator value
  useEffect(() => {
    if (isEmpty(operatorValue)) {
      if (isDoesExistColumn) {
        return operatorOnChange('equal')
      }

      const defaultValue = getDefaultColumnOperator(columnType)

      operatorOnChange(defaultValue)
    }
  }, [columnType, operatorValue, operatorOnChange, isDoesExistColumn])

  // set columnType and column label based on selected column
  useEffect(() => {
    if (columnId) {
      const group = getGroupFromContext({ context: machineCurrent.context, groupSlug })

      const columns = group ? getGroupColumns({ group }) : machineCurrent.context.columns

      const selectedColumn = find(columns, ['id', caseValue.column_id])

      if (selectedColumn) {
        const columnType = getColumnType(selectedColumn as IDatasetQueryColumn)

        // set default values for does exist column (i.e. "Did (1)" or "Did Not (0)")
        if (isDoesExistColumnType(selectedColumn as IDatasetQueryColumn)) {
          setValue(`${caseFilterFieldName}.filter.kind`, 'value')
          setValue(`${caseFilterFieldName}.filter.operator`, 'equal')
          setValue(`${caseFilterFieldName}.filter.or_null`, false)
        }

        setColumnType(columnType)
        setColumnLabel(selectedColumn.label)
      }
    }
  }, [columnId, groupSlug])

  // reset case values if they change the column id
  // (helpful when transitioning between column types like string vs timestamp vs number)
  useEffect(() => {
    if (prevColumnId && !isEqual(prevColumnId, columnId)) {
      // make sure we aren't triggering reset when deleting
      if (isEqual(prevCasesLength, casesLength)) {
        // or reordering
        //// little hacky, but we can infer that if column id changed, but the value didn't
        //// then it was do to reorder
        //// (wasn't able to target caseIndex change b/c race condition)
        if (isEqual(prevCaseFilterValue, caseFilterValue)) {
          onChangeCase({
            ...DEFAULT_FILTER_CASE,
            column_id: caseValue.column_id,
          })
        }
      }
    }
  }, [prevColumnId, columnId, prevCasesLength, casesLength, prevCaseFilterValue, caseFilterValue, onChangeCase])

  const renderFilterValueInput = () => (
    <Controller
      control={control}
      name={`${caseFilterFieldName}.column_id`}
      render={({ field }) => (
        <FilterValueInput
          {...field}
          columnId={field.value}
          columnType={columnType}
          filterFieldName={`${caseFilterFieldName}.filter`}
        />
      )}
    />
  )

  return (
    <Box mb={2} key={caseFilterFieldName}>
      {caseFilterIndex !== 0 && (
        <Flex justifyContent="space-between">
          <Title>And</Title>
          <Box onClick={() => remove(caseFilterIndex)}>
            <Close width={8} height={8} />
          </Box>
        </Flex>
      )}

      <Box mb={2}>
        <Input.Group compact>
          {/* if there's a parentColumnId omit it as an option so there's no circular filtering */}
          <ColumnSelect
            omitColumnIds={[parentColumnId]}
            fieldName={`${caseFilterFieldName}.column_id`}
            noStyle
            style={{ width: undefined }}
          />

          {!isDoesExistColumn && (
            <FilterOperatorSelect
              pluralizeLabels={pluralizeOperator}
              columnType={columnType}
              fieldName={filterOperatorFieldName}
              kind={kindValue}
            />
          )}

          {isDoesExistColumn && <DoesExistColumnFilter fieldName={`${caseFilterFieldName}.filter.value`} />}
        </Input.Group>
      </Box>

      {!isDoesExistColumn && (
        <>
          <Input.Group compact>{!isTimeRangeOperation && renderFilterValueInput()}</Input.Group>
          {isTimeRangeOperation && renderFilterValueInput()}
        </>
      )}
    </Box>
  )
}

interface IftttCaseProps {
  fieldName: string
  parentColumnId: string
}

const IftttCase: React.FC<IftttCaseProps> = ({ fieldName, parentColumnId }) => {
  const { control } = useFormContext()

  const { fields, append, remove } = useFieldArray({
    control,
    name: `${fieldName}.filters`,
  })

  return (
    <>
      <Title>IF Row values in</Title>
      <>
        {fields.map((caseFilterFieldName, caseFilterIndex) => (
          <CaseFilter
            key={caseFilterFieldName.id}
            remove={remove}
            caseFilterIndex={caseFilterIndex}
            caseFilterFieldName={`${fieldName}.filters.${caseFilterIndex}`}
            parentColumnId={parentColumnId}
          />
        ))}
        <Flex mb={3} justifyContent="flex-start">
          <Link onClick={() => append(DEFAULT_FILTER_CASE)}>Add Another Filter</Link>
        </Flex>
      </>

      <Title>Then Output</Title>
      <ValueOutput valueFieldName={fieldName} defaultValues={{ valueKind: 'string' }} />
    </>
  )
}

export default IftttCase
