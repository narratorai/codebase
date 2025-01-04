import { Title } from 'components/Datasets/BuildDataset/tools/shared'
import { ColumnSelect, NumberField } from 'components/Datasets/BuildDataset/tools/shared/ReactHookForm'
import { Box } from 'components/shared/jawns'
import React from 'react'
import { NUMBER_COLUMN_TYPES } from 'util/datasets'

const DecimateNumber = () => {
  return (
    <>
      <Title>Take values from</Title>
      <Box>
        <ColumnSelect
          columnTypes={NUMBER_COLUMN_TYPES}
          placeholder="Select number column"
          labelText="Number column"
          defaultNthOptionWithFilter={{ index: 0 }}
        />
      </Box>

      <Title mt={1}>and decimate value by</Title>

      <NumberField labelText="Number" defaultValue={5} />
    </>
  )
}

export default DecimateNumber
