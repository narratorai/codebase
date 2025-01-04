import { CloseCircleOutlined } from '@ant-design/icons'
import { FormItem, SearchSelect, SearchSelectOptionProps } from 'components/antd/staged'
import { ColumnFilterOption } from 'components/Datasets/Explore/interfaces'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { find } from 'lodash'
import { useCallback, useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { DEFAULT_FILTER } from 'util/datasets'
import { getDefaultColumnOperator } from 'util/datasets/v2/helpers'

import Filter from './Filter'

interface Props {
  fieldName: string
  columnOptions: SearchSelectOptionProps[]
  columnOptionsWithMeta: ColumnFilterOption[]
  removeColumn: () => void
  isViewMode?: boolean
}

const Column = ({ fieldName, columnOptions, columnOptionsWithMeta, removeColumn, isViewMode = false }: Props) => {
  const { control, watch, setValue } = useFormContext()
  const columnValue = watch(fieldName)
  const selectedColumnOptionValue = columnValue?.id

  const updateColumn = (value: unknown) => {
    // set id
    setValue(`${fieldName}.id`, value, { shouldValidate: true })

    // use "id" to find selected option
    // save option to form state
    const selectedOption = find(columnOptionsWithMeta, ['id', value])

    // reset filters if the column type changes
    // (including when they first select a column)
    if (selectedOption?.column?.type !== columnValue?.column?.type && selectedOption?.column?.type) {
      const defaultOperator = getDefaultColumnOperator(selectedOption.column.type)

      setValue(`${fieldName}.filter`, { ...DEFAULT_FILTER, operator: defaultOperator }, { shouldValidate: true })
    }

    // also save meta data from column option (column, column_id, activity_id, opt_group)
    setValue(`${fieldName}.column`, selectedOption?.column, { shouldValidate: true })
    setValue(`${fieldName}.column_id`, selectedOption?.column_id, { shouldValidate: true })
    setValue(`${fieldName}.opt_group`, selectedOption?.opt_group, { shouldValidate: true })
    setValue(`${fieldName}.activity_id`, selectedOption?.activity_id, { shouldValidate: true })

    // shouldn't happen but if no selectedOption found
    // set filter to null
    if (!selectedOption) {
      setValue(`${fieldName}.filter`, null, { shouldValidate: true })
    }
  }

  // Save the whole column to formstate - not just the option id
  const handleColumnSelect = useCallback(updateColumn, [
    setValue,
    columnOptionsWithMeta,
    fieldName,
    columnValue?.column,
  ])

  useEffect(() => {
    updateColumn(selectedColumnOptionValue)
  }, [selectedColumnOptionValue])

  return (
    <Flex alignItems="center" mb={1}>
      {!isViewMode && (
        <Box mr={1}>
          <CloseCircleOutlined onClick={removeColumn} />
        </Box>
      )}

      <Typography type="body50" style={{ whiteSpace: 'nowrap', fontWeight: 'bold' }} mr={1}>
        where
      </Typography>

      <Box mr={1}>
        <Controller
          control={control}
          name={`${fieldName}.column`}
          render={({ field, fieldState: { isTouched, error } }) => (
            <FormItem
              meta={{ touched: isTouched, error: error?.message }}
              layout="vertical"
              style={{ marginBottom: 0 }}
            >
              <SearchSelect
                style={{ width: 256 }}
                showSearch
                options={columnOptions}
                placeholder="Column"
                popupMatchSelectWidth={false}
                isGrouped
                {...field}
                onChange={handleColumnSelect}
                value={selectedColumnOptionValue}
              />
            </FormItem>
          )}
        />
      </Box>

      <Filter fieldName={`${fieldName}.filter`} column={columnValue?.column} />
    </Flex>
  )
}

export default Column
