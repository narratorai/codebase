import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd-next'
import { FormItem } from 'components/antd/staged'
import { Box } from 'components/shared/jawns'
import { map } from 'lodash'
import { useFieldArray, useFormContext } from 'react-hook-form'

import { ColumnOptionWithId } from './interfaces'
import SpendCard from './SpendCard'

interface Props {
  joinColumns?: ColumnOptionWithId[]
}

const SpendJoins = ({ joinColumns = [] }: Props) => {
  const { watch, control } = useFormContext()

  const groupByColumns = watch('columns') || []
  const spendJoins: { column_id?: string; spend_column?: string }[] = watch('spend.joins')

  const { append: addSpendJoin, remove: removeSpendJoin } = useFieldArray({
    control,
    name: 'spend.joins',
  })

  const existingColumnIds = map(spendJoins, 'column_id')
  const existingSpendColumns = map(spendJoins, 'spend_column')

  // Can only join on the group columns, so can't have more joins than group columns:
  const allowMoreJoins = (spendJoins || []).length < groupByColumns.length

  // Don't show joins if there are no group columns to join on
  if (groupByColumns.length === 0) {
    return null
  }

  return (
    <Box>
      <FormItem
        label="Joins"
        layout="vertical"
        tooltip={{
          title:
            'Given that not every aggregate column has a corresponding join column in the aggregate table, we will be distributing the values evenly across the percent of total events.',
          icon: <InfoCircleOutlined />,
          placement: 'right',
        }}
      >
        {spendJoins?.map((spendJoin, index: number) => {
          const columnIdValue = spendJoin?.column_id
          const spendColumnValue = spendJoin?.spend_column
          const fieldName = `spend.joins.${index}`

          return (
            <SpendCard
              key={`${columnIdValue}_${spendColumnValue}_${fieldName}`}
              remove={removeSpendJoin}
              fieldName={fieldName}
              index={index}
              groupByColumns={groupByColumns}
              availableSpendColumns={joinColumns}
              spendColumnValue={spendColumnValue}
              existingColumnIds={existingColumnIds}
              existingSpendColumns={existingSpendColumns}
              columnIdValue={columnIdValue}
            />
          )
        })}
      </FormItem>

      {allowMoreJoins && (
        <Button
          type="dashed"
          shape="round"
          icon={<PlusOutlined />}
          onClick={() => addSpendJoin({ column_id: null, spend_column: null, apply_computed_logic: true })}
        >
          Add another join
        </Button>
      )}
    </Box>
  )
}

export default SpendJoins
