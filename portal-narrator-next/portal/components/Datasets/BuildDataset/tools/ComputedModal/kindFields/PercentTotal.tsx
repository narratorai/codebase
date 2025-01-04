import { GroupColumns, Title } from 'components/Datasets/BuildDataset/tools/shared'
import { ColumnSelect } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import React from 'react'
import { NUMBER_COLUMN_TYPES } from 'util/datasets'

const PercentTotal = () => {
  return (
    <>
      <Title>Calculate % of total from</Title>
      <ColumnSelect columnTypes={NUMBER_COLUMN_TYPES} labelText="Number Column" placeholder="Select a Number Column" />

      <Title>grouped by</Title>
      <GroupColumns />
    </>
  )
}

export default PercentTotal
