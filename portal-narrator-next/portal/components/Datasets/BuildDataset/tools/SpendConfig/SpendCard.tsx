import { InfoCircleOutlined } from '@ant-design/icons'
import { Checkbox, Select, Tooltip } from 'antd-next'
import { FormItem, SearchSelect, SearchSelectOptionProps } from 'components/antd/staged'
import { Box, Flex, ListItemCard, Typography } from 'components/shared/jawns'
import { find, get, includes, map } from 'lodash'
import { Controller, UseFieldArrayRemove, useFormContext } from 'react-hook-form'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { isEquivalentType } from 'util/datasets'
import { required } from 'util/forms'

import { ColumnOptionWithId } from './interfaces'
import OptionContent from './OptionContent'

const { Option } = Select

const HoverBox = styled(Box)`
  &:hover {
    cursor: help;
  }
`

interface Props {
  remove: UseFieldArrayRemove
  fieldName: string
  index: number
  groupByColumns: any
  availableSpendColumns: ColumnOptionWithId[]
  spendColumnValue: any
  existingColumnIds: any[]
  existingSpendColumns: any[]
  columnIdValue: any
}

const SpendCard = ({
  remove,
  fieldName,
  index,
  groupByColumns,
  availableSpendColumns,
  spendColumnValue,
  existingColumnIds,
  existingSpendColumns,
  columnIdValue,
}: Props) => {
  const { control } = useFormContext()

  const aggregateColumnOptions = map(groupByColumns, (column) => {
    const spendColumn = find(availableSpendColumns, ['name', spendColumnValue])
    const spendColumnType = get(spendColumn, 'type')
    const invalidType = spendColumnType && !isEquivalentType(spendColumnType, column.type)
    const shouldDisable = includes(existingColumnIds, column.id) || !!invalidType
    return {
      value: column.id,
      label: column.label,
      key: column.id,
      disabled: shouldDisable,
      column,
    }
  })

  const handleCreateAggregateColumnContent = ({
    searchValue,
    option,
  }: {
    searchValue: string
    option: SearchSelectOptionProps
  }) => (
    <Option
      value={option.column.id}
      label={option.column.label}
      key={option.column.id}
      disabled={option.disabled}
      style={{ borderBottom: `1px solid ${colors.gray200}` }}
    >
      <OptionContent column={option.column} searchValue={searchValue} />
    </Option>
  )

  const spendTableColumnOptions = map(availableSpendColumns, (column) => {
    const groupColumn = find(groupByColumns, ['id', columnIdValue])
    const groupColumnType = get(groupColumn, 'type')
    const invalidType = groupColumnType && !isEquivalentType(groupColumnType, column.type || '')
    const shouldDisable = includes(existingSpendColumns, column.name) || !!invalidType
    return {
      value: column.name || '',
      label: column.label,
      key: column.name || '',
      disabled: shouldDisable,
      column,
    }
  })

  const handleCreateSpendTableColumnContent = ({
    searchValue,
    option,
  }: {
    searchValue: string
    option: SearchSelectOptionProps
  }) => (
    <Option
      value={option.column.name || ''}
      label={option.column.label}
      key={option.column.name || ''}
      disabled={option.disabled}
      style={{ borderBottom: `1px solid ${colors.gray200}` }}
    >
      <OptionContent column={option.column} searchValue={searchValue} />
    </Option>
  )

  return (
    <ListItemCard key={fieldName} onClose={() => remove(index)}>
      <Flex>
        {/* Selectable group columns */}
        <Box width={1 / 2} pr="8px">
          <Controller
            control={control}
            name={`${fieldName}.column_id`}
            rules={{ validate: required }}
            render={({ field, fieldState: { isTouched, error } }) => (
              <FormItem
                label="Aggregate Column"
                meta={{ touched: isTouched, error: error?.message }}
                layout="vertical"
                required
              >
                <SearchSelect
                  placeholder="Choose Aggregate Column"
                  showSearch
                  options={aggregateColumnOptions}
                  createOptionContent={handleCreateAggregateColumnContent}
                  optionFilterProp="label"
                  optionLabelProp="label"
                  popupMatchSelectWidth={false}
                  {...field}
                />
              </FormItem>
            )}
          />
        </Box>

        <Box width={1 / 2} pl="8px">
          <Controller
            control={control}
            name={`${fieldName}.spend_column`}
            rules={{ validate: required }}
            render={({ field, fieldState: { isTouched, error } }) => (
              <FormItem
                label="Aggregate Table Column"
                meta={{ touched: isTouched, error: error?.message }}
                layout="vertical"
                required
              >
                <SearchSelect
                  placeholder="Choose Aggregate Table Column"
                  showSearch
                  optionFilterProp="label"
                  optionLabelProp="label"
                  popupMatchSelectWidth={false}
                  options={spendTableColumnOptions}
                  createOptionContent={handleCreateSpendTableColumnContent}
                  {...field}
                />
              </FormItem>
            )}
          />
        </Box>
      </Flex>

      {/* Checkbox  -   apply_computed_logic */}
      <Flex alignItems="center">
        <Controller
          control={control}
          name={`${fieldName}.apply_computed_logic`}
          render={({ field }) => (
            <Checkbox {...field} checked={field.value} onChange={field.onChange}>
              Apply Computed Logic
            </Checkbox>
          )}
        />

        <Tooltip
          title={
            <Box>
              <Typography mb={1}>The equation of the group by column will be applied.</Typography>
              <Typography>i.e.</Typography>
              <Typography>
                date_trunc(month, timestamp) will result in the aggregate table column to be date_trunc(month,
                join_column)
              </Typography>
            </Box>
          }
        >
          <HoverBox>
            <InfoCircleOutlined style={{ color: colors.gray500 }} />
          </HoverBox>
        </Tooltip>
      </Flex>
    </ListItemCard>
  )
}

export default SpendCard
