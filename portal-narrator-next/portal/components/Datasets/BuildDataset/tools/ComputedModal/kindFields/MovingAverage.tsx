import { GroupColumns, Title } from 'components/Datasets/BuildDataset/tools/shared'
import { ColumnSelect, NumberField, OrderColumns } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import React from 'react'
import { NUMBER_COLUMN_TYPES } from 'util/datasets'

const MovingAverage = () => {
  return (
    <>
      <Title>Calculate average from</Title>
      <ColumnSelect columnTypes={NUMBER_COLUMN_TYPES} labelText="Number Column" placeholder="Select a Number Column" />

      <Title>grouped by</Title>
      <GroupColumns />

      <Title>ordered by</Title>
      <OrderColumns defaultValues={{ order: 'asc' }} />

      <Title>with window size</Title>
      <NumberField fieldKey="window_size" defaultValue={30} />
    </>
  )
}

export default MovingAverage
