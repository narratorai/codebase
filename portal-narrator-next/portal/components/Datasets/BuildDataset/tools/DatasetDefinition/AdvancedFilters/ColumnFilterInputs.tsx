import { Input, Select, Space } from 'antd-next'
import { SearchSelect, SearchSelectOptionProps } from 'components/antd/staged'
import {
  FilterOperatorSelect,
  FilterValueInput,
  OrNull,
} from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import { ValueKindOptionOverrides } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm/ValueKindSelect'
import { Box, Flex, Typography } from 'components/shared/jawns'
import Mark from 'components/shared/Mark'
import { includes } from 'lodash'
import pluralize from 'pluralize'
import React, { useContext, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import {
  COLUMN_TYPE_STRING,
  FILTER_KIND_VALUE,
  OPERATOR_IS_NOT_NULL,
  OPERATOR_IS_NULL,
  OPERATOR_TIME_RANGE,
} from 'util/datasets'
import { IDatasetDefinitionColumn } from 'util/datasets/interfaces'

import DatasetDefinitionContext from '../DatasetDefinitionContext'
import { IDatasetDefinitionContext } from '../interfaces'

const { Option } = Select

interface ColumnFilterInputsProps {
  fieldName: string
  column?: IDatasetDefinitionColumn
  columnOptions: SearchSelectOptionProps[]
  isGrouped: boolean
}

type RenderFilterValueInputProps = Pick<ColumnFilterInputsProps, 'column' | 'fieldName'> & {
  valueKindOptionOverrides?: ValueKindOptionOverrides
}

const renderFilterValueInput = ({ column, fieldName, valueKindOptionOverrides }: RenderFilterValueInputProps) => (
  <FilterValueInput
    hideFilterKind
    columnValues={column?.values}
    columnId={column?.name}
    columnType={column?.type || COLUMN_TYPE_STRING}
    filterFieldName={`${fieldName}.filter`}
    valueKindOptionOverrides={valueKindOptionOverrides}
  />
)

export const handleCreateOptionContent = ({
  searchValue,
  option,
}: {
  searchValue: string
  option: SearchSelectOptionProps
}) => (
  <Option key={option.value} label={option.label} value={option.value} disabled={option.disabled}>
    <Flex justifyContent="space-between" alignItems="center">
      <Box>
        <Mark value={option.label} snippet={searchValue} />
      </Box>
      <Box px={1}>
        <Typography type="body300" color="gray500">
          {option.type}
        </Typography>
      </Box>
    </Flex>
  </Option>
)

const ColumnFilterInputs: React.FC<ColumnFilterInputsProps> = ({
  fieldName,
  column,
  columnOptions,
  isGrouped,
  ...field
}) => {
  const { setValue, watch } = useFormContext()
  const { isExplore } = useContext<IDatasetDefinitionContext>(DatasetDefinitionContext)

  // If the column.enrichment_table changes we need to make sure to persist that
  // in the form value
  const enrichmentTable = column?.enrichment_table
  useEffect(() => {
    setValue(`${fieldName}.enrichment_table`, enrichmentTable, { shouldValidate: true })
  }, [setValue, fieldName, enrichmentTable])

  // If the column.enrichment_table_column changes we need to make sure to persist that
  // in the form value
  const enrichmentTableColumn = column?.enrichment_table_column
  useEffect(() => {
    setValue(`${fieldName}.enrichment_table_column`, enrichmentTableColumn, { shouldValidate: true })
  }, [setValue, fieldName, enrichmentTableColumn])

  // If the column.type changes we need to make sure to persist that
  // in the form value
  const columnType = column?.type
  useEffect(() => {
    setValue(`${fieldName}.column_type`, columnType, { shouldValidate: true })
  }, [setValue, fieldName, columnType])

  const operatorValue = watch(`${fieldName}.filter.operator`)
  const isTimeRangeOperation = operatorValue === OPERATOR_TIME_RANGE
  const isNullOperation = includes([OPERATOR_IS_NOT_NULL, OPERATOR_IS_NULL], operatorValue)
  const pluralizeOperator = pluralize.isPlural(column?.label || '')

  const kindValue = watch(`${fieldName}.filter.kind`)

  return (
    <>
      <Space style={{ display: 'flex', flexWrap: 'wrap' }}>
        <Input.Group compact>
          {/* FIXME - dupe of ColumnSelect */}
          <SearchSelect
            style={{ minWidth: 140 }}
            optionFilterProp="label"
            optionLabelProp="label"
            showSearch
            options={columnOptions}
            placeholder="Column"
            popupMatchSelectWidth={false}
            createOptionContent={handleCreateOptionContent}
            isGrouped={isGrouped}
            {...field}
          />

          <FilterOperatorSelect
            columnType={column?.type || COLUMN_TYPE_STRING}
            fieldName={`${fieldName}.filter.operator`}
            pluralizeLabels={pluralizeOperator}
            kind={kindValue}
          />

          {!isTimeRangeOperation && renderFilterValueInput({ column, fieldName })}
        </Input.Group>
        {!isNullOperation && <OrNull filterFieldName={`${fieldName}.filter`} />}
      </Space>
      {isTimeRangeOperation &&
        renderFilterValueInput({
          column,
          fieldName,
          valueKindOptionOverrides: isExplore ? [FILTER_KIND_VALUE] : undefined,
        })}
    </>
  )
}

export default ColumnFilterInputs
