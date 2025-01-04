import { GroupColumns, Title } from 'components/Datasets/BuildDataset/tools/shared'
import { ColumnSelect, OrderColumns } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import React from 'react'
import { NUMBER_COLUMN_TYPES } from 'util/datasets'

const RunningTotal = () => {
  return (
    <>
      <Title>Calculate running total from</Title>
      <ColumnSelect columnTypes={NUMBER_COLUMN_TYPES} labelText="Number Column" placeholder="Select a Number Column" />

      <Title>grouped by</Title>
      <GroupColumns />

      <Title>ordered by</Title>
      <OrderColumns defaultValues={{ order: 'asc' }} />
    </>
  )
}

export default RunningTotal
